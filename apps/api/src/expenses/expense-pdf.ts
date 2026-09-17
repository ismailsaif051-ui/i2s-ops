import PDFDocument from 'pdfkit';
import { dh } from '../common/pdf-format';

/**
 * Rendu PDF de la note de frais — décompte mensuel par poste et par semaine.
 *
 * Reprend le modèle Excel « I2S TESTING - Notes de frais » (feuille NOTE DE
 * FRAIS) : les postes de dépense en lignes, les semaines du mois en
 * colonnes, une synthèse et un pied de page de circuit de visa
 * (Préparé / Confirmé / Vérifié / Approuvé). Même gabarit de page que
 * report-pdf.ts et mission-order-pdf.ts.
 */

const PAGE = { size: 'A4' as const, margin: 42 };
const WIDTH = 595.28 - PAGE.margin * 2;

const INK = '#1a1b18';
const MUTED = '#4a4f52';
const ACCENT = '#d14e27';
const RULE = '#c4bfb4';
const WASH = '#f4f2ed';

type Doc = PDFKit.PDFDocument;

export interface ExpensePdfInput {
  number: string;
  status: string;
  company: { name: string; address: string | null; phone: string | null; email: string | null };
  employee: {
    name: string;
    matricule: string;
    position: string | null;
    department: string | null;
    manager: string | null;
  };
  periodStart: Date;
  periodEnd: Date;
  categories: Array<{ label: string; weeks: number[]; total: number }>;
  weekTotals: number[];
  totalGross: number;
  advanceDeduction: number;
  netPayable: number;
  paymentMethod: string;
  observation: string | null;
  preparedBy: string;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  checkedBy: string | null;
  checkedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  CONFIRMED_N1: 'Confirmée N+1',
  CHECKED_HR_CG: 'Contrôlée RH/CG',
  ACCOUNTED: 'Comptabilisée',
  APPROVED_DG: 'Approuvée DG',
  READY_TO_PAY: 'Bon à payer',
  PAID: 'Payée',
  REJECTED: 'Rejetée',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: 'Virement bancaire',
  CASH: 'Espèces',
  CHECK: 'Chèque',
};

const fr = (date: Date | null | undefined): string =>
  date ? date.toLocaleDateString('fr-FR') : '—';

/* ── Éléments de mise en page (mêmes réglages que report-pdf.ts) ──── */

function rule(doc: Doc, y?: number): void {
  const at = y ?? doc.y;
  doc.save().strokeColor(RULE).lineWidth(0.5)
    .moveTo(PAGE.margin, at).lineTo(PAGE.margin + WIDTH, at).stroke().restore();
}

function ensure(doc: Doc, height: number): void {
  if (doc.y + height > doc.page.height - PAGE.margin - 24) doc.addPage();
}

function identityBlock(doc: Doc, entries: Array<[string, string]>): void {
  const columnWidth = (WIDTH - 32) / 3;

  for (let i = 0; i < entries.length; i += 3) {
    const trio = entries.slice(i, i + 3);
    doc.font('Helvetica').fontSize(9);
    const used = Math.max(
      ...trio.map(([, value]) => doc.heightOfString(value, { width: columnWidth })),
    );

    ensure(doc, 9 + used + 6);
    const y = doc.y;

    trio.forEach(([label, value], column) => {
      const x = PAGE.margin + column * (columnWidth + 16);
      doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
        .text(label.toUpperCase(), x, y, { width: columnWidth, characterSpacing: 0.3 });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK)
        .text(value, x, y + 10, { width: columnWidth });
    });

    doc.y = y + 10 + used + 8;
  }
}

/* ── Sections ─────────────────────────────────────────────────────── */

