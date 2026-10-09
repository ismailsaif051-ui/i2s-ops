// Pilotage minimal d'Edge par le protocole DevTools : captures d'écran et impression PDF.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

export async function launch(port, baseProfileDir) {
  // Un profil neuf par lancement : deux instances ne se disputent jamais le même dossier.
  const profileDir = `${baseProfileDir}-${Date.now()}`;
  fs.mkdirSync(profileDir, { recursive: true });
  const child = spawn(EDGE, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--disable-extensions',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    'about:blank',
  ], { stdio: 'ignore' });

  let version;
  for (let i = 0; i < 60; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      break;
    } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  if (!version) throw new Error('Edge ne répond pas');

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else for (const l of listeners) l(msg);
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  async function page({ width = 1280, height = 800, scale = 2 } = {}) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const s = (method, params) => send(method, params, sessionId);
    await s('Page.enable');
    await s('Network.enable');
    await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
    await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

    const waitLoad = (timeout = 90_000) =>
      new Promise((resolve) => {
        const timer = setTimeout(() => { listeners.delete(l); resolve(false); }, timeout);
        const l = (msg) => {
          if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') {
            clearTimeout(timer); listeners.delete(l); resolve(true);
          }
        };
        listeners.add(l);
      });
    const evaluate = async (expression) =>
      (await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;

    return {
      send: s,
      evaluate,
      async goto(url, settle = 900) {
        const loaded = waitLoad();
        await s('Page.navigate', { url });
        await loaded;
        // Polices chargées, puis un court délai pour le rendu des données.
        await evaluate('document.fonts ? document.fonts.ready.then(() => true) : true').catch(() => {});
        await new Promise((r) => setTimeout(r, settle));
      },
      setCookie: (name, value, url) => s('Network.setCookie', { name, value, url, path: '/' }),
      clearCookies: () => s('Network.clearBrowserCookies'),
      async screenshot(file) {
        // Retire l'indicateur du mode développement : il n'existe pas en production.
        await evaluate(`document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()); true`).catch(() => {});
        const { data } = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
      },
      async pdf(file, { footer }) {
        const { data } = await s('Page.printToPDF', {
          printBackground: true,
          preferCSSPageSize: true,
          displayHeaderFooter: true,
          headerTemplate: '<span></span>',
          footerTemplate: footer,
          marginTop: 0.6, marginBottom: 0.75, marginLeft: 0.7, marginRight: 0.7,
          paperWidth: 8.27, paperHeight: 11.69,
        });
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
      },
      close: () => send('Target.closeTarget', { targetId }),
    };
  }

  return {
    page,
    async close() {
      try { await send('Browser.close'); } catch {}
      await new Promise((r) => setTimeout(r, 500));
      // Sous Windows, tuer le seul processus parent laisse les enfants d'Edge ouverts.
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else child.kill();
      try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
    },
  };
}
