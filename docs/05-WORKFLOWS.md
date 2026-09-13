# 05 — Workflows & machines à états

Chaque workflow est une machine à états explicite. Une transition porte : **acteur autorisé**, **condition d'entrée**, **effet de bord**, **notification**, **entrée d'audit**. Aucune transition n'est implicite.

---

## W1 — Opportunité commerciale

```
Nouvelle → Consultation → Offre en préparation → Offre envoyée → Relance → Négociation → Gagnée
                                                                                      ↘ Perdue (cause + motif)
```

C'est le suivi que le fichier « Suivi Cde Partagé » tient aujourd'hui à la main. L'étape se déduit des gestes posés : enregistrer un appel d'offres met l'opportunité en consultation, établir une offre la met en préparation, l'envoyer la fait passer à « offre envoyée », une relance à « relance ». Le commercial ne choisit pas son étape dans une liste — il travaille, et l'étape suit.

**Une opportunité ne se déclare pas gagnée.** C'est l'acceptation d'une offre par le client qui la gagne, et qui **crée l'affaire** : le client, le montant proposé, le bon de commande et les lignes de l'offre y sont repris tels quels. C'est le seul chemin, et c'est ce qui garantit qu'une affaire porte toujours le montant qui a été proposé.

| Transition | Acteur | Condition | Effet |
|---|---|---|---|
| → Consultation | Technico-commercial, Chargé d'affaires | Référence de l'appel d'offres | Suivi de la date de remise et de la caution |
| → Offre en préparation | idem | Au moins une ligne de prestation | Montant calculé sur les lignes, numéro `OFF-AA-NNNN` |
| → Offre envoyée | idem | Offre en préparation | Horodatage de l'envoi, les autres offres envoyées restent en concurrence |
| → Relance / Négociation | idem | Compte rendu de la relance | Date de prochaine action ; l'entonnoir signale celles qui sont dépassées |
| → **Gagnée** | idem | Offre **envoyée** acceptée par le client | **Création de l'affaire** (statut commercial `Gagnée`), offre acceptée, offres concurrentes du même dossier refusées, probabilité à 100 % |
| → Perdue | idem | **Cause** (catégorie) + motif en clair | Alimente l'analyse des marchés perdus |

### Consultation directe ou appel d'offres — un seul tableau

Une demande de prix arrive de deux façons : le client consulte I2S directement, ou il publie un appel d'offres avec une référence, une date de remise et une caution. C'est la même chose commercialement — une demande qui se gagne ou se perd — et les séparer en deux écrans obligeait à regarder à deux endroits pour savoir où en est le portefeuille. Le suivi est donc unique ; la nature de chaque ligne s'y lit, avec sa référence et son échéance quand il y en a une.

### Pourquoi on perd

Un motif en texte libre ne s'additionne pas : impossible de le compter, ni de le comparer d'une année sur l'autre. Toute perte porte donc une **cause** parmi neuf — prix, délai, références, capacité, concurrent en place, dossier non conforme, projet abandonné, sans suite, autre — et le texte libre reste à côté pour le détail du dossier.

Les causes se répartissent en deux familles, et l'écran ne les mélange pas : celles sur lesquelles I2S peut agir (**prix, délai, capacité, références, dossier non conforme**) et celles qui lui échappent (projet abandonné, concurrent déjà en place, sans suite). Compter un projet abandonné par le client comme une contre-performance commerciale fausserait la lecture — et donc la décision qui en découle.

### Ce que le serveur impose

| Situation | Refus |
|---|---|
| Déclarer une opportunité « gagnée » à la main | Une opportunité se gagne en acceptant une offre, pas en changeant son étape |
| Offre sans ligne | Une offre sans ligne n'a pas de montant |
| Accord du client sur une offre jamais envoyée | Cette offre n'a pas été envoyée au client : envoyez-la avant d'enregistrer son accord |
| Ouverture des plis antérieure à la remise des offres | L'ouverture des plis ne précède pas la remise des offres |
| Perte sans cause catégorisée | Indiquez la cause de la perte |
| Perte sans motif en clair | Le motif est obligatoire |
| Cause de perte inventée par l'écran | Refusée : les causes viennent du serveur |
| Rouvrir ou modifier une opportunité gagnée | Cette opportunité est gagnée : elle a donné une affaire et ne se rouvre pas |
| Nouvelle offre sur un dossier tranché | Une opportunité « Gagnée » ne reçoit plus d'offre |
| Seconde acceptation de la même offre | Une offre « ACCEPTED » ne s'accepte plus |
| Toucher au dossier d'un autre commercial | Cette opportunité est suivie par quelqu'un d'autre |

**Versionnement** : une offre révisée ne s'écrase pas. Elle garde son numéro et prend une version — `OFF-26-0009 v2` — de sorte que ce qui a été envoyé au client reste lisible après coup. L'écart entre le montant proposé et le bon de commande finalement reçu est ce que la négociation a coûté ; il est suivi offre par offre.

### Rédaction assistée de l'offre

