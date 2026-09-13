export * from './rbac';
export * from './navigation';
export * from './schemas';
export * from './numbering';
export * from './inspection-template';
export * from './report';

/**
 * Codes d'erreur applicatifs. Le front réagit au code, jamais au libellé :
 * un message peut être reformulé sans casser le comportement.
 */
export const ERROR_CODES = {
  /** Mot de passe provisoire : seule la page de changement est accessible. */
  PASSWORD_CHANGE_REQUIRED: 'PASSWORD_CHANGE_REQUIRED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Profil renvoyé par `GET /auth/me`. */
export interface SessionUser {
  id: string;
  email: string;
  mustChangePassword: boolean;
  /**
   * Jeu de démonstration chargé. Porté par la session — et non par les
   * paramètres — parce que le bandeau doit s'afficher pour tout le monde,
   * à commencer par les inspecteurs qui n'ont pas le droit de lire les
   * paramètres (cahier des charges §21).
   */
  demo: boolean;
  employee: {
    id: string;
    matricule: string;
    firstName: string;
    lastName: string;
    position: string | null;
    departmentId: string | null;
    departmentCode: string | null;
    isInspector: boolean;
  } | null;
  roles: Array<{
    code: string;
    name: string;
    companyId: string | null;
    departmentId: string | null;
  }>;
  companies: Array<{ id: string; code: string; name: string }>;
  permissions: Array<{ resource: string; action: string; scope: string }>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
