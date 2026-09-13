# 07 — Design System « I2S OPS »

> **Source normative : I2S-TESTING — CHARTE GRAPHIQUE, Édition 2026, version 1.0.**
> Les valeurs ci-dessous sont reportées telles quelles. Toute divergence est signalée
> comme une adaptation assumée, avec sa justification.

## 1. Palette officielle

| Nom de charte | Rôle | HEX | RVB | CMJN | Pantone |
|---|---|---|---|---|---|
| **Orange Signal** | Accent — 10 % | `#D14E27` | 209 · 78 · 39 | 0 / 75 / 90 / 5 | 173 C |
| **Vert Contrôle** | Secondaire — 10 % | `#6E8F76` | 110 · 143 · 118 | 58 / 28 / 50 / 5 | 5555 C |
| **Noir Industriel** | Dominante — 60 % | `#1A1B18` | 26 · 27 · 24 | 60 / 50 / 50 / 100 | Black 6 C |
| **Gris Acier** | Texte courant | `#4A4F52` | 74 · 79 · 82 | 30 / 20 / 18 / 70 | Cool Gray 11 C |
| **Sable Technique** | Fonds clairs — 20 % | `#F4F2ED` | 244 · 242 · 237 | 3 / 3 / 5 / 0 | Warm Gray 1 C |
| **Blanc** | Réserve / respiration | `#FFFFFF` | 255 · 255 · 255 | 0 / 0 / 0 / 0 | — |

Répartition prescrite : **55 / 25 / 12 / 8** — Noir Industriel, Sable/Blanc, Orange, Vert.

### Associations de texte validées par la charte

| Association | Niveau |
|---|---|
| Blanc sur Noir Industriel | AAA |
| Noir Industriel sur blanc | AAA |
| Orange Signal sur Noir Industriel | AA |
| Gris Acier sur Sable | AA |
| Blanc sur Orange Signal | AA |
| Blanc sur Vert Contrôle | AA |

**Interdits explicites** : Vert Contrôle sur Orange Signal ; Gris Acier sur Noir Industriel.

### Deux adaptations assumées

**1. La dominante passe du fond au texte.** La charte prescrit 55 % de Noir Industriel
sur « un support complet ». Appliqué littéralement à une application utilisée huit heures
par jour, cela donnerait une interface sombre — écartée par le client. Le Noir Industriel
reste dominant, mais porté par le **texte et les titres** ; les fonds sont en Sable
Technique et Blanc. La marque reste reconnaissable, la lecture prolongée reste tenable.

**2. Quatre couleurs d’état sont ajoutées.** La charte interdit toute autre teinte, mais
elle couvre l’imprimé et le marketing, pas les états d’un logiciel. Une application doit
distinguer une erreur d’un avertissement. Les quatre teintes ajoutées restent dans le
registre chaud de la marque :

| État | HEX | Origine |
|---|---|---|
| Succès | `#4F7358` | Vert Contrôle assombri pour le contraste sur fond clair |
| Avertissement | `#96701C` | Ocre, entre l’orange et le vert |
| Erreur | `#8C2F1E` | Brique profonde, nettement plus sombre que l’Orange Signal |
| Information | `#4A4F52` | Gris Acier, couleur de charte |

**Règle de non-confusion** : l’Orange Signal est réservé à l’**interactif** — bouton
principal, entrée de menu active, focus, lien. Il ne porte jamais d’état. Sans cette
règle, un bouton se lirait comme une alerte.

## 2. Typographie

| Rôle | Police | Usage |
|---|---|---|
| Titres | **Poppins** | Titres de page, titres de carte, valeurs des indicateurs |
| Textes | **Barlow** | Corps, tableaux, libellés, formulaires |
| Substitut bureautique | Arial | Quand les polices ne sont pas installées |
| Identifiants métier | IBM Plex Mono | `26/0142`, `OM-26-0311` — chiffres à chasse fixe |

**Proscrites par la charte** : Calibri, Aptos, Times New Roman.

La chasse fixe est un ajout applicatif, limité aux identifiants et aux montants en
colonne : Poppins et Barlow n’alignent pas les chiffres verticalement, ce qui rend une
colonne de montants difficile à parcourir. Partout ailleurs, la charte s’applique.

Échelle : `12 · 13 · 14 · 15 · 16 · 18 · 24 · 30 · 32 px`. Corps 15 px, tableaux 14,5 px,
indicateurs 32 px. Interlignage 1,6 pour le texte, 1,45 pour les tableaux.

## 3. Motif « Équerre »

Le symbole du logotype devient un élément de langage graphique : il signe un support sans
répéter le logo. Dans l’application, il marque la présence de la marque à côté du nom
« I2S OPS » et sert de puce de section. Classe `.equerre` du design system.
## 4. Espacement & grille