```
Offre en préparation → Texte rédigé (à relire) → Texte relu → Offre envoyée
                                ↘ corrections à la main ↗
```

Trois natures de document : **offre technique** (méthode, référentiels, moyens, livrables — sans aucun prix), **offre commerciale** (consistance, conditions, prix), **offre technico-commerciale** (les deux dans un seul document). Le choix n'est pas cosmétique : sur appel d'offres, les deux plis partent souvent séparément.

**L'assistant écrit les mots, jamais les chiffres.** Le bordereau des prix est construit à la mise en page à partir des lignes de l'offre en base, et le total y est recalculé. Le modèle ne voit aucun prix : il ne peut donc pas en écrire un faux sur un document destiné au client.

Ce que l'assistant reçoit, ce sont des faits tirés de la base : client et secteur, objet et contexte, appel d'offres et date de remise, lignes de prestation avec leurs quantités, **habilitations réellement détenues par le service** à la date du jour, et **instruments dont l'étalonnage est en cours de validité**. Quand le service n'a rien d'enregistré, le dossier le dit explicitement — le modèle ne doit pas combler un vide par une qualification imaginaire. Annoncer une accréditation que I2S ne détient pas engagerait l'entreprise sur une prestation qu'elle ne peut pas rendre.

| Situation | Refus |
|---|---|
| Rédiger sur une offre déjà envoyée | Une offre « SENT » ne se rédige plus : elle est déjà partie au client |
| Régénérer un texte déjà relu | Le régénérer effacerait les corrections apportées |
| Valider un texte avec une section vide | Relecture refusée : le document a des sections vides |
| Valider un texte contenant `[à confirmer : …]` | Relecture refusée : des mentions restent à compléter |
| **Envoyer une offre dont le texte n'a pas été relu** | Relisez-le et validez-le avant de l'envoyer au client |
| Nature de document inventée par l'écran | Choisissez la nature du document à rédiger |

Le document PDF s'édite à tout moment ; tant que le texte n'est pas relu, il sort marqué **PROJET** et le fichier porte le suffixe `-PROJET`. Chaque texte conserve le modèle qui l'a rédigé, la version du cadrage, qui a lancé la rédaction et qui l'a relu — de quoi y revenir des mois plus tard.

**Configuration** : la clé du modèle se dépose dans `.env` sous `ANTHROPIC_API_KEY`, le modèle sous `AI_MODEL`. Sans clé, toute l'application fonctionne : seul l'assistant est indisponible, et l'écran dit pourquoi. Le texte du dossier — nom du client, objet, contexte — sort de l'entreprise au moment de la rédaction : c'est le seul endroit du produit où cela se produit, et il est isolé dans un service unique.

---

## W2 — Mission

```
Demande → Planification → Affectation → Confirmation → OM émis → En cours → Terminée → Rapport remis → Clôturée
                                    ↘ Annulée (motif)      ↘ Reportée
```

| Transition | Acteur | Condition bloquante |
|---|---|---|
| Demande → Planification | Chargé d'affaires / Chef dép. | Affaire `En cours` |
| Planification → Affectation | Chef de département (N+1) | Inspecteur qualifié pour la méthode, **sans conflit** (mission simultanée, congé, formation), certification valide à la date |
| Affectation → Confirmation | Inspecteur (N) ou Chef dép. | — |
| Confirmation → OM émis | Système | Véhicule disponible réservé si requis | 
| OM émis → En cours | Inspecteur | OM `Signé` |
| En cours → Terminée | Inspecteur | `actualStartDate` et `actualEndDate` renseignés |
| Terminée → Rapport remis | Système | Rapport `Émis` |

**Contrôles de conflit automatiques** : double affectation · chevauchement de mission · congé/maladie · formation · certification expirée · véhicule déjà réservé.

---

## W3 — Ordre de mission

```
Brouillon → À valider → Validé → Signé → En cours → Terminé → Archivé
                    ↘ Rejeté (retour Brouillon, motif)
```

- Généré automatiquement à la confirmation de la mission.
- Contenu : n° OM, Code Affaire, client, projet, site, inspecteur(s), véhicule, dates, objet, instructions, consignes HSE, documents joints.
- **Signature** : identité authentifiée + horodatage serveur + empreinte SHA-256 du PDF + adresse IP. Le PDF signé devient immuable ; toute modification impose une nouvelle version d'OM.
- Toutes les actions sont historisées (`MissionOrderApproval`).

### Ce que le serveur impose à l'amont

| Étape | Refus opposés |
|---|---|
| Client | Code unique par société ; ICE à 15 chiffres ; le code n'est plus modifiable une fois posé |
| Affaire | Service pilote obligatoire ; Code Affaire alloué par la séquence, jamais saisi ; le client ne change plus après ouverture |
| Mission | Rattachement obligatoire à une affaire du périmètre ; fin après le début ; site appartenant à l'affaire |
| Affectation | Pas de double réservation, pas de congé accordé, pas de certification expirée à la fin de mission |
| Ordre de mission | Pas d'ordre sans équipe ; une seule signature ; l'équipe se fige à l'émission |

