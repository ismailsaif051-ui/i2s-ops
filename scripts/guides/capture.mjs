/**
 * Captures d'écran des guides — une série par rôle, prise avec un compte de ce
 * rôle : chaque guide montre le menu et les écrans que ce profil voit vraiment.
 *
 *   node scripts/guides/capture.mjs            (application lancée sur :3000 / :4000)
 */
import fs from 'node:fs';
import path from 'node:path';
import { launch } from './cdp.mjs';
import { WORK, can, loadRoles } from './data.mjs';

const WEB = process.env.GUIDES_WEB ?? 'http://localhost:3000';
const API = process.env.GUIDES_API ?? 'http://localhost:4000/api/v1';

/** Écrans capturables : droit requis, adresse, légende. */
const SCREENS = {
  overview: { path: '/cockpit', caption: 'Vue d’ensemble — votre page d’accueil' },
  'overview-finance': { path: '/cockpit?tab=finance', need: ['invoice', 'VIEW'], caption: 'Vue d’ensemble, onglet Finance' },
  affaires: { path: '/affaires', need: ['affair', 'VIEW'], caption: 'Liste des affaires' },
  'affaire-fiche': { api: '/affairs?limit=1', to: (id) => `/affaires/${id}`, need: ['affair', 'VIEW'], caption: 'Fiche d’une affaire' },
  clients: { path: '/commercial/clients', need: ['client', 'VIEW'], caption: 'Clients' },
  consultations: { path: '/commercial/consultations', need: ['opportunity', 'VIEW'], caption: 'Consultations et appels d’offres' },
  offres: { path: '/commercial/offres', need: ['offer', 'VIEW'], caption: 'Offres' },
  missions: { path: '/operations/missions', need: ['mission', 'VIEW'], caption: 'Missions' },
  'mission-fiche': { api: '/missions?limit=1', to: (id) => `/operations/missions/${id}`, need: ['mission', 'VIEW'], caption: 'Fiche d’une mission : équipe et ordre de mission' },
  'ordres-mission': { path: '/operations/ordres-mission', need: ['mission_order', 'VIEW'], caption: 'Ordres de mission' },
  planning: { path: '/operations/planning', need: ['planning', 'VIEW'], caption: 'Planning des inspecteurs' },
  'inspection-nouvelle': { path: '/operations/inspections/nouvelle', need: ['inspection', 'CREATE'], caption: 'Nouvelle inspection' },
  rapports: { path: '/operations/rapports', need: ['report', 'VIEW'], caption: 'Rapports' },
  'non-conformites': { path: '/operations/non-conformites', need: ['non_conformity', 'VIEW'], caption: 'Non-conformités' },
  equipements: { path: '/operations/equipements', need: ['asset', 'VIEW'], caption: 'Équipements clients' },
  'parc-mesure': { path: '/operations/parc-mesure', need: ['measuring_device', 'VIEW'], caption: 'Parc d’instruments de mesure' },
  attachements: { path: '/finance/attachements', need: ['attachment', 'VIEW'], caption: 'Attachements' },
  factures: { path: '/finance/factures', need: ['invoice', 'VIEW'], caption: 'Factures' },
  'facture-fiche': { api: '/invoices?limit=1', to: (id) => `/finance/factures/${id}`, need: ['invoice', 'VIEW'], caption: 'Fiche d’une facture : règlements et avoirs' },
  encaissements: { path: '/finance/encaissements', need: ['payment', 'VIEW'], caption: 'Encaissements et créances' },
  'notes-frais': { path: '/finance/notes-de-frais', need: ['expense_report', 'VIEW'], caption: 'Notes de frais' },
  virements: { path: '/finance/virements', need: ['payment_batch', 'VIEW'], caption: 'Ordres de virement' },
  avances: { path: '/finance/avances', need: ['advance', 'VIEW'], caption: 'Avances sur frais' },
  'controle-gestion': { path: '/finance/controle-de-gestion', need: ['controlling', 'VIEW'], caption: 'Contrôle de gestion' },
  productivite: { path: '/pilotage/productivite', need: ['timesheet', 'VIEW'], caption: 'Productivité' },
  rentabilite: { path: '/pilotage/rentabilite', need: ['controlling', 'VIEW'], caption: 'Rentabilité par affaire' },
  qualite: { path: '/pilotage/qualite', need: ['report', 'VIEW'], caption: 'Qualité' },
  employes: { path: '/ressources/employes', need: ['employee', 'VIEW'], caption: 'Employés' },
  pointage: { path: '/ressources/pointage', need: ['timesheet', 'VIEW'], caption: 'Pointage' },
  conges: { path: '/ressources/conges', need: ['leave', 'VIEW'], caption: 'Congés' },
  habilitations: { path: '/ressources/habilitations', need: ['certification', 'VIEW'], caption: 'Habilitations' },
  flotte: { path: '/ressources/flotte', need: ['vehicle', 'VIEW'], caption: 'Flotte de véhicules' },
  ged: { path: '/ged', need: ['document', 'VIEW'], caption: 'Documents (GED)' },
  utilisateurs: { path: '/administration/utilisateurs', need: ['user', 'VIEW'], caption: 'Utilisateurs' },
  roles: { path: '/administration/roles', need: ['role', 'VIEW'], caption: 'Rôles et droits' },
  referentiels: { path: '/administration/referentiels', need: ['setting', 'VIEW'], caption: 'Référentiels' },
  templates: { path: '/administration/templates', need: ['inspection_template', 'VIEW'], caption: 'Modèles d’inspection' },
  audit: { path: '/administration/audit', need: ['audit', 'VIEW'], caption: 'Journal d’audit' },
};

