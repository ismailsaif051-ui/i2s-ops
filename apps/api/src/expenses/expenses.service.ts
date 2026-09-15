import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { DocumentsService } from '../documents/documents.service';
import { ScopeService } from '../rbac/scope.service';
import { renderExpensePdf } from './expense-pdf';
import { renderTransferOrderPdf } from './transfer-order-pdf';
import type { RequestUser, ScopeDescriptor } from '../common/types';

export const EXPENSE_SCOPE: ScopeDescriptor = {
  companyPath: 'companyId',
  departmentPath: 'employee.departmentId',
  ownerPath: 'employeeId',
  teamPath: 'employeeId',
};

/**
 * Circuit de visa d'une note de frais (cahier des charges, W7).
 *
 * Chaque étape nomme le rôle qui la franchit. Un même utilisateur ne peut pas
 * enchaîner deux étapes s'il n'en porte pas les deux rôles : c'est la
 * séparation des tâches que le contrôle interne attend.
 */
export const EXPENSE_STEPS = [
  {
    from: 'SUBMITTED',
    to: 'CONFIRMED_N1',
    step: 1,
    roles: ['DEPT_HEAD', 'ACCOUNT_MANAGER', 'ADMIN'],
    label: 'Confirmation du responsable',
  },
  {
    from: 'CONFIRMED_N1',
    to: 'CHECKED_HR_CG',
    step: 2,
    roles: ['HR', 'CONTROLLER', 'ADMIN'],
    label: 'Contrôle RH / contrôle de gestion',
  },
  {
    from: 'CHECKED_HR_CG',
    to: 'ACCOUNTED',
    step: 3,
    roles: ['RAF', 'ADMIN'],
    label: 'Comptabilisation',
  },
  { from: 'ACCOUNTED', to: 'APPROVED_DG', step: 4, roles: ['DG', 'ADMIN'], label: 'Approbation DG' },
  {
    from: 'APPROVED_DG',
    to: 'READY_TO_PAY',
    step: 5,
    roles: ['RAF', 'ADMIN'],
    label: 'Bon à payer',
  },
] as const;

export interface LineInput {
  date: Date;
  categoryId: string;
  amount: number;
  affairId?: string | null;
  missionId?: string | null;
  departmentId?: string | null;
  description?: string | null;
  comment?: string | null;
  receipt?: { fileName: string; contentBase64: string } | null;
}