Deux valeurs sont posées automatiquement, parce que les oublier rendrait l'objet invisible à son propre auteur : le **chargé d'affaires** prend par défaut celui qui ouvre l'affaire (périmètre « équipe »), et le **service** d'une mission retombe sur celui de l'affaire, puis sur celui du planificateur (périmètre « département »).

Le **montant du marché** — celui que la rentabilité oppose aux coûts — suit le registre : montant du bon de commande dès qu'il existe, montant de l'offre avant.

Le périmètre « département » d'une affaire ne se limite pas au service pilote : une affaire mobilisant plusieurs pôles (« CND-CTC-EILM » au registre) est visible de chacun d'eux. Sans quoi un service planifierait une intervention sur une affaire qu'il ne peut pas ouvrir.

---

## W4 — Rapport d'inspection

```
Brouillon → Soumis → Contrôle → Validé → Émis → Archivé
                          ↘ Correction → Soumis
```

| Étape | Acteur | Règle |
|---|---|---|
| Brouillon | Inspecteur | Saisie possible hors ligne |
| → Soumis | Inspecteur | Champs requis du template complets ; **instrument de mesure en cours d'étalonnage à la date de l'essai** |
| → Contrôle | Chef de département ou Document Controller | `checkerId ≠ authorId` (bloquant) |
| Contrôle → Correction | Vérificateur | Motif + critère non conforme renseignés (`ReportCheck`) |
| Contrôle → Validé | Vérificateur | Fiche de suivi complète et visée |
| → Émis | Document Controller / Chargé d'affaires | Numérotation définitive, PDF verrouillé, envoi client tracé |
| → Archivé | Système | Après accusé de réception ou J+30 |

### Valeurs que l'inspecteur ne saisit jamais

Trois familles de champs sont écrites par le serveur, pas par l'écran :

| Champ | Source | Pourquoi côté serveur |
|---|---|---|
| Client, n° d'affaire, lieu de contrôle, inspecteur, date | Mission | Affichés en lecture seule : le navigateur ne les renvoie pas. Sans recopie, la validation les réclamerait et le rapport émis n'en garderait aucune trace. |
| Champs de type `device` (« Poste US »…) | Sélection d'instruments | Le sélecteur **est** le champ ; il n'existe pas de case à remplir en plus. |
| Numéro de rapport | Séquence transactionnelle | Alloué à la soumission seulement. |

Ces valeurs sont réappliquées à **chaque** enregistrement du brouillon : tant que la saisie n'est pas soumise, elle reste alignée sur sa mission ; la soumission les fige avec le rapport.

### La pièce remise

L'émission produit le **PDF** du rapport et le dépose à la GED. Le document est rendu à partir du schéma du formulaire — les 62 formulaires du référentiel passent par le même rendu — et porte ce qui engage I2S : numéro, indice de révision, rédacteur, vérificateur, grille de vérification visée, et la saisie elle-même.

Les fichiers vivent **hors de la base**, rangés sous leur empreinte SHA-256. Un fichier dont le contenu ne correspond plus à son empreinte n'est pas servi : l'altération provoque une erreur au lieu de passer inaperçue. Chaque téléchargement est journalisé.

Un rapport `Émis` ne se modifie pas : on ouvre une **révision** — `POST /reports/:id/revise`, motif obligatoire. Le numéro ne change pas, l'indice avance, la saisie redevient modifiable, et la nouvelle émission ajoute une **version** au même document. La pièce déjà remise reste consultable.

Deux dates ne bougent plus une fois posées : **la date d'émission** et **la date de remise** sont celles du premier envoi. Une révision ne les repousse pas — sinon le délai de remise s'effacerait à chaque reprise.

L'**indice de révision** désigne la pièce remise au client : une reprise avant la première émission reste à l'indice 0, puisque le client n'a encore rien reçu.

### Grille de vérification

Le vérificateur vise quatre critères, chacun **conforme**, **non conforme** ou **sans objet** :

1. Complétude des champs obligatoires du formulaire
2. Instrument de mesure en cours de validité d'étalonnage
3. Cohérence des résultats avec le critère d'acceptation
4. Visas rédacteur et vérificateur présents

Quatre refus sont opposés au vérificateur, dans cet ordre :

| Situation | Refus |
|---|---|
| Un critère applicable sans verdict | La grille est incomplète |
| Une validation alors qu'un critère est non conforme | **La validation est fermée** — le rapport repart en correction |
| Un critère non conforme sans commentaire | Le rédacteur doit savoir quoi reprendre |
| Un renvoi en correction sans motif | Le motif est obligatoire |

Le renvoi en correction **rouvre la saisie** : l'inspection repasse en brouillon et redevient modifiable par son seul rédacteur. À la nouvelle soumission, le rapport **conserve son numéro** et sa révision est incrémentée ; la grille du passage précédent est effacée, car elle portait sur une version qui n'existe plus. L'historique des passages vit dans le journal d'audit.

