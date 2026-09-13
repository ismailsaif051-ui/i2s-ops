# 00 — Analyse du Cahier des Charges & du corpus documentaire

> Produit le 2026-09-06. Source primaire : `CAHIER DE CHARGE.docx`.
> Sources secondaires : référentiel QMS I2S (procédures PR01 CND, PR02 EILM, PR03 CTC), 62 modèles de rapports, procédure et matrices Notes de frais.

---

## 1. Corpus analysé

| Source | Nature | Ce qu'elle apporte |
|---|---|---|
| `CAHIER DE CHARGE.docx` | Besoin fonctionnel | Modules, KPI, formules de productivité, matrice RBAC (12 rôles), 6 vues dashboard |
| `PR01 CND & Pression` (rev 00/01/02) | Processus QMS | Cycle CND, indicateurs, plan de contrôle, procédures opératoires (10 : UT/PT/MT/VT/RT × ASME V & EN ISO) |
| `PR02 EILM` (rev 01) | Processus QMS | Cycle contrôle réglementaire électricité / levage / incendie, indicateurs |
| `PR03 CTC` | Processus QMS | Cycle contrôle technique de construction, référentiels DTU/BAEL/Eurocodes/RPS2011, indicateurs |
| 20 modèles de rapports CND (`PR01-F02 … F27`) | Formulaires métier | Structure réelle des rapports d'essai END |
| 40 modèles de rapports EILM (`PR02-F01 … F42`) | Formulaires métier | Structure réelle des rapports de vérification réglementaire |
| 2 modèles CTC (`PR03-F01`, `PR03-F02`) | Formulaires métier | Rapport CTC + notice de sécurité incendie |
| `Procedure_Notes_de_Frais_I2S_TESTING V2` | Règles de gestion | Catégories, plafonds, barèmes, circuit de visa, délais, motifs de rejet |
| `I2S TESTING-Notes de frais rev01.xlsx` (+ variantes SUD, BETA ENG) | Gabarit opérationnel | Colonnes d'imputation analytique réelles, synthèse hebdo, bloc de visa |
| `PR01-F01 Planning des interventions CND` | Gabarit opérationnel | Champs de planification réels + jalons de remise de rapport |
| `PR03-F03 Registre des interventions CTC` | Gabarit opérationnel | Format `N° Affaire = AA/XXXX`, deadline de remise de PV |
| `PR03-DA01-F01 Fiche suivi CTC` | Gabarit qualité | Contrôle de conformité du rapport avant émission |
| `PR02-F16 / PR02-F30 Planning d'étalonnage` | Gabarit opérationnel | Parc d'équipements de mesure I2S + échéances d'étalonnage |
| `Suivi Cde Partagé I2S.xlsx` | **Système de gestion actuel** | Registre réel des affaires : double statut, montants OP et BC, pilotes, services multiples, ordres de grandeur |

**62 modèles de rapports distincts** ont été recensés (20 CND + 40 EILM + 2 CTC). C'est le chiffre qui commande l'architecture : aucun formulaire ne peut être codé en dur.

---

## 2. Exigences retenues du Cahier des Charges

### 2.1 Principe pivot

Le **Code Affaire** est la clé analytique unique reliant : Client → Affaire → Projet → Site → Mission → Inspecteur → Temps → Frais → Rapport → Attachement → Facture → Paiement → Rentabilité. Principe *Single Source of Truth* : une donnée saisie une seule fois.

### 2.2 Formules imposées (à implémenter littéralement)

```
Temps Ouvré Total = Jours Facturés/Travaillés
                  + Jours Attente/Intempéries
                  + Jours Congés/Formations
                  + Jours Non Affectés (Inactifs)

Taux de Productivité Nette (%) = Jours Facturés sur Attachements
                                 / (Jours Ouvrés Totaux − Jours Congés) × 100

Coût d'Inactivité = Jours Non Affectés × Coût Journalier de l'employé

Marge Brute par Vacation = Montant facturé − (Coût journalier inspecteur + Frais de mission)
Taux de Marge (%) = Marge / Revenus × 100
```

