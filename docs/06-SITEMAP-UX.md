# 06 — Sitemap, UX par profil & wireframes

## 1. Sitemap général

```
/
├── /cockpit                        Dashboard adapté au rôle
├── /recherche                      Recherche globale (⌘K)
│
├── /commercial
│   ├── /clients                    Liste · Fiche client (contacts, affaires, CA, impayés)
│   ├── /opportunites               Pipeline kanban + liste
│   ├── /appels-offres              Suivi AO, échéances, garanties
│   ├── /offres                     Offres, versions, envois
│   └── /relances                   File de relances à traiter
│
├── /affaires
│   ├── /                           Liste filtrable (statut, dép., client, marge)
│   └── /:numero                    ◆ FICHE AFFAIRE — écran pivot (11 onglets)
│
├── /operations
│   ├── /missions                   Liste · Fiche mission
│   ├── /ordres-mission             File de validation / signature
│   ├── /planning                   Jour · Semaine · Mois · Gantt · Ressource
│   ├── /rapports                   File par statut + bibliothèque
│   ├── /non-conformites            Registre + tableau de suivi
│   ├── /equipements                Assets clients
│   └── /parc-mesure                Instruments I2S + étalonnages
│
├── /finance
│   ├── /attachements
│   ├── /factures
│   ├── /encaissements              Échéancier, relances, rapprochement
│   ├── /notes-de-frais             Mes notes · À valider · Toutes
│   └── /avances
│
├── /ressources
│   ├── /employes                   Fiches, compétences, certifications
│   ├── /pointage                   Grille mensuelle par employé
│   ├── /conges
│   └── /flotte                     Véhicules, réservations, entretiens
│
├── /pilotage
│   ├── /productivite               Dashboard Module 18
│   ├── /rentabilite                Dashboard Module 19
│   ├── /jours-non-affectes         ◆ Vue stratégique Module 13 du CDC
│   ├── /controle-gestion           Budget vs réel, écarts
│   └── /qualite                    KPI QMS (délais, étalonnage, réclamations)
│
├── /ged                            Recherche documentaire multicritère
├── /assistant                      Assistant IA (V3)
└── /administration
    ├── /utilisateurs · /roles · /permissions
    ├── /referentiels               Départements, catégories de frais, méthodes
    ├── /templates-inspection       Éditeur de formulaires
    ├── /numerotation · /bareme     Séquences, plafonds, calendrier ouvré
    └── /audit
```

## 2. Navigation par profil

L'interface n'est pas la même selon le rôle. Le menu est **construit à partir des permissions**, pas filtré après coup.

| Profil | Menu affiché | Écran d'accueil |
|---|---|---|
| **Inspecteur** (mobile) | Mes missions · Mon pointage · Mes frais · Mes rapports · Mes documents | Mission du jour |
| **Chef de département** | Cockpit dép. · Équipe · Planning · Missions · OM à valider · Rapports à contrôler · Parc de mesure | Cockpit département |
| **Chargé d'affaires** | Clients · Affaires · Missions · Rapports · Attachements · Frais équipe | Portefeuille d'affaires |
| **Technico-commercial** | Prospects · Opportunités · AO · Offres · Relances | Pipeline |
| **Contrôle de gestion** | Coûts · Productivité · Budget · Rentabilité · Jours non affectés · Frais · Pointage | Dashboard contrôle de gestion |
| **RH** | Employés · Certifications · Congés · Coûts journaliers · Frais · Formations | Dashboard RH |
| **Facturation / RAF** | Attachements · Factures · Encaissements · Relances · Rapprochement | Échéancier |
| **Document Controller** | GED · Rapports à contrôler · Registres · Versions | File de contrôle |
| **DG** | Cockpit groupe · Alertes · Affaires · Validations · Tous les dashboards | Cockpit direction |