### Qui fait quoi

| Geste | Droit requis | Rôles concernés |
|---|---|---|
| Prendre en charge, viser | `report:APPROVE` | Chef de département, Document Controller |
| Émettre, enregistrer la remise | `report:EXPORT` | Document Controller, Chargé d'affaires |

Le périmètre s'applique **dans la requête** : un chef de département ne voit que les rapports de son département, un inspecteur que les siens. Un identifiant hors périmètre renvoie « introuvable », pas « interdit » — l'existence même du rapport n'est pas révélée.

À l'émission, le système calcule le **délai réel de remise en jours ouvrés** — calendrier de la société, week-ends et jours fériés marocains exclus — et alimente le KPI QMS (< 21 jours). L'échéance étant une date et la remise un instant, la comparaison se fait par journée : un rapport remis le jour de l'échéance est dans le délai. Une relance n'avance pas la date de remise : la première fait foi.

### Retrouver un rapport

Chaque rapport porte un **type** : le modèle du référentiel qualité qui l'a produit (`PR01-F04` ressuage, `PR02-F40` pont roulant…), et son numéro commence par ce code. Le référentiel compte **61 modèles**, relevés dans les dossiers PR01 CND (20), PR02 EILM (39) et PR03 CTC (2). Ceux dont le formulaire de saisie n'est pas encore construit y figurent en brouillon : ils classent les rapports, mais ne peuvent pas être saisis — l'écran de saisie ne propose que les modèles publiés et l'API refuse les autres.

La liste des rapports se filtre par **type, statut, service, inspecteur, client, période de contrôle et retard**. La période porte sur la date du contrôle (celle de la saisie terrain, à défaut la fin réelle de la mission), pas sur la date de saisie informatique, qui ne dit rien au métier. « Hors délai » regroupe les rapports remis après l'échéance et ceux attendus dont l'échéance est déjà passée.

Les filtres **s'ajoutent au périmètre** de celui qui regarde, ils ne l'élargissent jamais : un chef de département qui filtre sur un autre service n'obtient aucun rapport. Les choix des listes affichent leur nombre de rapports et viennent du périmètre entier, pour qu'un filtre posé ne fasse pas disparaître les autres options.

---

## W5 — Attachement

```
Brouillon → Transmis au client → Signé → Facturé
```

L'attachement est la pièce que le client **signe** : il reconnaît les journées passées chez lui. Sans lui, une facture n'a rien à opposer à une contestation.

### Ce qui entre dans un attachement

Seules les journées qui remplissent **les trois conditions** :

1. **visées** — un mois de pointage non visé ne se facture pas ;
2. **facturables** — une journée d'intervention non facturable (reprise, geste commercial) n'y a pas sa place ;
3. **non déjà attachées** — le rattachement d'une journée à une ligne d'attachement est ce qui empêche de la facturer deux fois.

Les journées sont regroupées **par mission** : c'est ce que le client reconnaît sur le terrain. Le prix unitaire vient du barème de l'affaire (`AffairRate`, par type de prestation), à défaut de son prix de journée. Sans prix connu, l'attachement est refusé plutôt que créé à zéro.

L'écran de préparation montre le détail **avant** de rien figer, et laisse ajuster le prix ligne par ligne.

---

## W6 — Facturation & encaissement

```
Brouillon → Émise → Partiellement réglée → Soldée
```

Une facture reprend **un ou plusieurs attachements signés du même client**. Un attachement non signé ne se facture pas ; un attachement facturé ne peut plus l'être ailleurs.

L'**échéance** découle du délai de règlement contractuel du client — c'est ce qui rend le suivi des retards opposable. La TVA est à 20 % par défaut, ajustable à l'émission.

### Encaissement

| Situation | Refus |
|---|---|
| Règlement sur une facture non émise | Une facture non émise ne s'encaisse pas |
| Règlement sur une facture annulée | Cette facture est annulée |
| Montant nul ou négatif | Le montant est strictement positif |
| Montant supérieur au solde dû | Le règlement dépasse le solde — vérifiez l'imputation |

Le solde décide du statut : **partiellement réglée** tant qu'il reste dû, **soldée** au dernier centime. Une tolérance d'un centime absorbe les arrondis de TVA, sans laquelle une facture réglée resterait ouverte au recouvrement pour un écart d'arrondi.

## W7 — Note de frais

```
Saisie (N) → Soumise → Confirmée (N+1) → Contrôlée (RH / CG) → Comptabilisée → Approuvée (DG) → Bon à payer → Payée
        ↘ Rejetée (motif en liste fermée) → Saisie
```

