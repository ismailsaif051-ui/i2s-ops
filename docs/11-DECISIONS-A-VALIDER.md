# 11 — Décisions à valider avant le développement

Ces points ne bloquent pas la conception, mais ils **conditionnent le socle**. Ils doivent être tranchés avant la fin de la Phase 0.

## D1 — Hébergement

| Option | Avantages | Inconvénients |
|---|---|---|
| **Cloud (recommandé)** — VPS européen ou marocain, Docker | Mise en route rapide, sauvegardes gérées, accessible depuis les chantiers, coût prévisible | Dépendance à la connexion internet du siège |
| On-premise — serveur au siège | Données physiquement chez I2S | Sauvegardes, disponibilité, VPN pour le terrain, maintenance à la charge d'I2S |
| Hybride | Base au siège, réplique cloud | Complexité supérieure |

*Impact : configuration réseau, sauvegardes, accès mobile.*

## D2 — Périmètre multi-sociétés

Trois entités ont été détectées (**I2S TESTING**, **I2S TESTING SUD**, **BETA ENG**).

- Le produit doit-il les gérer **toutes les trois dès le MVP**, avec consolidation groupe ?
- Ou démarrer sur I2S TESTING, la dimension `Company` restant présente dans le modèle mais inutilisée ?

*Recommandation : modèle multi-sociétés dès le départ, activation progressive. Le coût est marginal maintenant, lourd plus tard.*

## D3 — Format du numéro d'affaire

`AA/XXXX` (registre CTC actuel) ou `AFF-2026-001` (cahier des charges) ?

*Recommandation : `AA/XXXX`, pour la continuité avec l'existant. Le format reste paramétrable.*

## D4 — Niveau de la signature électronique

- **Simple** (recommandé pour démarrer) : identité authentifiée, horodatage, empreinte, audit. Suffisant pour un usage interne et pour la plupart des clients.
- **Avancée** : certificat qualifié auprès d'un prestataire agréé. À prévoir si un client l'exige contractuellement.

*L'architecture permet de passer de l'une à l'autre sans refonte.*

## D5 — Département HSE

Le CDC le cite dans les formules et les rôles, mais **aucun formulaire HSE n'a été fourni**. Faut-il :

- créer le département dès le MVP, sans bibliothèque de rapports ; ou
- attendre la transmission des procédures et modèles HSE ?

## D6 — Périmètre du pointage

Le pointage est-il **journalier** (une journée = une ligne, conforme aux formules du CDC) ou faut-il descendre à l'**heure** pour certaines prestations ?

*Recommandation : journalier, avec un champ « heures » optionnel pour information. Toutes les formules du CDC raisonnent en jours.*

## D7 — Refacturation des jours d'attente

Les jours `attente chantier` et `intempérie` sont-ils refacturables au client selon les contrats ? Si oui, sous quelle condition (accord préalable, seuil de jours, tarif réduit) ?

*Impact direct sur la marge et sur le comportement du module attachements.*

## D8 — Reprise de l'historique

Sur quelle profondeur reprendre les données existantes ?

- Coûts journaliers : **indispensable sur au moins 2 ans** pour les calculs rétroactifs.
- Affaires : en cours uniquement, ou historique complet ?
- Rapports passés : reprise en GED comme fichiers, sans re-modélisation.

## D9 — Ordre de priorité des départements

Quel département sert de pilote pour le MVP ?

*Recommandation : CND — c'est le mieux documenté (procédures opératoires, plan de contrôle, planning, 20 formulaires), donc celui qui valide le plus vite la conception.*

## D10 — Intégration comptable

Quel logiciel comptable est utilisé aujourd'hui ? Un export au format attendu (FEC, Sage, écritures CSV) sera prévu plutôt qu'une double saisie.

---

## Ce qui a déjà été tranché dans le dossier

| Sujet | Décision retenue | Document |
|---|---|---|
| Stack technique | TypeScript de bout en bout · Next.js + NestJS + PostgreSQL | `02` |
| Mobile | PWA hors ligne, pas d'application native | `02` |
| Formulaires d'inspection | Moteur de templates versionnés, aucun formulaire codé en dur | `08` |
| Coûts | Historisation par période de validité, calcul à la date | `09` |
| Rapports | Immuables après émission, révision explicite | `05` |
| Facturation | Uniquement par regroupement d'attachements validés | `05` |
| Séparation des tâches | Vérificateur ≠ rédacteur, valideur ≠ déclarant | `04` |
| Étalonnage | Bloquant à l'émission d'un rapport | `03`, `08` |
