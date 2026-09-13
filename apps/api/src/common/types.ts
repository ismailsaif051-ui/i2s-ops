import type { Action, Resource, Scope } from '@i2s/contracts';

export interface EffectivePermission {
  resource: Resource;
  action: Action;
  scope: Scope;
}

/** Identité résolue à chaque requête authentifiée. */
export interface RequestUser {
  id: string;
  email: string;
  employeeId: string | null;
  /** Départements sur lesquels l'utilisateur a une habilitation ou qu'il dirige. */
  departmentIds: string[];
  /** Sociétés sur lesquelles l'utilisateur est habilité. */
  companyIds: string[];
  /** Employés dont l'utilisateur est le manager (périmètre TEAM). */
  teamEmployeeIds: string[];
  roleCodes: string[];
  permissions: EffectivePermission[];
  mustChangePassword: boolean;
}

/**
 * Décrit, pour une ressource donnée, les colonnes qui portent le périmètre.
 * Sans descripteur, un périmètre restreint provoque un refus plutôt qu'une
 * fuite de données : c'est volontaire.
 */
export interface ScopeDescriptor {
  /** Colonne portant la société, ex. `companyId` ou `affair.companyId`. */
  companyPath?: string;
  /** Colonne portant le département. */
  departmentPath?: string;
  /** Colonne portant l'employé propriétaire (périmètre OWN). */
  ownerPath?: string;
  /** Colonne portant l'employé responsable (périmètre TEAM). */
  teamPath?: string;
}
