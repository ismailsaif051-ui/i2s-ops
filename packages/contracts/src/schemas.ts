import { z } from 'zod';
import { ACTIONS, RESOURCES, SCOPES } from './rbac';

/** Mot de passe : longueur d'abord, complexité ensuite. */
export const passwordSchema = z
  .string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caractères.')
  .max(128)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), {
    message: 'Le mot de passe doit contenir une minuscule, une majuscule et un chiffre.',
  });

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, 'Mot de passe requis.'),
  totp: z.string().length(6).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export const createUserSchema = z.object({
  email: z.string().email(),
  employeeId: z.string().uuid().optional(),
  roles: z
    .array(
      z.object({
        roleCode: z.enum(['ADMIN', 'DG', 'DEPT_HEAD', 'CONTROLLER', 'RAF', 'HR', 'BILLING', 'CONTROLLER_ASSISTANT', 'ACCOUNT_MANAGER', 'SALES', 'INSPECTOR', 'DOC_CONTROLLER']),
        companyId: z.string().uuid().optional(),
        departmentId: z.string().uuid().optional(),
      }),
    )
    .min(1, 'Au moins un rôle est requis.'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const createEmployeeSchema = z.object({
  companyId: z.string().uuid(),
  matricule: z.string().min(1).max(32),
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  departmentId: z.string().uuid().optional(),
  position: z.string().max(120).optional(),
  managerId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
  hireDate: z.coerce.date().optional(),
  contractType: z.string().max(32).optional(),
  isInspector: z.boolean().default(false),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/**
 * Coût journalier : on ne modifie jamais une période existante, on en ouvre une
 * nouvelle. `reason` est obligatoire — la traçabilité est exigée par le CDC.
 */
export const setDailyCostSchema = z.object({
  employeeId: z.string().uuid(),
  validFrom: z.coerce.date(),
  amount: z.coerce.number().positive('Le coût journalier doit être positif.'),
  currency: z.string().length(3).default('MAD'),
  reason: z.string().min(3, 'Le motif est obligatoire.').max(500),
});
export type SetDailyCostInput = z.infer<typeof setDailyCostSchema>;

export const createDepartmentSchema = z.object({
  companyId: z.string().uuid(),
  code: z.string().min(2).max(8).toUpperCase(),
  name: z.string().min(2).max(120),
  managerId: z.string().uuid().optional(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().max(200).optional(),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export const permissionSchema = z.object({
  resource: z.enum(RESOURCES),
  action: z.enum(ACTIONS),
  scope: z.enum(SCOPES),
});

export const auditQuerySchema = paginationSchema.extend({
  entity: z.string().max(64).optional(),
  entityId: z.string().max(64).optional(),
  userId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