Base **4 px** : `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.
Rayon : `8 px` (contrôles), `12 px` (cartes), `999 px` (badges).
Élévation : trois niveaux seulement — carte (`0 1px 2px`), menu (`0 4px 12px`), modale (`0 16px 48px`).
Largeur maximale de contenu : `1440 px`, tableaux en pleine largeur.

## 5. Composants

| Composant | Variantes | Points d'attention |
|---|---|---|
| `Button` | primary · accent · secondary · ghost · danger | 40 px de haut ; un seul bouton d'accent visible par zone |
| `StatusBadge` | 9 statuts métier | Point coloré + libellé ; jamais la couleur seule |
| `DataTable` | densité compacte/confort | Colonnes configurables, tri multiple, sélection, actions groupées, export, pagination par curseur, colonnes figées |
| `KpiCard` | valeur · delta · sparkline | **Cliquable** : ouvre le détail (exigence CDC) |
| `EntityHeader` | — | Numéro, titre, statut, détenteur, actions — commun à affaire/mission/rapport/facture |
| `Tabs` | — | État conservé dans l'URL |
| `Timeline` | événements + acteurs | Utilisée sur affaire, mission, rapport, équipement |
| `ApprovalBar` | — | Étape courante, détenteur, délai restant, actions autorisées |
| `NextActionBanner` | info · warning · danger | Répond à « que dois-je faire ? » |
| `FormSection` | — | Titre, description, champs, état de complétude |
| `FieldRenderer` | 14 types | Rend un champ à partir du schéma JSON d'un template |
| `PlanningGrid` | jour/semaine/mois | Glisser-déposer, détection de conflits, couleurs par type de journée |
| `FileDrop` | — | Aperçu, empreinte, progression, reprise |
| `SignaturePad` | — | Trait, horodatage, empreinte |
| `Chart` | ligne · barre · barre empilée · donut · jauge · heatmap | Palette accessible, valeurs affichées, pas d'axe tronqué |
| `Modal` / `Drawer` | — | Drawer pour l'édition contextuelle, modal pour la confirmation |
| `Toast` / `NotificationCenter` | — | Non bloquant, actionnable |
| `EmptyState` | — | Explique l'action à faire |
| `CommandPalette` | — | `⌘K` recherche globale et navigation |

## 6. Codes couleur du planning

| Type de journée | Couleur | Trame |
|---|---|---|
| Mission facturable | Orange Signal plein | — |
| Mission non facturable | Orange Signal 10 % | — |
| Attente chantier / intempérie | Ocre | — |
| Congé / maladie | Gris neutre | — |
| Formation | Gris Acier | — |
| **Non affecté** | fond `--bg`, bordure `--danger` pointillée | vide |
| Conflit | surligné `--danger` + ⚠ | — |

Le « non affecté » est volontairement **visible comme un trou** dans la grille : c'est le message principal du dashboard de productivité.

## 7. Identité des documents PDF

Tous les PDF partagent un gabarit unique :

```
┌────────────────────────────────────────────────────────────┐
│ [LOGO I2S]   RAPPORT D'EXAMEN PAR ULTRASONS          N° … │
│              Report of ultrasonic examination              │
│              Affaire 26/0142 · Client OCP SAFI             │
├────────────────────────────────────────────────────────────┤
│  … sections issues du template …                           │
├────────────────────────────────────────────────────────────┤
│  Examen effectué par │ Rapport établi par │ Client │ Final │
│  Nom / Date / Visa   │ …                  │ …      │ …     │
├────────────────────────────────────────────────────────────┤
│ PR01-F02. Version 00. DA 01/10/2022        Page 1 / 2      │
│ Document généré le 06/09/2026 — empreinte a1b2c3…          │
└────────────────────────────────────────────────────────────┘
```

Contraintes reprises des modèles existants : bilingue FR/EN sur les rapports END, code formulaire QMS + version + date d'application en pied de page, matrice de visas à 4 colonnes, pagination `Page n / N`, empreinte SHA-256 pour l'intégrité. Un QR code renvoyant à la version en ligne du document est ajouté (proposition, V3).

## 8. Accessibilité

- Contraste minimal AA (4,5:1) sur tout texte, vérifié par test automatisé.
- Navigation clavier complète, ordre de tabulation logique, `focus-visible` marqué.
- Libellés et messages d'erreur reliés aux champs (`aria-describedby`).
- Interface en français, avec libellés bilingues sur les documents techniques.
- Cibles tactiles ≥ 44 px sur mobile — l'inspecteur porte des gants.

## 8. Densité et lisibilité terrain

Le mobile inspecteur adopte une variante à contraste renforcé et corps de texte 16 px minimum : la saisie se fait souvent en extérieur, en plein soleil, avec des gants. Les boutons d'action y sont fixés en bas d'écran, atteignables au pouce.
