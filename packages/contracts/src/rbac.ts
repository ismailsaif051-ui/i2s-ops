/**
 * Vocabulaire RBAC partagé entre l'API et l'interface.
 * Source unique : docs/04-RBAC.md
 */

export const ACTIONS = [
  'VIEW',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'EXPORT',
  'DOWNLOAD',
] as const;
export type Action = (typeof ACTIONS)[number];

export const SCOPES = ['ALL', 'COMPANY', 'DEPARTMENT', 'TEAM', 'OWN'] as const;
export type Scope = (typeof SCOPES)[number];

/** Du plus large au plus étroit. Un périmètre plus large englobe les suivants. */
export const SCOPE_RANK: Record<Scope, number> = {
  ALL: 0,
  COMPANY: 1,
  DEPARTMENT: 2,
  TEAM: 3,
  OWN: 4,
};

export const RESOURCES = [
  'client', 'contact', 'opportunity', 'tender', 'offer',
  'affair', 'project', 'site',
  'mission', 'mission_order', 'planning',
  'employee', 'daily_cost', 'timesheet', 'leave', 'certification',
  'inspection', 'inspection_template', 'report', 'asset', 'measuring_device', 'non_conformity',
  'attachment', 'invoice', 'payment', 'expense_report', 'advance',
  'vehicle', 'controlling', 'document', 'dashboard', 'audit',
  'user', 'role', 'setting',
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ROLE_CODES = [
  'ADMIN',
  'DG',
  'DEPT_HEAD',
  'CONTROLLER',
  'RAF',
  'HR',
  'BILLING',
  'CONTROLLER_ASSISTANT',
  'ACCOUNT_MANAGER',
  'SALES',
  'INSPECTOR',
  'DOC_CONTROLLER',
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_LABELS: Record<RoleCode, string> = {
  ADMIN: 'Administrateur',
  DG: 'Direction Générale',
  DEPT_HEAD: 'Chef de Département',
  CONTROLLER: 'Contrôle de Gestion',
  RAF: 'Responsable Administratif & Financier',
  HR: 'Ressources Humaines',
  BILLING: 'Responsable Facturation',
  CONTROLLER_ASSISTANT: 'Assistante Contrôle de Gestion',
  ACCOUNT_MANAGER: "Chargé d'Affaires",
  SALES: 'Représentant Technico-Commercial',
  INSPECTOR: 'Inspecteur',
  DOC_CONTROLLER: 'Document Controller',
};

/** Droit effectif d'un utilisateur, tel que renvoyé par `GET /auth/me`. */
export interface EffectivePermission {
  resource: Resource;
  action: Action;
  scope: Scope;
}

export function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/**
 * Vérifie qu'un utilisateur détient un droit, et renvoie le périmètre le plus
 * large qu'il possède pour ce couple ressource/action.
 */
export function resolveScope(
  permissions: readonly EffectivePermission[],
  resource: Resource,
  action: Action,
): Scope | null {
  let best: Scope | null = null;
  for (const p of permissions) {
    if (p.resource !== resource || p.action !== action) continue;
    if (best === null || SCOPE_RANK[p.scope] < SCOPE_RANK[best]) best = p.scope;
  }
  return best;
}

export function can(
  permissions: readonly EffectivePermission[],
  resource: Resource,
  action: Action,
): boolean {
  return resolveScope(permissions, resource, action) !== null;
}