| Étape | Délai imposé | Contrôles automatiques |
|---|---|---|
| Saisie | ≤ 03 du mois M+1 | Justificatif obligatoire selon catégorie ; imputation Code Affaire / mission / département / centre de charges obligatoire |
| Confirmation N+1 | J+3 ouvrés | Réalité de la mission (OM existant et signé) |
| Contrôle RH / CG | J+5 ouvrés | Plafonds : 100 DH/j véhicule personnel · 150 DH/nuitée hébergement · 100 DH/j déplacement > 150 km · 100 DH/mois lavage · 300 DH/mois achats · dépassement → justification obligatoire |
| Comptabilité | calendrier interne | Cohérence des pièces, compte général |
| DG | — | Validation finale, possible en lot |
| Règlement | le 15 du mois | Virement, déduction des avances en cours |

**Contrôles bloquants supplémentaires** : détection de doublon (même date + même montant + même catégorie), dépense hors période d'un OM pour un frais de mission, catégorie non remboursable.

### Ce que le serveur impose

Une note par personne, par mois et par type. L'ouvrir deux fois y ramène : c'est ce qui empêche qu'une même dépense figure dans deux notes soumises séparément. Le numéro porte **le mois de la note**, pas la date où on l'ouvre.

| Situation | Refus |
|---|---|
| Dépense hors du mois de la note | La dépense n'appartient pas au mois |
| Frais de mission sans mission | Un frais de mission porte sa mission |
| Mission dont l'ordre n'est pas signé | La réalité du déplacement ne peut pas être établie |
| Dépense hors de la période de la mission (± 1 jour) | Le jour tombe hors de la mission |
| Même date, même catégorie, même montant | Une dépense identique existe déjà |
| Justificatif manquant sur une catégorie qui l'exige | Justificatif obligatoire |
| Plafond dépassé sans justification | Une justification est obligatoire |
| Visa de sa propre note | Une note ne se vise pas soi-même |
| Étape franchie par un rôle qui n'est pas le sien | L'étape nomme les rôles qui la franchissent |

Une marge d'un jour encadre la période de la mission : on part souvent la veille.

**Les plafonds ne bloquent pas, ils exigent une justification.** Un dépassement peut être légitime — une nuitée à Laâyoune n'a pas le prix d'une nuitée à Berrechid — mais il doit être motivé, et il reste visible : le dépassement est inscrit sur la ligne à la soumission, et compté dans la liste.

### Le circuit

Chaque étape nomme le rôle qui la franchit, et l'étape franchissable se déduit du statut : c'est le circuit qui commande, pas l'écran.

| Étape | Rôle |
|---|---|
| 1 — Confirmation du responsable | Chef de département, chargé d'affaires |
| 2 — Contrôle RH / contrôle de gestion | RH, contrôle de gestion |
| 3 — Comptabilisation | RAF |
| 4 — Approbation | Direction générale |
| 5 — Bon à payer | RAF |

La comptabilisation et l'approbation sont séparées, et la DG s'intercale entre elles : c'est le contrôle croisé du cahier des charges.

Un rejet est **motivé** — l'auteur doit savoir quoi reprendre — et rend la note modifiable.

### Le règlement

Les **avances en cours** de l'intéressé sont déduites d'abord, de la plus ancienne à la plus récente : c'est l'objet même d'une avance, et l'oublier reviendrait à payer deux fois. Une avance intégralement retenue passe à `SETTLED`.

Les justificatifs rejoignent la **GED** en diffusion restreinte, rattachés à la note.

---

## W8 — Non-conformité

```
Ouverte → Affectée → En traitement → Preuve fournie → Vérification → Clôturée
                                                              ↘ Rejetée → En traitement
```

- Créée depuis une observation (`Finding`) d'inspection, en un clic.
- Gravité : `Critique` / `Majeure` / `Mineure` / `Observation`.
- Échéance selon la gravité (paramétrable) ; alerte automatique à J−3 puis à échéance dépassée.
- Clôture par un vérificateur avec preuve documentaire.

### Ce que le serveur impose

| Situation | Refus |
|---|---|
| Écart sans description | Décrivez l'écart constaté |
| Prise en main sans responsable | Affectez-le d'abord |
| Action corrective avant affectation | Un écart « ouvert » n'attend pas d'action corrective |
| Levée sans preuve documentaire | Photo, rapport de contre-visite ou attestation obligatoire |
| Vérification par le responsable lui-même | Faites-la vérifier par un tiers |
| Refus sans motif | Un refus doit dire ce qui manque |
| Réaffectation d'un écart clos | Un écart clôturé ne se réaffecte plus |

**L'échéance découle de la gravité**, elle ne se choisit pas au cas par cas : c'est ce qui rend le suivi comparable d'un écart à l'autre. Les délais par défaut — 7, 30, 60 et 90 jours — sont paramétrables par société (`nonConformity.dueDaysCritical`, etc.). L'échéance reste modifiable à l'affectation, quand le responsable connaît la charge réelle.

**Le vérificateur n'est jamais celui qui a traité l'écart.** Une levée que personne d'autre n'a regardée ne vaut rien devant un auditeur. Un refus renvoie l'écart en traitement, avec ce qui manque.

La **preuve de levée** rejoint la GED, rattachée à l'écart. Une nouvelle preuve ne remplace pas la précédente : elle en ajoute une version, et l'historique du traitement reste lisible.

