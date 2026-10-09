/**
 * Fabrique les guides d'utilisation — un PDF par profil.
 *
 *   node scripts/guides/capture.mjs   (captures d'écran, application lancée)
 *   node scripts/guides/build.mjs     (PDF dans « I2S-System - Guides utilisateurs »)
 *
 * Le contenu se déduit des droits réels de chaque rôle : à relancer après un
 * changement de droits, de menu ou d'écran.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch } from './cdp.mjs';
import { OUT, ROOT, WORK, can, loadRoles, menuFor, resolveScope } from './data.mjs';
import { CHAPTERS, FAQ, RIGHTS_GROUPS, ROLE_INTRO, SCOPE_SHORT, SCOPE_TEXT, btn, path as menuPath } from './content.mjs';

const VERSION = '1.0';
const TODAY = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const manifest = JSON.parse(fs.readFileSync(path.join(WORK, 'shots.json'), 'utf8'));
const asset = (rel) => pathToFileURL(path.join(ROOT, rel)).href;
const shotUrl = (file) => pathToFileURL(path.join(WORK, 'shots', file)).href;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const figure = (file, caption) =>
  `<figure><img src="${shotUrl(file)}" alt=""><figcaption>${esc(caption)}</figcaption></figure>`;

const CSS = `
@font-face{font-family:Archivo;font-weight:400;src:url('${asset('apps/web/public/fonts/Archivo-400.ttf')}')}
@font-face{font-family:Archivo;font-weight:500;src:url('${asset('apps/web/public/fonts/Archivo-500.ttf')}')}
@font-face{font-family:Archivo;font-weight:600;src:url('${asset('apps/web/public/fonts/Archivo-600.ttf')}')}
@font-face{font-family:Archivo;font-weight:700;src:url('${asset('apps/web/public/fonts/Archivo-700.ttf')}')}
@page{size:A4}
*{box-sizing:border-box}
html{font-family:Archivo,Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#202322;font-variant-numeric:tabular-nums}
body{margin:0}
h1,h2,h3{line-height:1.2;letter-spacing:-.01em;margin:0}
.cover{height:9.9in;display:flex;flex-direction:column;page-break-after:always}
.cover img.logo{width:2.6in}
.cover .band{margin-top:1.5in;border-left:5px solid #d74f2c;padding-left:.3in}
.cover .kicker{font-size:10pt;letter-spacing:.2em;text-transform:uppercase;color:#426b53;font-weight:500}
.cover h1{font-size:34pt;font-weight:700;margin-top:.12in}
.cover .role{font-size:20pt;font-weight:600;color:#a83c20;margin-top:.08in}
.cover .sum{font-size:12pt;color:#626b65;margin-top:.3in;max-width:5.4in}
.cover .meta{margin-top:auto;font-size:9pt;color:#626b65;border-top:1px solid #e3e6e1;padding-top:.15in;display:flex;justify-content:space-between}
.toc{page-break-after:always}
.toc h2{font-size:18pt;margin-bottom:.2in}
.toc ol{list-style:none;padding:0;margin:0;columns:2;column-gap:.4in}
.toc li{padding:.055in 0;border-bottom:1px solid #eceeea;break-inside:avoid;font-size:10.5pt}
.toc li span{display:inline-block;width:.32in;color:#a83c20;font-weight:600}
/* Les chapitres s'enchaînent : un titre ne reste jamais seul en bas de page. */
section.ch{margin-top:.42in}
section.ch:first-of-type{margin-top:0}
section.ch>h2{font-size:19pt;font-weight:700;padding-bottom:.1in;border-bottom:2px solid #d74f2c;margin-bottom:.16in;break-after:avoid}
section.ch>h2+*{break-before:avoid}
section.ch>h2 .num{color:#a83c20;margin-right:.12in}
.where{font-size:9.5pt;color:#626b65;margin:-.06in 0 .14in}
h3{font-size:12.5pt;font-weight:600;margin:.22in 0 .07in;break-after:avoid}
p{margin:0 0 .09in}
ul,ol{margin:0 0 .1in;padding-left:.24in}
li{margin-bottom:.035in}
ol.steps{list-style:none;padding:0;counter-reset:s}
ol.steps>li{counter-increment:s;position:relative;padding:.03in 0 .03in .36in;break-inside:avoid}
ol.steps>li::before{content:counter(s);position:absolute;left:0;top:.035in;width:.24in;height:.24in;border-radius:50%;background:#a83c20;color:#fff;font-weight:600;font-size:9pt;text-align:center;line-height:.24in}
.btn{display:inline-block;border:1px solid #c9cec7;background:#f7f7f5;border-radius:4px;padding:0 .06in;font-weight:500;font-size:9.5pt;white-space:nowrap}
.path{font-weight:600;color:#202322}.path i{color:#a83c20;font-style:normal}
.note{border:1px solid #cfe0d4;background:#eaf1eb;border-radius:6px;padding:.09in .13in;margin:.1in 0 .13in;break-inside:avoid;font-size:10pt}
.note b{display:block;color:#426b53;font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.02in}
.note.warn{border-color:#f0c9bd;background:#fdf1ec}.note.warn b{color:#a83c20}
table{border-collapse:collapse;width:100%;margin:.08in 0 .14in;font-size:9.5pt;break-inside:avoid}
th,td{border:1px solid #e3e6e1;padding:.05in .08in;text-align:left;vertical-align:top}
th{background:#f1f2ef;font-weight:600}
table.refus td:first-child{width:46%}
table.rights td.c,table.rights th.c{text-align:center;width:.62in}
table.rights tr.grp td{background:#f7f7f5;font-weight:600;color:#426b53;font-size:8.5pt;letter-spacing:.08em;text-transform:uppercase}
.yes{color:#426b53;font-weight:700}.no{color:#c9cec7}
figure{margin:.14in 0 .18in;break-inside:avoid}
figure img{width:100%;border:1px solid #d3d8d1;border-radius:6px;display:block}
figcaption{font-size:8.5pt;color:#626b65;margin-top:.04in;text-align:center}
.menu{columns:2;column-gap:.3in}.menu div{break-inside:avoid;margin-bottom:.1in}
.menu b{display:block;font-size:8.5pt;letter-spacing:.1em;text-transform:uppercase;color:#426b53}
.kv{display:grid;grid-template-columns:1.5in 1fr;gap:.04in .15in;margin:.08in 0 .14in}
.kv dt{color:#626b65}.kv dd{margin:0;font-weight:500}
.faq dt{font-weight:600;margin-top:.12in}.faq dd{margin:.02in 0 0;color:#3d4440}
`;

function overviewChapter(c) {
  const tabs = [
    ['Synthèse', 'les indicateurs principaux, le tableau « À traiter », les encaissements, la qualité et la disponibilité des équipes', true],
    ['Activité', 'jours travaillés, facturés et non affectés du mois, par inspecteur', c.can('timesheet', 'VIEW')],
    ['Finance', 'facturé et encaissé mois par mois, créances, rentabilité', c.can('invoice', 'VIEW') || c.can('payment', 'VIEW') || c.can('controlling', 'VIEW')],
    ['Qualité', 'délai de remise des rapports par service et par trimestre, rapports en retard', c.can('report', 'VIEW')],
  ];
  return (
    `<p>La Vue d’ensemble est votre page d’accueil. Elle ne montre que ce que vous avez le droit de voir, dans votre périmètre : ${SCOPE_TEXT[c.scope('dashboard', 'VIEW')] ?? 'votre périmètre'}.</p>` +
    `<h3>Les onglets</h3><table class="grid"><thead><tr><th>Onglet</th><th>Ce qu’il montre</th><th>Pour vous</th></tr></thead><tbody>${tabs
      .map(([t, d, ok]) => `<tr><td><b>${t}</b></td><td>${d}</td><td>${ok ? '<span class="yes">Accessible</span>' : 'Non accessible'}</td></tr>`)
      .join('')}</tbody></table>` +
    `<h3>Le tableau « À traiter »</h3><p>Il liste ce qui demande une action, par priorité : <b>Haute</b>, <b>À vérifier</b>, <b>À valider</b>, <b>À suivre</b>. Cliquez sur l’action à droite (Relancer, Consulter, Valider, Examiner…) pour ouvrir la liste concernée. Rien n’est envoyé à un client depuis ce tableau.</p>` +
    `<h3>Choisir la période</h3><ol class="steps"><li>En haut à droite, choisissez le mois dans le sélecteur.</li><li>Les cumuls « année » vont du 1<sup>er</sup> janvier à la fin du mois choisi. Les éléments « en cours » et « À traiter » restent l’état du jour.</li><li>${btn('Exporter')} télécharge un fichier Excel des chiffres affichés, avec le périmètre de chacun.</li></ol>` +
    `<div class="note"><b>À savoir</b>Les chiffres comptent exactement ce que montrent vos listes. Un indicateur que vous n’avez pas le droit de voir n’apparaît pas.</div>`
  );
}

function guideHtml(role) {
  const c = {
    code: role.code,
    can: (res, act) => can(role.permissions, res, act),
    scope: (res, act) => resolveScope(role.permissions, res, act),
  };
  const intro = ROLE_INTRO[role.code];
  const shots = new Map((manifest.roles[role.code] ?? []).map((s) => [s.key, s]));
  const used = new Set();
  const shot = (key) => {
    const s = shots.get(key);
    if (!s || used.has(key)) return '';
    used.add(key);
    return figure(s.file, `${s.caption} — telle que vous la voyez avec votre profil.`);
  };
  const menu = menuFor(role.permissions);

  const chapters = [];
  const add = (title, where, html) => chapters.push({ title, where, html });

  // 1 — Profil
  add('Votre profil', null,
    `<p>${intro.summary}</p><h3>Vos missions principales</h3><ul>${intro.missions.map((m) => `<li>${m}</li>`).join('')}</ul>` +
    `<h3>Votre périmètre</h3><p>Chaque droit s’exerce sur un périmètre. Vous ne voyez et ne modifiez que ce qui s’y trouve — la recherche et les compteurs suivent la même règle.</p>` +
    `<table class="grid"><thead><tr><th>Périmètre</th><th>Ce qu’il couvre</th></tr></thead><tbody>${Object.entries(SCOPE_TEXT)
      .filter(([k]) => role.permissions.some((p) => p.scope === k))
      .map(([k, v]) => `<tr><td><b>${SCOPE_SHORT[k]}</b></td><td>${v.charAt(0).toUpperCase() + v.slice(1)}</td></tr>`)
      .join('')}</tbody></table>` +
    `<p>Le détail de vos droits, module par module, figure à la fin de ce guide.</p>`);

  // 2 — Connexion
  add('Se connecter', null,
    `<ol class="steps"><li>Ouvrez l’adresse de l’application dans votre navigateur (Edge, Chrome ou Firefox).</li><li>Saisissez votre <b>adresse e-mail professionnelle</b> et votre <b>mot de passe</b>. L’œil à droite du champ affiche le mot de passe.</li><li>Cliquez sur ${btn('Se connecter')}.</li><li><b>Première connexion</b> : l’application vous demande de remplacer le mot de passe provisoire par le vôtre. Aucune autre page n’est accessible avant.</li></ol>` +
    figure(manifest.shared.login, 'La page de connexion') +
    `<div class="note warn"><b>Attention</b>Après 5 tentatives infructueuses, le compte est bloqué 15 minutes. Mot de passe oublié : contactez votre administrateur, qui vous en attribuera un provisoire.</div>` +
    `<h3>Changer de mot de passe, se déconnecter</h3><p>Cliquez sur votre nom, en bas du menu : ${btn('Changer le mot de passe')} et ${btn('Se déconnecter')}. Déconnectez-vous toujours sur un poste partagé.</p>`);

  // 3 — Interface
  add('Se repérer dans l’application', null,
    `<h3>Votre menu</h3><p>Le menu latéral est construit d’après vos droits : vous n’y voyez que vos rubriques.</p>` +
    `<div class="menu">${menu
      .map((g) => {
        // Comme à l'écran : « Jours non affectés » s'ouvre depuis Productivité.
        const items = g.items.filter((i) => i.href !== '/pilotage/jours-non-affectes');
        return `<div><b>${esc(g.key === 'admin' ? 'Paramètres' : g.label)}</b>${items.map((i) => esc(i.label)).join(' · ')}</div>`;
      })
      .join('')}</div>` +
    (c.can('timesheet', 'VIEW') ? `<p>La page « Jours non affectés » s’ouvre depuis la page Productivité.</p>` : '') +
    shot('overview') +
    `<h3>L’en-tête</h3><ul><li><b>Fil d’Ariane</b> : il indique où vous êtes (« Opérations / Missions »). La maison ramène à la Vue d’ensemble.</li><li><b>Recherche</b> : voir ci-dessous.</li><li><b>Soleil / lune</b> : bascule entre le mode clair et le mode sombre.</li><li><b>Cloche</b> : vos notifications, avec le nombre de non lues.</li></ul>` +
    `<h3>La recherche globale</h3><ol class="steps"><li>Cliquez sur « Rechercher dans I2S… » ou appuyez sur <b>Ctrl K</b>.</li><li>Tapez au moins deux caractères : numéro d’affaire, client, mission, rapport, facture, nom ou matricule, ou le nom d’une page.</li><li>Choisissez avec ↑ ↓, ouvrez avec Entrée, fermez avec Échap.</li></ol>` +
    figure(manifest.shared.search, 'La recherche globale — elle ne montre que les dossiers de votre périmètre') +
    `<h3>L’apparence</h3><p>Dans le menu de votre profil, « Apparence » propose <b>Système</b> (suit le réglage de votre ordinateur), <b>Clair</b> ou <b>Sombre</b>. Le choix est mémorisé dans votre navigateur.</p>` +
    figure(manifest.shared.dark, 'Le mode sombre'));

  // 4 — Vue d'ensemble
  if (c.can('dashboard', 'VIEW')) add('La Vue d’ensemble', ['Pilotage', 'Vue d’ensemble'], overviewChapter(c) + shot('overview-finance'));

  // Chapitres métier
  for (const chapter of CHAPTERS) {
    if (!chapter.show(c)) continue;
    add(chapter.title, chapter.where, chapter.body(c) + (chapter.shots ?? []).map(shot).join(''));
  }

  // Droits
  const cell = (res, act) => (c.can(res, act) ? '<span class="yes">✓</span>' : '<span class="no">–</span>');
  const rows = RIGHTS_GROUPS.map(([group, items]) => {
    const visible = items.filter(([res]) => c.can(res, 'VIEW'));
    if (visible.length === 0) return '';
    return (
      `<tr class="grp"><td colspan="6">${group}</td></tr>` +
      visible
        .map(([res, label]) =>
          `<tr><td>${label}</td><td class="c">${cell(res, 'VIEW')}</td><td class="c">${cell(res, 'CREATE')}</td><td class="c">${cell(res, 'UPDATE')}</td><td class="c">${cell(res, 'APPROVE')}</td><td>${SCOPE_SHORT[c.scope(res, 'VIEW')] ?? ''}</td></tr>`)
        .join('')
    );
  }).join('');
  add('Vos droits en un coup d’œil', null,
    `<p>« Valider » couvre les visas, approbations, vérifications et émissions. Un module absent de ce tableau n’est pas accessible à votre profil.</p>` +
    `<table class="rights"><thead><tr><th>Module</th><th class="c">Voir</th><th class="c">Créer</th><th class="c">Modifier</th><th class="c">Valider</th><th>Périmètre</th></tr></thead><tbody>${rows}</tbody></table>`);

  // FAQ
  add('Questions fréquentes', null,
    `<dl class="faq">${FAQ(c).map(([q, a]) => `<dt>${q}</dt><dd>${a}</dd>`).join('')}</dl>` +
    `<h3>Besoin d’aide ?</h3><p>Contactez l’administrateur de la plateforme. Si une page affiche « Cette page n’a pas pu se charger », transmettez-lui la référence indiquée sous le message.</p>`);

  const toc = chapters.map((ch, i) => `<li><span>${i + 1}</span>${esc(ch.title)}</li>`).join('');
  const body = chapters
    .map((ch, i) =>
      `<section class="ch"><h2><span class="num">${i + 1}</span>${esc(ch.title)}</h2>${ch.where ? `<p class="where">Où : ${menuPath(...ch.where)}</p>` : ''}${ch.html}</section>`)
    .join('');

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Guide I2S-System — ${esc(role.label)}</title><style>${CSS}</style></head><body>
<div class="cover">
  <img class="logo" src="${asset('apps/web/public/brand/logo-i2s-testing.png')}" alt="I2S TESTING">
  <div class="band"><div class="kicker">I2S-System · Guide d’utilisation</div><h1>Guide d’utilisation</h1><div class="role">${esc(role.label)}</div><p class="sum">${intro.summary}</p></div>
  <div class="meta"><span>Version ${VERSION} · ${TODAY}</span><span>${chapters.length} chapitres · document interne I2S TESTING</span></div>
</div>
<div class="toc"><h2>Sommaire</h2><ol>${toc}</ol>
<div class="note" style="margin-top:.3in"><b>Comment lire ce guide</b>Il est écrit pour votre profil : il ne décrit que les écrans et les actions auxquels vous avez accès. Les libellés encadrés, comme ${btn('Enregistrer')}, sont ceux des boutons de l’application. Les captures viennent de la base de démonstration : clients, montants et personnes y sont fictifs.</div></div>
${body}</body></html>`;
}

const roles = await loadRoles();
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(WORK, 'html'), { recursive: true });
const edge = await launch(9379, path.join(WORK, 'edge-profile-pdf'));
const page = await edge.page({ width: 1000, height: 1400, scale: 1 });

let n = 0;
for (const role of roles) {
  n += 1;
  const html = guideHtml(role);
  const htmlFile = path.join(WORK, 'html', `${role.code}.html`);
  fs.writeFileSync(htmlFile, html);
  const name = `Guide I2S-System - ${String(n).padStart(2, '0')} ${role.label.replace(/[\\/:*?"<>|]/g, '').replace('&', 'et')}.pdf`;
  await page.goto(pathToFileURL(htmlFile).href, 1500);
  await page.pdf(path.join(OUT, name), {
    footer: `<div style="font-family:Arial;font-size:7.5pt;color:#626b65;width:100%;padding:0 0.7in;display:flex;justify-content:space-between"><span>I2S-System — Guide ${esc(role.label)} · v${VERSION}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  console.log(`✔ ${name}  (${Math.round(fs.statSync(path.join(OUT, name)).size / 1024)} Ko)`);
}
await edge.close();
console.log(`\n${n} guides dans : ${OUT}`);
