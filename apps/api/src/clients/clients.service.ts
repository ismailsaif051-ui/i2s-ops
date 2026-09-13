import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestUser } from '../common/types';

export interface ClientInput {
  code?: string | null;
  name: string;
  type: 'PROSPECT' | 'CLIENT';
  ice?: string | null;
  sector?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentTerms: number;
  creditLimit?: number | null;
  ownerId?: string | null;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null, companyId: { in: user.companyIds } },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }] },
        owner: { select: { id: true, firstName: true, lastName: true } },
        affairs: {
          where: { deletedAt: null },
          orderBy: { number: 'desc' },
          take: 20,
          select: {
            id: true,
            number: true,
            title: true,
            commercialStatus: true,
            worksStatus: true,
            poAmountHT: true,
          },
        },
      },
    });

    if (!client) throw new NotFoundException('Client introuvable.');
    return client;
  }

  /* ── Création ─────────────────────────────────────────────────── */

  /**
   * Le code client sert de clé de rapprochement avec la comptabilité : il est
   * unique par société et ne se réutilise pas. Faute de code proposé, on en
   * dérive un du nom, ce qui reste lisible dans un journal comptable.
   */
  async create(
    user: RequestUser,
    input: ClientInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const companyId = user.companyIds[0];
    if (!companyId) {
      throw new BadRequestException('Votre compte n’est rattaché à aucune société.');
    }

    const code = (input.code?.trim() || (await this.suggestCode(companyId, input.name))).toUpperCase();

    const taken = await this.prisma.client.findFirst({
      where: { companyId, code },
      select: { id: true, name: true },
    });
    if (taken) {
      throw new BadRequestException(`Le code ${code} est déjà porté par « ${taken.name} ».`);
    }

    const client = await this.prisma.client.create({
      data: {
        companyId,
        code,
        name: input.name.trim(),
        type: input.type,
        ice: input.ice?.trim() || null,
        sector: input.sector?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        paymentTerms: input.paymentTerms,
        creditLimit: input.creditLimit ?? null,
        ownerId: input.ownerId || null,
      },
    });

    await this.audit.record(
      {
        entity: 'client',
        entityId: client.id,
        action: 'CREATE',
        after: { code: client.code, name: client.name, type: client.type },
        companyId,
      },
      { user, ...ctx },
    );

    return client;
  }

  /* ── Modification ─────────────────────────────────────────────── */

  async update(
    user: RequestUser,
    id: string,
    input: Partial<ClientInput>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const before = await this.get(user, id);

    // Le code n'est pas modifiable : il est déjà cité sur des factures émises.
    const client = await this.prisma.client.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.ice !== undefined ? { ice: input.ice?.trim() || null } : {}),
        ...(input.sector !== undefined ? { sector: input.sector?.trim() || null } : {}),
        ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
        ...(input.city !== undefined ? { city: input.city?.trim() || null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
        ...(input.paymentTerms !== undefined ? { paymentTerms: input.paymentTerms } : {}),
        ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit } : {}),
        ...(input.ownerId !== undefined ? { ownerId: input.ownerId || null } : {}),
      },
    });

    const { before: was, after: now } = this.audit.diff(
      before as unknown as Record<string, unknown>,
      client as unknown as Record<string, unknown>,
    );

    await this.audit.record(
      { entity: 'client', entityId: id, action: 'UPDATE', before: was, after: now, companyId: client.companyId },
      { user, ...ctx },
    );

    return client;
  }

  /* ── Contacts ─────────────────────────────────────────────────── */

  async addContact(
    user: RequestUser,
    clientId: string,
    input: ContactInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const client = await this.get(user, clientId);

    const contact = await this.prisma.$transaction(async (tx) => {
      // Un seul contact principal : c'est lui qui reçoit les rapports.
      if (input.isPrimary) {
        await tx.contact.updateMany({ where: { clientId }, data: { isPrimary: false } });
      }

      return tx.contact.create({
        data: {
          clientId,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: input.role?.trim() || null,
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          isPrimary: input.isPrimary,
        },
      });
    });

    await this.audit.record(
      {
        entity: 'contact',
        entityId: contact.id,
        action: 'CREATE',
        after: {
          client: client.name,
          name: `${contact.lastName} ${contact.firstName}`,
          isPrimary: contact.isPrimary,
        },
        companyId: client.companyId,
      },
      { user, ...ctx },
    );

    return contact;
  }

  /* ── Code client ──────────────────────────────────────────────── */

  /**
   * Propose un code à partir du nom : quatre lettres, puis un rang si ces
   * quatre lettres sont déjà prises. « SOMAPHOS INDUSTRIES » → SOMA, SOMA2…
   */
  private async suggestCode(companyId: string, name: string): Promise<string> {
    const root =
      name
        .normalize('NFD')
        // Les marques diacritiques sont retirées après décomposition : « ÉNERGIE »
        // donne ENER, pas NERG.
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z]/g, '')
        .slice(0, 4)
        .toUpperCase() || 'CLI';

    const existing = await this.prisma.client.findMany({
      where: { companyId, code: { startsWith: root } },
      select: { code: true },
    });
    if (!existing.some((c) => c.code === root)) return root;

    for (let rank = 2; rank < 100; rank += 1) {
      const candidate = `${root}${rank}`;
      if (!existing.some((c) => c.code === candidate)) return candidate;
    }

    throw new BadRequestException(
      `Impossible de dériver un code de « ${name} » : précisez-le vous-même.`,
    );
  }
}