Un écart dont l'échéance est passée est signalé **en retard**, avec le nombre de jours — sur la liste comme sur la fiche.

---

## W9 — Cycle du pointage (transverse, quotidien)

### Le pointage se déduit, il ne se déclare pas

Une journée affectée à une mission **est** pointée sur cette mission : le planning porte déjà l'information, il n'y a rien à saisir. Ce qui reste, une fois retirés les jours vendus, les absences accordées et les jours non ouvrés, est une **journée non affectée**.

```
jour ouvré + affectation à une mission   →  mission (facturable selon la mission)
jour ouvré + congé accordé               →  congé, ou arrêt maladie
jour ouvré + formation                   →  formation
jour ouvré, rien d'autre                 →  NON AFFECTÉE
jour non ouvré sans mission              →  hors décompte
jour non ouvré avec mission              →  mission (l'arrêt d'usine ne s'arrête pas le week-end)
```

C'est cette soustraction qui rend le coût d'inactivité fiable : il n'attend la déclaration de personne. L'ordre de priorité est celui du métier — une personne envoyée en mission un jour où elle était aussi inscrite en formation a bien travaillé ce jour-là.

La **formation est comptée à part** : ni vendue, ni portée au coût d'inactivité. C'est un investissement, et la certification COFREND l'exige.

L'**avenir ne se pointe pas** : une journée à venir n'est ni travaillée ni perdue. Le mois en cours se remplit au fil des jours.

### Déduction, correction, visa

`POST /timesheets/generate` rejoue la déduction sur un mois. L'opération est **idempotente** : elle ne touche ni les journées corrigées à la main, ni celles déjà visées. Elle relève du chef de département (son pôle) ou des ressources humaines (la société) — pas de celui qui pointe.

La correction (`PUT /timesheets/corrections`) sert à ce que le terrain a démenti : une intervention empêchée par les intempéries, une attente sur site, une absence non saisie ailleurs. Une journée corrigée est marquée `MANUAL` et survit aux régénérations.

| Situation | Refus |
|---|---|
| Catégorie d'intervention sans mission | La catégorie demande une mission |
| Congé, formation ou journée non affectée rattachés à une mission | La catégorie ne se rattache pas à une mission |
| Autre chose qu'une intervention un jour chômé | Seule une intervention se pointe un jour non ouvré |
| Reprise d'une journée déjà visée | Une journée visée ne se reprend plus |
| Visa de son propre pointage | Un pointage ne se vise pas soi-même |

Deux écarts sont **signalés sans bloquer**, parce que la réalité du terrain les produit : corriger vers une mission à laquelle on n'est pas affecté (l'affectation reste à régulariser au planning), et déclarer facturable une journée sur une mission qui ne l'est pas — la journée est alors comptée non facturable, et l'intervenant en est averti.

Le **visa est mensuel**, par intervenant : chef de département pour son pôle, ressources humaines pour la société — ce qui permet de viser le pointage d'un chef de département sans blocage. Un mois visé ne se reprend plus.

### Le coût de la journée

`dailyCostSnapshot` est figé **à la date de la journée**, depuis la grille historisée `EmployeeDailyCost`. Il n'est jamais recalculé : c'est ce qui rend le coût d'inactivité opposable des mois plus tard, après une revalorisation des salaires.

Une journée d'intervention porte son `affairId`, repris de la mission : c'est ce rattachement qui fait remonter le temps passé dans la rentabilité de l'affaire.

## W10 — Étalonnage des instruments

```
Valide → Échéance J−30 (alerte) → À étalonner → En étalonnage → Valide (nouveau certificat)
                                            ↘ Périmé (blocage d'usage)
```

Un instrument `Périmé` ne peut plus être sélectionné dans une inspection, et toute inspection l'ayant utilisé après la date d'expiration est signalée en anomalie qualité.

### Le certificat est la seule sortie

Enregistrer un certificat conforme est **le seul geste** qui rend un instrument périmé utilisable. Rien d'autre ne le débloque — ni la remise en service, ni une modification de fiche.

| Situation | Refus |
|---|---|
| Étalonnage daté dans le futur | Un étalonnage ne se date pas dans le futur |
| Échéance antérieure à la date d'étalonnage | L'échéance doit être postérieure |
| Certificat sans numéro | Le numéro est la preuve de l'étalonnage |
| Remise en service d'un instrument dont l'étalonnage a expiré | Enregistrez d'abord un certificat valide |

À défaut d'échéance portée au certificat, la **périodicité de l'instrument** s'applique à la date d'étalonnage.

Un résultat **non conforme ne prolonge rien** : l'instrument sort du service. Un appareil qui a échoué à sa vérification ne peut pas fonder un rapport, et c'est le système qui l'empêche, pas la vigilance de l'utilisateur.