Granularité de restitution imposée : **par inspecteur, par département (CND, CTC, EILM, HSE), par mois / trimestre / année**.

### 2.3 Les 6 vues dashboard du CDC

1. Productivité RH & Taux d'Occupation — Direction, RH, Chefs de dép.
2. Chantiers & Attachements — Chargés d'Affaires, Facturation
3. Financier & Rentabilité — Contrôle de Gestion, DG, RAF
4. Commercial & Pipeline — Technico-commercial, DG
5. Frais & Rapprochements — RAF, DG, Comptabilité
6. Flotte & Véhicules — Moyens Généraux, Assistante

### 2.4 Circuits de validation imposés

- **Note de frais** : Saisie N → Confirmation N+1 → Validation RH / Contrôle de Gestion → Comptabilité → Validation finale DG → Règlement (virement le 15 du mois).
- **Mission** : planifiée par N+1, confirmée par N → génère un **Ordre de Mission signé électroniquement**.
- **Facturation** : uniquement par regroupement d'**attachements validés**.

### 2.5 Matrice des 12 rôles

DG, Chef de Département (CND/CTC/EILM/HSE), RH, Contrôle de Gestion, Assistante CG, Responsable Facturation, RAF, Chargé d'Affaires, Technico-Commercial, Inspecteur, Document Controller, Admin.

---

## 3. Ce que le corpus QMS ajoute — et que le CDC ne dit pas

Ces points sont issus des documents fournis. Ils sont **structurants** et doivent entrer dans le produit.

### 3.1 Le groupe compte plusieurs entités juridiques

Trois classeurs de notes de frais coexistent : **I2S TESTING**, **I2S TESTING SUD**, **BETA ENG**.

→ Le modèle de données doit porter une dimension `Company` (société émettrice) dès le MVP : numérotation, facturation, plans analytiques et consolidation en dépendent. *Ajouter cette dimension a posteriori coûterait une migration lourde.*

### 3.2 Format réel du numéro d'affaire

Le registre CTC impose `N° Affaire = AA/XXXX` (ex. `26/0142`). Le CDC utilise `AFF-2026-001`.

