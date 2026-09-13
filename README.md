# I2S OPS — ERP Gestion Opérationnelle, Inspection & Contrôle de Gestion

Plateforme de pilotage pour **I2S TESTING** — bureau de contrôle, inspection industrielle, END/CND, contrôle réglementaire (EILM) et contrôle technique de construction (CTC).

> **État : MVP fonctionnel, sur données de simulation.**
> Socle, commercial, affaires, missions, ordres de mission, planning, pointage, rapports,
> attachements, facturation, encaissements, notes de frais, non-conformités, parc de mesure,
> et les quatre tableaux de bord de pilotage. Design system conforme à la **charte graphique
> officielle, édition 2026**. Les modules restants portent une page qui annonce leur contenu
> et leur phase — aucune entrée de menu ne mène à une erreur.

## Chaîne de valeur

```
OPPORTUNITÉ → AFFAIRE → MISSION → INSPECTION → RAPPORT → ATTACHEMENT → FACTURE → PAIEMENT → RENTABILITÉ
```

Clé analytique unique : le **Code Affaire**.

---

## Démarrage

### 1. Prérequis

- Node.js 20+ (24 sur le poste actuel)
- PostgreSQL 17+ (18 déjà installé sur le poste de développement)

### 2. Configuration

Renseignez le mot de passe PostgreSQL dans `.env` :

```
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/i2s_ops?schema=public"
```

Le `JWT_SECRET` est déjà généré. `.env` n'est pas versionné.

### 3. Base de données

```bash
npm run db:setup
```

Crée la base `i2s_ops`, applique le schéma, puis charge les référentiels :
12 rôles, 245 permissions, 7 départements, 15 méthodes d'inspection, 14 catégories de frais
avec leurs plafonds, les paramètres métier et le calendrier ouvré marocain 2026.

Un compte administrateur est créé, avec un mot de passe affiché **une seule fois**.

### 3 bis. Jeu de simulation (facultatif mais recommandé)

```bash
npm run db:demo
```

Génère un exercice complet de janvier à aujourd'hui : ~25 collaborateurs avec coûts journaliers
historisés sur trois trimestres, 8 clients, ~70 affaires, plusieurs centaines de missions et de
journées pointées, rapports, attachements, factures, encaissements, notes de frais, flotte,
instruments de mesure et non-conformités. Un compte par rôle est créé, avec un mot de passe
commun affiché une seule fois.

**Toutes ces données sont fictives.** L'application affiche un bandeau permanent tant que le jeu
est chargé, conformément au cahier des charges §21.

### 4. Lancement

```bash
npm run dev
```

- Interface : http://localhost:3000
- API : http://localhost:4000/api/v1
- Documentation OpenAPI : http://localhost:4000/api/docs

### Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | API et interface en parallèle |
| `npm run dev:api` / `npm run dev:web` | Séparément |
| `npm run build` | Compile contrats, API et interface |
| `npm run db:studio` | Explorateur de base Prisma |
| `npm run db:migrate` | Nouvelle migration |
| `npm run db:seed` | Recharge les référentiels (idempotent) |
| `npm run db:demo` | Recharge le jeu de simulation |

---

## Structure

```
apps/
  api/            NestJS — socle + modules métier
  web/            Next.js — back-office et design system
packages/
  contracts/      Types, schémas Zod, matrice RBAC, sitemap — source unique
  db/             Schéma Prisma + seed des référentiels
docs/             Dossier d'architecture (12 documents)
```

## Ce qui fonctionne aujourd'hui

