import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const HOUR = 60 * 60 * 1000;

/**
 * Fait passer en « échue » les factures dont l'échéance est dépassée.
 *
 * Rien ne posait ce statut : en dehors des données de démonstration, une
 * facture restait « envoyée » indéfiniment, et la liste des factures, la fiche
 * affaire et les relances ne voyaient aucun retard. Le passage se fait au
 * démarrage de l'API, puis toutes les heures — une facture devient échue le
 * lendemain de son échéance, jamais le jour même.
 */
@Injectable()
export class OverdueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OverdueService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.markOverdue().catch((error: Error) =>
      this.logger.error(`Passage en échue impossible : ${error.message}`),
    );
    this.timer = setInterval(() => {
      this.markOverdue().catch((error: Error) =>
        this.logger.error(`Passage en échue impossible : ${error.message}`),
      );
    }, HOUR);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** Nombre de factures passées en « échue ». */
  async markOverdue(today = new Date()): Promise<number> {
    const startOfToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const { count } = await this.prisma.invoice.updateMany({
      where: {
        status: { in: ['ISSUED', 'SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: startOfToday },
      },
      data: { status: 'OVERDUE' },
    });
    if (count > 0) this.logger.log(`${count} facture(s) passée(s) en échue`);
    return count;
  }
}
