import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Action } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { ScopeService } from '../rbac/scope.service';
import type { RequestUser, ScopeDescriptor } from '../common/types';

export const AFFAIR_SCOPE: ScopeDescriptor = {
  companyPath: 'companyId',
  departmentPath: 'departmentId',
  ownerPath: 'accountManagerId',
  teamPath: 'accountManagerId',
};

export interface AffairInput {
  clientId: string;
  title: string;
  departmentId?: string | null;
  /** Services mobilisés — « CND-CTC-EILM » au registre. */
  departmentIds?: string[];
  accountManagerId?: string | null;
  pilotId?: string | null;
  preparedById?: string | null;
  controlLocation?: string | null;
  endClient?: string | null;
  engineeringOffice?: string | null;
  offerAmountHT?: number | null;
  poAmountHT?: number | null;
  poNumber?: string | null;
  commercialStatus?: 'GAGNEE' | 'SUIVANT_OP' | 'PERDUE_ANNULEE' | 'DP';
  worksStatus?:
    | 'NON_DEMARRE'
    | 'EN_COURS'
    | 'A_FACTURER'
    | 'FAC_PARTIELLE'
    | 'FAC_TOTALE'
    | 'PERDU_ANNULE';
  physicalFileOpened?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  observation?: string | null;
}

