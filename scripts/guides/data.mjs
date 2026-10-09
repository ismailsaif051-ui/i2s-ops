// Données réelles des guides : rôles et droits lus en base, menu lu dans l'application.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const WORK = path.join(ROOT, '.guides-tmp');
export const OUT = path.resolve(ROOT, '..', 'I2S-System - Guides utilisateurs');

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')]; }),
);

const { NAVIGATION, ROLE_LABELS, can, resolveScope } = require(path.join(ROOT, 'packages/contracts/dist/index.js'));
export { NAVIGATION, ROLE_LABELS, can, resolveScope };

/** Ordre de présentation des guides. */
export const ROLE_ORDER = [
  'DG', 'DEPT_HEAD', 'ACCOUNT_MANAGER', 'SALES', 'INSPECTOR', 'DOC_CONTROLLER',
  'CONTROLLER', 'CONTROLLER_ASSISTANT', 'BILLING', 'RAF', 'HR', 'ADMIN',
];

export async function loadRoles() {
  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  const rows = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
  });
  const roles = [];
  for (const code of ROLE_ORDER) {
    const role = rows.find((r) => r.code === code);
    if (!role) continue;
    const permissions = role.permissions.map((p) => ({
      resource: p.permission.resource,
      action: p.permission.action,
      scope: p.scope,
    }));
    const user =
      code === 'ADMIN'
        ? await prisma.user.findFirst({ where: { email: 'admin@i2s-testing.ma' } })
        : await prisma.user.findFirst({
            where: { userRoles: { some: { role: { code } } }, status: 'ACTIVE', deletedAt: null },
            orderBy: { email: 'asc' },
          });
    roles.push({
      code,
      label: ROLE_LABELS[code] ?? role.name,
      description: role.description ?? '',
      permissions,
      user,
      token: user ? jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: 3600 }) : null,
    });
  }
  await prisma.$disconnect();
  return roles;
}

/** Menu réellement visible pour un jeu de droits. */
export function menuFor(permissions) {
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((i) => !i.requires || can(permissions, i.requires.resource, i.requires.action)),
  })).filter((g) => g.items.length > 0);
}

export const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