Deux situations sont **signalées sans bloquer** : un certificat dont l'échéance est déjà passée (l'instrument reste inutilisable, mais la trace est conservée), et un certificat qui expire avant celui déjà enregistré — la validité acquise n'est jamais raccourcie.

### La pièce et la traçabilité

Le certificat scanné rejoint la **GED**, rattaché à l'instrument. Sans lui, un audit n'a que la parole de celui qui a saisi.

La fiche de l'instrument liste les **inspections qui se sont appuyées dessus**, avec la validité d'étalonnage figée au moment de chaque essai. C'est la question qu'un auditeur pose quand un étalonnage se révèle non conforme : quels rapports faut-il reprendre ?

Le départ au laboratoire retire l'instrument des choix proposés à la saisie : un appareil qui n'est pas dans les mains de l'inspecteur ne peut pas avoir servi à mesurer.
## W11 — Congé

```
Demande → Accordé | Refusé
      ↘ Retirée par le demandeur, tant qu'elle n'est pas tranchée
```

Le **nombre de jours n'est pas saisi** : il se compte sur le calendrier de la société. Une semaine posée sur un pont férié ne consomme pas cinq jours, et laisser quelqu'un l'écrire à la main ouvrirait la porte aux écarts de solde.

| Situation | Refus |
|---|---|
| Fin antérieure au début | La fin ne peut pas précéder le début |
| Période sans aucun jour ouvré | Il n'y a rien à poser |
| Chevauchement d'une demande en attente ou accordée | Un jour n'est absent qu'une fois |
| Congé accordé à soi-même | Un congé ne s'accorde pas soi-même |
| Refus sans motif | Un refus doit être motivé |

Une **mission planifiée pendant l'absence** est signalée sans bloquer, à la demande comme à la décision : c'est au responsable d'arbitrer entre le congé et la mission, pas au système.

Un congé accordé **se répercute seul sur le pointage** : la déduction du planning en fait une journée d'absence, sans nouvelle saisie.

---

## W12 — Habilitation d'un inspecteur

Une habilitation périmée empêche d'affecter son porteur à une mission de la méthode concernée — le planning signale le conflit `EXPIRED_CERTIFICATION`. **Enregistrer le renouvellement est le seul geste qui rouvre cette affectation.**

| Situation | Refus |
|---|---|
| Échéance antérieure à la date de délivrance | L'échéance doit être postérieure |
| Délivrance dans le futur | Une certification ne se délivre pas dans le futur |
| Enregistrement par un autre rôle que les ressources humaines | Droit manquant |

Une échéance déjà passée est **signalée sans bloquer** : la trace est conservée, mais l'habilitation reste inopérante.

Le certificat scanné rejoint la **GED en diffusion restreinte**, rattaché au titulaire. Une habilitation à moins de soixante jours de son terme est signalée : c'est le délai d'alerte `certification.alertDaysBefore`.

---

---

## W13 — Équipement client

Le parc contrôlé : bacs, ponts roulants, circuits de tuyauterie, installations électriques. Chaque équipement porte la **périodicité que la réglementation lui impose** et le texte qui la fonde — API 653, API 570, arrêté du 1er mars pour le levage, décret 2-14-499 pour les appareils à pression.

Le **repère est unique chez un client**, pas dans toute la base : deux clients peuvent nommer un bac `T-401`.

À la création, quand la périodicité et la date de mise en service sont connues, **l'échéance se calcule** plutôt que de se saisir.

### L'échéance se reporte seule

À l'**émission du rapport** — pas à la saisie, car c'est la pièce remise qui atteste du contrôle — l'échéance de l'équipement avance d'une périodicité à partir de la date d'essai. Vérifié : un contrôle du 07/09/2026 sur un équipement à 24 mois reporte l'échéance au 07/09/2028.

Deux garde-fous :

- **sans périodicité connue, rien n'est reporté** — mieux vaut une échéance vide qu'une échéance inventée ;
- **l'échéance ne recule jamais** : un rapport émis en retard ne raccourcit pas le délai déjà acquis.

C'est cette échéance qui ramène l'inspection l'année suivante : un contrôle échu est une intervention à planifier, et le tableau de bord la signale comme telle.

La fiche d'un équipement porte son **historique d'inspection** et les **écarts** ouverts sur lui — c'est ce qu'on présente au client lors d'une revue de parc.

---

## W14 — Flotte

Un véhicule **sans couverture d'assurance en cours reste hors service**. C'est le seul point que le système refuse de contourner : un véhicule neuf naît hors service, et seule une police valide l'en sort.

| Situation | Refus |
|---|---|
| Immatriculation déjà enregistrée | Une plaque ne se dédouble pas |
| Compteur qui recule | Une saisie inférieure est une faute de frappe |
| Entretien daté dans le futur | Un entretien ne se date pas dans le futur |
| Relevé d'entretien sous le compteur actuel | Le compteur fait foi |
| Fin de validité d'assurance avant son début | La fin doit suivre le début |

Une police **déjà expirée est acceptée mais signalée** : la trace est conservée, le véhicule reste hors service.