@Injectable()
export class AffairsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly scope: ScopeService,
  ) {}

  /* ── Périmètre ────────────────────────────────────────────────── */

  /**
   * Périmètre d'une affaire.
   *
   * Le cas « département » ne se réduit pas au service pilote : une affaire
   * mobilise souvent plusieurs pôles — « CND-CTC-EILM » au registre — et
   * chacun d'eux doit la voir, sans quoi une intervention est planifiée par
   * un service qui n'a pas accès à l'affaire sur laquelle il travaille.
   */
  affairWhere(user: RequestUser, action: Action): Record<string, unknown> {
    const level = this.scope.requireScope(user, 'affair', action);
    if (level !== 'DEPARTMENT') {
      return this.scope.buildWhere(user, 'affair', action, AFFAIR_SCOPE);
    }

    if (user.departmentIds.length === 0) {
      throw new ForbiddenException(
        'Aucun département rattaché à votre habilitation pour les affaires.',
      );
    }

    return {
      OR: [
        { departmentId: { in: user.departmentIds } },
        { services: { some: { departmentId: { in: user.departmentIds } } } },
      ],
    };
  }

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const affair = await this.prisma.affair.findFirst({
      where: {
        id,
        deletedAt: null,
        ...this.affairWhere(user, 'VIEW'),
      },
      include: {
        client: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, code: true, name: true } },
        services: { include: { department: { select: { id: true, code: true } } } },
        accountManager: { select: { id: true, firstName: true, lastName: true } },
        pilot: { select: { id: true, firstName: true, lastName: true } },
        preparedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!affair) throw new NotFoundException('Affaire introuvable.');
    return affair;
  }

  /* ── Création ─────────────────────────────────────────────────── */

  /**
   * Ouvre une affaire et lui alloue son Code Affaire.
   *
   * Le numéro est pris dans la séquence transactionnelle de la société : c'est
   * le pivot de tout le système — pointage, frais, attachements, factures et
   * rentabilité s'y rattachent. Il ne se choisit pas à la main.
   */
  async create(
    user: RequestUser,
    input: AffairInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const companyId = user.companyIds[0];
    if (!companyId) {
      throw new BadRequestException('Votre compte n’est rattaché à aucune société.');
    }

    const client = await this.prisma.client.findFirst({
      where: { id: input.clientId, deletedAt: null, companyId },
      select: { id: true, name: true, type: true },
    });
    if (!client) throw new BadRequestException('Client introuvable dans votre société.');

    const services = await this.resolveServices(companyId, input);

    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      throw new BadRequestException('La date de fin précède la date de début.');
    }

    const affair = await this.prisma.$transaction(async (tx) => {
      const number = await this.numbering.next(companyId, 'AFFAIR', {}, tx);

      const created = await tx.affair.create({
        data: {
          companyId,
          number,
          clientId: client.id,
          title: input.title.trim(),
          departmentId: input.departmentId || null,
          // Sans chargé d'affaires désigné, c'est celui qui ouvre l'affaire.
          // Ce n'est pas une commodité : au périmètre « équipe », une affaire
          // sans chargé d'affaires serait invisible à son propre auteur.
          accountManagerId: input.accountManagerId || user.employeeId || null,
          pilotId: input.pilotId || null,
          preparedById: input.preparedById || null,
          controlLocation: input.controlLocation?.trim() || null,
          endClient: input.endClient?.trim() || null,
          engineeringOffice: input.engineeringOffice?.trim() || null,
          offerAmountHT: input.offerAmountHT ?? null,
          poAmountHT: input.poAmountHT ?? null,
          poNumber: input.poNumber?.trim() || null,
          contractAmountHT: this.contractAmount(input),
          commercialStatus: input.commercialStatus ?? 'SUIVANT_OP',
          worksStatus: input.worksStatus ?? 'NON_DEMARRE',
          physicalFileOpened: input.physicalFileOpened ?? false,
          creationDate: new Date(),
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          observation: input.observation?.trim() || null,
          status: 'IN_PROGRESS',
          createdById: user.employeeId,
          services: { create: services.map((departmentId) => ({ departmentId })) },
        },
      });

      // Une affaire gagnée transforme le prospect en client : le registre ne
      // distingue pas les deux, mais la facturation, si.
      if (client.type === 'PROSPECT' && created.commercialStatus === 'GAGNEE') {
        await tx.client.update({ where: { id: client.id }, data: { type: 'CLIENT' } });
      }

      return created;
    });

    await this.audit.record(
      {
        entity: 'affair',
        entityId: affair.id,
        action: 'CREATE',
        after: {
          number: affair.number,
          client: client.name,
          title: affair.title,
          commercialStatus: affair.commercialStatus,
        },
        companyId,
      },
      { user, ...ctx },
    );

    return affair;
  }

  /* ── Modification ─────────────────────────────────────────────── */

  async update(
    user: RequestUser,
    id: string,
    input: Partial<AffairInput>,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const before = await this.get(user, id);

    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      throw new BadRequestException('La date de fin précède la date de début.');
    }

    // Le client ne change pas : les missions, attachements et factures déjà
    // rattachés le désignent. Une erreur de client se corrige en annulant
    // l'affaire et en en ouvrant une autre.
    if (input.clientId && input.clientId !== before.clientId) {
      throw new BadRequestException(
        'Le client d’une affaire ouverte ne se change pas. Annulez l’affaire et ouvrez-en une autre.',
      );
    }

    const services =
      input.departmentIds !== undefined
        ? await this.resolveServices(before.companyId, input)
        : null;

    const affair = await this.prisma.$transaction(async (tx) => {
      if (services) {
        await tx.affairDepartment.deleteMany({ where: { affairId: id } });
        await tx.affairDepartment.createMany({
          data: services.map((departmentId) => ({ affairId: id, departmentId })),
        });
      }

      return tx.affair.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.departmentId !== undefined ? { departmentId: input.departmentId || null } : {}),
          ...(input.accountManagerId !== undefined
            ? { accountManagerId: input.accountManagerId || null }
            : {}),
          ...(input.pilotId !== undefined ? { pilotId: input.pilotId || null } : {}),
          ...(input.preparedById !== undefined
            ? { preparedById: input.preparedById || null }
            : {}),
          ...(input.controlLocation !== undefined
            ? { controlLocation: input.controlLocation?.trim() || null }
            : {}),
          ...(input.endClient !== undefined ? { endClient: input.endClient?.trim() || null } : {}),
          ...(input.engineeringOffice !== undefined
            ? { engineeringOffice: input.engineeringOffice?.trim() || null }
            : {}),
          ...(input.offerAmountHT !== undefined ? { offerAmountHT: input.offerAmountHT } : {}),
          ...(input.poAmountHT !== undefined ? { poAmountHT: input.poAmountHT } : {}),
          ...(input.poNumber !== undefined ? { poNumber: input.poNumber?.trim() || null } : {}),
          ...(input.poAmountHT !== undefined || input.offerAmountHT !== undefined
            ? { contractAmountHT: this.contractAmount(input, before) }
            : {}),
          ...(input.commercialStatus !== undefined
            ? { commercialStatus: input.commercialStatus }
            : {}),
          ...(input.worksStatus !== undefined ? { worksStatus: input.worksStatus } : {}),
          ...(input.physicalFileOpened !== undefined
            ? { physicalFileOpened: input.physicalFileOpened }
            : {}),
          ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
          ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
          ...(input.observation !== undefined
            ? { observation: input.observation?.trim() || null }
            : {}),
          updatedById: user.employeeId,
        },
      });
    });

    const { before: was, after: now } = this.audit.diff(
      before as unknown as Record<string, unknown>,
      affair as unknown as Record<string, unknown>,
      ['updatedAt', 'createdAt', 'updatedById'],
    );

    await this.audit.record(
      {
        entity: 'affair',
        entityId: id,
        action: 'UPDATE',
        before: was,
        after: now,
        companyId: affair.companyId,
      },
      { user, ...ctx },
    );

    return affair;
  }

  /* ── Montant du marché ────────────────────────────────────────── */

  /**
   * Ce sur quoi l'affaire est jugée.
   *
   * Le registre raisonne en deux temps : le montant de l'offre tant qu'aucun
   * bon de commande n'est arrivé, celui du bon de commande ensuite. C'est ce
   * montant que la rentabilité oppose aux coûts — sans lui, une affaire
   * fraîchement ouverte afficherait un marché à zéro.
   */
  private contractAmount(
    input: Partial<AffairInput>,
    current?: { offerAmountHT: unknown; poAmountHT: unknown },
  ): number | null {
    const po = input.poAmountHT ?? (current ? Number(current.poAmountHT ?? 0) || null : null);
    if (po) return po;

    const offer =
      input.offerAmountHT ?? (current ? Number(current.offerAmountHT ?? 0) || null : null);
    return offer ?? null;
  }

  /* ── Prochain numéro ──────────────────────────────────────────── */

  /** Aperçu du prochain Code Affaire, sans le consommer. */
  peekNextNumber(companyId: string): Promise<string> {
    return this.numbering.peek(companyId, 'AFFAIR');
  }

  /* ── Services mobilisés ───────────────────────────────────────── */

  /**
   * Le service pilote fait partie des services mobilisés, qu'on l'ait coché ou
   * non : c'est lui qui porte l'affaire.
   */
  private async resolveServices(companyId: string, input: Partial<AffairInput>): Promise<string[]> {
    const wanted = new Set([...(input.departmentIds ?? [])]);
    if (input.departmentId) wanted.add(input.departmentId);
    if (wanted.size === 0) return [];

    const found = await this.prisma.department.findMany({
      where: { id: { in: [...wanted] }, companyId },
      select: { id: true },
    });

    if (found.length !== wanted.size) {
      throw new BadRequestException('Un service demandé n’appartient pas à votre société.');
    }

    return found.map((d) => d.id);
  }
}
