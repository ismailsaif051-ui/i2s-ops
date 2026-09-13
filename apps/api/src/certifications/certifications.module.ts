import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DocumentsService } from '../documents/documents.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

/** Méthodes d'essais non destructifs certifiées, telles que le référentiel les nomme. */
export const CERTIFICATION_METHODS = ['UT', 'PT', 'MT', 'VT', 'RT', 'ET', 'LT'] as const;

const listSchema = z.object({
  employeeId: z.string().uuid().optional(),
  /** `expired` ou `due` : ce qui bloque, ou ce qui va bloquer. */
  state: z.enum(['valid', 'due', 'expired']).optional(),
});

const createSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.string().trim().min(2, 'Le type de certification est obligatoire.').max(60),
  method: z.string().trim().max(10).nullable().optional(),
  level: z.string().trim().max(10).nullable().optional(),
  issuer: z.string().trim().max(120).nullable().optional(),
  number: z.string().trim().max(80).nullable().optional(),
  issuedAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date(),
  certificate: z
    .object({
      fileName: z.string().trim().min(1).max(200),
      contentBase64: z.string().max(11_000_000),
    })
    .nullable()
    .optional(),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Habilitations des inspecteurs.
 *
 * Une certification périmée empêche d'affecter son porteur à une mission de la
 * méthode concernée — le planning le signale. Enregistrer le renouvellement
 * est le seul geste qui débloque cette affectation.
 */
@Injectable()
class CertificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly documents: DocumentsService,
  ) {}

  async create(
    user: RequestUser,
    input: z.infer<typeof createSchema>,
    context: { ip?: string | null; userAgent?: string | null },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: input.employeeId, deletedAt: null, companyId: { in: user.companyIds } },
      select: { id: true, companyId: true, matricule: true, departmentId: true },
    });
    if (!employee) throw new BadRequestException('Employé introuvable.');

    const expiresAt = startOfDay(input.expiresAt);
    const issuedAt = input.issuedAt ? startOfDay(input.issuedAt) : null;

    if (issuedAt && expiresAt <= issuedAt) {
      throw new BadRequestException({
        message: 'Certification refusée.',
        errors: [
          {
            field: 'expiresAt',
            message: 'L’échéance doit être postérieure à la date de délivrance.',
          },
        ],
      });
    }
    if (issuedAt && issuedAt > startOfDay(new Date())) {
      throw new BadRequestException({
        message: 'Certification refusée.',
        errors: [
          { field: 'issuedAt', message: 'Une certification ne se délivre pas dans le futur.' },
        ],
      });
    }

    let documentId: string | null = null;
    if (input.certificate) {
      const content = Buffer.from(input.certificate.contentBase64, 'base64');
      if (content.byteLength === 0) {
        throw new BadRequestException('Le certificat joint est vide ou illisible.');
      }

      const stored = await this.documents.store(user, {
        companyId: employee.companyId,
        type: 'CERTIFICATION',
        fileName: input.certificate.fileName,
        mimeType: 'application/pdf',
        content,
        extension: '.pdf',
        entityType: 'certification',
        entityId: employee.id,
        departmentId: employee.departmentId,
        confidentiality: 'RESTRICTED',
        tags: ['habilitation', input.type, input.method ?? ''].filter(Boolean),
        comment: `${input.type}${input.method ? ` ${input.method}` : ''} — ${employee.matricule}`,
      });
      documentId = stored.id;
    }

    const certification = await this.prisma.certification.create({
      data: {
        employeeId: employee.id,
        type: input.type.trim(),
        method: input.method?.trim() || null,
        level: input.level?.trim() || null,
        issuer: input.issuer?.trim() || null,
        number: input.number?.trim() || null,
        issuedAt,
        expiresAt,
        documentId,
      },
    });

    await this.audit.record(
      {
        entity: 'certification',
        entityId: certification.id,
        action: 'CREATE',
        after: {
          employee: employee.matricule,
          type: certification.type,
          method: certification.method,
          expiresAt,
        },
        companyId: employee.companyId,
      },
      { user, ...context },
    );

    const warnings: string[] = [];
    if (expiresAt < startOfDay(new Date())) {
      warnings.push(
        `L’échéance du ${expiresAt.toLocaleDateString('fr-FR')} est déjà passée : l’habilitation reste inopérante.`,
      );
    }

    return { certification, warnings };
  }

  async remove(
    user: RequestUser,
    id: string,
    context: { ip?: string | null; userAgent?: string | null },
  ) {
    const certification = await this.prisma.certification.findFirst({
      where: { id, employee: { companyId: { in: user.companyIds } } },
      include: { employee: { select: { matricule: true, companyId: true } } },
    });
    if (!certification) throw new BadRequestException('Certification introuvable.');

    await this.prisma.certification.delete({ where: { id } });

    await this.audit.record(
      {
        entity: 'certification',
        entityId: id,
        action: 'DELETE',
        before: {
          employee: certification.employee.matricule,
          type: certification.type,
          expiresAt: certification.expiresAt,
        },
        companyId: certification.employee.companyId,
      },
      { user, ...context },
    );

    return { removed: id };
  }
}

@ApiTags('Habilitations')
@Controller('certifications')
class CertificationsController {
  constructor(
    private readonly certifications: CertificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('certification', 'VIEW')
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>,
  ) {
    const rows = await this.prisma.certification.findMany({
      where: {
        employee: { companyId: { in: user.companyIds }, deletedAt: null },
        ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      },
      orderBy: { expiresAt: 'asc' },
      include: {
        employee: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            isInspector: true,
            department: { select: { code: true } },
          },
        },
      },
    });

    const today = startOfDay(new Date());
    const in60Days = new Date(today.getTime() + 60 * 86_400_000);

    const items = rows.map((c) => {
      const expires = c.expiresAt ? startOfDay(c.expiresAt) : null;
      const expired = expires === null || expires < today;

      return {
        id: c.id,
        employeeId: c.employeeId,
        employee: `${c.employee.lastName.toUpperCase()} ${c.employee.firstName}`,
        matricule: c.employee.matricule,
        department: c.employee.department?.code ?? null,
        isInspector: c.employee.isInspector,
        type: c.type,
        method: c.method,
        level: c.level,
        issuer: c.issuer,
        number: c.number,
        issuedAt: c.issuedAt,
        expiresAt: c.expiresAt,
        hasDocument: c.documentId !== null,
        /** Une habilitation périmée bloque l'affectation à sa méthode. */
        expired,
        dueSoon: !expired && expires !== null && expires <= in60Days,
        daysLeft:
          expires === null
            ? null
            : Math.round((expires.getTime() - today.getTime()) / 86_400_000),
      };
    });

    const filtered = query.state
      ? items.filter((c) =>
          query.state === 'expired' ? c.expired : query.state === 'due' ? c.dueSoon : !c.expired,
        )
      : items;

    return {
      items: filtered,
      totals: {
        all: items.length,
        expired: items.filter((c) => c.expired).length,
        dueSoon: items.filter((c) => c.dueSoon).length,
        inspectors: new Set(items.filter((c) => c.isInspector).map((c) => c.employeeId)).size,
      },
      methods: [...CERTIFICATION_METHODS],
    };
  }

  @Post()
  @RequirePermission('certification', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>,
    @Req() req: Request,
  ) {
    return this.certifications.create(user, body, ctx(req));
  }

  @Delete(':id')
  @RequirePermission('certification', 'DELETE')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.certifications.remove(user, id, ctx(req));
  }
}

@Module({
  controllers: [CertificationsController],
  providers: [CertificationsService],
})
export class CertificationsModule {}