function header(doc: Doc, input: ExpensePdfInput): void {
  const y = PAGE.margin;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
    .text(input.company.name, PAGE.margin, y);
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text('Inspection · Testing · Engineering · Compliance', PAGE.margin, y + 16);

  doc.font('Helvetica-Bold').fontSize(15).fillColor(ACCENT)
    .text('NOTE DE FRAIS', PAGE.margin + WIDTH - 220, y, { width: 220, align: 'right' });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    .text('Décompte mensuel des déplacements', PAGE.margin + WIDTH - 220, y + 16, {
      width: 220,
      align: 'right',
    });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
    .text(
      `${input.number} · ${STATUS_LABELS[input.status] ?? input.status}`,
      PAGE.margin + WIDTH - 220,
      y + 28,
      { width: 220, align: 'right' },
    );

  doc.y = y + 48;
  rule(doc);
  doc.moveDown(0.8);

  identityBlock(doc, [
    ['Nom & prénom', input.employee.name],
    ['Fonction', input.employee.position ?? '—'],
    ['Période début', fr(input.periodStart)],
    ['Service', input.employee.department ?? '—'],
    ['Responsable', input.employee.manager ?? '—'],
    ['Période fin', fr(input.periodEnd)],
  ]);
}

function categoryGrid(doc: Doc, input: ExpensePdfInput): void {
  const posteWidth = 150;
  const weekWidth = 58;
  const totalWidth = WIDTH - posteWidth - weekWidth * 5;
  const headers = ['Poste', 'Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4', 'Semaine 5', 'Total poste'];
  const widths = [posteWidth, weekWidth, weekWidth, weekWidth, weekWidth, weekWidth, totalWidth];
  const colX = (i: number) => PAGE.margin + widths.slice(0, i).reduce((s, w) => s + w, 0);

  doc.moveDown(0.6);
  ensure(doc, 40);
  let y = doc.y;
  doc.save().rect(PAGE.margin, y, WIDTH, 16).fill(ACCENT).restore();
  headers.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#ffffff')
      .text(h, colX(i) + 4, y + 5, {
        width: widths[i] - 8,
        align: i === 0 ? 'left' : 'right',
      });
  });
  y += 16;

  input.categories.forEach((row, i) => {
    if (y + 16 > doc.page.height - PAGE.margin) {
      doc.addPage();
      y = doc.y;
    }
    doc.save().rect(PAGE.margin, y, WIDTH, 16).fill(i % 2 === 0 ? '#ffffff' : WASH).restore();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(INK)
      .text(row.label, colX(0) + 4, y + 4.5, { width: widths[0] - 8 });
    row.weeks.forEach((amount, w) => {
      doc.font('Helvetica').fontSize(8).fillColor(amount ? INK : MUTED)
        .text(amount ? dh(amount) : '—', colX(w + 1) + 4, y + 4.5, {
          width: widths[w + 1] - 8,
          align: 'right',
        });
    });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(INK)
      .text(dh(row.total), colX(6) + 4, y + 4.5, { width: widths[6] - 8, align: 'right' });
    y += 16;
  });

  if (y + 18 > doc.page.height - PAGE.margin) {
    doc.addPage();
    y = doc.y;
  }
  doc.save().rect(PAGE.margin, y, WIDTH, 18).fill(ACCENT).restore();
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
    .text('TOTAL SEMAINE', colX(0) + 4, y + 5, { width: widths[0] - 8 });
  input.weekTotals.forEach((amount, w) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
      .text(dh(amount), colX(w + 1) + 4, y + 5, { width: widths[w + 1] - 8, align: 'right' });
  });
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
    .text(dh(input.weekTotals.reduce((s, n) => s + n, 0)), colX(6) + 4, y + 5, {
      width: widths[6] - 8,
      align: 'right',
    });
  y += 18;

  doc.y = y + 8;
}

