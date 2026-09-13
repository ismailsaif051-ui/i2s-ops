import { Body, Controller, Get, Module, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { z } from 'zod';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../common/types';

const clientSchema = z.object({
  /** Laissé vide, le code est dérivé du nom. */
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{2,12}$/, 'Code invalide : 2 à 12 lettres, chiffres ou tirets.')
    .optional()
    .or(z.literal('')),
  name: z.string().trim().min(2, 'Le nom est obligatoire.').max(160),
  type: z.enum(['PROSPECT', 'CLIENT']).default('PROSPECT'),
  /** Identifiant Commun de l'Entreprise — 15 chiffres au Maroc. */
  ice: z
    .string()
    .trim()
    .regex(/^\d{15}$/, 'L’ICE compte 15 chiffres.')
    .optional()
    .or(z.literal('')),
  sector: z.string().trim().max(80).optional().or(z.literal('')),
  address: z.string().trim().max(240).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.string().trim().email('Adresse électronique invalide.').optional().or(z.literal('')),
  paymentTerms: z.coerce.number().int().min(0).max(180).default(30),
  creditLimit: z.coerce.number().min(0).optional().nullable(),
  ownerId: z.string().uuid().optional().or(z.literal('')),
});

const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire.').max(80),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire.').max(80),
  role: z.string().trim().max(80).optional().or(z.literal('')),
  email: z.string().trim().email('Adresse électronique invalide.').optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  isPrimary: z.boolean().default(false),
});

function ctx(req: Request) {
  return { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
}

@ApiTags('Clients')
@Controller('clients')
class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermission('client', 'VIEW')
  async list(@CurrentUser() user: RequestUser) {
    const rows = await this.prisma.client.findMany({
      where: { deletedAt: null, companyId: { in: user.companyIds } },
      orderBy: { name: 'asc' },
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        _count: { select: { affairs: true, invoices: true } },
      },
    });

    return {
      items: rows.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        sector: c.sector,
        city: c.city,
        type: c.type,
        paymentTerms: c.paymentTerms,
        primaryContact: c.contacts[0]
          ? `${c.contacts[0].firstName} ${c.contacts[0].lastName} — ${c.contacts[0].role ?? ''}`.trim()
          : null,
        affairCount: c._count.affairs,
        invoiceCount: c._count.invoices,
      })),
    };
  }

  @Get(':id')
  @RequirePermission('client', 'VIEW')
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const client = await this.clients.get(user, id);

    return {
      id: client.id,
      code: client.code,
      name: client.name,
      type: client.type,
      ice: client.ice,
      sector: client.sector,
      address: client.address,
      city: client.city,
      phone: client.phone,
      email: client.email,
      paymentTerms: client.paymentTerms,
      creditLimit: client.creditLimit,
      owner: client.owner
        ? {
            id: client.owner.id,
            name: `${client.owner.lastName.toUpperCase()} ${client.owner.firstName}`,
          }
        : null,
      contacts: client.contacts.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        role: c.role,
        email: c.email,
        phone: c.phone,
        isPrimary: c.isPrimary,
      })),
      affairs: client.affairs.map((a) => ({
        id: a.id,
        number: a.number,
        title: a.title,
        commercialStatus: a.commercialStatus,
        worksStatus: a.worksStatus,
        amount: a.poAmountHT,
      })),
    };
  }

  @Post()
  @RequirePermission('client', 'CREATE')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(clientSchema)) body: z.infer<typeof clientSchema>,
    @Req() req: Request,
  ) {
    return this.clients.create(user, body, ctx(req));
  }

  @Patch(':id')
  @RequirePermission('client', 'UPDATE')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(clientSchema.partial())) body: Partial<z.infer<typeof clientSchema>>,
    @Req() req: Request,
  ) {
    return this.clients.update(user, id, body, ctx(req));
  }

  @Post(':id/contacts')
  @RequirePermission('contact', 'CREATE')
  addContact(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(contactSchema)) body: z.infer<typeof contactSchema>,
    @Req() req: Request,
  ) {
    return this.clients.addContact(user, id, body, ctx(req));
  }
}

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