| Brique | État |
|---|---|
| Connexion, Argon2id, verrouillage après 5 échecs | ✅ |
| Jetons courts + rotation du jeton de rafraîchissement, détection de réutilisation | ✅ |
| Mot de passe provisoire forcé à la première connexion | ✅ |
| RBAC : 12 rôles, 7 actions, 5 périmètres, appliqué route → service → requête SQL | ✅ |
| Menu construit à partir des droits (aucune entrée grisée) | ✅ |
| Journal d'audit en ajout seul, avec valeurs avant / après | ✅ |
| Coût journalier historisé par période, jamais écrasé | ✅ |
| Numérotation transactionnelle par société et par année | ✅ |
| Notifications in-app | ✅ |
| Design system aligné sur la charte graphique officielle (édition 2026) | ✅ |
| Cockpit avec KPI cliquables et file d’alertes | ✅ |
| Dashboard jours non affectés — par pôle, par inspecteur, tendance 12 mois | ✅ |
| Dashboard productivité — décomposition du temps, jours non valorisés, classement | ✅ |
| Dashboard rentabilité — marge par affaire, écart au budget, alerte | ✅ |
| Affaires : liste à double statut + fiche avec budget vs réel | ✅ |
| Missions, ordres de mission signés, planning avec détection de conflits | ✅ |
| Pointage mensuel, une ligne par employé et par jour | ✅ |
| Rapports avec délai QMS, parc de mesure avec étalonnage bloquant | ✅ |
| Non-conformités, opportunités et entonnoir commercial | ✅ |
| Attachements, factures, encaissements avec balance âgée et DSO | ✅ |
| Notes de frais avec circuit à 5 visas et alertes de plafond | ✅ |
| Référentiels : départements, plafonds de frais, méthodes, règles de gestion | ✅ |
| Clients, flotte, utilisateurs, rôles, audit | ✅ |
| Aucune entrée de menu ne mène à une page inexistante | ✅ |
| Jeu de simulation complet, signalé comme fictif | ✅ |

---

## Dossier d'architecture

| # | Document | Contenu |
|---|---|---|
| 00 | [Analyse du cahier des charges](docs/00-ANALYSE-CDC.md) | Corpus analysé, exigences, apports du référentiel QMS, écarts et propositions |
| 01 | [Architecture fonctionnelle](docs/01-ARCHITECTURE-FONCTIONNELLE.md) | 6 domaines, 26 modules, automatisations, user journeys |
| 02 | [Architecture technique](docs/02-ARCHITECTURE-TECHNIQUE.md) | Stack et justification, topologie, sécurité, hors ligne |
| 03 | [Modèle de données & ERD](docs/03-MODELE-DONNEES.md) | Entités, relations, invariants, numérotation |
| 04 | [RBAC](docs/04-RBAC.md) | 12 rôles × 7 actions × 5 périmètres, séparation des tâches |
| 05 | [Workflows](docs/05-WORKFLOWS.md) | 10 machines à états, conditions bloquantes |
| 06 | [Sitemap & UX](docs/06-SITEMAP-UX.md) | Navigation par profil, wireframes des écrans pivots |
| 07 | [Design System](docs/07-DESIGN-SYSTEM.md) | Tokens, composants, identité des PDF, accessibilité |
| 08 | [Moteur de templates](docs/08-MOTEUR-TEMPLATES.md) | 62 formulaires, 3 paradigmes, versionnage, plan de reprise |
| 09 | [Contrôle de gestion](docs/09-CONTROLE-DE-GESTION.md) | Formules de productivité, coûts et rentabilité |
| 10 | [Roadmap](docs/10-ROADMAP.md) | MVP 10 semaines, V2 12 semaines, V3 10 semaines |
| 11 | [Décisions à valider](docs/11-DECISIONS-A-VALIDER.md) | Arbitrages requis — D1, D2 et D9 tranchés |

## Décisions actées

| Réf. | Décision |
|---|---|
| D1 | Hébergement **cloud** (`docker-compose.yml` fourni) |
| D2 | Périmètre MVP **I2S TESTING seule** ; la dimension société existe dans le modèle, les deux autres entités s'activent sans migration |
| D9 | Département pilote **CND** |

## Sources métier

Cahier des charges I2S-TESTING, procédures QMS `PR01 CND & Pression`, `PR02 EILM`, `PR03 CTC`,
62 modèles de rapports, procédure et matrices de notes de frais, plannings d'interventions et d'étalonnage.
