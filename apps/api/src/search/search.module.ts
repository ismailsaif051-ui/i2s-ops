import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { can, type Resource } from '@i2s/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeService } from '../rbac/scope.service';
import { AffairsModule } from '../affairs/affairs.module';
import { AffairsService } from '../affairs/affairs.service';
import { MISSION_SCOPE } from '../missions/missions.service';
import { REPORT_SCOPE } from '../reports/reports.service';
import { CurrentUser } from '../common/decorators';
import type { RequestUser, ScopeDescriptor } from '../common/types';

const PER_GROUP = 6;

const INVOICE_SCOPE: ScopeDescriptor = {
  companyPath: 'affair.companyId',
  departmentPath: 'affair.departmentId',
  ownerPath: 'affair.accountManagerId',
  teamPath: 'affair.accountManagerId',
};

const EMPLOYEE_SCOPE: ScopeDescriptor = {
  companyPath: 'companyId',
  departmentPath: 'departmentId',
  ownerPath: 'id',
  teamPath: 'id',
};

export interface SearchHit {
  id: string;
  /** Identifiant métier ou nom : ce que l'utilisateur reconnaît. */
  label: string;
  detail: string;
  href: string;
}

export interface SearchGroup {
  key: string;
  label: string;
  hits: SearchHit[];
}

const contains = (q: string) => ({ contains: q, mode: 'insensitive' as const });

