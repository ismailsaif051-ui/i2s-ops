# 10 — Roadmap & plan de développement

## 1. Principe de séquencement

L'ordre n'est pas dicté par la facilité technique mais par la **valeur de pilotage** : le CDC désigne les *jours non affectés* comme l'indicateur critique. On construit donc en priorité la chaîne minimale qui permet de le mesurer :

```
Employé → Coût journalier historisé → Mission → Affectation → Pointage → Jours non affectés → Coût d'inactivité
```

Cette chaîne est mesurable dès la fin du MVP, avant même les rapports et la facturation.

## 2. Phase 0 — Socle (2 semaines)

| Livrable | Contenu |
|---|---|
| Monorepo | pnpm + Turborepo, CI, lint, tests, Docker Compose |
| Base de données | Schéma Prisma complet, migrations, seeds de référentiels (départements, catégories de frais, rôles, calendrier ouvré marocain) |
| Auth & RBAC | Connexion, JWT, 12 rôles, 7 actions, 5 périmètres, gardes et filtres |
| Design System | Tokens, 20 composants de base, thèmes clair/sombre |
| Socle transverse | Numérotation, audit, notifications, stockage fichiers, recherche |

**Critère de sortie** : un utilisateur se connecte, voit un menu conforme à son rôle, toute action est journalisée.

## 3. MVP — Pilotage opérationnel (10 semaines)

| Sprint | Modules | Livrable démontrable |
|---|---|---|
| S1–S2 | 21 RH · 07 Inspecteurs | Fiches employés, compétences, certifications avec alerte d'expiration, **coût journalier historisé** |
| S3 | 02 Commercial · 03 Affaires | Clients, opportunités, pipeline, création d'affaire depuis une offre gagnée |
| S4–S5 | 04 Missions · 16 Flotte (socle) | Cycle de mission complet, affectation, réservation de véhicule, détection de conflits |
| S6 | 05 Ordre de mission | Génération, circuit de validation, signature électronique, PDF |
| S7 | 06 Planning | Vues jour/semaine/mois, glisser-déposer, conflits, disponibilité |
| S8 | 08 Pointage | Journées pré-remplies, 9 catégories, validation hebdomadaire, verrouillage mensuel |
| S9 | 15 Notes de frais | Saisie, barèmes et plafonds automatiques, circuit à 5 visas, PDF, export virement |
| S10 | 01 Dashboard · 18 Productivité · **Jours non affectés** | Cockpit par rôle, KPI cliquables, coût d'inactivité par pôle |

**Critère de sortie du MVP** : I2S peut répondre, sans Excel, à « qui est où, qui n'est pas affecté, combien ça coûte, quelles missions arrivent, où en sont les frais ».

En parallèle : PWA inspecteur (missions, OM, pointage, frais) livrée en fin de MVP, avec le mode hors ligne.

## 4. V2 — Chaîne technique & financière (12 semaines)

| Sprint | Modules | Livrable |
|---|---|---|
| S11–S13 | 10 Moteur de templates · 09 Rapports | Éditeur de templates, saisie mobile hors ligne, workflow de rapport, PDF fidèle · **lot L1 : 6 formulaires END** |
| S14 | 11 Assets · 11b Parc de mesure | Registre d'équipements, historique, **étalonnage bloquant** |
| S15 | 12 Non-conformités | Observation → NC, workflow, alertes |
| S16–S17 | 13 Attachements · 14 Facturation | Attachement depuis pointage + rapports, facture par regroupement, avoirs |
| S18 | Paiements & relances | Échéancier, encaissements, rapprochement bancaire, balance âgée |
| S19 | 16 Flotte (complet) | Entretiens, assurances, carburant, taux d'utilisation |
| S20 | 20 GED | Recherche multicritère, versioning, permissions, registres QMS |
| S21 | 17 Contrôle de gestion · 19 Rentabilité | Budget vs réel, marges, alertes d'écart |
| S22 | 22 Dashboards direction | 5 dashboards spécialisés, exports |
| S23–S24 | Reprise des formulaires | **Lots L2 à L5 : 56 formulaires restants** |

**Critère de sortie de la V2** : la chaîne complète Opportunité → Paiement fonctionne sans ressaisie, et la rentabilité de chaque affaire est disponible en temps réel.

## 5. V3 — Intelligence & ouverture (10 semaines)

| Modules | Livrable |
|---|---|
| 26 Assistant IA | Questions en langage naturel filtrées par permissions ; synthèse mensuelle ; analyse de cahiers des charges clients ; brouillon d'offre commerciale |
| Portail client | Consultation des rapports émis, accusé de réception, suivi des NC |
| QR code documents | Vérification d'authenticité d'un rapport imprimé |
| Analytics avancés | Prévision de charge, détection d'affaires à risque, saisonnalité |
| Intégrations | Comptabilité (export FEC / Sage), e-mail, calendrier Microsoft 365 |

## 6. Jalons

| Jalon | Échéance relative | Contenu |
|---|---|---|
| **J0** | S0 | Validation du présent dossier d'architecture |
| **J1** | S2 | Socle livré, démonstration de connexion et de droits |
| **J2** | S6 | Mission + OM signé de bout en bout |
| **J3** | S10 | **MVP en production, pilote sur un département** |
| **J4** | S13 | Premier rapport END généré, superposable au modèle Word |
| **J5** | S18 | Première facture issue d'attachements validés |
| **J6** | S24 | **V2 complète, 62 formulaires repris, généralisation** |
| **J7** | S34 | V3, assistant IA et portail client |

## 7. Stratégie de mise en service

1. **Pilote sur un département** (CND recommandé : c'est le plus outillé et le plus documenté) pendant 4 semaines en double saisie.
2. **Reprise de données** : clients, employés, coûts journaliers historiques, affaires en cours, véhicules, instruments — depuis les classeurs Excel existants, par imports contrôlés.
3. **Formation par rôle** : 2 h inspecteurs (mobile), 4 h chefs de département et chargés d'affaires, 4 h contrôle de gestion et finance.
4. **Bascule** département par département, jamais en big bang.
5. **Arrêt d'Excel** module par module, uniquement après réconciliation d'un mois complet.

## 8. Conditions de réussite

| Condition | Pourquoi |
|---|---|
| Un référent métier disponible par département | La modélisation des 62 formulaires ne peut pas se faire sans validation terrain |
| Coûts journaliers historiques fournis | Sans eux, aucun calcul rétroactif de marge n'est possible |
| Discipline de pointage quotidien | Tout le module productivité en dépend ; c'est un changement d'habitude, pas un sujet technique |
| Décision sur l'hébergement (cloud ou on-premise) avant J1 | Impacte la configuration du socle |
| Modèles HSE fournis | Le département existe dans les formules mais n'a aucun formulaire dans le corpus |

## 9. Ce qui n'est volontairement pas fait

Pour éviter la complexité inutile (règle §17 et §24 du CDC) :

- Pas de module achats/fournisseurs complet — la sous-traitance est une ligne de coût.
- Pas de paie — le coût journalier suffit à l'analytique ; l'interface avec la paie se fait par export.
- Pas de comptabilité générale — export FEC vers l'outil comptable existant.
- Pas d'application mobile native — la PWA couvre le besoin.
- Pas de multi-langue d'interface au démarrage — français, avec libellés bilingues sur les documents techniques.
