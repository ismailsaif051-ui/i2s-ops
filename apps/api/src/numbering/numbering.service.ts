import { Injectable } from '@nestjs/common';
import {
  DEFAULT_PATTERNS,
  formatNumber,
  type NumberScope,
  type NumberTokens,
} from '@i2s/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Allocation transactionnelle des numéros métier : par société, par année,
 * sans trou et sans doublon (docs/03-MODELE-DONNEES.md §13).
 *
 * L'incrément se fait par `update` atomique sur la ligne de séquence, ce qui
 * sérialise les demandes concurrentes au niveau de la base.
 */
@Injectable()
export class NumberingService {
  constructor(private readonly prisma: PrismaService) {}

  async next(
    companyId: string,
    scope: NumberScope,
    /**
     * Jetons de rendu. `year` et `month` valent l'année et le mois courants
     * à défaut : une pièce datée d'une autre période doit les fournir, sinon
     * elle porterait la date du jour où on l'a créée.
     */
    extra: Omit<NumberTokens, 'year' | 'sequence'> & { year?: number } = {},
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const client = tx ?? this.prisma;

    // Le compteur reste indexé sur l'année civile en cours : c'est lui qui
    // garantit l'absence de doublon, indépendamment de l'affichage.
    const year = new Date().getFullYear();
    const pattern = DEFAULT_PATTERNS[scope];

    const sequence = await client.numberSequence.upsert({
      where: { companyId_scope_year: { companyId, scope, year } },
      create: { companyId, scope, year, pattern, next: 2, padding: 4 },
      update: { next: { increment: 1 } },
    });

    // `create` renvoie next=2 après avoir réservé le numéro 1 ;
    // `update` renvoie la valeur déjà incrémentée.
    const allocated = sequence.next - 1;

    return formatNumber(sequence.pattern || pattern, {
      year,
      sequence: allocated,
      padding: sequence.padding,
      month: new Date().getMonth() + 1,
      ...extra,
    });
  }

  /** Aperçu du prochain numéro, sans le consommer. */
  async peek(companyId: string, scope: NumberScope): Promise<string> {
    const year = new Date().getFullYear();
    const row = await this.prisma.numberSequence.findUnique({
      where: { companyId_scope_year: { companyId, scope, year } },
    });
    return formatNumber(row?.pattern ?? DEFAULT_PATTERNS[scope], {
      year,
      sequence: row?.next ?? 1,
      padding: row?.padding ?? 4,
      month: new Date().getMonth() + 1,
    });
  }
}
