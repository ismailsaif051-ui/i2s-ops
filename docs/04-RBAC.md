# 04 — RBAC : rôles, permissions, périmètres

## 1. Modèle

Une autorisation est le triplet **`(rôle, ressource+action, périmètre)`**.

- **Actions (7)** : `view` · `create` · `update` · `delete` · `approve` · `export` · `download`
- **Périmètres (5)** : `all` (groupe) · `company` (société) · `department` (pôle) · `team` (équipe du manager) · `own` (ses propres objets)

Le périmètre est appliqué **dans la requête SQL**, pas dans l'interface : un inspecteur qui forgerait un appel API ne verrait toujours que ses propres missions.

## 2. Les 12 rôles

| Rôle | Périmètre par défaut | Fonction |
|---|---|---|
| `DG` | `all` | Direction générale — vue groupe, approbation finale |
| `DEPT_HEAD` | `department` | Chef de pôle CND / CTC / EILM / HSE |
| `HR` | `company` | Ressources humaines |
| `CONTROLLER` | `company` | Contrôle de gestion |
| `CONTROLLER_ASSISTANT` | `company` | Assistante contrôle de gestion |
| `BILLING` | `company` | Responsable facturation |
| `RAF` | `company` | Responsable administratif et financier |
| `ACCOUNT_MANAGER` | `team` | Chargé d'affaires |
| `SALES` | `company` | Représentant technico-commercial |
| `INSPECTOR` | `own` | Inspecteur / technicien |
| `DOC_CONTROLLER` | `company` | Document controller |
| `ADMIN` | `all` | Administrateur technique |

Un utilisateur peut cumuler plusieurs rôles, éventuellement sur plusieurs sociétés (`UserRole` porte `companyId` et `departmentId`).

## 3. Matrice des droits

Légende : **V** view · **C** create · **U** update · **D** delete · **A** approve · **E** export · **T** download · `—` aucun accès. L'indice précise le périmètre quand il n'est pas celui du rôle.

| Ressource | DG | Chef dép. | RH | CG | Ass. CG | Factu. | RAF | Ch. aff. | Comm. | Inspect. | Doc ctrl | Admin |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Clients / Contacts | V E | V | — | V | V | V | V | VCU | VCU | — | V | VCUD |
| Opportunités / AO / Offres | V A E | V | — | V | V | — | V | VCU | VCU | — | V | VCUD |
| Affaires | V A E | V | — | V E | V | V | V | VCU | V | V<sub>own</sub> | V | VCUD |
| Projets / Sites | V | VCU | — | V | V | V | — | VCU | V | V<sub>own</sub> | V | VCUD |
| Missions | V | VCUA | V | V | V | V | — | VCU | — | V<sub>own</sub> | V | VCUD |
| Ordres de mission | V A | VCUA | V | V | V | — | — | VC | — | V<sub>own</sub> T | V | VCUD |
| Planning | V | VCU | V | V | V | — | — | V | — | V<sub>own</sub> | — | VCUD |
| Inspecteurs (fiches) | V | V<sub>dept</sub> | VCU | V | V | — | — | V | — | V<sub>own</sub> | — | VCUD |
| Coût journalier | V | — | VCU | VCUA | V | — | V | — | — | — | — | VCUD |
| Pointage | V E | VA | VA | V E | V | — | — | V | — | VCU<sub>own</sub> | — | VCUD |
| Rapports | V E | VCUA | — | V | V | V | — | VCU | — | VCU<sub>own</sub> | VUA E | VCUD |
| Templates d'inspection | V | VCU<sub>dept</sub> | — | — | — | — | — | — | — | V | VCU | VCUD |
| Équipements clients | V | VCU | — | V | V | — | — | VCU | — | VCU | V | VCUD |
| Parc de mesure / étalonnage | V | VCUA | — | V | V | — | — | — | — | V | V | VCUD |
| Non-conformités | V | VCUA | — | V | V | — | — | VCU | — | VC | V | VCUD |
| Attachements | V A | V | — | V A | VCU | VCU | V | VCUA | — | V<sub>own</sub> | V | VCUD |
| Factures | V A E | — | — | V E | V | VCUA | VCUA E | V | V | — | V | VCUD |
| Paiements / relances | V E | — | — | V | V | VCU | VCUA E | V | — | — | — | VCUD |
| Notes de frais | V A E | VA<sub>dept</sub> | VA | VA E | VCU | — | VA T | VA<sub>team</sub> | VCU<sub>own</sub> | VCU<sub>own</sub> | — | VCUD |
| Avances | V A | V | V | VA | VCU | — | VCUA | — | — | V<sub>own</sub> | — | VCUD |
| Flotte | V | V<sub>dept</sub> | VCU | V | VCU | — | V | V | — | V<sub>own</sub> | — | VCUD |
| RH (employés, congés) | V | V<sub>dept</sub> A | VCUA E | V | V | — | V | — | — | V<sub>own</sub> C | — | VCUD |
| Contrôle de gestion | V E | V<sub>dept</sub> | V | VCU E | VCU | V | V E | V<sub>team</sub> | — | — | — | V |
| GED | V T E | V<sub>dept</sub> T | V T | V T | VCU T | V T | V T | VCU<sub>team</sub> T | V T | V<sub>own</sub> T | VCUDA E T | VCUD |
| Dashboards | tous | dép. | RH | CG | CG | factu. | fin. | portefeuille | commercial | perso | GED | tous |
| Audit | V E | — | — | V | — | — | V | — | — | — | V | V E |
| Utilisateurs / rôles | V | — | V | — | — | — | — | — | — | — | — | VCUDA |
| Paramètres / barèmes | V A | — | V | VCU | — | — | V | — | — | — | — | VCUD |

## 4. Règles de séparation des tâches

Ces contrôles sont bloquants, indépendamment des permissions.

1. Le **vérificateur d'un rapport ne peut pas en être le rédacteur**.
2. Le **valideur d'une note de frais ne peut pas en être le déclarant**, à aucune étape.
3. Un utilisateur ne peut **pas s'approuver lui-même** dans un circuit à plusieurs étapes.
4. La **création d'une facture** et sa **mise en paiement** relèvent de deux rôles distincts (Facturation vs RAF).
5. La **modification d'un coût journalier** exige une double action : saisie (CG) + validation (CG responsable ou DG), avec motif obligatoire et trace d'audit.
6. Un rapport **émis** n'est plus modifiable : seule une **révision** (nouveau numéro de révision) est possible, avec motif.
7. La **suppression** est toujours logique ; la suppression physique est réservée à `ADMIN` et journalisée.

## 5. Application technique

- **Garde de route** : décorateur `@RequirePermission('report','approve')` sur chaque endpoint.
- **Filtre de périmètre** : intercepteur qui injecte les clauses `companyId IN (…)`, `departmentId IN (…)`, `employeeId = …` selon le périmètre du rôle.
- **Interface** : les actions non autorisées ne sont pas affichées désactivées, elles sont **absentes** — l'écran d'un inspecteur ne montre jamais un bouton qu'il ne peut pas utiliser.
- **Assistant IA** : chaque outil exposé au modèle exécute la même requête filtrée que l'utilisateur ; l'IA ne peut structurellement pas répondre au-delà des droits de son interlocuteur.
