/**
 * Contenu des guides d'utilisation.
 *
 * Chaque chapitre décrit un module ; chaque étape n'apparaît que si le profil
 * a le droit correspondant (`c.can('report', 'APPROVE')`). Un guide ne contient
 * donc que ce que son lecteur peut réellement faire. Les libellés entre « » sont
 * ceux des boutons de l'application ; les règles viennent de docs/05-WORKFLOWS.md.
 */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const btn = (label) => `<span class="btn">${esc(label)}</span>`;
export const path = (...parts) => `<span class="path">${parts.map(esc).join(' <i>›</i> ')}</span>`;
const p = (html) => `<p>${html}</p>`;
const steps = (items) => `<ol class="steps">${items.filter(Boolean).map((i) => `<li>${i}</li>`).join('')}</ol>`;
const list = (items) => `<ul>${items.filter(Boolean).map((i) => `<li>${i}</li>`).join('')}</ul>`;
const note = (html) => `<div class="note"><b>À savoir</b>${html}</div>`;
const warn = (html) => `<div class="note warn"><b>Attention</b>${html}</div>`;
const h3 = (t) => `<h3>${t}</h3>`;
const refusals = (rows) =>
  `<table class="refus"><thead><tr><th>Si vous faites…</th><th>L’application répond…</th></tr></thead><tbody>${rows
    .map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`)
    .join('')}</tbody></table>`;

export const SCOPE_TEXT = {
  ALL: 'toutes les sociétés du groupe',
  COMPANY: 'toute votre société',
  DEPARTMENT: 'votre département',
  TEAM: 'votre portefeuille (les dossiers dont vous êtes chargé)',
  OWN: 'ce qui vous concerne personnellement',
};
export const SCOPE_SHORT = { ALL: 'Groupe', COMPANY: 'Société', DEPARTMENT: 'Département', TEAM: 'Portefeuille', OWN: 'Personnel' };

/** Ce que chaque profil vient faire dans l'application — écrit pour lui. */
export const ROLE_INTRO = {
  DG: {
    summary: 'Vous pilotez l’entreprise : vous voyez tout, vous approuvez ce qui engage la société, et vous ne saisissez presque rien.',
    missions: [
      'Suivre l’activité, la facturation, les encaissements et la qualité depuis la Vue d’ensemble.',
      'Approuver les notes de frais après leur comptabilisation (étape 4 du circuit).',
      'Surveiller la rentabilité des affaires et les dérives signalées par le contrôle de gestion.',
      'Consulter le journal d’audit quand une décision doit être retracée.',
    ],
  },
  DEPT_HEAD: {
    summary: 'Vous dirigez un département technique : vous planifiez les missions, affectez vos inspecteurs, vérifiez les rapports et visez le pointage de votre équipe.',
    missions: [
      'Planifier les missions de votre département et composer les équipes.',
      'Vérifier les rapports de vos inspecteurs avant leur émission.',
      'Viser chaque mois le pointage de votre équipe.',
      'Confirmer les notes de frais de vos collaborateurs (étape 1 du circuit).',
      'Accorder ou refuser les congés, suivre les non-conformités et les étalonnages.',
    ],
  },
  ACCOUNT_MANAGER: {
    summary: 'Vous portez un portefeuille d’affaires de bout en bout : de la consultation au bon de commande, puis des missions à l’attachement signé par le client.',
    missions: [
      'Suivre vos consultations, établir et envoyer les offres.',
      'Ouvrir les affaires et renseigner leur bon de commande.',
      'Demander et planifier les missions de vos affaires.',
      'Émettre les rapports vers le client, préparer et faire signer les attachements.',
      'Confirmer les notes de frais liées à vos affaires.',
    ],
  },
  SALES: {
    summary: 'Vous développez le portefeuille : vous créez les clients, suivez les consultations et appels d’offres, et établissez les offres.',
    missions: [
      'Créer et tenir à jour les fiches clients et leurs contacts.',
      'Enregistrer chaque consultation ou appel d’offres et la suivre jusqu’à la décision.',
      'Établir, faire relire et envoyer les offres ; relancer.',
      'Saisir vos propres notes de frais.',
    ],
  },
  INSPECTOR: {
    summary: 'Vous réalisez les interventions : vous consultez vos missions, signez vos ordres de mission, saisissez vos inspections et vos rapports, et déclarez vos frais.',
    missions: [
      'Consulter vos missions et votre planning.',
      'Signer vos ordres de mission avant de partir.',
      'Saisir vos inspections sur le terrain et soumettre vos rapports.',
      'Vérifier votre pointage et demander vos congés.',
      'Saisir vos notes de frais avant le 3 du mois suivant.',
    ],
  },
  DOC_CONTROLLER: {
    summary: 'Vous garantissez la qualité documentaire : vous vérifiez les rapports, vous les émettez vers le client, et vous tenez la GED et les modèles de formulaires.',
    missions: [
      'Prendre en charge et viser les rapports soumis (grille de vérification).',
      'Émettre les rapports validés et enregistrer leur remise au client.',
      'Classer et retrouver les documents dans la GED.',
      'Tenir à jour les modèles d’inspection.',
    ],
  },
  CONTROLLER: {
    summary: 'Vous tenez les coûts et la marge : coûts journaliers, budgets, coûts de sous-traitance, contrôle des notes de frais et suivi de la rentabilité.',
    missions: [
      'Mettre à jour les coûts journaliers des employés (un par un ou par Excel).',
      'Saisir la sous-traitance et les autres coûts sur les affaires.',
      'Suivre le contrôle de gestion : budget, coût à terminaison, anomalies.',
      'Contrôler les notes de frais (étape 2 du circuit) et accorder les avances.',
    ],
  },
  CONTROLLER_ASSISTANT: {
    summary: 'Vous assistez le contrôle de gestion : vous saisissez les pièces de dépenses, préparez les attachements et suivez la flotte et les avances.',
    missions: [
      'Saisir et compléter les notes de frais et leurs justificatifs.',
      'Préparer les attachements à partir des journées visées.',
      'Saisir la sous-traitance et les autres coûts sur les affaires.',
      'Enregistrer les demandes d’avance et tenir la flotte à jour.',
    ],
  },
  BILLING: {
    summary: 'Vous transformez le travail réalisé en factures : attachements signés, factures, avoirs et règlements.',
    missions: [
      'Préparer les attachements et les transmettre au client.',
      'Établir et émettre les factures à partir des attachements signés.',
      'Émettre un avoir quand une facture émise doit être corrigée.',
      'Enregistrer les règlements reçus.',
    ],
  },
  RAF: {
    summary: 'Vous tenez la trésorerie : factures, encaissements, comptabilisation et paiement des notes de frais, avances et virements.',
    missions: [
      'Suivre les créances, les factures échues et le délai moyen de paiement.',
      'Enregistrer les règlements clients et émettre les avoirs.',
      'Comptabiliser les notes de frais (étape 3) puis donner le bon à payer (étape 5).',
      'Enregistrer et verser les avances, valider les ordres de virement.',
    ],
  },
  HR: {
    summary: 'Vous gérez le personnel : fiches employés, coûts journaliers, habilitations, congés, pointage, et contrôle RH des notes de frais.',
    missions: [
      'Créer et tenir à jour les fiches employés (import Excel possible).',
      'Mettre à jour les coûts journaliers.',
      'Enregistrer les habilitations et leurs renouvellements.',
      'Viser le pointage, traiter les congés, contrôler les notes de frais (étape 2).',
      'Tenir la flotte et préparer les ordres de virement.',
    ],
  },
  ADMIN: {
    summary: 'Vous administrez la plateforme : comptes, rôles, référentiels et sécurité. Vous avez accès à tous les modules.',
    missions: [
      'Créer les comptes utilisateurs et leur attribuer un rôle.',
      'Réinitialiser un mot de passe ou débloquer un compte.',
      'Tenir les référentiels et les modèles d’inspection.',
      'Consulter le journal d’audit.',
    ],
  },
};

/** Étape du circuit des notes de frais franchie par chaque rôle (docs/05, W7). */
const EXPENSE_STEP = {
  DEPT_HEAD: ['1 — Confirmation du responsable', 'Vous confirmez la réalité de la mission et des dépenses de vos collaborateurs.'],
  ACCOUNT_MANAGER: ['1 — Confirmation du responsable', 'Vous confirmez les dépenses liées à vos affaires.'],
  HR: ['2 — Contrôle RH', 'Vous contrôlez les plafonds et les justificatifs.'],
  CONTROLLER: ['2 — Contrôle de gestion', 'Vous contrôlez les plafonds, les justificatifs et l’imputation.'],
  RAF: ['3 — Comptabilisation, puis 5 — Bon à payer', 'Vous comptabilisez la note, puis, après l’approbation de la Direction, vous donnez le bon à payer.'],
  DG: ['4 — Approbation', 'Vous approuvez la note après sa comptabilisation.'],
};

/**
 * Chapitres. `show` décide si le chapitre figure dans le guide ; `body` en
 * rend le contenu pour ce profil. `shots` nomme les captures à y placer.
 */
export const CHAPTERS = [
  {
    id: 'affaires',
    title: 'Les affaires',
    where: ['Affaires'],
    shots: ['affaires', 'affaire-fiche'],
    show: (c) => c.can('affair', 'VIEW'),
    body: (c) =>
      p('Une affaire regroupe tout ce qui concerne une commande client : missions, rapports, attachements, factures et rentabilité. Son numéro (26/0142) est attribué automatiquement.') +
      h3('Retrouver une affaire') +
      steps([
        `Ouvrez ${path('Affaires')}.`,
        'Utilisez la recherche, ou filtrez par statut commercial, état des travaux et service pilote.',
        'Cliquez sur le numéro de l’affaire pour ouvrir sa fiche.',
      ]) +
      note(`Vous voyez les affaires de ${SCOPE_TEXT[c.scope('affair', 'VIEW')]}.`) +
      (c.can('affair', 'CREATE')
        ? h3('Ouvrir une affaire') +
          steps([
            `Dans ${path('Affaires')}, cliquez sur ${btn('Ouvrir une affaire')}.`,
            'Choisissez le client, saisissez la désignation et le service pilote (obligatoire).',
            'Renseignez le montant de l’offre, et le bon de commande s’il est déjà reçu.',
            'Enregistrez : le numéro d’affaire est attribué automatiquement.',
          ]) +
          note('Dans le cycle normal, l’affaire naît toute seule quand le client accepte une offre : client, montant et lignes sont repris de l’offre.')
        : '') +
      (c.can('affair', 'UPDATE')
        ? h3('Renseigner le bon de commande') +
          p('Le bon de commande fixe comment la prestation sera facturée. Il arrive souvent après l’ouverture de l’affaire.') +
          steps([
            `Sur la fiche de l’affaire, cliquez sur ${btn('Renseigner le bon de commande')}.`,
            'Saisissez le n° de bon de commande et son montant.',
            'Choisissez le mode de facturation : à la vacation, à l’intervention, à l’unité (équipement contrôlé) ou au forfait.',
            'Saisissez le prix unitaire du BC, puis enregistrez.',
          ]) +
          `<table class="grid"><thead><tr><th>Mode</th><th>Ce qui sera facturé par mission</th></tr></thead><tbody>
            <tr><td>À la vacation</td><td>Les journées passées ; une demi-journée compte 0,5.</td></tr>
            <tr><td>À l’intervention</td><td>Chaque jour où la mission a eu lieu compte 1.</td></tr>
            <tr><td>À l’unité</td><td>Le nombre d’équipements contrôlés.</td></tr>
            <tr><td>Au forfait</td><td>Une fois par mission.</td></tr></tbody></table>`
        : '') +
      (c.can('controlling', 'VIEW')
        ? h3('Lire la rentabilité d’une affaire') +
          p('Le bandeau en haut de la fiche donne le marché, le facturé, l’encaissé, les coûts, la marge et la <b>marge à terminaison</b> (ce que l’affaire laissera si rien ne change).') +
          list([
            '<b>Marge « n. c. »</b> : non calculable tant que rien n’est facturé.',
            '<b>Budget vs réel</b> : pour chaque poste, le budget, le réel, l’engagé et l’écart à terminaison.',
            'Une alerte apparaît quand la marge réelle passe plus de 5 points sous la marge budgétée.',
          ])
        : '') +
      (c.can('controlling', 'CREATE')
        ? h3('Saisir la sous-traitance et les autres coûts') +
          steps([
            `Sur la fiche de l’affaire, dans « Sous-traitance et autres coûts », cliquez sur ${btn('Ajouter un coût')}.`,
            'Choisissez le poste (sous-traitance ou autre coût direct) et l’état : <b>Engagé</b> (commande passée) ou <b>Réel</b> (facture reçue).',
            'Saisissez la description, le fournisseur, le n° de commande ou de facture et le montant HT.',
            `À réception de la facture d’un coût engagé, cliquez sur ${btn('Facture reçue')} : il entre alors dans la marge.`,
          ]) +
          note('Un coût engagé pèse sur la marge à terminaison ; un coût réel entre dans la marge. Chaque saisie est tracée dans le journal d’audit.')
        : ''),
  },
  {
    id: 'clients',
    title: 'Les clients',
    where: ['Commercial', 'Clients'],
    shots: ['clients'],
    show: (c) => c.can('client', 'VIEW'),
    body: (c) =>
      p('Le fichier clients est commun à toute l’entreprise : prospects, clients actifs, contacts et délai de règlement.') +
      (c.can('client', 'CREATE')
        ? h3('Créer un client') +
          steps([
            `Ouvrez ${path('Commercial', 'Clients')} et cliquez sur ${btn('Nouveau client')}.`,
            'Saisissez la raison sociale, le code client, la nature (prospect ou client), le secteur et la ville.',
            'Renseignez l’ICE (15 chiffres) et le <b>délai de règlement</b> : il fixera l’échéance des factures.',
            `Ajoutez les interlocuteurs avec ${btn('Ajouter un contact')}, puis enregistrez.`,
          ]) +
          warn('Le code client ne se modifie plus une fois enregistré. Vérifiez-le avant de valider.')
        : p(`Vous consultez les clients de ${SCOPE_TEXT[c.scope('client', 'VIEW')]} : coordonnées, contacts et affaires liées.`)),
  },
  {
    id: 'commercial',
    title: 'Consultations, appels d’offres et offres',
    where: ['Commercial', 'Consultations & appels d’offres'],
    shots: ['consultations', 'offres'],
    show: (c) => c.can('opportunity', 'VIEW') || c.can('offer', 'VIEW'),
    body: (c) =>
      p('Une demande de prix arrive de deux façons : le client vous consulte directement, ou il publie un appel d’offres. Les deux se suivent dans le même tableau.') +
      p('<b>Vous ne choisissez pas l’étape : elle suit ce que vous faites.</b> Enregistrer un appel d’offres met le dossier en consultation, établir une offre le met en préparation, l’envoyer le fait passer à « offre envoyée ».') +
      (c.can('opportunity', 'CREATE')
        ? h3('Enregistrer une consultation') +
          steps([
            `Ouvrez ${path('Commercial', 'Consultations & appels d’offres')}.`,
            'Créez la consultation : client, objet, montant pressenti, décision attendue.',
            'Pour un appel d’offres, ajoutez sa référence, la date de remise des offres, l’ouverture des plis et la caution.',
          ]) +
          h3('Établir et envoyer une offre') +
          steps([
            `Sur la consultation, cliquez sur ${btn('Établir l’offre')} et ajoutez les lignes de prestation : le montant se calcule sur les lignes.`,
            `Rédigez le texte (${btn('Rédiger avec l’assistant')} si l’assistant est activé), puis relisez-le et corrigez-le.`,
            'Validez la relecture, puis envoyez l’offre au client.',
            `Après l’envoi, enregistrez chaque relance avec ${btn('Relancer')} et la date de prochaine action.`,
          ]) +
          note('L’assistant écrit les mots, jamais les chiffres : le bordereau des prix est construit à partir de vos lignes. Tant que le texte n’est pas relu, le PDF sort marqué <b>PROJET</b>.') +
          h3('Gagner ou perdre') +
          list([
            '<b>Gagnée</b> : enregistrez l’accord du client sur l’offre envoyée. L’affaire est créée automatiquement avec le client, le montant et les lignes de l’offre.',
            `<b>Perdue</b> : cliquez sur ${btn('Déclarer perdue')}, choisissez la cause (prix, délai, références, capacité…) et écrivez le motif.`,
          ]) +
          refusals([
            ['Déclarer « gagnée » à la main', 'Une opportunité se gagne en acceptant une offre.'],
            ['Envoyer une offre non relue', 'Relisez-la et validez-la avant de l’envoyer.'],
            ['Enregistrer l’accord sur une offre jamais envoyée', 'Envoyez-la d’abord.'],
            ['Déclarer une perte sans cause ni motif', 'La cause et le motif sont obligatoires.'],
          ])
        : p(`Vous consultez les consultations et les offres de ${SCOPE_TEXT[c.scope('opportunity', 'VIEW') ?? c.scope('offer', 'VIEW')]}, sans pouvoir les modifier.`) +
          (c.can('offer', 'APPROVE') ? p('Vous pouvez approuver une offre qui demande votre accord.') : '')),
  },
  {
    id: 'missions',
    title: 'Les missions',
    where: ['Opérations', 'Missions'],
    shots: ['missions', 'mission-fiche'],
    show: (c) => c.can('mission', 'VIEW'),
    body: (c) =>
      p('Une mission est une intervention chez un client, rattachée à une affaire. Elle suit ce parcours : demande → planification → affectation → ordre de mission → en cours → terminée → rapport remis.') +
      note(`Vous voyez les missions de ${SCOPE_TEXT[c.scope('mission', 'VIEW')]}.`) +
      (c.can('mission', 'CREATE')
        ? h3('Planifier une mission') +
          steps([
            `Ouvrez ${path('Opérations', 'Missions')} et cliquez sur ${btn('Planifier une mission')}.`,
            'Choisissez l’affaire, puis le site, le service, le type de prestation et l’objet.',
            'Saisissez le début et la fin prévus, ainsi que les consignes.',
            'Enregistrez : la mission reçoit son numéro (MIS-26-…).',
          ]) +
          h3('Composer l’équipe') +
          steps([
            `Sur la fiche de la mission, cliquez sur ${btn('Ajouter un intervenant')}.`,
            'Choisissez l’inspecteur et son rôle : chef de mission, assistant, superviseur ou stagiaire.',
            `Cliquez sur ${btn('Enregistrer l’équipe')}. L’application contrôle les conflits.`,
          ]) +
          `<table class="grid"><thead><tr><th>Contrôle</th><th>Résultat</th></tr></thead><tbody>
            <tr><td>Congé ou arrêt maladie accordé</td><td>Affectation refusée</td></tr>
            <tr><td>Formation ces jours-là</td><td>Affectation refusée</td></tr>
            <tr><td>Habilitation expirée à la date</td><td>Affectation refusée</td></tr>
            <tr><td>Déjà sur une autre mission le même jour</td><td><b>Acceptée avec un avertissement</b> : la journée est partagée à parts égales</td></tr></tbody></table>` +
          note('Un inspecteur peut faire plusieurs interventions le même jour. Deux interventions comptent ½ journée chacune, trois ⅓. Le chef de service de l’inspecteur reçoit une notification « Journée partagée ».')
        : '') +
      (c.code === 'INSPECTOR'
        ? h3('Suivre vos missions') +
          steps([
            `Ouvrez ${path('Opérations', 'Missions')} : vous n’y voyez que les missions où vous êtes affecté.`,
            'Ouvrez une mission pour lire l’objet, le site, les dates, les consignes et l’équipe.',
            'Signez votre ordre de mission avant de partir (chapitre suivant).',
          ])
        : '') +
      (c.can('mission', 'UPDATE')
        ? h3('Annuler ou reporter') +
          p(`Sur la fiche de la mission, l’annulation demande un motif (${btn('Confirmer l’annulation')}). Une mission annulée ne coûte plus rien à l’affaire.`)
        : ''),
  },
  {
    id: 'ordres',
    title: 'Les ordres de mission',
    where: ['Opérations', 'Ordres de mission'],
    shots: ['ordres-mission'],
    show: (c) => c.can('mission_order', 'VIEW'),
    body: (c) =>
      p('L’ordre de mission (OM) est la pièce qui autorise le déplacement : numéro, affaire, client, site, équipe, véhicule, dates, objet et consignes HSE.') +
      (c.can('mission_order', 'CREATE')
        ? h3('Émettre un ordre de mission') +
          steps([
            'Ouvrez la fiche de la mission et vérifiez que l’équipe est complète.',
            'Renseignez l’objet, le moyen de transport et les consignes HSE.',
            'Émettez l’ordre : il reçoit son numéro (OM-26-…) et <b>l’équipe se fige</b>.',
          ])
        : '') +
      h3(c.code === 'INSPECTOR' ? 'Signer votre ordre de mission' : 'La signature') +
      steps([
        `Ouvrez ${path('Opérations', 'Ordres de mission')}, puis l’ordre concerné.`,
        `Relisez-le, puis cliquez sur ${btn('Signer l’ordre de mission')}.`,
        'La signature enregistre votre identité, la date et l’heure.',
      ]) +
      warn('Un ordre de mission signé ne se modifie plus. Il est aussi indispensable pour vos frais : une dépense de mission n’est acceptée que si l’ordre est signé.'),
  },
  {
    id: 'planning',
    title: 'Le planning',
    where: ['Opérations', 'Planning'],
    shots: ['planning'],
    show: (c) => c.can('planning', 'VIEW'),
    body: (c) =>
      p('Le planning montre, pour chaque inspecteur et chaque jour, où il se trouve. La colonne « Charge » donne le taux d’occupation sur la période.') +
      list([
        'Une case orange porte le numéro de la mission.',
        '<b>×2</b> : deux interventions le même jour ; le survol détaille chacune et sa part de journée.',
        'Une case en pointillé : journée non affectée.',
        'Une case grise : congé, maladie ou formation.',
      ]) +
      note(`Vous voyez le planning de ${SCOPE_TEXT[c.scope('planning', 'VIEW')]}.`) +
      (c.can('planning', 'UPDATE') ? p('Pour modifier une affectation, ouvrez la mission concernée et ajustez son équipe.') : ''),
  },
  {
    id: 'inspections',
    title: 'Les inspections et les rapports',
    where: ['Opérations', 'Rapports'],
    shots: ['inspection-nouvelle', 'rapports'],
    show: (c) => c.can('report', 'VIEW') || c.can('inspection', 'VIEW'),
    body: (c) =>
      p('Un rapport suit ce parcours : <b>brouillon → soumis → contrôle → validé → émis</b>. Celui qui vérifie n’est jamais celui qui a rédigé.') +
      (c.can('inspection', 'CREATE')
        ? h3('Saisir une inspection') +
          steps([
            `Ouvrez ${path('Opérations', 'Nouvelle inspection')}.`,
            'Choisissez la mission, puis le formulaire correspondant au contrôle réalisé.',
            'Remplissez le formulaire. Le client, l’affaire, le lieu, l’inspecteur et la date viennent de la mission : vous ne les saisissez pas.',
            'Sélectionnez les instruments de mesure utilisés et ajoutez vos photographies.',
            `Cliquez sur ${btn('Enregistrer')} pour garder un brouillon, puis sur ${btn('Soumettre')} quand tout est complet.`,
          ]) +
          warn('Un instrument dont l’étalonnage est périmé à la date de l’essai ne peut pas être sélectionné. Le numéro du rapport est attribué à la soumission.')
        : '') +
      (c.can('report', 'APPROVE')
        ? h3('Vérifier un rapport') +
          steps([
            `Ouvrez ${path('Opérations', 'Rapports')} et filtrez sur les rapports à vérifier.`,
            `Ouvrez le rapport et cliquez sur ${btn('Prendre en charge')}.`,
            'Visez les quatre critères — chacun <b>conforme</b>, <b>non conforme</b> ou <b>sans objet</b> : complétude, étalonnage de l’instrument, cohérence des résultats, visas.',
            'Tous conformes : validez. Un critère non conforme : commentez-le et renvoyez le rapport en correction, avec le motif.',
          ]) +
          refusals([
            ['Vérifier votre propre rapport', 'Le vérificateur doit être différent du rédacteur.'],
            ['Valider avec un critère non conforme', 'La validation est fermée : le rapport repart en correction.'],
            ['Laisser un critère sans verdict', 'La grille est incomplète.'],
            ['Renvoyer en correction sans motif', 'Le motif est obligatoire.'],
          ])
        : '') +
      (c.can('report', 'EXPORT')
        ? h3('Émettre un rapport et enregistrer sa remise') +
          steps([
            'Ouvrez un rapport validé et émettez-le : le PDF est produit, verrouillé et rangé dans la GED.',
            `Quand le client l’a reçu, cliquez sur ${btn('Enregistrer la remise')}.`,
          ]) +
          note('Le délai de remise se compte en jours ouvrés entre la fin de la mission et la remise. Objectif qualité : moins de 21 jours ouvrés.') +
          h3('Corriger un rapport déjà émis') +
          p(`Un rapport émis ne se modifie pas. Cliquez sur ${btn('Réviser le rapport')}, indiquez le motif : le numéro reste le même, l’indice de révision avance, et la version déjà remise reste consultable.`)
        : '') +
      (c.code === 'INSPECTOR'
        ? h3('Quand un rapport revient en correction') +
          p('Le vérificateur indique le critère en cause et son commentaire. Votre saisie redevient modifiable : corrigez, puis soumettez de nouveau. Le rapport garde son numéro.')
        : ''),
  },
  {
    id: 'nc',
    title: 'Les non-conformités',
    where: ['Opérations', 'Non-conformités'],
    shots: ['non-conformites'],
    show: (c) => c.can('non_conformity', 'VIEW'),
    body: (c) =>
      p('Une non-conformité est un écart constaté lors d’une inspection. Parcours : <b>ouverte → affectée → en traitement → preuve fournie → vérification → clôturée</b>.') +
      p('L’échéance dépend de la gravité : 7 jours (critique), 30 (majeure), 60 (mineure), 90 (observation).') +
      (c.can('non_conformity', 'CREATE')
        ? h3('Ouvrir et traiter un écart') +
          steps([
            `Ouvrez ${path('Opérations', 'Non-conformités')} et cliquez sur ${btn('Ouvrir l’écart')} : décrivez ce qui a été constaté et choisissez la gravité.`,
            `${btn('Affecter')} : désignez le responsable du traitement.`,
            `Le responsable clique sur ${btn('Prendre en main')}, mène l’action corrective et joint la preuve (photo, rapport de contre-visite, attestation).`,
            `Il clique sur ${btn('Transmettre à la vérification')}.`,
          ])
        : '') +
      (c.can('non_conformity', 'APPROVE')
        ? h3('Vérifier la levée') +
          p(`Examinez la preuve, puis cliquez sur ${btn('Clôturer l’écart')}, ou sur ${btn('Refuser la levée')} en indiquant ce qui manque.`) +
          warn('Celui qui a traité l’écart ne peut pas le vérifier lui-même.')
        : '') +
      note('Un écart dont l’échéance est passée est signalé « en retard », avec le nombre de jours.'),
  },
  {
    id: 'equipements',
    title: 'Les équipements clients',
    where: ['Opérations', 'Équipements clients'],
    shots: ['equipements'],
    show: (c) => c.can('asset', 'VIEW'),
    body: (c) =>
      p('Le parc contrôlé chez les clients : bacs, ponts roulants, tuyauteries, installations électriques. Chaque équipement porte sa périodicité réglementaire et sa prochaine échéance.') +
      list([
        'Le repère est unique chez un client (deux clients peuvent avoir un « T-401 »).',
        '<b>L’échéance se reporte toute seule</b> à l’émission du rapport : un contrôle du 07/09/2026 sur un équipement à 24 mois reporte l’échéance au 07/09/2028.',
        'La fiche d’un équipement montre son historique d’inspection et ses écarts ouverts.',
      ]) +
      (c.can('asset', 'CREATE') ? p('Vous pouvez créer un équipement : repère, type, client, périodicité et date de mise en service. L’échéance est alors calculée.') : ''),
  },
  {
    id: 'parc',
    title: 'Le parc d’instruments de mesure',
    where: ['Opérations', 'Parc de mesure'],
    shots: ['parc-mesure'],
    show: (c) => c.can('measuring_device', 'VIEW'),
    body: (c) =>
      p('Chaque instrument porte la validité de son étalonnage. <b>Un instrument périmé ne peut plus être sélectionné dans une inspection.</b>') +
      (c.can('measuring_device', 'UPDATE')
        ? h3('Enregistrer un étalonnage') +
          steps([
            `Ouvrez ${path('Opérations', 'Parc de mesure')}, puis la fiche de l’instrument.`,
            `Au départ au laboratoire, cliquez sur ${btn('Envoyer au laboratoire')} : l’instrument n’est plus proposé à la saisie.`,
            'Au retour, saisissez le n° de certificat, le laboratoire, la date, l’échéance et le résultat, et joignez le certificat scanné.',
            `Cliquez sur ${btn('Enregistrer le certificat')}.`,
          ]) +
          warn('Enregistrer un certificat conforme est le seul geste qui rend un instrument périmé utilisable. Un résultat non conforme sort l’instrument du service.')
        : p('Vous consultez l’état du parc : instruments valides, à étalonner sous 30 jours et périmés.')),
  },
  {
    id: 'attachements',
    title: 'Les attachements',
    where: ['Finance', 'Attachements'],
    shots: ['attachements'],
    show: (c) => c.can('attachment', 'VIEW'),
    body: (c) =>
      p('L’attachement est la pièce que le client <b>signe</b> : il reconnaît le travail réalisé. Sans lui, une facture ne peut pas être établie.') +
      p('Seules entrent dans un attachement les journées <b>visées</b>, <b>facturables</b> et <b>pas encore attachées</b>.') +
      (c.can('attachment', 'CREATE')
        ? h3('Préparer un attachement') +
          steps([
            `Ouvrez ${path('Finance', 'Attachements')} et cliquez sur ${btn('Préparer un attachement')}.`,
            'Choisissez l’affaire et la période (du… au…).',
            'L’écran montre, par mission, le temps passé et la quantité à facturer selon le bon de commande. Ajustez le prix ou la quantité si nécessaire.',
            'Créez l’attachement : il reçoit son numéro (ATT-26-…).',
            `Cliquez sur ${btn('Transmettre au client')}, puis sur ${btn('Signé par le client')} à son retour.`,
          ]) +
          refusals([
            ['À l’unité, sans nombre d’équipements', 'Indiquez le nombre d’équipements contrôlés.'],
            ['Une ligne sans prix', 'Prix unitaire manquant : renseignez le bon de commande ou saisissez-le ici.'],
          ])
        : p(`Vous consultez les attachements de ${SCOPE_TEXT[c.scope('attachment', 'VIEW')]} et leur état.`)) +
      (c.can('attachment', 'APPROVE') && !c.can('attachment', 'CREATE') ? p('Vous validez les attachements soumis avant leur facturation.') : ''),
  },
  {
    id: 'factures',
    title: 'Les factures, les avoirs et les règlements',
    where: ['Finance', 'Factures'],
    shots: ['factures', 'facture-fiche'],
    show: (c) => c.can('invoice', 'VIEW'),
    body: (c) =>
      p('Une facture reprend un ou plusieurs attachements signés du même client. Parcours : <b>brouillon → émise → partiellement réglée → réglée</b>. Une facture non soldée devient « échue » le lendemain de son échéance.') +
      (c.can('invoice', 'CREATE')
        ? h3('Établir et émettre une facture') +
          steps([
            `Ouvrez ${path('Finance', 'Attachements')} et repérez les attachements « prêts à facturer ».`,
            'Créez la facture à partir des attachements signés : elle reprend la quantité et l’unité de chaque ligne. La TVA est de 20 % par défaut.',
            `Sur la fiche de la facture, cliquez sur ${btn('Émettre la facture')} : l’échéance commence à courir (date d’émission + délai de règlement du client).`,
          ])
        : '') +
      (c.can('invoice', 'APPROVE')
        ? h3('Émettre un avoir') +
          p('Une facture émise ne se modifie jamais. Une erreur de quantité, un geste commercial ou une annulation se corrigent par un avoir.') +
          steps([
            `Sur la fiche de la facture, dans « Avoirs », cliquez sur ${btn('Émettre un avoir')}.`,
            'Saisissez le montant HT (le TTC s’affiche) ou cliquez sur « Tout le montant restant » pour annuler la facture.',
            'Indiquez le motif (obligatoire) et validez : l’avoir reçoit son numéro (AV-26-…).',
          ]) +
          note('L’avoir est déduit partout : chiffre facturé, reste dû, créances, rentabilité. Il ne peut pas dépasser ce que le client doit encore.')
        : '') +
      (c.can('payment', 'CREATE')
        ? h3('Enregistrer un règlement') +
          steps([
            `Sur la fiche de la facture, cliquez sur ${btn('Enregistrer un règlement')}.`,
            'Saisissez le montant TTC, la date, le moyen (virement, chèque, effet, espèces, carte) et la référence bancaire.',
            'Validez : le reste dû et le statut se mettent à jour.',
          ]) +
          refusals([
            ['Un règlement supérieur au reste dû', 'Le règlement dépasse le solde — vérifiez l’imputation.'],
            ['Un règlement sur une facture non émise', 'Une facture non émise ne s’encaisse pas.'],
          ])
        : '') +
      (!c.can('invoice', 'CREATE') && !c.can('invoice', 'APPROVE') && !c.can('payment', 'CREATE')
        ? p(`Vous consultez les factures de ${SCOPE_TEXT[c.scope('invoice', 'VIEW')]} : montant, échéance, reste dû et règlements.`)
        : ''),
  },
  {
    id: 'encaissements',
    title: 'Les encaissements et les créances',
    where: ['Finance', 'Encaissements'],
    shots: ['encaissements'],
    show: (c) => c.can('payment', 'VIEW'),
    body: () =>
      p('Cette page donne l’état des créances clients à ce jour.') +
      list([
        '<b>Reste à encaisser</b> : total des factures émises non soldées, avoirs déduits.',
        '<b>Taux de recouvrement</b> : encaissé ÷ facturé.',
        '<b>Délai moyen de paiement</b> (DSO), en jours.',
        '<b>Balance âgée</b> : non échu, 1–30 jours, 31–60, 61–90, plus de 90 jours.',
        'La liste des factures ouvertes, les plus en retard en premier, et le total par client.',
      ]),
  },
  {
    id: 'frais',
    title: 'Les notes de frais',
    where: ['Finance', 'Notes de frais'],
    shots: ['notes-frais'],
    show: (c) => c.can('expense_report', 'VIEW'),
    body: (c) =>
      p('Circuit d’une note : <b>saisie → soumise → confirmée (responsable) → contrôlée (RH / contrôle de gestion) → comptabilisée → approuvée (Direction) → bon à payer → payée</b>. Le règlement intervient le 15 du mois.') +
      (c.can('expense_report', 'CREATE')
        ? h3(c.code === 'CONTROLLER_ASSISTANT' ? 'Saisir une note de frais' : 'Saisir votre note de frais') +
          steps([
            `Ouvrez ${path('Finance', 'Notes de frais')} et ouvrez la note du mois (mois et type de note). Il y a une seule note par personne, par mois et par type.`,
            'Pour chaque dépense : date, nature, mission concernée, montant, mode de règlement et libellé.',
            'Joignez le justificatif quand la nature de la dépense l’exige.',
            `Cliquez sur ${btn('Ajouter la dépense')}. Répétez pour chaque dépense.`,
            `Quand la note est complète, cliquez sur ${btn('Transmettre au visa')}.`,
          ]) +
          `<table class="grid"><thead><tr><th>Dépense</th><th>Plafond</th></tr></thead><tbody>
            <tr><td>Indemnité de déplacement</td><td>100 DH par jour</td></tr>
            <tr><td>Hébergement</td><td>150 DH par nuitée (accord préalable)</td></tr>
            <tr><td>Véhicule personnel</td><td>100 DH par jour (accord préalable)</td></tr>
            <tr><td>Lavage</td><td>100 DH par mois</td></tr>
            <tr><td>Achats exceptionnels</td><td>300 DH par mois</td></tr></tbody></table>` +
          note('Les plafonds ne bloquent pas : un dépassement est accepté s’il est justifié. La justification est alors obligatoire et reste visible.') +
          refusals([
            ['Une dépense hors du mois de la note', 'La dépense n’appartient pas au mois.'],
            ['Un frais de mission sans mission', 'Un frais de mission porte sa mission.'],
            ['Une mission dont l’ordre n’est pas signé', 'La réalité du déplacement ne peut pas être établie.'],
            ['Même date, même nature, même montant', 'Une dépense identique existe déjà.'],
            ['Un justificatif manquant', 'Justificatif obligatoire.'],
          ]) +
          warn('Saisissez votre note au plus tard le 3 du mois suivant.')
        : '') +
      (c.can('expense_report', 'APPROVE') && EXPENSE_STEP[c.code]
        ? h3('Votre étape dans le circuit') +
          p(`<b>Étape ${EXPENSE_STEP[c.code][0]}.</b> ${EXPENSE_STEP[c.code][1]}`) +
          steps([
            `Ouvrez ${path('Finance', 'Notes de frais')} : les notes qui attendent votre visa sont signalées.`,
            'Ouvrez une note et contrôlez chaque ligne : justificatif, plafond, imputation.',
            `Cliquez sur ${btn('Viser')} pour la faire avancer, ou sur ${btn('Rejeter')} en indiquant le motif.`,
            c.code === 'RAF' ? `Au bon à payer, cliquez sur ${btn('Confirmer le règlement')} : les avances en cours de l’intéressé sont déduites d’abord.` : null,
          ]) +
          warn('Vous ne pouvez pas viser votre propre note. Un rejet rend la note modifiable par son auteur.')
        : ''),
  },
  {
    id: 'avances',
    title: 'Les avances sur frais',
    where: ['Finance', 'Avances'],
    shots: ['avances'],
    show: (c) => c.can('advance', 'VIEW'),
    body: (c) =>
      p('Une avance est de l’argent versé avant justificatif. Elle est ensuite retenue sur les notes de frais de l’intéressé, de la plus ancienne à la plus récente. Parcours : <b>demandée → accordée → versée → soldée</b>.') +
      (c.can('advance', 'CREATE') ? p(`<b>Enregistrer une demande</b> : dans ${path('Finance', 'Avances')}, saisissez le bénéficiaire, l’affaire, le montant et le motif.`) : '') +
      (c.can('advance', 'APPROVE') ? p('<b>Accorder ou refuser</b> : ouvrez la demande et accordez-la, ou refusez-la avec un motif.') : '') +
      (c.code === 'INSPECTOR' ? p('Vous consultez vos avances et ce qu’il en reste à retenir.') : '') +
      refusals([
        ['Une seconde avance alors que la première n’est pas soldée', 'On n’avance pas deux fois sans avoir récupéré.'],
        ['Accorder une avance que vous avez enregistrée', 'Elle doit être accordée par quelqu’un d’autre.'],
        ['Refuser sans motif', 'Un refus doit être motivé.'],
      ]),
  },
  {
    id: 'virements',
    title: 'Les ordres de virement',
    where: ['Finance', 'Ordres de virement'],
    shots: ['virements'],
    show: (c) => c.can('payment_batch', 'VIEW'),
    body: (c) =>
      p('Un ordre de virement regroupe les notes de frais « bon à payer » en un seul lot destiné à la banque.') +
      (c.can('payment_batch', 'CREATE')
        ? steps([
            `Ouvrez ${path('Finance', 'Ordres de virement')} et cliquez sur ${btn('Créer le lot')}.`,
            'Vérifiez que chaque bénéficiaire a ses coordonnées bancaires (banque et RIB sur la fiche employé).',
          ])
        : '') +
      (c.can('payment_batch', 'APPROVE') ? p(`Vous validez le lot avec ${btn('Valider le lot')}, puis ${btn('Exécuter le virement')} une fois le virement passé en banque.`) : '') +
      warn('Un bénéficiaire sans RIB est signalé « Banque non renseignée » : complétez sa fiche employé avant de créer le lot.'),
  },
  {
    id: 'controle',
    title: 'Le contrôle de gestion et la rentabilité',
    where: ['Finance', 'Contrôle de gestion'],
    shots: ['controle-gestion', 'rentabilite'],
    show: (c) => c.can('controlling', 'VIEW'),
    body: (c) =>
      p(`Deux pages : ${path('Finance', 'Contrôle de gestion')} pour les affaires en cours, et ${path('Pilotage', 'Rentabilité')} pour la marge de toutes les affaires gagnées.`) +
      h3('Ce que les chiffres veulent dire') +
      `<table class="grid"><thead><tr><th>Terme</th><th>Définition</th></tr></thead><tbody>
        <tr><td>Coût réel</td><td>Journées pointées au coût du jour, frais acceptés, véhicule des missions faites, sous-traitance dont la facture est reçue.</td></tr>
        <tr><td>Coût engagé</td><td>Missions à venir et commandes passées aux fournisseurs.</td></tr>
        <tr><td>Coût à terminaison</td><td>Réel + engagé : ce que l’affaire coûtera une fois finie.</td></tr>
        <tr><td>Marge brute</td><td>Chiffre facturé − coûts réels.</td></tr>
        <tr><td>Marge à terminaison</td><td>Montant du marché − coût à terminaison.</td></tr></tbody></table>` +
      note('La même marge s’affiche sur la fiche affaire, dans la liste des affaires, en Rentabilité et au contrôle de gestion.') +
      h3('Les anomalies à traiter') +
      list([
        '<b>Critique</b> — une journée portée par deux attachements : elle serait facturée deux fois.',
        '<b>Critique</b> — du travail fait depuis plus de 45 jours et jamais attaché : il ne sera jamais facturé.',
        'À surveiller — mission terminée sans pointage, frais accepté sans affaire, affaire sans budget, pointage après clôture, facture sans attachement.',
      ]) +
      p('Une alerte se déclenche quand le coût à terminaison dépasse le budget de plus de 10 %.') +
      note(`Vous voyez les affaires de ${SCOPE_TEXT[c.scope('controlling', 'VIEW')]}.`),
  },
  {
    id: 'employes',
    title: 'Les employés',
    where: ['Ressources', 'Employés'],
    shots: ['employes'],
    show: (c) => c.can('employee', 'VIEW'),
    body: (c) =>
      (c.code === 'INSPECTOR'
        ? p('Vous consultez votre propre fiche : fonction, département, coordonnées et coordonnées bancaires.')
        : p(`Vous consultez les fiches des employés de ${SCOPE_TEXT[c.scope('employee', 'VIEW')]} : fonction, département, responsable, contrat.`)) +
      (c.can('employee', 'CREATE')
        ? h3('Créer des employés') +
          steps([
            `Ouvrez ${path('Ressources', 'Employés')}.`,
            `Pour un import en masse, cliquez sur ${btn('Importer Excel')} : téléchargez le modèle, remplissez-le, puis importez-le.`,
            'Un matricule déjà connu est ignoré : une fiche existante n’est jamais écrasée.',
          ])
        : '') +
      (c.can('employee', 'UPDATE') ? p('Sur une fiche, vous pouvez renseigner la banque et le RIB : c’est ce qui figurera sur l’ordre de virement.') : '') +
      (c.can('daily_cost', 'UPDATE')
        ? h3('Mettre à jour un coût journalier') +
          p('Le coût journalier est le coût complet d’une journée de travail (salaire et charges). Chaque journée est toujours valorisée au coût en vigueur à sa date.') +
          steps([
            `Sur la fiche de l’employé, dans « Coût journalier », cliquez sur ${btn('Nouveau coût')}.`,
            'Saisissez le montant, la date d’effet et le motif (obligatoire).',
            'Enregistrez : une nouvelle période s’ouvre, l’ancienne se ferme la veille. Rien n’est effacé.',
          ]) +
          h3('Mettre à jour tous les coûts par Excel') +
          steps([
            `Dans ${path('Ressources', 'Employés')}, cliquez sur ${btn('Mettre à jour les coûts')}.`,
            'Téléchargez le modèle : il liste chaque employé avec son coût actuel.',
            'Remplissez « Nouveau coût journalier » et « Date d’effet » pour ceux qui changent ; laissez les autres lignes vides.',
            'Choisissez le fichier : un aperçu montre l’ancien et le nouveau coût, sans rien enregistrer.',
            'S’il n’y a aucune erreur, cliquez sur « Enregistrer ». Tout est enregistré d’un coup, ou rien.',
          ]) +
          note('Un coût antidaté recalcule les journées déjà pointées depuis sa date d’effet. Seules les journées d’un mois clôturé gardent l’ancien coût.')
        : c.can('daily_cost', 'VIEW')
          ? note('Vous voyez le coût journalier des employés, sans pouvoir le modifier.')
          : c.code !== 'INSPECTOR'
            ? note('Le coût journalier n’apparaît pas pour votre profil : il est réservé à la Direction, aux RH et au contrôle de gestion.')
            : ''),
  },
  {
    id: 'pointage',
    title: 'Le pointage',
    where: ['Ressources', 'Pointage'],
    shots: ['pointage', 'productivite'],
    show: (c) => c.can('timesheet', 'VIEW'),
    body: (c) =>
      p('<b>Le pointage se déduit du planning, il ne se déclare pas.</b> Une journée affectée à une mission est pointée sur cette mission ; un congé accordé devient une journée d’absence. Ce qui reste est une « journée non affectée ».') +
      (c.code === 'INSPECTOR'
        ? h3('Vérifier votre pointage') +
          steps([
            `Ouvrez ${path('Ressources', 'Pointage')} : votre semaine s’affiche, jour par jour.`,
            'Une journée à deux interventions affiche ½ pour chacune.',
            `Si le terrain a démenti le planning (intempéries, attente sur site…), cliquez sur ${btn('Corriger')} et choisissez la bonne catégorie.`,
          ])
        : '') +
      (c.can('timesheet', 'UPDATE') && c.code !== 'INSPECTOR'
        ? h3('Corriger une journée') +
          p(`Sur la semaine d’un intervenant, cliquez sur ${btn('Corriger')} : intervention facturable ou non, attente sur site, intempéries, formation, congé, maladie, journée non affectée. Une journée corrigée à la main n’est plus régénérée.`)
        : '') +
      (c.can('timesheet', 'APPROVE')
        ? h3('Déduire et viser le mois') +
          steps([
            `Ouvrez ${path('Ressources', 'Pointage')} et choisissez le mois.`,
            `Cliquez sur ${btn('Déduire du planning')} pour (re)calculer le pointage. Les journées corrigées ou déjà visées ne sont pas touchées.`,
            'Contrôlez chaque intervenant.',
            `Cliquez sur ${btn('Viser le mois')}.`,
          ]) +
          warn('Un mois visé ne se reprend plus, et seules les journées visées peuvent être facturées. Vous ne pouvez pas viser votre propre pointage.')
        : '') +
      (c.code !== 'INSPECTOR'
        ? h3('Lire la productivité') +
          p(`Dans ${path('Pilotage', 'Productivité')} : productivité nette = jours facturés sur attachements validés ÷ (jours ouvrés − congés, maladie, formation). Un jour travaillé mais pas encore attaché ne compte pas : il apparaît dans « jours travaillés non valorisés ».`)
        : ''),
  },
  {
    id: 'conges',
    title: 'Les congés',
    where: ['Ressources', 'Congés'],
    shots: ['conges'],
    show: (c) => c.can('leave', 'VIEW'),
    body: (c) =>
      (c.can('leave', 'CREATE')
        ? h3(c.code === 'INSPECTOR' ? 'Demander un congé' : 'Enregistrer une demande') +
          steps([
            `Ouvrez ${path('Ressources', 'Congés')}.`,
            'Choisissez la nature, les dates (du… au…) et le motif.',
            `Cliquez sur ${btn('Transmettre la demande')}.`,
          ]) +
          note(`Le nombre de jours n’est pas saisi : il est compté sur le calendrier de la société, jours fériés exclus. Tant que la demande n’est pas tranchée, vous pouvez la retirer (${btn('Retirer')}).`)
        : '') +
      (c.can('leave', 'APPROVE')
        ? h3('Accorder ou refuser') +
          p(`Ouvrez la demande et cliquez sur ${btn('Accorder')}, ou refusez-la avec un motif. Une mission planifiée pendant l’absence est signalée : à vous d’arbitrer.`) +
          warn('Vous ne pouvez pas vous accorder un congé à vous-même. Un congé accordé se répercute seul sur le pointage.')
        : ''),
  },
  {
    id: 'habilitations',
    title: 'Les habilitations',
    where: ['Ressources', 'Habilitations'],
    shots: ['habilitations'],
    show: (c) => c.can('certification', 'VIEW'),
    body: (c) =>
      p('Une habilitation périmée <b>empêche d’affecter</b> son titulaire à une mission de la méthode concernée. Une habilitation à moins de 60 jours de son terme est signalée.') +
      (c.can('certification', 'CREATE')
        ? steps([
            `Ouvrez ${path('Ressources', 'Habilitations')}.`,
            'Saisissez le titulaire, le type, la méthode, le niveau, l’organisme, le n° de certificat, la date de délivrance et l’échéance.',
            'Joignez le certificat scanné, puis enregistrez.',
          ]) + note('Enregistrer le renouvellement est le seul geste qui rouvre l’affectation.')
        : p(c.code === 'INSPECTOR' ? 'Vous consultez vos habilitations et leurs échéances. Prévenez les RH avant l’échéance.' : 'Vous consultez les habilitations et leurs échéances.')),
  },
  {
    id: 'flotte',
    title: 'La flotte',
    where: ['Ressources', 'Flotte'],
    shots: ['flotte'],
    show: (c) => c.can('vehicle', 'VIEW'),
    body: (c) =>
      p('Chaque véhicule porte son assurance, son compteur et ses entretiens. <b>Un véhicule sans assurance en cours reste hors service.</b>') +
      (c.can('vehicle', 'UPDATE')
        ? list([
            `<b>Assurance</b> : assureur, n° de police, dates de validité et prime, puis ${btn('Enregistrer la police')}.`,
            `<b>Entretien</b> : date, garage, nature, compteur et coût, puis ${btn('Enregistrer l’entretien')}. Le relevé du garage met le compteur à jour.`,
          ]) +
          refusals([
            ['Une immatriculation déjà enregistrée', 'Une plaque ne se dédouble pas.'],
            ['Un compteur inférieur au compteur actuel', 'Une saisie inférieure est une faute de frappe.'],
            ['Un entretien daté dans le futur', 'Un entretien ne se date pas dans le futur.'],
          ])
        : p('Vous consultez les véhicules, leur disponibilité et leurs échéances.')),
  },
  {
    id: 'ged',
    title: 'Les documents (GED)',
    where: ['Documents'],
    shots: ['ged'],
    show: (c) => c.can('document', 'VIEW'),
    body: (c) =>
      p('La GED rassemble les pièces produites par l’application : rapports émis, certificats d’étalonnage, habilitations, justificatifs de frais, preuves de levée.') +
      list([
        'Chaque document est rattaché à son dossier (affaire, mission, instrument, employé…).',
        'Une nouvelle version ne remplace pas la précédente : l’historique reste consultable.',
        'Chaque téléchargement est enregistré dans le journal d’audit.',
      ]) +
      note(`Vous voyez les documents de ${SCOPE_TEXT[c.scope('document', 'VIEW')]}.`) +
      (c.can('document', 'CREATE') ? p('Vous pouvez déposer un document et le rattacher à son dossier.') : ''),
  },
  {
    id: 'admin',
    title: 'Les paramètres',
    where: ['Paramètres'],
    shots: ['utilisateurs', 'roles', 'referentiels', 'templates', 'audit'],
    show: (c) => c.can('user', 'VIEW') || c.can('role', 'VIEW') || c.can('setting', 'VIEW') || c.can('inspection_template', 'VIEW') || c.can('audit', 'VIEW'),
    body: (c) =>
      p('Le menu « Paramètres », en bas du menu latéral, regroupe l’administration.') +
      (c.can('user', 'CREATE')
        ? h3('Créer un compte utilisateur') +
          steps([
            `Ouvrez ${path('Paramètres', 'Utilisateurs')}.`,
            'Saisissez l’adresse e-mail, rattachez l’employé, choisissez le rôle et, pour un chef de département, son département.',
            'Créez le compte : un mot de passe provisoire est attribué. L’utilisateur devra le changer à sa première connexion.',
          ]) +
          h3('Redéfinir un mot de passe ou débloquer un compte') +
          p('Sur la fiche de l’utilisateur, redéfinissez son mot de passe : il devra le changer à sa prochaine connexion. Un compte bloqué après 5 tentatives se débloque seul au bout de 15 minutes.') +
          warn('Ne communiquez jamais un mot de passe par courriel ou par messagerie de groupe. Transmettez le mot de passe provisoire directement à la personne.')
        : c.can('user', 'VIEW')
          ? p(`${path('Paramètres', 'Utilisateurs')} : vous consultez les comptes et leurs rôles.`)
          : '') +
      (c.can('role', 'VIEW') ? p(`${path('Paramètres', 'Rôles & droits')} : la matrice des droits de chaque rôle, module par module.`) : '') +
      (c.can('setting', 'VIEW') ? p(`${path('Paramètres', 'Référentiels')} : départements, catégories de frais et leurs plafonds, calendrier ouvré, délais des non-conformités.`) : '') +
      (c.can('inspection_template', 'VIEW')
        ? p(`${path('Paramètres', 'Templates d’inspection')} : les 61 modèles de formulaires du référentiel qualité.` + (c.can('inspection_template', 'UPDATE') ? ' Vous pouvez les modifier et les publier : seuls les modèles publiés sont proposés à la saisie.' : ''))
        : '') +
      (c.can('audit', 'VIEW') ? p(`${path('Paramètres', 'Audit')} : le journal de toutes les actions — qui a fait quoi, quand, avec l’ancienne et la nouvelle valeur.`) : ''),
  },
];

/** Tableau des droits : les ressources regroupées par domaine. */
export const RIGHTS_GROUPS = [
  ['Commercial', [['client', 'Clients'], ['opportunity', 'Consultations'], ['offer', 'Offres']]],
  ['Affaires', [['affair', 'Affaires'], ['controlling', 'Contrôle de gestion']]],
  ['Opérations', [['mission', 'Missions'], ['mission_order', 'Ordres de mission'], ['planning', 'Planning'], ['inspection', 'Inspections'], ['report', 'Rapports'], ['non_conformity', 'Non-conformités'], ['asset', 'Équipements clients'], ['measuring_device', 'Instruments de mesure']]],
  ['Finance', [['attachment', 'Attachements'], ['invoice', 'Factures'], ['payment', 'Règlements'], ['expense_report', 'Notes de frais'], ['advance', 'Avances'], ['payment_batch', 'Ordres de virement']]],
  ['Ressources', [['employee', 'Employés'], ['daily_cost', 'Coûts journaliers'], ['timesheet', 'Pointage'], ['leave', 'Congés'], ['certification', 'Habilitations'], ['vehicle', 'Flotte']]],
  ['Transverse', [['document', 'Documents'], ['dashboard', 'Vue d’ensemble'], ['audit', 'Journal d’audit'], ['user', 'Utilisateurs'], ['setting', 'Référentiels']]],
];

export const FAQ = (c) => [
  ['Je ne vois pas un menu dont parle un collègue.', 'C’est normal : le menu est construit d’après vos droits. Une rubrique à laquelle vous n’avez pas accès n’apparaît pas.'],
  ['La recherche ne trouve pas un dossier que je sais exister.', 'La recherche ne montre que ce qui est dans votre périmètre. Si le dossier devrait y être, demandez à l’administrateur de vérifier votre rattachement.'],
  ['J’ai oublié mon mot de passe, ou mon compte est bloqué.', 'Après 5 tentatives, le compte est bloqué 15 minutes puis se débloque seul. Pour un mot de passe oublié, contactez l’administrateur : il vous en attribuera un provisoire.'],
  ['Un bouton décrit dans ce guide n’apparaît pas.', 'Un bouton n’apparaît que lorsque l’action est possible : le bon statut du dossier et le bon droit. Vérifiez l’état du dossier.'],
  ['L’application refuse mon action avec un message.', 'Le message dit pourquoi et quoi corriger. Les refus les plus courants sont listés dans chaque chapitre.'],
  c.can('timesheet', 'VIEW') ? ['Une journée affiche ½.', 'Deux interventions le même jour se partagent la journée à parts égales. Le total de la journée reste 1.'] : null,
  ['Je vois un badge « Démo ».', 'Il indique que la base contient des données de démonstration : clients, montants et personnes sont fictifs.'],
].filter(Boolean);