Le **relevé du garage met le compteur à jour** : c'est la mesure la plus fiable dont on dispose, et elle évite une double saisie. Un véhicule qui sort de l'atelier redevient disponible.

L'entretien est **dû par la date ou par le compteur**, selon ce que le dernier passage a fixé.

---

## W15 — Avance sur frais

```
Demandée → Accordée → Versée → Partiellement soldée → Soldée
       ↘ Refusée (motif obligatoire)
```

Une avance est de la trésorerie sortie **avant justificatif**. Elle se retient ensuite sur les notes de frais de l'intéressé : le règlement d'une note déduit d'abord les avances en cours, de la plus ancienne à la plus récente.

| Situation | Refus |
|---|---|
| Seconde avance alors que la première n'est pas soldée | On n'avance pas deux fois sans avoir récupéré |
| Accord par celui qui a enregistré la demande | Elle doit être accordée par quelqu'un d'autre |
| Avance accordée à soi-même | Une avance ne s'accorde pas à soi-même |
| Refus sans motif | Un refus doit être motivé |
| Versement d'une avance non accordée | Seule une avance accordée se verse |

La **séparation des tâches** n'est pas une formalité ici : le RAF enregistre la demande, le contrôle de gestion ou la RH l'accorde, le RAF verse. Trois gestes, deux personnes au minimum.

---

## W16 — Contrôle de gestion (transverse, permanent)

Le contrôle de gestion ne suit pas une machine à états : il pose trois questions sur ce que les autres workflows ont produit.

### 1. Ce qui était prévu contre ce qui a été dépensé

Le budget d'une affaire se saisit poste par poste — **main-d'œuvre, frais de mission, véhicules, sous-traitance, autres** — puis se compare au réel, poste à poste.

| Poste | D'où vient le réel |
|---|---|
| Main-d'œuvre | Journées pointées, au **coût figé du jour de l'intervention** (`dailyCostSnapshot`) |
| Frais de mission | Lignes de notes de frais **acceptées** et imputées à l'affaire |
| Véhicules | Forfait mensuel du véhicule, au prorata des jours de mission |
| Sous-traitance | *pas encore de source* |
| Autres | *pas encore de source* |

Les deux derniers postes sont **exclus des totaux et des écarts**, et l'écran le dit. Les compter à zéro les ferait passer pour une économie intégrale — un budget de sous-traitance non consommé apparaîtrait comme 100 % d'économie alors que la dépense existe simplement ailleurs.

### 2. Ce que l'affaire coûtera une fois finie

```
coût à terminaison = consommé + reste à engager
```

Le **reste à engager** valorise les missions planifiées et pas encore faites : intervenants affectés × jours prévus × coût journalier en vigueur, plus la quote-part véhicule. C'est cette somme, et non le consommé seul, qui dit si le budget tiendra.

Le consommé peut rester sous le budget pendant que le coût à terminaison le dépasse déjà : c'est précisément le moment où la dérive se rattrape encore. Une alerte se déclenche **au-delà de 10 %** de dépassement à terminaison — en dessous, c'est le bruit habituel d'un chantier.

Le **montant du marché** suit le registre : bon de commande s'il existe, sinon le contrat, sinon l'offre.

### 3. Ce qui ne colle pas dans les données

Sept contrôles, exécutés à chaque consultation de l'écran. **Aucun n'est bloquant** — ils désignent, ils n'empêchent pas : un écart peut être justifié par un avenant non saisi ou une mission reportée, et c'est pour cela qu'ils sont montrés à une personne plutôt que traités automatiquement.

| Contrôle | Gravité | Ce que ça coûte |
|---|---|---|
| Journée portée par deux attachements | **Critique** | La même journée sera facturée deux fois : réclamation assurée, avoir à passer |
| Travail fait, jamais attaché (> 45 jours) | **Critique** | Une prestation réalisée qui n'entre sur aucun attachement ne sera jamais facturée — du chiffre perdu, pas un retard |
| Mission terminée sans pointage | À surveiller | Le coût n'apparaît nulle part : la marge de l'affaire est surévaluée d'autant |
| Frais accepté sans affaire | À surveiller | Coût décaissé qui n'entre dans aucune marge et ne sera jamais refacturé |
| Affaire en cours sans budget | À surveiller | Aucun écart calculable : la dérive ne se verra qu'à la clôture |
| Pointage après clôture de l'affaire | À surveiller | La marge annoncée à la clôture était fausse |
| Facture sans attachement | À surveiller | Rien ne prouve le travail facturé : indéfendable en cas de contestation |

Le délai de 45 jours sur le deuxième contrôle laisse au circuit d'attachement le temps de se faire : plus court, chaque fin de mois déclencherait une alerte sur du travail normal.

**Périmètre** : le contrôle porte sur les affaires **en cours ou suspendues** — les affaires closes sortent du tableau, sauf pour le contrôle « pointage après clôture », qui n'a de sens que sur elles. Les droits suivent le périmètre `controlling:VIEW` de celui qui regarde.