→ **Proposition** : conserver `AA/XXXX` comme numéro métier affiché (continuité avec l'existant) et le générer par séquence annuelle et par société. Le format reste paramétrable.

### 3.3 Codification documentaire QMS existante

`PM01` (Direction), `PM02` (QHS), `PS01` (RH), `PS02` (Achats), `PR01` (CND), `PR02` (EILM), `PR03` (CTC) ; formulaires `-Fxx`, annexes `-DAxx`, avec **version** et **date d'application**.

→ La GED doit reprendre cette codification, pas en inventer une autre. Chaque rapport PDF porte en pied de page `PR01-F02. Version 00. DA 01/10/2022`.

### 3.4 Structure réelle d'un rapport d'essai (CND)

Bloc commun identique sur tous les formulaires END, bilingue FR/EN :
`Identifiant N°` · `Rapport N°` · `Client` · `N° d'Affaire` · `Instruction Ref (procédure)` · `Fabricant` · `Lieu de contrôle` · `Spec. applicable` · `Plan de référence` · `Matériel examiné`.

Puis des blocs variables selon la méthode :

- **Matériel utilisé** (appareil, marque, type, n° de série → *doit pointer vers le parc d'équipements de mesure et son étalonnage*)
- **Conditions d'examen** (état de surface, couplant, sens de sondage, étendue…)
- **Étalonnage / réglages** (blocs de référence, gain dB, transfert…)
- **Résultats de l'interprétation** (tableau répétable, colonnes propres à la méthode)
- **Décision** : `V/NV` (valable / non valable) et `C/NC` (conforme / non conforme)

Et un bloc commun de signature à **4 colonnes** :
`EXAMEN EFFECTUÉ PAR` · `RAPPORT ÉTABLI PAR` · `CLIENT / TIERCE PARTIE` · `CLIENT FINAL`, chacune avec `NOM` / `DATE` / `VISA`.

### 3.5 Structure réelle d'un rapport réglementaire (EILM)

Modèle différent : **check-list hiérarchique**.

- Références client & circonstances de la visite (établissement, adresse, lieu, nature d'intervention, date)
- Identification de l'équipement (désignation, constructeur, n° d'identification, type, portée, CMU, année…)
- Check-list par sections → points de contrôle, verdict dans **{SO, NA, C, NC}** + état constaté
- **Conclusion à 3 issues exclusives** : `apte au service sans réserve` / `apte avec réserves à lever` / `inapte nécessitant l'arrêt`
- Textes de référence réglementaires (ex. *Arrêté viziriel du 09 septembre 1953*)

→ Le moteur de templates doit supporter **deux paradigmes** : mesures/indications (END) et check-list/verdict (réglementaire). Le CTC ajoute un 3ᵉ paradigme : **critères d'acceptation** confrontés aux référentiels de calcul (BAEL, Eurocodes, CM66, DTU, RPS 2011, NV65).

### 3.6 Un module absent du CDC : le parc d'équipements de MESURE I2S

Le CDC prévoit un registre des équipements **inspectés chez le client** (Module 11). Le QMS impose en plus un registre des **instruments de mesure d'I2S** avec planning d'étalonnage, et en fait un indicateur trimestriel/annuel :

> `Taux de respect planning d'étalonnage = (Équipements étalonnés à temps / Total à étalonner) × 100`

Un rapport END est **invalide** si l'appareil utilisé était hors étalonnage à la date de l'essai.

→ **Ajout proposé : Module 11-bis « Parc d'équipements de mesure & étalonnage »**, avec blocage à l'émission d'un rapport utilisant un instrument périmé.

### 3.7 KPI qualité déjà contractualisés (à ajouter aux dashboards)

| Indicateur | Formule | Fréquence | Départements |
|---|---|---|---|
| Taux de respect des délais de remise de rapport | (Rapports remis à temps / rapports planifiés) × 100 | Trimestrielle | CND, EILM, CTC |
| Délai de remise | Nombre de jours ouvrés **< 21 jours** | Mensuelle / Trimestrielle | CND, EILM |
| Réclamations client sur rapports | **< 2** par trimestre | Trimestrielle | CTC |
| Taux de respect du planning d'étalonnage | (Équipements étalonnés à temps / total) × 100 | Annuelle | CND, EILM |
| Taux de respect des interventions planifiées | (Interventions réalisées à temps / planifiées) × 100 | Mensuelle | EILM |

Le planning CND porte déjà les 4 dates qui permettent ces calculs : `date prévue d'intervention`, `date effective d'intervention`, `date prévue de remise de rapport`, `date effective de remise`.

→ Ces 4 dates deviennent des champs de première classe des entités `Mission` et `Report`.

### 3.8 Barème des frais — règles chiffrées à coder

| Catégorie | Plafond / barème | Justificatif | Contrôle automatique |
|---|---|---|---|
| Transport ferroviaire | Frais réels, 2ᵉ classe | Billet | Obligatoire |
| Véhicule personnel | **100 DH / jour** d'utilisation | Pointage mission | Accord N+1 préalable |
| Carburant | Frais réels | Ticket / facture | Véhicule de service requis |
| Péage / Jawaz | Frais réels | Ticket | — |
| Parking | Frais réels | Ticket | — |
| Hébergement | **Forfait 150 DH / nuitée** | Si disponible | OM approuvé requis |
| Indemnité de déplacement | **Forfait 100 DH / jour** si **> 150 km** du siège | — | Distance calculée |
| Repas d'affaires | Validation N+1 | Facture détaillée | — |
| Lavage | **Max 100 DH / mois** | Reçu | Plafond mensuel glissant |
| Achats complémentaires | **Max 300 DH / mois** | Reçu | Plafond mensuel glissant |

Non remboursable : amendes et PV, dépenses personnelles, pressing court séjour, absence de justificatif conforme, dépense non professionnelle, dépassement non autorisé.

Motifs de rejet, en liste fermée : justificatif absent / illisible / dépense personnelle / dépassement non autorisé / **mauvaise imputation analytique** / dépense hors mission / non-respect de la procédure.

Échéances : saisie ≤ **03 du mois M+1**, N+1 sous **J+3 ouvrés**, RH/CG sous **J+5 ouvrés**, paiement le **15**.

### 3.9 Imputation analytique réelle d'une ligne de frais

Colonnes du classeur existant : `Date` · `Semaine` · `Collaborateur` · `N° affaire` · `N° intervention` · `Client / lieu` · `Département` · `Type d'intervention` · `Centre des charges` · `Détails` · `Montant` · `Observation`.

Centres des charges existants (13) : Indemnités de Déplacement, Frais d'Hébergement, Location de voiture, Transport, Petit outillage, Parking, Lavage, Jawaz/Péage, Carburant, Impression, Achats exceptionnels, Autre.

→ Repris tels quels comme référentiel `ExpenseCategory` paramétrable.

Le classeur produit aussi une **synthèse hebdomadaire** (centre des charges × semaine 1-5 + total), une **synthèse** (Total brut / Retenue-Avance / Net à payer), une **modalité de règlement** et un bloc de révision `Préparé par / Confirmé par / Vérifié par / Approuvé par`. Le PDF généré doit reproduire cette mise en page.

### 3.10 Le contrôle qualité du rapport est une étape formelle

La `Fiche suivi CTC` prouve qu'un rapport passe par une **vérification de conformité** documentée (vérificateur ≠ rédacteur, visa, date, critères d'acceptation) avant transmission client.

→ Le workflow rapport `Brouillon → Soumis → Contrôle → Correction → Validé → Émis → Archivé` du CDC est confirmé par le terrain ; l'étape « Contrôle » doit produire un enregistrement signé, pas un simple clic.


### 3.11 Le registre « Suivi Cde Partagé I2S » — le modèle réel des affaires

Ce classeur est le **système de gestion actuel des affaires**. Il contient 248 affaires
renseignées (dont ~167 pour 2026) et impose plusieurs corrections au modèle.

| Colonne du registre | Ce qu'elle impose |
|---|---|
| `N° affaire` | Confirme le format `AA/XXXX`. Les numéros sont **pré-alloués** (jusqu'à `26/0583`) : la séquence avance même sans affaire renseignée |
| `Statut affaire` | **G** (gagnée, 101) · **S/OP** (suivant offre de prix, 65) · **P/A** (perdue ou annulée, 2) · **DP** (1) |
| `Etat Travaux` | **En cours** (45) · **Fac Totale** (42) · **Fac partielle** (8) · **A facturer** (3) · **Perdu/Annulé** (2) |
| `Mt OP DH HT` | Montant de l'**offre de prix** |
| `Montant BC` | Montant du **bon de commande**, distinct du précédent |
| `BC N°` | Texte libre : `BC 34950`, `CF_0013464373`, `Cmde verbale`, `Contrat + Avenant` |
| `Pilote` | Initiales du pilote (AE, MH, MIO, JO, KN…), parfois **plusieurs** : `AE-BH-MH` |
| `AFF PREPARER PAR` | Personne distincte du pilote |
| `Ouv doss physiq` | Indicateur d'ouverture du dossier papier (0/1) |
| `Sce` | Service, parfois **multiple** : `CND-CTC-EILM`, `CND-EILM` |
| `Lieu de contrôle` | Texte libre, distinct du site rattaché au projet |
| `Observation` | Porte souvent le n° de facture (`FAC26-054`) |

**Cinq corrections apportées au modèle :**

1. **Deux axes de statut indépendants.** Le statut commercial et l'état des travaux ne sont pas
   la même information : une affaire peut être `G` (gagnée) et `En cours`, ou `G` et
   `Fac Totale`. Les fusionner en un seul champ aurait détruit la moitié du pilotage.
2. **Deux montants.** L'écart entre le montant proposé et le montant commandé est un indicateur
   commercial à part entière ; le modèle porte désormais `offerAmountHT` et `poAmountHT`.
3. **Pilote ≠ préparateur ≠ chargé d'affaires.** Trois rôles distincts sur une même affaire.
4. **Services multiples.** Une affaire peut mobiliser plusieurs pôles : table `AffairDepartment`
   en complément du service pilote.
5. **Deux départements manquaient** : **ÉTUDE** (bureau d'études, 9 affaires) et **QHSE**.
   Le cahier des charges ne mentionnait que CND, CTC, EILM et HSE.

**Ordres de grandeur — à ne pas se tromper de produit.** La médiane d'une affaire est de
**15 000 DH HT**, le minimum de quelques centaines de dirhams, avec une longue traîne vers les
gros projets (jusqu'à 3,4 M DH). L'activité est donc dominée par un **grand nombre de courtes
interventions**, pas par quelques marchés au long cours. Les écrans de liste, la recherche et la
saisie doivent être optimisés pour ce régime : créer une affaire doit prendre moins d'une minute.

Le registre mentionne aussi un transfert d'affaires vers **I2S SUD** — confirmation
supplémentaire du besoin multi-sociétés (P1).


---

## 4. Écarts, ambiguïtés et propositions

Tout ce qui suit est **une proposition**, signalée comme telle conformément à la règle §2 du CDC.

| # | Point | Constat | Proposition |
|---|---|---|---|
| P1 | Multi-sociétés | 3 entités détectées, non traitées par le CDC | Dimension `Company` obligatoire dès le MVP ; consolidation groupe dans les dashboards DG |
| P2 | Numérotation affaire | `AA/XXXX` (terrain) vs `AFF-2026-001` (CDC) | Séquence paramétrable par société et par année ; défaut `AA/XXXX` |
| P3 | Département HSE | Cité dans le CDC et dans les formules, **aucune procédure QMS fournie** | Département créé, sans bibliothèque de templates au démarrage ; à alimenter dès réception des formulaires HSE |
| P4 | Équipements de mesure | Absent du CDC, imposé par le QMS | Module 11-bis + blocage d'émission si étalonnage périmé |
| P5 | Jours ouvrés | Formule fournie, base non définie | Calendrier ouvré paramétrable par société (jours fériés marocains, week-ends), défaut 22 j/mois |
| P6 | Coût journalier | « mise à jour chaque trimestre », historisation exigée | Table `EmployeeDailyCost` versionnée par période de validité ; tout calcul rétroactif utilise le coût **en vigueur à la date du fait**, jamais le coût courant |
| P7 | Signature électronique de l'OM | « signé électroniquement » — niveau juridique non précisé | Signature **simple** : identité authentifiée + horodatage + empreinte SHA-256 + piste d'audit + verrouillage du PDF. Passage à une signature avancée (certificat qualifié) possible sans refonte |
| P8 | Portail client | Cité en V3 | Accès en lecture aux rapports émis + accusé de réception (jalon « date effective de remise ») ; alimente directement le KPI de délai |
| P9 | Devise & TVA | Non spécifiés | MAD, TVA 20 % par défaut, paramétrables ; multi-devise prévu au modèle mais désactivé |
| P10 | Rapprochement bancaire | Exigé, format non précisé | Import de relevé CAMT.053 / CSV + lettrage assisté ; pas d'intégration bancaire directe au MVP |
| P11 | Sous-traitance | Citée dans les coûts (Module 17) sans module dédié | Traitée comme ligne de coût d'affaire + fournisseur, sans module achats complet en V1 |
| P12 | Mode hors-ligne | Exigé pour l'inspecteur | PWA avec file de synchronisation et résolution de conflits *last-writer-wins par champ* + journal ; photos envoyées en tâche de fond |

---

## 5. Conclusion de l'analyse

Le projet n'est pas un CRUD. Trois natures de complexité le structurent.

1. **Complexité analytique** — un plan analytique unique (Code Affaire) traverse 25 modules, avec des coûts historisés et des calculs de marge et de productivité qui doivent être reproductibles à la date.
2. **Complexité documentaire** — 62 formulaires métier, bilingues, versionnés, avec trois paradigmes de saisie différents (mesures / check-list / critères), et un PDF fidèle à l'identité graphique et au QMS.
3. **Complexité de workflow** — 8 machines à états distinctes (mission, OM, rapport, attachement, facture, note de frais, non-conformité, opportunité) avec des acteurs, des délais et des jalons contractuels.

L'architecture qui suit répond à ces trois axes avant toute considération d'écran.
