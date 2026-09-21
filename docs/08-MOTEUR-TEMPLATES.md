# 08 — Moteur de templates d'inspection

C'est la pièce la plus structurante du produit. **61 formulaires** ont été recensés dans le référentiel I2S ; ils évoluent (versions, révisions), diffèrent par département et se déclinent en trois paradigmes de saisie. Les coder en dur condamnerait le produit à une maintenance permanente.

## 1. Les trois paradigmes

| Paradigme | Département | Nature de la saisie | Sortie | Exemple |
|---|---|---|---|---|
| `measurement` | CND | Blocs de conditions + **tableau d'indications répétable** avec mesures chiffrées | Décision `V/NV` et `C/NC` par indication | `PR01-F02` Ultrasons, `PR01-F04` Ressuage, `PR01-F05` Magnétoscopie |
| `checklist` | EILM | **Check-list hiérarchique** : sections → points de contrôle → verdict `{SO, NA, C, NC}` + état constaté | Conclusion à 3 issues exclusives | `PR02-F40` Pont roulant, `PR02-F14` Installations électriques |
| `criteria` | CTC | **Critères d'acceptation** confrontés à des référentiels de calcul | Conforme / Non conforme par critère | `PR03-F01` Rapport CTC |

Un même moteur, trois façons de rendre les sections. C'est un choix de rendu, pas trois moteurs.

## 2. Anatomie commune à tous les rapports

Le corpus montre un **bloc d'en-tête identique** sur tous les formulaires END, et un équivalent sur les formulaires réglementaires. Il est **pré-rempli automatiquement** depuis la mission — l'inspecteur ne le ressaisit jamais (principe *Single Source of Truth*).

| Champ | Source de pré-remplissage |
|---|---|
| Identifiant N° / Rapport N° | `NumberSequence` |
| Client | `Mission → Affair → Client` |
| N° d'affaire | `Mission → Affair.number` |
| Instruction Ref. (procédure) | `InspectionTemplate.method.procedure` |
| Fabricant | `Asset.brand` |
| Lieu de contrôle | `Mission → Site` |
| Spec. applicable | `InspectionMethod.standards` (ASME V, EN ISO 17640…) |
| Plan de référence | Document joint à l'affaire |
| Matériel examiné | `Asset` |
| Date | `Inspection.date` |
| Examen effectué par | `Inspection.inspectorId` + niveau de certification à la date |

## 3. Types de champs

| Type | Options | Contrôles |
|---|---|---|
| `text` / `textarea` | longueur, masque | — |
| `number` | unité, min, max, décimales, **tolérance** | Hors tolérance → indication signalée automatiquement |
| `date` / `datetime` | — | Cohérence avec la période de mission |
| `enum` / `multi-enum` | options, options bilingues | — |
| `boolean` | — | — |
| `verdict` | `{SO, NA, C, NC}` | Un seul `NC` suffit à empêcher la conclusion « sans réserve » |
| `ref` | `client · affair · employee · asset · device · site` | Lecture seule si pré-rempli |
| `photo` | multiple, annotation, géolocalisation | Compression côté client, empreinte |
| `signature` | rôle du signataire | Horodatage + empreinte |
| `table` | colonnes typées, répétable, min/max lignes | Numérotation automatique des indications |
| `formula` | expression sur d'autres champs | Recalcul temps réel, valeur figée à l'émission |
| `section-repeat` | groupe répétable | Ex. plusieurs traducteurs UT |
| `device` | sélection d'un instrument du parc | **Refus si étalonnage périmé à la date de l'essai** |
| `standard-ref` | référentiel normatif | Liste issue du référentiel QMS |

## 4. Sections

| Type de section | Rendu écran | Rendu PDF |
|---|---|---|
| `keyvalue` | Grille 2–3 colonnes | Tableau bordé bilingue |
| `devices` | Sélecteur d'instruments + état d'étalonnage | Tableau « Matériel utilisé » |
| `conditions` | Cases à cocher groupées | Grille de cases |
| `table` | Tableau éditable, ajout de ligne | Tableau paginé |
| `checklist` | Accordéon par section, verdict en 4 boutons | Liste hiérarchique avec colonnes de verdict |
| `criteria` | Critère + applicable + conforme + commentaire | Tableau à 3 colonnes |
| `photos` | Galerie, légendes | Planches photos numérotées |
| `verdict` | Choix exclusif | Cases à cocher exclusives |
| `signature-matrix` | 4 colonnes de visas | Bloc de signatures |
| `text` | Zone libre | Paragraphe |

## 5. Versionnage

```
InspectionTemplate
  formCode      PR01-F02
  version       00 · 01 · 02 …
  applicationDate  01/10/2022
  status        draft → published → superseded
```

Règles :

1. Une inspection stocke `templateId` **et** `templateVersion`. Le rapport est toujours re-rendu avec la version utilisée le jour de l'essai.
2. Publier une nouvelle version ne modifie **aucun** rapport existant.
3. Une version publiée est immuable. Une correction crée une version suivante.
4. Les missions déjà planifiées gardent la version en vigueur à leur date de planification, sauf bascule explicite.

Cela reproduit exactement la logique QMS existante (`Version 00. DA 01/10/2022`) et rend le système auditable.

## 6. Éditeur de templates (administration)

Destiné au Document Controller et aux chefs de département — **sans écrire de code** :

- construction par glisser-déposer des sections et des champs ;
- édition des libellés bilingues FR/EN ;
- définition des unités, tolérances, listes de valeurs ;
- aperçu simultané de l'écran de saisie et du rendu PDF ;
- import assisté depuis un modèle Word/Excel existant : le fichier est analysé, la structure proposée, l'opérateur corrige (accélère fortement la reprise des 61 formulaires) ;
- publication versionnée avec note de révision.

## 7. Stockage et exploitation des données

Les réponses sont stockées en `JSONB` dans `Inspection.data`, mais **les données exploitables analytiquement sont projetées dans des tables relationnelles** :

- chaque indication devient une ligne `Finding` (mesurable, agrégeable, transformable en non-conformité) ;
- chaque verdict de check-list alimente un compteur de conformité par équipement ;
- les mesures numériques clés sont indexées (`jsonb_path_ops`) pour la recherche et les tendances.

On obtient la souplesse du schéma libre **sans perdre** la capacité à répondre à « quels réservoirs ont une épaisseur résiduelle < 8 mm sur les 3 dernières campagnes ? ».

## 8. Plan de reprise des 61 formulaires

| Lot | Contenu | Effort | Jalon |
|---|---|---|---|
| L1 | 6 formulaires END les plus utilisés : UT, PT, MT, VT, RT, dureté | Modélisation fine, validation par le Responsable CND | V2 — semaine 1–3 |
| L2 | 14 formulaires CND restants (verticalité, rotondité, déformation, peinture, PMI, QMOS, QS…) | Réutilisation des sections du L1 | V2 — semaine 4–6 |
| L3 | 20 formulaires EILM levage & accessoires | Paradigme `checklist`, sections largement communes | V2 — semaine 7–9 |
| L4 | 20 formulaires EILM électricité, engins, échafaudages, ascenseurs | idem | V2 — semaine 10–12 |
| L5 | 2 formulaires CTC | Paradigme `criteria` | V2 — semaine 13 |
| L6 | HSE | À la réception des modèles | À planifier |

Chaque lot est validé par le chef de département concerné : **un rapport généré doit être visuellement superposable au modèle Word/Excel actuel** avant d'être publié.
