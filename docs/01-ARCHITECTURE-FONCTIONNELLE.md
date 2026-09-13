# 01 — Architecture fonctionnelle

## 1. La chaîne de valeur

```
OPPORTUNITÉ → AFFAIRE → MISSION → INSPECTION → RAPPORT → ATTACHEMENT → FACTURE → PAIEMENT → RENTABILITÉ
```

Chaque flèche est une **transition contrôlée** : elle a un acteur, une condition d'entrée, un enregistrement, et elle est refusée si la condition précédente n'est pas remplie.

| Transition | Condition bloquante |
|---|---|
| Opportunité → Affaire | Offre au statut `Gagné` + bon de commande client enregistré |
| Affaire → Mission | Affaire `En cours` + budget et vacation journalière renseignés |
| Mission → Ordre de Mission | Mission `Confirmée` + inspecteur sans conflit de planning + véhicule disponible |
| Mission → Inspection | OM `Signé` |
| Inspection → Rapport | Instrument de mesure **en cours de validité d'étalonnage** à la date de l'essai |
| Rapport → Émission | Vérification de conformité par un vérificateur ≠ rédacteur |
| Rapport → Attachement | Rapport `Émis` (ou dispense tracée par le Chargé d'Affaires) |
| Attachement → Facture | Attachement `Validé` par le client ou le Chargé d'Affaires |
| Facture → Paiement | Facture `Émise` + échéance |
| Tout → Rentabilité | Automatique, temps réel |

## 2. Les 6 domaines fonctionnels

```
┌─────────────────────────────────────────────────────────────────────┐
│  D1. PILOTAGE          Dashboards · KPI · Alertes · Assistant IA    │
├─────────────────────────────────────────────────────────────────────┤
│  D2. COMMERCIAL        CRM · AO · Offres · Affaires · Projets       │
├─────────────────────────────────────────────────────────────────────┤
│  D3. OPÉRATIONS        Missions · OM · Planning · Inspections ·     │
│                        Rapports · NC · Équipements · Étalonnage     │
├─────────────────────────────────────────────────────────────────────┤
│  D4. FINANCE           Attachements · Facturation · Paiements ·     │
│                        Frais · Avances · Contrôle de gestion        │
├─────────────────────────────────────────────────────────────────────┤
│  D5. RESSOURCES        RH · Compétences · Pointage · Flotte         │
├─────────────────────────────────────────────────────────────────────┤
│  D6. SOCLE             Auth · RBAC · GED · Audit · Notifications ·  │
│                        Référentiels · Numérotation · Recherche      │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Cartographie des 26 modules

| # | Module | Domaine | Dépend de | Version |
|---|---|---|---|---|
| 01 | Dashboard / Cockpit | D1 | tous | MVP (partiel) → V2 |
| 02 | Commercial / CRM | D2 | 20, 23 | MVP |
| 03 | Affaires / Projets | D2 | 02 | MVP |
| 04 | Missions | D3 | 03, 07, 16 | MVP |
| 05 | Ordre de Mission | D3 | 04, 18 | MVP |
| 06 | Planning inspecteurs | D3 | 04, 07, 21 | MVP |
| 07 | Inspecteurs | D5 | 21 | MVP |
| 08 | Pointage / Productivité | D5 | 04, 07, 13 | MVP |
| 09 | Rapports d'inspection | D3 | 04, 10, 11bis | V2 |
| 10 | Méthodes & templates d'inspection | D3 | — | V2 (socle en MVP) |
| 11 | Équipements clients (assets) | D3 | 03 | V2 |
| 11b | **Parc de mesure & étalonnage** *(ajout)* | D3 | 07 | V2 |
| 12 | Non-conformités / Observations | D3 | 09, 11 | V2 |
| 13 | Attachements | D4 | 04, 08, 09 | V2 |
| 14 | Facturation | D4 | 13 | V2 |
| 15 | Notes de frais & avances | D4 | 05, 07 | MVP |
| 16 | Flotte | D5 | 21 | V2 |
| 17 | Contrôle de gestion | D4 | 08, 13, 14, 15, 16 | V2 |
| 18 | Dashboard productivité | D1 | 08 | MVP |
| 19 | Dashboard rentabilité | D1 | 17 | V2 |
| 20 | GED | D6 | 23 | V2 (stockage en MVP) |
| 21 | RH | D5 | 23 | MVP |
| 22 | Dashboards direction | D1 | tous | V2 |
| 23 | RBAC / Utilisateurs | D6 | — | MVP |
| 24 | Audit | D6 | 23 | MVP |
| 25 | Notifications | D6 | tous | MVP |
| 26 | **Assistant IA** | D1 | 23, 20 | V3 |

## 4. Modules transverses du socle (D6)

Ces briques ne sont pas des écrans, ce sont des services utilisés par tous les modules.

| Service | Rôle | Exemple |
|---|---|---|
| `Numbering` | Génère tous les numéros métier par société, année, séquence | `26/0142`, `OM-26-0311`, `F-26-0088` |
| `Approval` | Machine à états générique des circuits de visa | Sert frais, OM, rapport, attachement, facture |
| `Audit` | Journalise `qui / quoi / avant / après / quand / depuis où` | Changement de coût journalier 850 → 900 DH |
| `Documents` | Stockage, versioning, tags, permissions, prévisualisation | Rattache tout fichier à une entité |
| `Notifications` | Canal in-app + e-mail + push PWA, règles déclaratives | « OM à valider », « certification expire dans 30 j » |
| `Search` | Recherche globale fédérée | `26/0142` → affaire + missions + rapports + factures |
| `Rules` | Moteur de règles métier déclaratives | Plafonds de frais, conflits de planning |
| `Reporting` | Agrégats analytiques matérialisés | Productivité mensuelle par inspecteur |

## 5. Automatisations (Module 10 du CDC)

| Déclencheur | Actions automatiques |
|---|---|
| Mission confirmée | Générer l'OM en brouillon · notifier l'inspecteur · réserver le véhicule · créer la tâche « rapport attendu » avec échéance J+21 ouvrés |
| OM signé | Verrouiller le PDF · ouvrir la saisie de frais de mission · pousser la mission sur le mobile de l'inspecteur |
| Mission terminée sans rapport à J+15 ouvrés | Alerte inspecteur + chef de département |
| Rapport validé | Débloquer l'attachement · calculer le délai réel de remise · alimenter le KPI qualité |
| Attachement validé | Rendre les jours facturables · débloquer la facturation |
| Facture échue | Créer une relance · notifier le RAF · marquer l'affaire « à risque cash » |
| Certification / habilitation à J−60 | Notifier RH + chef de département · marquer l'inspecteur « à requalifier » |
| Étalonnage instrument à J−30 | Notifier le responsable métrologie · bloquer les nouvelles affectations de cet instrument après échéance |
| Marge réelle < marge budgétée − 5 pts | Alerte Contrôle de gestion + DG sur la fiche affaire |
| Inspecteur non affecté 3 jours ouvrés consécutifs | Alerte chef de département avec le coût d'inactivité cumulé |
| Note de frais non soumise au 03 du mois | Rappel collaborateur, puis escalade N+1 au 05 |

## 6. User journeys

### J1 — Inspecteur (mobile, souvent hors réseau)

```
Notification « OM-26-0311 signé »
  → Ouvrir Ma mission (client, site, contact, horaires, consignes HSE)
  → Consulter l'OM PDF hors ligne
  → [Sur site] Démarrer la mission → horodatage + géolocalisation
  → Sélectionner le template (ex. PR01-F02 Ultrasons)
  → Renseigner l'appareil utilisé → contrôle d'étalonnage automatique
  → Saisir mesures / indications / check-list, prendre photos
  → Ajouter une observation → la promouvoir en non-conformité si besoin
  → Terminer la mission → pointage du jour pré-rempli « Mission facturable »
  → Déclarer les frais du jour (catégorie, montant, photo du justificatif)
  → [Retour réseau] Synchronisation automatique
```

Contrainte : **tout l'écran de saisie fonctionne hors ligne**, y compris les photos ; la file de synchronisation est visible et rejouable.

### J2 — Chef de département

```
Cockpit département → 4 inspecteurs non affectés cette semaine (coût 3 400 DH)
  → Ouvrir le planning semaine → glisser un inspecteur sur une demande de mission
  → Le système refuse : conflit avec un congé → proposer 2 inspecteurs qualifiés disponibles
  → Confirmer la mission → OM généré → valider → signer
  → File « Rapports à contrôler » (3) → vérifier la conformité → viser ou renvoyer en correction
```

### J3 — Chargé d'affaires

```
Fiche affaire 26/0142 → onglet Rentabilité
  → Marge budgétée 22 %, marge réelle 8,4 % → alerte
  → Détail : frais de mission +180 %, 6 jours d'attente chantier non facturables
  → Créer un attachement des jours d'attente imputables au client
  → Soumettre pour validation client → transmettre à la Facturation
```

### J4 — Contrôle de gestion

```
Dashboard rentabilité → tri par écart de marge
  → 3 affaires déficitaires → ouvrir la pire
  → Analyser le coût RH (coût journalier historisé à la date de chaque vacation)
  → Dashboard Jours non affectés → CND 18 j / 15 300 DH, CTC 9 j / 7 650 DH
  → Cliquer sur CND → liste des inspecteurs et des journées concernées
  → Exporter pour la revue de direction
```

### J5 — DG

```
Cockpit → CA facturé, CA encaissé, marge, cash, alertes
  → 5 notes de frais en attente de validation finale → valider en lot
  → Le lot passe en « Bon à payer », le RAF est notifié
  → Question à l'assistant IA : « Quelle est la rentabilité de l'affaire 26/0142 ? »
```

## 7. Règle UX « Action suivante »

Tout objet métier expose en permanence quatre informations :

| Question | Rendu |
|---|---|
| Où suis-je ? | Fil d'Ariane + en-tête d'entité |
| Quel est le statut ? | Badge d'état coloré + timeline |
| Que dois-je faire ? | Bandeau d'action primaire unique |
| Qui doit agir ? | Nom et rôle du détenteur courant + délai restant |

Exemple : `🟠 Rapport RPT-26-0455 — en attente de vérification · Détenteur : M. OULAMIN (Resp. CTC) · Échéance J+2` avec un bouton primaire **Vérifier le rapport**.
