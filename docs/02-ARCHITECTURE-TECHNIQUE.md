# 02 — Architecture technique

## 1. Contraintes qui dictent le choix

| Contrainte issue du besoin | Conséquence technique |
|---|---|
| 61 formulaires métier évolutifs, non codés en dur | Schéma de formulaire en JSON validé côté serveur, stocké en `JSONB` |
| Calculs analytiques historisés et reproductibles | Base relationnelle transactionnelle, coûts versionnés, agrégats matérialisés |
| Inspecteur hors réseau sur chantier | PWA avec base locale + file de synchronisation |
| PDF conformes au QMS (logo, code formulaire, version, visas) | Moteur de rendu HTML → PDF partageant le design system |
| 12 rôles × 7 verbes × ~30 ressources | RBAC déclaratif centralisé, appliqué au niveau service **et** requête |
| Traçabilité intégrale exigée | Journal d'audit immuable, append-only |
| API-first, extensible | Contrat OpenAPI, types partagés front/back |
| Équipe de maintenance réduite | Un seul langage (TypeScript) sur toute la chaîne |

## 2. Stack retenue

| Couche | Choix | Justification |
|---|---|---|
| **Monorepo** | npm workspaces | Types, schémas de validation et design system partagés entre web, mobile et API — évite la dérive de contrat. *pnpm n’étant pas installé sur le poste de développement, npm workspaces (natif, équivalent ici) a été retenu ; le passage à pnpm reste possible sans changer la structure.* |
| **Front web** | Next.js 15 (App Router) · React 19 · TypeScript | Rendu serveur pour les listes lourdes, routage par rôle, écosystème mature ; le même code sert le PDF |
| **UI** | Tailwind CSS + design system maison (base Radix UI) | Composants accessibles non stylés + notre identité ; pas de dette d'un kit ERP figé |
| **Mobile inspecteur** | PWA (même socle Next.js) + Workbox + Dexie (IndexedDB) | Une seule base de code ; installation sans store ; hors ligne réel. *Une app native n'apporterait rien de plus ici et doublerait le coût.* |
| **API** | NestJS 11 · TypeScript · OpenAPI | Modularité imposée par le framework (un module NestJS par module métier), gardes RBAC, intercepteurs d'audit, files de tâches intégrées |
| **Validation** | Zod, schémas partagés front/back | Une seule définition de règle par champ |
| **ORM** | Prisma | Migrations versionnées, typage strict, lisibilité pour la maintenance |
| **Base de données** | PostgreSQL 18 (poste de dév.) / 17+ en production | Transactions, `JSONB` pour les formulaires, `tsvector` + `pg_trgm` pour la recherche, `pgvector` pour l'IA, vues matérialisées pour l'analytique |
| **Cache & files** | Redis + BullMQ | Notifications, génération PDF, recalcul d'agrégats, relances, synchronisation |
| **Stockage fichiers** | S3-compatible (MinIO on-premise ou AWS S3) | GED et photos hors base ; URL signées ; versioning natif |
| **PDF** | Playwright/Chromium headless, gabarits React | Fidélité typographique au modèle Word/Excel existant, mêmes composants que l'écran |
| **Auth** | JWT courte durée + refresh rotatif, Argon2id, TOTP optionnel, SSO Microsoft Entra ID optionnel | I2S est vraisemblablement sous Microsoft 365 ; SSO en option sans dépendance forte |
| **Temps réel** | WebSocket (Socket.IO) | Notifications et planning collaboratif |
| **IA** | API Claude (`claude-sonnet-5` par défaut, `claude-opus-5` pour l'analyse documentaire) + `pgvector` | Outils exposés au modèle filtrés par les permissions de l'utilisateur appelant |
| **Observabilité** | OpenTelemetry + Sentry + logs structurés Pino | Diagnostic en production |
| **CI/CD** | GitHub Actions · Docker · Compose (puis Kubernetes) | Déploiement reproductible, on-premise ou cloud |
| **Tests** | Vitest (unitaire) · Supertest (API) · Playwright (E2E) | Les règles de calcul et les workflows sont testés en priorité |

### Pourquoi pas les alternatives

- **Odoo / ERPNext** : le cœur de valeur d'I2S (61 formulaires END/réglementaires, productivité par jour non affecté, étalonnage) n'existe pas en standard ; le coût de personnalisation dépasse celui d'un produit dédié, et l'ergonomie reste celle d'un ERP générique.
- **Laravel / Django** : parfaitement viables, mais imposent un second langage face à un front TypeScript, et donc deux définitions de chaque règle métier.
- **Base NoSQL** : incompatible avec des agrégats financiers transactionnels et des jointures analytiques profondes.
- **App mobile native** : le besoin est de la saisie de formulaire et de la photo hors ligne ; la PWA le couvre, sans double base de code ni distribution par store.

## 3. Topologie

```
┌──────────────┐   ┌──────────────┐   ┌───────────────┐
│  Web (SSR)   │   │ PWA Inspect. │   │ Portail client│
│  Next.js     │   │  offline     │   │   (V3)        │
└──────┬───────┘   └──────┬───────┘   └───────┬───────┘
       │  HTTPS / JSON + WebSocket            │
       └──────────────┬───────────────────────┘
                      ▼
            ┌────────────────────┐
            │   API Gateway      │  Auth · RBAC · Rate limit · Audit
            │   NestJS           │
            └─────────┬──────────┘
     ┌────────────────┼─────────────────┬──────────────┐
     ▼                ▼                 ▼              ▼
┌─────────┐   ┌──────────────┐   ┌───────────┐  ┌────────────┐
│ Modules │   │  Workers     │   │ AI Layer  │  │  Storage   │
│ métier  │   │  BullMQ      │   │  Claude   │  │  S3/MinIO  │
│ (26)    │   │ PDF·Notif·   │   │ +pgvector │  │  GED·photos│
│         │   │ Agrégats·Sync│   │           │  │            │
└────┬────┘   └──────┬───────┘   └─────┬─────┘  └────────────┘
     └───────────────┴─────────────────┘
                     ▼
        ┌─────────────────────────┐
        │ PostgreSQL 17 + Redis   │
        └─────────────────────────┘
```

## 4. Structure du monorepo

```
i2s-ops/
├── apps/
│   ├── api/            NestJS — 26 modules métier + socle
│   ├── web/            Next.js — back-office
│   └── mobile/         Next.js PWA — interface inspecteur
├── packages/
│   ├── contracts/      Types + schémas Zod partagés (source unique)
│   ├── ui/             Design System (composants, tokens)
│   ├── pdf/            Gabarits de documents PDF
│   ├── templates/      Définitions JSON des 61 formulaires
│   └── calc/           Moteur de calcul (productivité, marge, coûts) — testé unitairement
├── prisma/             Schéma + migrations + seeds de référentiels
└── docs/               Ce dossier d'architecture
```

Le package `calc` est isolé volontairement : les formules du CDC (productivité nette, coût d'inactivité, marge) y sont pures, testables, et rejouables sur une date donnée.

## 5. Sécurité

- **Authentification** : Argon2id, verrouillage progressif, 2FA TOTP pour DG / RAF / Admin, sessions révocables.
- **Autorisation** : RBAC déclaratif, vérifié à trois niveaux — route (garde), service (règle métier), requête (filtre de périmètre : un chef de département ne voit que son pôle, un inspecteur que ses propres objets).
- **Multi-société** : filtre `companyId` injecté systématiquement ; un utilisateur peut être habilité sur plusieurs sociétés.
- **Données** : chiffrement TLS en transit, chiffrement au repos sur la base et le stockage, empreintes SHA-256 sur les pièces jointes et les PDF signés.
- **Audit** : table append-only, sans `UPDATE` ni `DELETE`, avec valeurs avant/après en JSON, utilisateur, IP, horodatage.
- **RGPD / loi 09-08** : purge paramétrable, export des données d'un collaborateur, minimisation de la géolocalisation (horodatage de pointage uniquement, pas de suivi continu).
- **Sauvegardes** : PostgreSQL PITR quotidien + réplication du stockage objet ; restauration testée trimestriellement.

## 6. Performance

- Vues matérialisées rafraîchies par worker pour les agrégats de productivité et de rentabilité (rafraîchissement incrémental à chaque événement significatif, plein la nuit).
- Pagination par curseur sur toutes les listes.
- Index composites sur `(companyId, affairId, date)`, `(employeeId, date)`, `(status, dueDate)`.
- Recherche globale : `tsvector` matérialisé par entité, `pg_trgm` pour la tolérance aux fautes. Bascule vers Meilisearch prévue si le volume l'impose.
- Objectif : liste de 50 lignes < 300 ms, cockpit complet < 1,5 s, génération PDF < 4 s.

## 7. Synchronisation hors ligne

1. Le mobile pré-charge les missions à J±7, les templates concernés et les référentiels.
2. Toute saisie hors ligne est écrite dans IndexedDB avec un `clientMutationId` et un horodatage.
3. À la reconnexion, la file est rejouée en ordre ; le serveur est idempotent sur `clientMutationId`.
4. Conflit : résolution **par champ**, dernier écrivain gagnant, avec journalisation systématique et signalement à l'utilisateur si un champ a été écrasé.
5. Un brouillon de rapport reste local tant qu'il n'est pas soumis ; la soumission est un point de synchronisation obligatoire (elle échoue explicitement hors ligne, avec mise en file).
6. Les photos sont téléversées en tâche de fond, avec reprise, et référencées par leur empreinte.