export interface LineIssue {
  /** Identifiant de la ligne concernée, quand l'écart en vise une. */
  lineId?: string;
  line: string;
  message: string;
  blocking: boolean;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly documents: DocumentsService,
    private readonly scope: ScopeService,
  ) {}

  /* ── Lecture ──────────────────────────────────────────────────── */

  async get(user: RequestUser, id: string) {
    const report = await this.prisma.expenseReport.findFirst({
      where: { id, companyId: { in: user.companyIds } },
      include: {
        employee: {
          select: {
            id: true,
            matricule: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            position: true,
            bankName: true,
            bankRib: true,
            department: { select: { code: true, name: true } },
            manager: { select: { firstName: true, lastName: true } },
          },
        },
        lines: {
          orderBy: { date: 'asc' },
          include: {
            category: true,
            affair: { select: { number: true } },
            mission: { select: { number: true } },
            department: { select: { code: true } },
          },
        },
        approvals: { orderBy: { decidedAt: 'asc' } },
      },
    });

    if (!report) throw new NotFoundException('Note de frais introuvable.');

    const level = this.scope.requireScope(user, 'expense_report', 'VIEW');
    const allowed =
      level === 'ALL' ||
      level === 'COMPANY' ||
      (level === 'DEPARTMENT' &&
        report.employee.departmentId !== null &&
        user.departmentIds.includes(report.employee.departmentId)) ||
      (level === 'TEAM' &&
        (report.employeeId === user.employeeId ||
          user.teamEmployeeIds.includes(report.employeeId))) ||
      (level === 'OWN' && report.employeeId === user.employeeId);

    if (!allowed) throw new ForbiddenException('Cette note de frais est hors de votre périmètre.');

    return report;
  }

  /**
   * Pièce imprimable — celle qu'on agrafe aux justificatifs, et que chaque
   * signataire du circuit reçoit. Générée à la volée : une note de frais
   * change de statut trop souvent pour figer un PDF à un instant donné.
   */
  async pdf(user: RequestUser, id: string): Promise<Buffer> {
    const report = await this.get(user, id);

    const approverUserIds = [
      ...new Set(report.approvals.map((a) => a.userId).filter((v): v is string => v !== null)),
    ];

    const [company, categories, approverUsers] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({
        where: { id: report.companyId },
        select: { name: true, address: true, phone: true, email: true },
      }),
      this.prisma.expenseCategory.findMany({
        where: { isActive: true },
        orderBy: { position: 'asc' },
        select: { id: true, label: true },
      }),
      approverUserIds.length > 0
        ? this.prisma.user.findMany({
            where: { id: { in: approverUserIds } },
            select: {
              id: true,
              email: true,
              employee: { select: { firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const approverName = (userId: string | null): string | null => {
      if (!userId) return null;
      const u = approverUsers.find((u) => u.id === userId);
      if (!u) return null;
      return u.employee ? `${u.employee.lastName.toUpperCase()} ${u.employee.firstName}` : u.email;
    };

    // La semaine « courte » d'Excel : (jour du mois - 1) / 7, plafonnée à 5.
    const weekOf = (date: Date): number => Math.min(5, Math.floor((date.getUTCDate() - 1) / 7));

    const lines = report.lines.filter((l) => l.status !== 'REJECTED');
    const gridCategories = categories.map((c) => {
      const weeks = [0, 0, 0, 0, 0];
      for (const l of lines) {
        if (l.categoryId !== c.id) continue;
        weeks[weekOf(l.date)] += Number(l.amount);
      }
      return { label: c.label, weeks, total: weeks.reduce((s, n) => s + n, 0) };
    });
    const weekTotals = [0, 0, 0, 0, 0];
    for (const row of gridCategories) row.weeks.forEach((v, i) => (weekTotals[i] += v));

    const periodStart = new Date(
      Date.UTC(report.periodMonth.getUTCFullYear(), report.periodMonth.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(report.periodMonth.getUTCFullYear(), report.periodMonth.getUTCMonth() + 1, 0),
    );

    const step1 = report.approvals.find((a) => a.step === 1);
    const step2 = report.approvals.find((a) => a.step === 2);
    const step4 = report.approvals.find((a) => a.step === 4);

    return renderExpensePdf({
      number: report.number,
      status: report.status,
      company,
      employee: {
        name: `${report.employee.lastName.toUpperCase()} ${report.employee.firstName}`,
        matricule: report.employee.matricule,
        position: report.employee.position,
        department: report.employee.department?.name ?? report.employee.department?.code ?? null,
        manager: report.employee.manager
          ? `${report.employee.manager.lastName.toUpperCase()} ${report.employee.manager.firstName}`
          : null,
      },
      periodStart,
      periodEnd,
      categories: gridCategories,
      weekTotals,
      totalGross: Number(report.totalGross),
      advanceDeduction: Number(report.advanceDeduction),
      netPayable: Number(report.netPayable),
      paymentMethod: report.paymentMethod,
      observation: report.observation,
      preparedBy: `${report.employee.lastName.toUpperCase()} ${report.employee.firstName}`,
      confirmedBy: approverName(step1?.userId ?? null),
      confirmedAt: step1?.decidedAt ?? null,
      checkedBy: approverName(step2?.userId ?? null),
      checkedAt: step2?.decidedAt ?? null,
      approvedBy: approverName(step4?.userId ?? null),
      approvedAt: step4?.decidedAt ?? null,
    });
  }

  /**
   * Ordre de virement — la pièce que le RAF remet à la banque une fois la
   * note réglée. N'existe qu'à partir du règlement (docs/10-ROADMAP.md, S9 :
   * « export virement ») : avant, il n'y a ni montant net ni date arrêtés.
   */
  async transferOrderPdf(user: RequestUser, id: string): Promise<Buffer> {
    const report = await this.get(user, id);

    if (report.status !== 'PAID' || !report.paidAt) {
      throw new BadRequestException('Cette note de frais n’est pas encore réglée.');
    }

    const [company, payer] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({
        where: { id: report.companyId },
        select: { name: true, address: true, phone: true },
      }),
      report.paidById
        ? this.prisma.user.findUnique({
            where: { id: report.paidById },
            select: { email: true, employee: { select: { firstName: true, lastName: true } } },
          })
        : Promise.resolve(null),
    ]);

    return renderTransferOrderPdf({
      reference: `OV-${report.number}`,
      company,
      issuedAt: report.paidAt,
      beneficiary: {
        name: `${report.employee.lastName.toUpperCase()} ${report.employee.firstName}`,
        matricule: report.employee.matricule,
        position: report.employee.position,
        department: report.employee.department?.name ?? report.employee.department?.code ?? null,
        bankName: report.employee.bankName,
        bankRib: report.employee.bankRib,
      },
      expenseReportNumber: report.number,
      periodMonth: report.periodMonth,
      amount: Number(report.netPayable),
      paymentMethod: report.paymentMethod,
      bankReference: report.bankReference,
      issuedBy: payer
        ? payer.employee
          ? `${payer.employee.lastName.toUpperCase()} ${payer.employee.firstName}`
          : payer.email
        : null,
    });
  }

  /* ── Ouverture du mois ────────────────────────────────────────── */

  /**
   * Ouvre la note du mois.
   *
   * Une seule note par personne, par mois et par type : c'est la contrainte du
   * modèle, et c'est aussi ce qui évite qu'une même dépense se retrouve dans
   * deux notes soumises séparément.
   */
  async open(
    user: RequestUser,
    input: { month: string; type: 'MISSION' | 'OFF_MISSION'; employeeId?: string },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const employeeId = input.employeeId ?? user.employeeId;
    if (!employeeId) {
      throw new ForbiddenException(
        'Votre compte n’est rattaché à aucun employé : impossible d’ouvrir une note de frais.',
      );
    }
    if (employeeId !== user.employeeId && !this.canActFor(user)) {
      throw new ForbiddenException('Vous ne pouvez ouvrir une note que pour vous-même.');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null, companyId: { in: user.companyIds } },
      select: { id: true, companyId: true, matricule: true },
    });
    if (!employee) throw new BadRequestException('Employé introuvable.');

    const periodMonth = monthStart(input.month);

    const existing = await this.prisma.expenseReport.findUnique({
      where: {
        employeeId_periodMonth_type: { employeeId, periodMonth, type: input.type },
      },
    });
    if (existing) return existing;

    const base = await this.numbering.next(employee.companyId, 'EXPENSE_REPORT', {
      matricule: employee.matricule,
      // Le motif porte l'année et le mois de la note, pas la date du jour.
      year: periodMonth.getUTCFullYear(),
      month: periodMonth.getUTCMonth() + 1,
    });

    // Le motif NF-AA-MM-MATRICULE ne distingue pas les deux types : sans ce
    // suffixe, la note hors mission du même mois porterait le même numéro que
    // la note de mission, et se heurterait à la contrainte d'unicité.
    const number = input.type === 'OFF_MISSION' ? `${base}-HM` : base;

    const report = await this.prisma.expenseReport.create({
      data: {
        number,
        companyId: employee.companyId,
        employeeId,
        periodMonth,
        type: input.type,
        status: 'DRAFT',
      },
    });

    await this.audit.record(
      {
        entity: 'expense_report',
        entityId: report.id,
        action: 'OPEN',
        after: { number: report.number, month: input.month, type: input.type },
        companyId: employee.companyId,
      },
      { user, ...ctx },
    );

    return report;
  }

  /* ── Lignes ───────────────────────────────────────────────────── */

  async addLine(
    user: RequestUser,
    reportId: string,
    input: LineInput,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, reportId);
    this.assertEditable(user, report);

    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: input.categoryId, isActive: true },
    });
    if (!category) throw new BadRequestException('Catégorie de dépense inconnue.');

    const date = startOfDay(input.date);
    if (!withinMonth(date, report.periodMonth)) {
      throw new BadRequestException({
        message: 'Dépense refusée.',
        errors: [
          {
            field: 'date',
            message: 'La dépense n’appartient pas au mois de la note.',
          },
        ],
      });
    }
    if (input.amount <= 0) {
      throw new BadRequestException({
        message: 'Dépense refusée.',
        errors: [{ field: 'amount', message: 'Le montant doit être positif.' }],
      });
    }

    // Doublon : même jour, même catégorie, même montant. C'est le contrôle qui
    // rattrape la pièce saisie deux fois.
    const duplicate = report.lines.find(
      (l) =>
        iso(l.date) === iso(date) &&
        l.categoryId === category.id &&
        Number(l.amount) === input.amount,
    );
    if (duplicate) {
      throw new BadRequestException({
        message: 'Dépense refusée.',
        errors: [
          {
            field: 'amount',
            message: `Une dépense identique existe déjà le ${date.toLocaleDateString('fr-FR')} dans cette note.`,
          },
        ],
      });
    }

    await this.assertImputation(report.type, input, date);

    let receiptDocumentId: string | null = null;
    if (input.receipt) {
      const content = Buffer.from(input.receipt.contentBase64, 'base64');
      if (content.byteLength === 0) {
        throw new BadRequestException('Le justificatif joint est vide ou illisible.');
      }

      const stored = await this.documents.store(user, {
        companyId: report.companyId,
        type: 'EXPENSE_RECEIPT',
        fileName: input.receipt.fileName,
        mimeType: guessMime(input.receipt.fileName),
        content,
        extension: extensionOf(input.receipt.fileName),
        entityType: 'expense_line',
        entityId: report.id,
        affairId: input.affairId ?? null,
        confidentiality: 'RESTRICTED',
        tags: ['note de frais', category.code],
        comment: `${report.number} — ${category.label} du ${date.toLocaleDateString('fr-FR')}`,
      });
      receiptDocumentId = stored.id;
    }

    const line = await this.prisma.expenseLine.create({
      data: {
        expenseReportId: report.id,
        date,
        categoryId: category.id,
        amount: input.amount,
        affairId: input.affairId ?? null,
        missionId: input.missionId ?? null,
        departmentId: input.departmentId ?? report.employee.departmentId,
        description: input.description?.trim() || null,
        comment: input.comment?.trim() || null,
        receiptDocumentId,
      },
    });

    await this.recompute(report.id);

    await this.audit.record(
      {
        entity: 'expense_report',
        entityId: report.id,
        action: 'ADD_LINE',
        after: { category: category.code, date: iso(date), amount: input.amount },
        companyId: report.companyId,
      },
      { user, ...ctx },
    );

    return line;
  }

  async removeLine(
    user: RequestUser,
    reportId: string,
    lineId: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, reportId);
    this.assertEditable(user, report);

    const line = report.lines.find((l) => l.id === lineId);
    if (!line) throw new NotFoundException('Ligne introuvable dans cette note.');

    await this.prisma.expenseLine.delete({ where: { id: lineId } });
    await this.recompute(report.id);

    await this.audit.record(
      {
        entity: 'expense_report',
        entityId: report.id,
        action: 'REMOVE_LINE',
        before: { category: line.category.code, date: iso(line.date), amount: line.amount },
        companyId: report.companyId,
      },
      { user, ...ctx },
    );

    return { removed: lineId };
  }

  /* ── Contrôles ────────────────────────────────────────────────── */

  /**
   * Ce qui empêche la soumission, et ce qui la nuance.
   *
   * Les plafonds ne bloquent pas : ils exigent une justification. Un
   * dépassement peut être légitime — une nuitée à Laâyoune n'a pas le prix
   * d'une nuitée à Berrechid — mais il doit être motivé et visible.
   */
  async check(id: string): Promise<{ issues: LineIssue[]; canSubmit: boolean }> {
    const report = await this.prisma.expenseReport.findUniqueOrThrow({
      where: { id },
      include: { lines: { include: { category: true, mission: true } } },
    });

    const issues: LineIssue[] = [];

    if (report.lines.length === 0) {
      issues.push({ line: '—', message: 'La note ne comporte aucune dépense.', blocking: true });
    }

    // Cumuls par catégorie, pour les plafonds journaliers et mensuels.
    const perDay = new Map<string, number>();
    const perMonth = new Map<string, number>();
    for (const l of report.lines) {
      const day = `${l.categoryId}|${iso(l.date)}`;
      perDay.set(day, (perDay.get(day) ?? 0) + Number(l.amount));
      perMonth.set(l.categoryId, (perMonth.get(l.categoryId) ?? 0) + Number(l.amount));
    }

    for (const line of report.lines) {
      const label = `${line.category.label} du ${line.date.toLocaleDateString('fr-FR')}`;

      if (line.category.requiresReceipt && !line.receiptDocumentId) {
        issues.push({
          lineId: line.id,
          line: label,
          message: 'Justificatif obligatoire pour cette catégorie.',
          blocking: true,
        });
      }

      const cap = line.category.capAmount === null ? null : Number(line.category.capAmount);
      if (cap !== null) {
        const consumed =
          line.category.capType === 'MONTHLY'
            ? (perMonth.get(line.categoryId) ?? 0)
            : (perDay.get(`${line.categoryId}|${iso(line.date)}`) ?? 0);

        if (consumed > cap) {
          const unit =
            line.category.capType === 'MONTHLY'
              ? 'ce mois'
              : line.category.capType === 'PER_NIGHT'
                ? 'cette nuitée'
                : 'cette journée';

          if (!line.comment?.trim()) {
            issues.push({
              lineId: line.id,
              line: label,
              message: `Plafond dépassé pour ${unit} : ${consumed} DH pour un plafond de ${cap} DH. Une justification est obligatoire.`,
              blocking: true,
            });
          } else {
            issues.push({
              lineId: line.id,
              line: label,
              message: `Plafond dépassé (${consumed} DH pour ${cap} DH), justifié.`,
              blocking: false,
            });
          }
        }
      }
    }

    return { issues, canSubmit: issues.every((i) => !i.blocking) };
  }

  /* ── Soumission ───────────────────────────────────────────────── */

  async submit(
    user: RequestUser,
    id: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, id);
    this.assertEditable(user, report);

    const { issues, canSubmit } = await this.check(id);
    if (!canSubmit) {
      throw new BadRequestException({
        message: 'La note de frais ne peut pas être soumise en l’état.',
        errors: issues
          .filter((i) => i.blocking)
          .map((i) => ({ field: i.line, message: i.message })),
      });
    }

    await this.recompute(id);

    const capWarnings = new Map(
      issues
        .filter((i) => i.lineId && i.message.startsWith('Plafond'))
        .map((i) => [i.lineId!, i.message]),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const line of report.lines) {
        const warning = capWarnings.get(line.id) ?? null;
        if (warning !== line.capWarning) {
          await tx.expenseLine.update({ where: { id: line.id }, data: { capWarning: warning } });
        }
      }

      return tx.expenseReport.update({
        where: { id },
        data: { status: 'SUBMITTED', rejectReason: null },
      });
    });

    await this.audit.record(
      {
        entity: 'expense_report',
        entityId: id,
        action: 'SUBMIT',
        after: { status: updated.status, total: updated.totalGross, warnings: issues.length },
        companyId: report.companyId,
      },
      { user, ...ctx },
    );

    return { report: updated, warnings: issues.filter((i) => !i.blocking) };
  }

  /* ── Circuit de visa ──────────────────────────────────────────── */

  /**
   * Franchit l'étape suivante du circuit, ou renvoie la note à son auteur.
   *
   * L'étape franchissable se déduit du statut : c'est le circuit qui commande,
   * pas l'écran. Chacun ne peut franchir que les étapes de son rôle.
   */
  async decide(
    user: RequestUser,
    id: string,
    input: { decision: 'APPROVE' | 'REJECT'; comment?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, id);

    if (report.employeeId === user.employeeId && !user.roleCodes.includes('ADMIN')) {
      throw new BadRequestException('Une note de frais ne se vise pas soi-même.');
    }

    const step = EXPENSE_STEPS.find((s) => s.from === report.status);
    if (!step) {
      throw new BadRequestException(
        `Une note « ${report.status} » n’attend aucun visa.`,
      );
    }
    if (!step.roles.some((role) => user.roleCodes.includes(role))) {
      throw new ForbiddenException(
        `Cette étape relève de : ${step.roles.filter((r) => r !== 'ADMIN').join(', ')}.`,
      );
    }

    if (input.decision === 'REJECT' && !input.comment?.trim()) {
      throw new BadRequestException({
        message: 'Rejet refusé.',
        errors: [
          {
            field: 'comment',
            message: 'Un rejet doit être motivé : l’auteur doit savoir quoi reprendre.',
          },
        ],
      });
    }

    const status = input.decision === 'APPROVE' ? step.to : 'REJECTED';

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.expenseApproval.create({
        data: {
          expenseReportId: id,
          step: step.step,
          roleCode: step.roles.find((r) => user.roleCodes.includes(r)) ?? user.roleCodes[0] ?? '—',
          userId: user.id,
          decision: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          comment: input.comment?.trim() || null,
        },
      });

      return tx.expenseReport.update({
        where: { id },
        data: {
          status,
          rejectReason: input.decision === 'REJECT' ? (input.comment?.trim() ?? null) : null,
        },
      });
    });

    await this.audit.record(
      {
        entity: 'expense_report',
        entityId: id,
        action: input.decision === 'APPROVE' ? `APPROVE_STEP_${step.step}` : 'REJECT',
        before: { status: report.status },
        after: { status: updated.status, step: step.label },
        reason: input.comment ?? null,
        companyId: report.companyId,
      },
      { user, ...ctx },
    );

    return updated;
  }

  /* ── Règlement ────────────────────────────────────────────────── */

  /**
   * Solde la note.
   *
   * Les avances en cours de l'intéressé sont déduites d'abord : c'est l'objet
   * même d'une avance, et l'oublier reviendrait à payer deux fois.
   */
  async pay(
    user: RequestUser,
    id: string,
    input: { paidAt?: Date | null; paymentMethod?: string; bankReference?: string | null },
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    const report = await this.get(user, id);

    if (report.status !== 'READY_TO_PAY') {
      throw new BadRequestException(
        'Seule une note portant le bon à payer se règle. Faites-la approuver au préalable.',
      );
    }

    const paidAt = input.paidAt ?? new Date();
    const { updated, settlements } = await this.prisma.$transaction((tx) =>
      this.settleReport(
        tx,
        report,
        user.id,
        paidAt,
        input.paymentMethod ?? report.paymentMethod,
        input.bankReference ?? null,
      ),
    );

    await this.audit.record(
      {
        entity: 'expense_report',
        entityId: id,
        action: 'PAY',
        after: {
          gross: Number(report.totalGross),
          advanceDeduction: Number(updated.advanceDeduction),
          net: Number(updated.netPayable),
          reference: input.bankReference,
        },
        companyId: report.companyId,
      },
      { user, ...ctx },
    );

    return { report: updated, settlements };
  }

  /**
   * Cœur du règlement, factorisé pour être rejoué à l'identique — avances
   * déduites d'abord — que la note soit payée seule ou dans un lot de
   * virement (voir PaymentBatchesService.pay). `tx` porte toute l'opération :
   * appelant et appelé partagent la même transaction, ou aucun des deux
   * n'écrit.
   */
  async settleReport(
    tx: Prisma.TransactionClient,
    report: { id: string; employeeId: string; totalGross: Prisma.Decimal | number },
    paidById: string,
    paidAt: Date,
    paymentMethod: string,
    bankReference: string | null,
  ) {
    const advances = await tx.advance.findMany({
      where: {
        employeeId: report.employeeId,
        status: { in: ['PAID', 'PARTIALLY_SETTLED'] },
      },
      orderBy: { date: 'asc' },
    });

    const gross = Number(report.totalGross);
    let remaining = gross;
    const settlements: Array<{ advanceId: string; amount: number }> = [];

    for (const advance of advances) {
      if (remaining <= 0) break;
      const due = Number(advance.amount) - Number(advance.settledAmount);
      if (due <= 0) continue;

      const amount = Math.min(due, remaining);
      settlements.push({ advanceId: advance.id, amount });
      remaining -= amount;
    }

    const deduction = settlements.reduce((sum, s) => sum + s.amount, 0);

    for (const s of settlements) {
      await tx.advanceSettlement.create({
        data: { advanceId: s.advanceId, expenseReportId: report.id, amount: s.amount },
      });

      const advance = advances.find((a) => a.id === s.advanceId)!;
      const settled = Number(advance.settledAmount) + s.amount;
      await tx.advance.update({
        where: { id: s.advanceId },
        data: {
          settledAmount: settled,
          status: settled >= Number(advance.amount) ? 'SETTLED' : 'PARTIALLY_SETTLED',
          settledAt: settled >= Number(advance.amount) ? paidAt : null,
        },
      });
    }

    const updated = await tx.expenseReport.update({
      where: { id: report.id },
      data: {
        status: 'PAID',
        paidAt,
        paidById,
        advanceDeduction: deduction,
        netPayable: gross - deduction,
        paymentMethod,
        bankReference: bankReference?.trim() || null,
      },
    });

    return { updated, settlements };
  }

  /* ── Files d'attente ──────────────────────────────────────────── */

  /** Notes qui attendent une décision de cet utilisateur. */
  async pending(user: RequestUser) {
    const reachable = EXPENSE_STEPS.filter((s) =>
      s.roles.some((role) => user.roleCodes.includes(role)),
    ).map((s) => s.from);

    if (reachable.length === 0) return [];

    const rows = await this.prisma.expenseReport.findMany({
      where: {
        status: { in: reachable as never },
        companyId: { in: user.companyIds },
        ...this.scope.buildWhere(user, 'expense_report', 'VIEW', EXPENSE_SCOPE),
      },
      orderBy: { periodMonth: 'asc' },
      include: {
        employee: {
          select: {
            matricule: true,
            firstName: true,
            lastName: true,
            department: { select: { code: true } },
          },
        },
        _count: { select: { lines: true } },
      },
    });

    return rows
      .filter((r) => r.employeeId !== user.employeeId || user.roleCodes.includes('ADMIN'))
      .map((r) => ({
        id: r.id,
        number: r.number,
        employee: `${r.employee.lastName.toUpperCase()} ${r.employee.firstName}`,
        department: r.employee.department?.code ?? null,
        month: iso(r.periodMonth).slice(0, 7),
        type: r.type,
        status: r.status,
        lines: r._count.lines,
        totalGross: Number(r.totalGross),
        step: EXPENSE_STEPS.find((s) => s.from === r.status)?.label ?? '—',
      }));
  }

  /* ── Utilitaires ──────────────────────────────────────────────── */

  /** Recalcule les totaux depuis les lignes — jamais saisis à la main. */
  private async recompute(id: string) {
    const lines = await this.prisma.expenseLine.findMany({
      where: { expenseReportId: id, status: { not: 'REJECTED' } },
      select: { amount: true },
    });

    const total = lines.reduce((sum, l) => sum + Number(l.amount), 0);
    const report = await this.prisma.expenseReport.findUniqueOrThrow({
      where: { id },
      select: { advanceDeduction: true },
    });

    await this.prisma.expenseReport.update({
      where: { id },
      data: { totalGross: total, netPayable: total - Number(report.advanceDeduction) },
    });
  }

  private assertEditable(
    user: RequestUser,
    report: { status: string; employeeId: string; number: string },
  ) {
    if (!['DRAFT', 'REJECTED'].includes(report.status)) {
      throw new BadRequestException(
        `La note ${report.number} est engagée dans le circuit de visa : elle n’est plus modifiable.`,
      );
    }
    if (report.employeeId !== user.employeeId && !this.canActFor(user)) {
      throw new ForbiddenException('Seul l’auteur de la note peut la modifier.');
    }
  }

  /** Saisir pour autrui : réservé à l'assistance et à l'administration. */
  private canActFor(user: RequestUser): boolean {
    return user.permissions.some(
      (p) =>
        p.resource === 'expense_report' &&
        p.action === 'CREATE' &&
        (p.scope === 'COMPANY' || p.scope === 'ALL'),
    );
  }

  /**
   * Imputation d'une dépense.
   *
   * Un frais de mission doit porter sa mission, et tomber dans la période de
   * l'ordre de mission : c'est ce qui permet de le refacturer, et ce qui
   * empêche d'imputer un déplacement personnel à une affaire.
   */
  private async assertImputation(type: string, input: LineInput, date: Date) {
    if (type !== 'MISSION') return;

    if (!input.missionId) {
      throw new BadRequestException({
        message: 'Dépense refusée.',
        errors: [
          { field: 'missionId', message: 'Un frais de mission doit porter sa mission.' },
        ],
      });
    }

    const mission = await this.prisma.mission.findFirst({
      where: { id: input.missionId, deletedAt: null },
      select: {
        number: true,
        plannedStartDate: true,
        plannedEndDate: true,
        actualStartDate: true,
        actualEndDate: true,
        missionOrder: { select: { status: true } },
      },
    });
    if (!mission) throw new BadRequestException('Mission introuvable.');

    if (!mission.missionOrder || mission.missionOrder.status === 'DRAFT') {
      throw new BadRequestException({
        message: 'Dépense refusée.',
        errors: [
          {
            field: 'missionId',
            message: `L’ordre de mission ${mission.number} n’est pas signé : la réalité du déplacement ne peut pas être établie.`,
          },
        ],
      });
    }

    // Une marge d'un jour de part et d'autre : on part souvent la veille.
    const from = addDays(mission.actualStartDate ?? mission.plannedStartDate ?? date, -1);
    const to = addDays(mission.actualEndDate ?? mission.plannedEndDate ?? date, 1);

    if (date < startOfDay(from) || date > startOfDay(to)) {
      throw new BadRequestException({
        message: 'Dépense refusée.',
        errors: [
          {
            field: 'date',
            message: `Le ${date.toLocaleDateString('fr-FR')} tombe hors de la période de la mission ${mission.number} (${from.toLocaleDateString('fr-FR')} → ${to.toLocaleDateString('fr-FR')}).`,
          },
        ],
      });
    }
  }
}

/* ── Dates et fichiers ────────────────────────────────────────────── */

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function monthStart(month: string): Date {
  const [year, index] = month.split('-').map(Number);
  if (!year || !index || index < 1 || index > 12) {
    throw new BadRequestException('Mois attendu au format AAAA-MM.');
  }
  return new Date(Date.UTC(year, index - 1, 1));
}

function withinMonth(date: Date, monthDate: Date): boolean {
  return (
    date.getUTCFullYear() === monthDate.getUTCFullYear() &&
    date.getUTCMonth() === monthDate.getUTCMonth()
  );
}

function extensionOf(fileName: string): string {
  const match = /\.[a-z0-9]{1,5}$/i.exec(fileName);
  return match ? match[0].toLowerCase() : '.pdf';
}

function guessMime(fileName: string): string {
  const ext = extensionOf(fileName);
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/pdf';
}