function synthese(doc: Doc, input: ExpensePdfInput): void {
  ensure(doc, 90);
  doc.moveDown(0.6);

  const boxWidth = (WIDTH - 16) / 2;
  const y = doc.y;

  doc.save().rect(PAGE.margin, y, boxWidth, 16).fill('#6e8f76').restore();
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
    .text('SYNTHÈSE', PAGE.margin + 8, y + 4.5, { width: boxWidth - 16 });
  doc.save().rect(PAGE.margin + boxWidth + 16, y, boxWidth, 16).fill('#6e8f76').restore();
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
    .text('MODALITÉS DE RÈGLEMENT', PAGE.margin + boxWidth + 24, y + 4.5, { width: boxWidth - 16 });

  const rows: Array<[string, string, boolean]> = [
    ['Total brut des frais', dh(input.totalGross), false],
    ...(input.advanceDeduction > 0
      ? ([['Moins retenue / avance', `- ${dh(input.advanceDeduction)}`, false]] as Array<
          [string, string, boolean]
        >)
      : []),
    ['Net à payer (DH)', dh(input.netPayable), true],
  ];

  let ry = y + 22;
  for (const [label, value, strong] of rows) {
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 10 : 9)
      .fillColor(strong ? ACCENT : MUTED)
      .text(label, PAGE.margin + 8, ry, { width: boxWidth - 116 });
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 10 : 9)
      .fillColor(strong ? ACCENT : INK)
      .text(value, PAGE.margin + boxWidth - 100, ry, { width: 92, align: 'right' });
    ry += strong ? 18 : 15;
  }

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK)
    .text(
      PAYMENT_METHOD_LABELS[input.paymentMethod] ?? input.paymentMethod,
      PAGE.margin + boxWidth + 24,
      y + 22,
      { width: boxWidth - 32 },
    );

  doc.y = Math.max(ry, y + 22 + 20) + 10;

  ensure(doc, 40);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK)
    .text('Observation', PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(9).fillColor(INK)
    .text(input.observation?.trim() || 'R.A.S.', PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.4);
}

function revisionFooter(doc: Doc, input: ExpensePdfInput): void {
  ensure(doc, 50);
  doc.moveDown(0.8);

  const cols: Array<[string, string]> = [
    ['Rev', '00'],
    ['Date', fr(input.periodEnd)],
    ['Description', 'Création'],
    ['Préparé par', input.preparedBy],
    ['Confirmé par', input.confirmedBy ?? '—'],
    ['Vérifié par', input.checkedBy ?? '—'],
    ['Approuvé par', input.approvedBy ?? '—'],
  ];
  const nameWidth = 84;
  const fixedWidth = 30 + 55 + nameWidth * 4;
  const colWidths = [30, 55, WIDTH - fixedWidth, nameWidth, nameWidth, nameWidth, nameWidth];

  let y = doc.y;
  doc.save().rect(PAGE.margin, y, WIDTH, 16).fill('#6e8f76').restore();
  let x = PAGE.margin;
  cols.forEach(([label], i) => {
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#ffffff')
      .text(label.toUpperCase(), x + 4, y + 5, { width: colWidths[i] - 8, characterSpacing: 0.2 });
    x += colWidths[i];
  });
  y += 16;

  doc.font('Helvetica-Bold').fontSize(8);
  const rowHeight =
    6 + Math.max(...cols.map(([, value], i) => doc.heightOfString(value, { width: colWidths[i] - 8 })));

  x = PAGE.margin;
  cols.forEach(([, value], i) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(INK)
      .text(value, x + 4, y + 5, { width: colWidths[i] - 8 });
    x += colWidths[i];
  });
  y += rowHeight;

  doc.save().strokeColor(RULE).lineWidth(0.3)
    .moveTo(PAGE.margin, y).lineTo(PAGE.margin + WIDTH, y).stroke().restore();

  doc.y = y + 6;
}

function footers(doc: Doc, input: ExpensePdfInput): void {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    const y = doc.page.height - PAGE.margin + 4;

    doc.save().strokeColor(RULE).lineWidth(0.5)
      .moveTo(PAGE.margin, y - 6).lineTo(PAGE.margin + WIDTH, y - 6).stroke().restore();

    doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
      .text(
        `${input.number} · ${input.company.name}` +
          (input.company.phone ? ` · ${input.company.phone}` : ''),
        PAGE.margin,
        y,
        { width: WIDTH - 80, lineBreak: false },
      )
      .text(`${i - range.start + 1} / ${range.count}`, PAGE.margin + WIDTH - 80, y, {
        width: 80,
        align: 'right',
        lineBreak: false,
      });
  }
}

/* ── Document ─────────────────────────────────────────────────────── */

export function renderExpensePdf(input: ExpensePdfInput): Promise<Buffer> {
  return new Promise((resolvePdf, reject) => {
    const doc = new PDFDocument({
      size: PAGE.size,
      margin: PAGE.margin,
      bufferPages: true,
      info: {
        Title: `${input.number} — Note de frais`,
        Author: input.company.name,
        Subject: input.employee.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolvePdf(Buffer.concat(chunks)));

    try {
      header(doc, input);
      categoryGrid(doc, input);
      synthese(doc, input);
      revisionFooter(doc, input);
      footers(doc, input);

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