## 3. ◆ Écran pivot : la fiche affaire

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ‹ Affaires    26/0142  ·  OCP SAFI — Contrôle réservoirs      🟢 EN COURS   │
│  Chargé d'affaires : Y. RACHDI   ·   Département CND   ·   Safi              │
│                                          [Nouvelle mission ▾]  [⋯]           │
├──────────────────────────────────────────────────────────────────────────────┤
│  MARCHÉ        FACTURÉ       ENCAISSÉ      COÛTS        MARGE       JOURS    │
│  480 000 DH    312 000 DH    240 000 DH    286 400 DH   8,4 % ⚠     124/180  │
│                              ▓▓▓▓▓▓░░░ 65%              (budget 22 %)         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Vue générale │ Commercial │ Missions │ Planning │ Inspecteurs │ Rapports │   │
│ Attachements │ Factures │ Frais │ Documents │ Rentabilité │ Historique       │
├──────────────────────────────────────────────────────────────────────────────┤
│  ⚠  ALERTE RENTABILITÉ — écart de marge −13,6 pts                            │
│      Frais de mission +180 % vs budget · 6 j d'attente chantier non facturés  │
│      → [Créer un attachement d'attente]  [Analyser les coûts]                 │
│                                                                              │
│  PROCHAINE ACTION                                                            │
│  🟠 3 rapports en attente de vérification — détenteur : M. OULAMIN — J+2      │
│                                                                              │
│  TIMELINE                                                                    │
│  ●─── 12/01 Offre envoyée                                                    │
│  ●─── 28/01 Affaire gagnée · BC n° 4471                                      │
│  ●─── 05/02 Mission MIS-26-0311 · 3 inspecteurs                              │
│  ●─── 19/02 Rapport PR01-F02-26-0455 émis                                    │
│  ○─── 28/02 Attachement ATT-26-0077 en attente client                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 4. ◆ Dashboard « Jours non affectés » (Module 13 du CDC)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  JOURS NON AFFECTÉS            Mars 2026 ▾      Toutes sociétés ▾            │
├──────────────────────────────────────────────────────────────────────────────┤
│   27 JOURS            22 950 DH            9 INSPECTEURS        ▲ +12 % M-1  │
│   non affectés        coût d'inactivité    concernés                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  PAR DÉPARTEMENT                              ÉVOLUTION 12 MOIS              │
│  CND    ████████████████  18 j   15 300 DH    ▁▂▄▃▅▇▆▄▃▅▆█                  │
│  CTC    ████████           9 j    7 650 DH                                   │
│  EILM   ─                  0 j        0 DH                                   │
│                                                                              │
│  ▸ Cliquer un département pour voir les inspecteurs et les journées          │
├──────────────────────────────────────────────────────────────────────────────┤
│  Inspecteur          Dép.  Jours  Coût      Dernière mission   Compétences   │
│  A. HOUARI           CND     6    5 100 DH  02/03 · OCP Safi   UT2 PT2 MT2  │
│  … (cliquable → planning de l'inspecteur, pour l'affecter immédiatement)      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Chaque KPI est cliquable et ouvre le détail correspondant — exigence explicite du CDC (Module 01).

## 5. ◆ Planning inspecteurs

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ PLANNING   ‹ Semaine 11 · 09–15 mars 2026 ›   [Jour|Semaine|Mois]  CND ▾     │
├──────────────┬────┬────┬────┬────┬────┬────┬────────────────────────────────┤
│ Inspecteur   │ L9 │M10 │M11 │J12 │V13 │S14 │  Charge                        │
├──────────────┼────┼────┼────┼────┼────┼────┼────────────────────────────────┤
│ A. HOUARI    │▓▓▓▓▓▓▓▓▓ OCP Safi ▓▓▓│░░░░│░░░░│  ███████░░  70 %             │
│ Y. RACHDI    │▓▓▓▓│▒▒▒▒ Congé ▒▒▒▒▒▒▒▒▒▒▒│    │  ████░░░░░  40 %             │
│ M. BENALI    │░░░░│░░░░│░░░░│░░░░│░░░░│    │  ░░░░░░░░░   0 % ⚠ non affecté │
│ K. ZAHRI     │▓▓▓▓▓ Jorf ▓▓▓│⚠⚠⚠⚠│▓▓▓▓│    │  ████████░  80 % ⚠ conflit     │
└──────────────┴────┴────┴────┴────┴────┴────┴────────────────────────────────┘
  ▓ Mission   ▒ Congé/formation   ░ Non affecté   ⚠ Conflit détecté
  Glisser-déposer pour affecter · le système refuse et explique tout conflit
```

## 6. ◆ Mobile inspecteur

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ ≡  Ma mission    ⚡ │   │ ‹ Rapport UT     ⚡ │   │ ‹ Mes frais         │
├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤
│ 🟢 EN COURS         │   │ PR01-F02 · v00      │   │ Mars 2026 — 1 240 DH│
│ OCP SAFI            │   │                     │   │ Statut : Brouillon  │
│ Réservoir T-402     │   │ ▸ Identification ✓  │   │                     │
│ 09:14 → arrivée ✓   │   │ ▸ Appareil          │   │ 12/03 Carburant     │
│                     │   │   Sitescan D-50     │   │       320 DH   📎   │
│ 📄 OM-26-0311   ⬇   │   │   ✓ Étalonné 08/26  │   │ 12/03 Péage         │
│                     │   │ ▸ Conditions   ✓    │   │        45 DH   📎   │
│ ┌─────────────────┐ │   │ ▸ Étalonnage   ✓    │   │ 11/03 Hébergement   │
│ │ Saisir rapport  │ │   │ ▸ Résultats  (4)    │   │       150 DH ⓘ forfait│
│ └─────────────────┘ │   │ ▸ Photos      (7)   │   │                     │
│ [Observation] [Frais]│  │ ▸ Conclusion        │   │ ⚠ 1 justificatif    │
│ [Terminer la mission]│  │                     │   │   manquant          │
│                     │   │ [Enregistrer]       │   │ [+ Ajouter]         │
│ ⚡ 3 éléments en    │   │ [Soumettre]         │   │ [Soumettre au N+1]  │
│   attente de sync   │   │                     │   │                     │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

L'indicateur ⚡ est permanent : l'inspecteur sait toujours si ses données sont synchronisées.

## 7. ◆ Cockpit DG

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  COCKPIT DIRECTION            Mars 2026 ▾     Groupe (3 sociétés) ▾          │
├───────────────────────────────────────────────────────────────────────────────┤
│  CA FACTURÉ   ENCAISSÉ    MARGE BRUTE   TAUX MARGE   AFFAIRES   PRODUCTIVITÉ  │
│  4,12 M DH    3,28 M DH   0,96 M DH     23,3 %       42 en cours   78,4 %     │
│  ▲ +8 %       ▼ −3 %      ▲ +2 pts      ─           +5 gagnées    ▼ −2 pts    │
├───────────────────────────────────────────────────────────────────────────────┤
│  ⚠ ALERTES (6)                                                                │
│  · 3 affaires sous la marge budgétée de plus de 10 pts                        │
│  · 8 factures échues — 412 000 DH                                             │
│  · 27 jours non affectés en mars — 22 950 DH                                  │
│  · 2 certifications expirent sous 30 jours                                    │
│  · 5 notes de frais en attente de votre validation                            │
│  · 4 rapports hors délai QMS (> 21 jours ouvrés)                              │
├───────────────────────────────────────────────────────────────────────────────┤
│  CA & MARGE (12 mois)          │  RENTABILITÉ PAR AFFAIRE (top écarts)        │
│  [graphique combiné]           │  [barres divergentes budget vs réel]         │
└───────────────────────────────────────────────────────────────────────────────┘
```

## 8. Recherche globale

Raccourci `⌘K` / `Ctrl+K`. Saisir `26/0142` retourne, groupés par type : l'affaire, son client, ses 6 missions, ses 4 inspecteurs, ses 9 rapports, ses 2 attachements, ses 3 factures, ses 27 documents. Chaque résultat est cliquable et conserve le contexte.

## 9. Principes d'interaction transverses

- **Une action primaire par écran**, visuellement unique.
- **Aucun bouton mort** : une action indisponible est absente ou porte l'explication de son indisponibilité.
- **Filtres persistants** par utilisateur et par écran, partageables par URL.
- **Tableaux** : colonnes configurables, tri multiple, export CSV/XLSX respectant les permissions.
- **Formulaires longs** : découpés en sections avec sauvegarde automatique du brouillon.
- **Confirmation** exigée uniquement sur les actions irréversibles, avec rappel de la conséquence.
- **États vides** utiles : ils expliquent quoi faire, pas seulement qu'il n'y a rien.
