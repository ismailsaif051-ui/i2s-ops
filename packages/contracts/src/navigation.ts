/**
 * Sitemap applicatif. Le menu est CONSTRUIT à partir des permissions
 * (docs/06-SITEMAP-UX.md §2) : une entrée dont le droit manque n'est pas
 * grisée, elle est absente.
 */
import type { Action, Resource } from './rbac';

export interface NavItem {
  href: string;
  label: string;
  /** Droit requis pour voir l'entrée. Absent = toujours visible. */
  requires?: { resource: Resource; action: Action };
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    key: 'pilotage',
    label: 'Pilotage',
    items: [
      { href: '/cockpit', label: 'Cockpit', requires: { resource: 'dashboard', action: 'VIEW' } },
      { href: '/pilotage/productivite', label: 'Productivité', requires: { resource: 'timesheet', action: 'VIEW' } },
      { href: '/pilotage/jours-non-affectes', label: 'Jours non affectés', requires: { resource: 'timesheet', action: 'VIEW' } },
      { href: '/pilotage/rentabilite', label: 'Rentabilité', requires: { resource: 'controlling', action: 'VIEW' } },
      { href: '/pilotage/qualite', label: 'Qualité', requires: { resource: 'report', action: 'VIEW' } },
    ],
  },
  {
    key: 'commercial',
    label: 'Commercial',
    items: [
      { href: '/commercial/clients', label: 'Clients', requires: { resource: 'client', action: 'VIEW' } },
      { href: '/commercial/consultations', label: "Consultations & appels d'offres", requires: { resource: 'opportunity', action: 'VIEW' } },
      { href: '/commercial/offres', label: 'Offres', requires: { resource: 'offer', action: 'VIEW' } },
    ],
  },
  {
    key: 'affaires',
    label: 'Affaires',
    items: [
      { href: '/affaires', label: 'Affaires', requires: { resource: 'affair', action: 'VIEW' } },
      { href: '/affaires/projets', label: 'Projets & sites', requires: { resource: 'project', action: 'VIEW' } },
    ],
  },
  {
    key: 'operations',
    label: 'Opérations',
    items: [
      { href: '/operations/missions', label: 'Missions', requires: { resource: 'mission', action: 'VIEW' } },
      { href: '/operations/ordres-mission', label: 'Ordres de mission', requires: { resource: 'mission_order', action: 'VIEW' } },
      { href: '/operations/planning', label: 'Planning', requires: { resource: 'planning', action: 'VIEW' } },
      { href: '/operations/inspections/nouvelle', label: 'Nouvelle inspection', requires: { resource: 'inspection', action: 'CREATE' } },
      { href: '/operations/rapports', label: 'Rapports', requires: { resource: 'report', action: 'VIEW' } },
      { href: '/operations/non-conformites', label: 'Non-conformités', requires: { resource: 'non_conformity', action: 'VIEW' } },
      { href: '/operations/equipements', label: 'Équipements clients', requires: { resource: 'asset', action: 'VIEW' } },
      { href: '/operations/parc-mesure', label: 'Parc de mesure', requires: { resource: 'measuring_device', action: 'VIEW' } },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    items: [
      { href: '/finance/attachements', label: 'Attachements', requires: { resource: 'attachment', action: 'VIEW' } },
      { href: '/finance/factures', label: 'Factures', requires: { resource: 'invoice', action: 'VIEW' } },
      { href: '/finance/encaissements', label: 'Encaissements', requires: { resource: 'payment', action: 'VIEW' } },
      { href: '/finance/notes-de-frais', label: 'Notes de frais', requires: { resource: 'expense_report', action: 'VIEW' } },
      { href: '/finance/virements', label: 'Ordres de virement', requires: { resource: 'payment_batch', action: 'VIEW' } },
      { href: '/finance/avances', label: 'Avances', requires: { resource: 'advance', action: 'VIEW' } },
      { href: '/finance/controle-de-gestion', label: 'Contrôle de gestion', requires: { resource: 'controlling', action: 'VIEW' } },
    ],
  },
  {
    key: 'ressources',
    label: 'Ressources',
    items: [
      { href: '/ressources/employes', label: 'Employés', requires: { resource: 'employee', action: 'VIEW' } },
      { href: '/ressources/pointage', label: 'Pointage', requires: { resource: 'timesheet', action: 'VIEW' } },
      { href: '/ressources/conges', label: 'Congés', requires: { resource: 'leave', action: 'VIEW' } },
      {
        href: '/ressources/habilitations',
        label: 'Habilitations',
        requires: { resource: 'certification', action: 'VIEW' },
      },
      { href: '/ressources/flotte', label: 'Flotte', requires: { resource: 'vehicle', action: 'VIEW' } },
    ],
  },
  {
    key: 'ged',
    label: 'Documents',
    items: [{ href: '/ged', label: 'GED', requires: { resource: 'document', action: 'VIEW' } }],
  },
  {
    key: 'admin',
    label: 'Administration',
    items: [
      { href: '/administration/utilisateurs', label: 'Utilisateurs', requires: { resource: 'user', action: 'VIEW' } },
      { href: '/administration/roles', label: 'Rôles & droits', requires: { resource: 'role', action: 'VIEW' } },
      { href: '/administration/referentiels', label: 'Référentiels', requires: { resource: 'setting', action: 'VIEW' } },
      { href: '/administration/templates', label: "Templates d'inspection", requires: { resource: 'inspection_template', action: 'VIEW' } },
      { href: '/administration/audit', label: 'Audit', requires: { resource: 'audit', action: 'VIEW' } },
    ],
  },
];