/** Les écrans les plus utiles à chaque profil, dans l'ordre de son travail. */
export const FOCUS = {
  ADMIN: ['utilisateurs', 'roles', 'referentiels', 'templates', 'audit', 'employes'],
  DG: ['overview-finance', 'affaires', 'rentabilite', 'controle-gestion', 'notes-frais', 'encaissements', 'qualite'],
  DEPT_HEAD: ['missions', 'mission-fiche', 'planning', 'rapports', 'pointage', 'non-conformites', 'parc-mesure'],
  HR: ['employes', 'pointage', 'conges', 'habilitations', 'notes-frais', 'flotte', 'virements'],
  CONTROLLER: ['controle-gestion', 'rentabilite', 'affaire-fiche', 'employes', 'notes-frais', 'productivite'],
  CONTROLLER_ASSISTANT: ['notes-frais', 'attachements', 'avances', 'flotte', 'controle-gestion'],
  BILLING: ['attachements', 'factures', 'facture-fiche', 'encaissements', 'affaires'],
  RAF: ['factures', 'facture-fiche', 'encaissements', 'notes-frais', 'virements', 'avances'],
  ACCOUNT_MANAGER: ['affaires', 'affaire-fiche', 'missions', 'consultations', 'attachements', 'rapports'],
  SALES: ['clients', 'consultations', 'offres', 'affaires', 'notes-frais'],
  INSPECTOR: ['missions', 'ordres-mission', 'planning', 'inspection-nouvelle', 'rapports', 'pointage', 'notes-frais'],
  DOC_CONTROLLER: ['rapports', 'ged', 'templates', 'non-conformites', 'audit'],
};

const shotsDir = path.join(WORK, 'shots');
// GUIDES_ONLY=shared : ne refait que les écrans communs, les autres sont conservés.
const sharedOnly = process.env.GUIDES_ONLY === 'shared';
const manifestFile = path.join(WORK, 'shots.json');
const manifest = sharedOnly ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { shared: {}, roles: {} };

const roles = await loadRoles();
const edge = await launch(9377, path.join(WORK, 'edge-profile'));
const page = await edge.page({ width: 1280, height: 800, scale: 2 });

async function firstId(token, apiPath) {
  const r = await fetch(API + apiPath, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  if (!r?.ok) return null;
  const body = await r.json();
  return (body.items ?? body)[0]?.id ?? null;
}

async function healthy() {
  return page.evaluate(
    `(() => { const t = document.body.innerText; return !/pas pu se charger|Accès refusé|Page introuvable/.test(t) && !!document.querySelector('h1'); })()`,
  );
}

// ── Écrans communs : connexion, recherche, apparence ─────────────────
await page.clearCookies();
await page.goto(`${WEB}/login`, 1500);
await page.screenshot(path.join(shotsDir, 'shared', 'login.png'));
manifest.shared.login = 'shared/login.png';

const admin = roles.find((r) => r.code === 'ADMIN');
await page.setCookie('i2s_at', admin.token, WEB);
await page.goto(`${WEB}/cockpit`, 1500);
// Vraie frappe au clavier : la fenêtre s'ouvre par son bouton, puis chaque caractère est tapé.
await page.evaluate(`document.querySelector('[aria-label^="Rechercher dans I2S"]').click(); true`);
await new Promise((r) => setTimeout(r, 500));
for (const ch of '26/01') {
  await page.send('Input.dispatchKeyEvent', { type: 'char', text: ch });
  await new Promise((r) => setTimeout(r, 120));
}
// Les résultats arrivent après un court délai : on attend qu'ils soient affichés.
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  if (await page.evaluate(`!/Recherche(…|\.\.\.)/.test(document.body.innerText.replace('Rechercher dans I2S', ''))`)) break;
}
await new Promise((r) => setTimeout(r, 600));
await page.screenshot(path.join(shotsDir, 'shared', 'recherche.png'));
manifest.shared.search = 'shared/recherche.png';

await page.goto(`${WEB}/cockpit`, 1200);
await page.evaluate(`document.documentElement.dataset.theme = 'dark'; true`);
await new Promise((r) => setTimeout(r, 700));
await page.screenshot(path.join(shotsDir, 'shared', 'sombre.png'));
manifest.shared.dark = 'shared/sombre.png';
await page.evaluate(`delete document.documentElement.dataset.theme; true`);

// ── Écrans de chaque rôle ────────────────────────────────────────────
for (const role of sharedOnly ? [] : roles) {
  if (!role.token) { console.log(`✖ ${role.code} : aucun compte de démonstration`); continue; }
  await page.clearCookies();
  await page.setCookie('i2s_at', role.token, WEB);
  const shots = [];
  for (const key of ['overview', ...(FOCUS[role.code] ?? [])]) {
    const screen = SCREENS[key];
    if (screen.need && !can(role.permissions, screen.need[0], screen.need[1])) continue;
    let target = screen.path;
    if (screen.api) {
      const id = await firstId(role.token, screen.api);
      if (!id) continue;
      target = screen.to(id);
    }
    await page.goto(WEB + target, 1400);
    if (!(await healthy())) {
      // Une page qui se compile pour la première fois : second essai.
      await page.goto(WEB + target, 2500);
      if (!(await healthy())) { console.log(`  · ${role.code} ${key} : non capturé`); continue; }
    }
    const file = `${role.code}/${key}.png`;
    await page.screenshot(path.join(shotsDir, file));
    shots.push({ key, file, caption: screen.caption });
  }
  manifest.roles[role.code] = shots;
  console.log(`✔ ${role.code.padEnd(22)} ${shots.length} captures`);
}

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
await edge.close();
console.log('captures terminées');
