# 09 — Contrôle de gestion : règles de calcul

Ce document est le **contrat de calcul** du produit. Toutes ces formules sont implémentées dans le package isolé `packages/calc`, couvert par des tests unitaires, et sont **rejouables à une date donnée**.

---

## 1. Principe fondateur : le calcul à la date

Tout coût utilisé dans un calcul est celui **en vigueur à la date du fait générateur**, jamais le coût courant.

```
coûtJournalier(employé, date) =
    EmployeeDailyCost
      WHERE employeeId = employé
        AND validFrom <= date
        AND (validTo IS NULL OR validTo >= date)
```

Exemple imposé par le CDC :

| Période | Coût journalier |
|---|---|
| T1 2026 | 850 DH |
| T2 2026 | 875 DH |
| T3 2026 | 900 DH |

Une vacation du 12 février 2026 est valorisée à **850 DH**, même recalculée en octobre. L'historique n'est jamais écrasé ; une modification crée une nouvelle période de validité et une entrée d'audit (ancienne valeur → nouvelle valeur, auteur, motif, date).

---

## 2. Temps & productivité

### 2.1 Décomposition du temps ouvré

```
TempsOuvréTotal(employé, période)
    = JoursTravaillés          (MISSION_BILLABLE + MISSION_NON_BILLABLE)
    + JoursAttenteIntempéries  (SITE_WAITING + WEATHER)
    + JoursCongésFormations    (LEAVE + SICK + TRAINING)
    + JoursNonAffectés         (UNASSIGNED)
```

`JoursOuvrésTotaux` provient du calendrier `WorkCalendar` de la société (jours fériés marocains paramétrés), et non d'une constante.

### 2.2 Productivité nette

```
TauxProductivitéNette (%) =
    JoursFacturésSurAttachements
    ─────────────────────────────────────  × 100
    (JoursOuvrésTotaux − JoursCongés)
```

`JoursFacturésSurAttachements` = jours effectivement portés par un `AttachmentLine` d'un attachement `Validé` ou `Facturé`. C'est un choix volontairement strict : un jour travaillé mais non attaché **ne compte pas** comme productif. L'écart entre jours travaillés et jours facturés devient un indicateur à part entière (« jours travaillés non valorisés »).

### 2.3 Taux d'affectation

```
TauxAffectation (%) = InspecteursSousOMActifCeJour / InspecteursDisponiblesCeJour × 100
```

Calculé en temps réel pour le cockpit, historisé quotidiennement pour les tendances.

### 2.4 Coût d'inactivité

```
CoûtInactivité(employé, période) =
    Σ  coûtJournalier(employé, jour)      pour chaque jour UNASSIGNED
```

Agrégé par employé, département, société, mois, trimestre, année.

### 2.5 Jours non facturables sur chantier

```
JoursNonFacturablesChantier = Σ jours (SITE_WAITING + WEATHER)
CoûtSupporté = Σ coûtJournalier(employé, jour) sur ces jours
```