/**
 * Recherche globale de l'en-tête.
 *
 * Chaque domaine n'est interrogé que si l'utilisateur a le droit de le
 * consulter, et AVEC LE MÊME PÉRIMÈTRE que sa liste : la recherche ne doit
 * jamais faire découvrir une affaire, une facture ou un salarié que l'écran
 * correspondant cacherait. Un domaine dont le périmètre ne peut pas être
 * établi (département manquant, par exemple) est simplement omis.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly affairs: AffairsService,
  ) {}

  async search(user: RequestUser, raw: string): Promise<SearchGroup[]> {
    const q = raw.trim().slice(0, 80);
    if (q.length < 2) return [];

    const allowed = (resource: Resource) => can(user.permissions, resource, 'VIEW');
    const guard = async (key: string, label: string, run: () => Promise<SearchHit[]>) => {
      try {
        const hits = await run();
        return hits.length > 0 ? [{ key, label, hits }] : [];
      } catch {
        return [];
      }
    };

    const groups = await Promise.all([
      allowed('affair')
        ? guard('affairs', 'Affaires', async () => {
            const rows = await this.prisma.affair.findMany({
              where: {
                deletedAt: null,
                ...this.affairs.affairWhere(user, 'VIEW'),
                AND: [
                  {
                    OR: [
                      { number: contains(q) },
                      { title: contains(q) },
                      { poNumber: contains(q) },
                      { client: { name: contains(q) } },
                    ],
                  },
                ],
              },
              select: { id: true, number: true, title: true, client: { select: { name: true } } },
              orderBy: { number: 'desc' },
              take: PER_GROUP,
            });
            return rows.map((a) => ({
              id: a.id,
              label: a.number,
              detail: `${a.client.name} · ${a.title}`,
              href: `/affaires/${a.id}`,
            }));
          })
        : [],
      allowed('client')
        ? guard('clients', 'Clients', async () => {
            const rows = await this.prisma.client.findMany({
              where: {
                deletedAt: null,
                companyId: { in: user.companyIds },
                OR: [{ name: contains(q) }, { code: contains(q) }, { ice: contains(q) }, { city: contains(q) }],
              },
              select: { id: true, name: true, code: true, city: true },
              orderBy: { name: 'asc' },
              take: PER_GROUP,
            });
            return rows.map((c) => ({
              id: c.id,
              label: c.name,
              detail: [c.code, c.city].filter(Boolean).join(' · '),
              href: `/commercial/clients/${c.id}`,
            }));
          })
        : [],
      allowed('mission')
        ? guard('missions', 'Missions', async () => {
            const level = this.scope.requireScope(user, 'mission', 'VIEW');
            const scopeWhere =
              level === 'OWN'
                ? { assignments: { some: { employeeId: user.employeeId ?? '' } } }
                : this.scope.buildWhere(user, 'mission', 'VIEW', MISSION_SCOPE);
            const rows = await this.prisma.mission.findMany({
              where: {
                deletedAt: null,
                ...scopeWhere,
                AND: [
                  {
                    OR: [
                      { number: contains(q) },
                      { objective: contains(q) },
                      { affair: { number: contains(q) } },
                      { affair: { client: { name: contains(q) } } },
                    ],
                  },
                ],
              },
              select: {
                id: true,
                number: true,
                objective: true,
                affair: { select: { number: true, client: { select: { name: true } } } },
              },
              orderBy: { number: 'desc' },
              take: PER_GROUP,
            });
            return rows.map((m) => ({
              id: m.id,
              label: m.number,
              detail: [m.affair.client.name, m.objective ?? `affaire ${m.affair.number}`].join(' · '),
              href: `/operations/missions/${m.id}`,
            }));
          })
        : [],
      allowed('report')
        ? guard('reports', 'Rapports', async () => {
            const rows = await this.prisma.report.findMany({
              where: {
                ...this.scope.buildWhere(user, 'report', 'VIEW', REPORT_SCOPE),
                AND: [{ OR: [{ number: contains(q) }, { mission: { number: contains(q) } }] }],
              },
              select: { id: true, number: true, mission: { select: { number: true } } },
              orderBy: { number: 'desc' },
              take: PER_GROUP,
            });
            return rows.map((r) => ({
              id: r.id,
              label: r.number,
              detail: `Mission ${r.mission.number}`,
              href: `/operations/rapports/${r.id}`,
            }));
          })
        : [],
      allowed('invoice')
        ? guard('invoices', 'Factures', async () => {
            const rows = await this.prisma.invoice.findMany({
              where: {
                ...this.scope.buildWhere(user, 'invoice', 'VIEW', INVOICE_SCOPE),
                AND: [{ OR: [{ number: contains(q) }, { client: { name: contains(q) } }] }],
              },
              select: { id: true, number: true, client: { select: { name: true } }, affair: { select: { number: true } } },
              orderBy: { issueDate: 'desc' },
              take: PER_GROUP,
            });
            return rows.map((i) => ({
              id: i.id,
              label: i.number,
              detail: [i.client.name, i.affair ? `affaire ${i.affair.number}` : null].filter(Boolean).join(' · '),
              href: `/finance/factures/${i.id}`,
            }));
          })
        : [],
      allowed('employee')
        ? guard('employees', 'Employés', async () => {
            const rows = await this.prisma.employee.findMany({
              where: {
                deletedAt: null,
                ...this.scope.buildWhere(user, 'employee', 'VIEW', EMPLOYEE_SCOPE),
                AND: [
                  {
                    OR: [{ matricule: contains(q) }, { lastName: contains(q) }, { firstName: contains(q) }],
                  },
                ],
              },
              select: { id: true, matricule: true, firstName: true, lastName: true, position: true },
              orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
              take: PER_GROUP,
            });
            return rows.map((e) => ({
              id: e.id,
              label: `${e.lastName.toUpperCase()} ${e.firstName}`,
              detail: [e.matricule, e.position].filter(Boolean).join(' · '),
              href: `/ressources/employes/${e.id}`,
            }));
          })
        : [],
    ]);

    return groups.flat();
  }
}

@ApiTags('Recherche')
@Controller('search')
class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** Connecté suffit : chaque domaine vérifie ensuite son propre droit. */
  @Get()
  search(@CurrentUser() user: RequestUser, @Query('q') q?: string) {
    return this.searchService.search(user, q ?? '');
  }
}

@Module({
  imports: [AffairsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