Ces jours sont **potentiellement refacturables** au client si le contrat le prévoit (intempéries, retard d'accès, arrêt chantier imputable au client). Le système propose systématiquement de les porter à un attachement, avec la mention de l'imputabilité.

---

## 3. Rentabilité par affaire

### 3.1 Revenus

```
CAContractuel  = Affair.contractAmountHT + Σ avenants
CAFacturé      = Σ Invoice.totalHT   (statut ≠ Annulée) − Σ CreditNote.amount
CAEncaissé     = Σ Payment.amount
CAÀFacturer    = Σ AttachmentSheet.totalHT (statut Validé, non facturé)
Reste à facturer = CAContractuel − CAFacturé − CAÀFacturer
```

### 3.2 Coûts

```
CoûtRH        = Σ  coûtJournalier(employé, jour) × jours passés sur l'affaire
                   (toutes catégories imputées à l'affaire, y compris attente/intempérie)
CoûtFrais     = Σ  ExpenseLine.amount imputées à l'affaire (statut ≥ Approuvée)
CoûtVéhicules = Σ  (carburant + péage + entretien au prorata + forfait LLD au prorata d'usage)
CoûtSousTrait.= Σ  lignes de coût de type sous-traitance
AutresCoûts   = Σ  lignes de coût diverses
CoûtTotal     = CoûtRH + CoûtFrais + CoûtVéhicules + CoûtSousTraitance + AutresCoûts
```

Le coût véhicule est réparti : les frais directs (carburant, péage) sont imputés à l'affaire par la note de frais ; les coûts de structure (LLD, assurance, entretien) sont répartis au prorata des jours d'utilisation sur l'affaire.

### 3.3 Résultat

```
MargeBrute       = CAFacturé − CoûtTotal
TauxMarge (%)    = MargeBrute / CAFacturé × 100

MargeProjetée    = CAContractuel − CoûtTotalProjeté
TauxMargeProjeté = MargeProjetée / CAContractuel × 100

ÉcartMarge (pts) = TauxMargeRéel − TauxMargeBudgété
```

Alerte automatique dès que `ÉcartMarge < −5 points` :

```
⚠ Affaire 26/0142
   Marge budgétée : 22,0 %
   Marge actuelle : 8,4 %
   Écart : −13,6 points
```

### 3.4 Marge brute par vacation (formule du CDC)

```
MargeVacation = TarifVacationFacturé
              − ( coûtJournalier(inspecteur, date) + FraisDeMissionDuJour )
```

Restituée par mission, inspecteur, affaire et client — elle révèle les grilles tarifaires devenues insuffisantes.

### 3.5 Budget vs réel

Comparaison ligne à ligne sur `AffairBudgetLine` :

| Poste | Budget | Engagé | Réel | Écart | Écart % |
|---|---|---|---|---|---|
| Main-d'œuvre | | | | | |
| Frais de mission | | | | | |
| Véhicules | | | | | |
| Sous-traitance | | | | | |
| Autres | | | | | |

L'« engagé » comprend les missions planifiées non encore réalisées, valorisées au coût journalier prévisionnel : cela donne au contrôle de gestion une **vision à terminaison**, pas seulement un constat.

---

## 4. Trésorerie

```
Échu           = Σ Invoice.totalTTC (dueDate < aujourd'hui, non soldées)
DSO (jours)    = (Créances clients / CA TTC de la période) × nb jours de la période
TauxRecouvrement (%) = CAEncaissé / CAFacturé × 100
```

Balance âgée : 0–30 · 31–60 · 61–90 · > 90 jours.

---

## 5. Commercial

```
TauxTransformation (%) = OffresGagnées / OffresEnvoyées × 100
PipelinePondéré        = Σ (Opportunity.amount × probability)
DélaiMoyenDeCycle      = moyenne(dateGain − dateCréationOpportunité)
TauxDeRéponseAO        = AOdéposés / AOidentifiés × 100
```

Analyse des marchés perdus par motif, client, département, concurrent.

---

## 6. KPI qualité (QMS — issus des procédures PR01/PR02/PR03)

```
TauxRespectDélaisRapport (%) =
    RapportsRemisÀTemps / RapportsPlanifiés × 100        [trimestriel]

DélaiDeRemise (jours ouvrés) =
    Report.deliveredAt − Mission.actualEndDate            [objectif < 21 j]

TauxRespectPlanningÉtalonnage (%) =
    ÉquipementsÉtalonnésÀTemps / ÉquipementsÀÉtalonner × 100   [annuel]

TauxRespectInterventionsPlanifiées (%) =
    InterventionsRéaliséesÀTemps / InterventionsPlanifiées × 100  [mensuel]

RéclamationsClientSurRapports  → objectif < 2 par trimestre
```

Ces indicateurs sont contractualisés dans le système qualité d'I2S : ils apparaissent dans un dashboard « Qualité » dédié et alimentent la revue de direction.

---

## 7. Contrôles de cohérence permanents

Exécutés par un worker quotidien ; toute anomalie remonte au contrôle de gestion.

| Contrôle | Anomalie détectée |
|---|---|
| Jour facturé deux fois | Une `TimesheetDay` sur deux attachements validés |
| Mission sans pointage | Mission terminée sans journées associées |
| Journée orpheline | Journée `MISSION_BILLABLE` sans mission |
| Frais sans imputation | `ExpenseLine` sans `affairId` ni centre de charges |
| Rapport hors étalonnage | Instrument périmé à la date de l'essai |
| Facture sans attachement | Facture émise hors du circuit |
| Coût journalier manquant | Employé sans coût en vigueur à une date pointée |
| Marge aberrante | Taux de marge > 80 % ou < −50 % |
| Affaire dormante | Aucun mouvement depuis 90 jours sur une affaire « En cours » |

---

## 8. Exemple de bout en bout

Affaire `26/0142` — mars 2026, 2 inspecteurs.

| Élément | Détail | Montant |
|---|---|---|
| Jours facturés | 24 j × 1 800 DH (vacation) | **43 200 DH** |
| Coût RH | 24 j × 850 DH (coût T1 2026) | −20 400 DH |
| Jours d'attente chantier | 3 j × 850 DH, non facturés | −2 550 DH |
| Frais de mission | carburant, péage, hébergement 4 nuits | −3 140 DH |
| Véhicule (quote-part LLD) | 27 j / 30 × 3 500 DH | −3 150 DH |
| **Marge brute** | | **13 960 DH** |
| **Taux de marge** | 13 960 / 43 200 | **32,3 %** |
| Marge si les 3 j d'attente avaient été attachés | +5 400 DH de CA | **35,8 %** |

Cette dernière ligne est l'objet même du module : rendre visible, en permanence, ce que l'entreprise ne facture pas.
