import PDFDocument from 'pdfkit';

/**
 * Rendu PDF de la note de frais.
 *
 * C'est la pièce que le collaborateur imprime pour y agrafer ses
 * justificatifs, et celle que le circuit de visa (docs/05-WORKFLOWS.md, W7)
 * remet à chaque signataire. Même gabarit que report-pdf.ts — même charte,
 * mêmes réglages de page — pour que les deux documents remis par I2S se
 * ressemblent.
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
  type: 'MISSION' | 'OFF_MISSION';
  month: string; // AAAA-MM
  company: { name: string; address: string | null; phone: string | null; email: string | null };
  employee: { name: string; matricule: string; department: string | null };
  lines: Array<{
    date: Date;
    category: string;
    reference: string | null;
    description: string | null;
    amount: number;
  }>;
  totalGross: number;
  advanceDeduction: number;
  netPayable: number;
  approvals: Array<{ label: string; decision: string; decidedAt: Date | null }>;
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

const fr = (date: Date | null | undefined): string =>
  date ? date.toLocaleDateString('fr-FR') : '—';

const dh = (amount: number): string =>
  `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;

const monthLabel = (month: string): string => {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
};

/* ── Éléments de mise en page (mêmes réglages que report-pdf.ts) ──── */

function rule(doc: Doc, y?: number): void {
  const at = y ?? doc.y;
  doc.save().strokeColor(RULE).lineWidth(0.5)
    .moveTo(PAGE.margin, at).lineTo(PAGE.margin + WIDTH, at).stroke().restore();
}

function ensure(doc: Doc, height: number): void {
  if (doc.y + height > doc.page.height - PAGE.margin - 24) doc.addPage();
}

function keyValues(doc: Doc, entries: Array<[string, string]>): void {
  const columnWidth = (WIDTH - 16) / 2;

  for (let i = 0; i < entries.length; i += 2) {
    const pair = entries.slice(i, i + 2);

    doc.font('Helvetica').fontSize(9);
    const used = Math.max(
      ...pair.map(([, value]) => doc.heightOfString(value, { width: columnWidth })),
    );

    ensure(doc, 9 + used + 6);
    const y = doc.y;

    pair.forEach(([label, value], column) => {
      const x = PAGE.margin + column * (columnWidth + 16);
      doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
        .text(label.toUpperCase(), x, y, { width: columnWidth, characterSpacing: 0.3 });
      doc.font('Helvetica').fontSize(9).fillColor(INK)
        .text(value, x, y + 9, { width: columnWidth });
    });

    doc.y = y + 9 + used + 6;
  }
}

function table(doc: Doc, headers: string[], widths: number[], rows: string[][]): void {
  if (rows.length === 0) {
    ensure(doc, 20);
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED)
      .text('Aucune ligne saisie.', PAGE.margin, doc.y, { width: WIDTH });
    doc.moveDown(0.4);
    return;
  }

  const colX = (i: number) => PAGE.margin + widths.slice(0, i).reduce((s, w) => s + w, 0);

  ensure(doc, 40);
  let y = doc.y;
  doc.save().rect(PAGE.margin, y, WIDTH, 16).fill(WASH).restore();
  headers.forEach((header, i) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED)
      .text(header, colX(i) + 4, y + 5, { width: widths[i] - 8, lineBreak: false, ellipsis: true });
  });
  y += 16;

  for (const row of rows) {
    doc.font('Helvetica').fontSize(8);
    const height = Math.max(
      16,
      ...row.map((cell, i) => doc.heightOfString(cell, { width: widths[i] - 8 }) + 8),
    );

    if (y + height > doc.page.height - PAGE.margin) {
      doc.addPage();
      y = doc.y;
    }

    row.forEach((cell, i) => {
      doc.font('Helvetica').fontSize(8).fillColor(INK)
        .text(cell, colX(i) + 4, y + 4, {
          width: widths[i] - 8,
          align: i === row.length - 1 ? 'right' : 'left',
        });
    });

    y += height;
    doc.save().strokeColor(RULE).lineWidth(0.3)
      .moveTo(PAGE.margin, y).lineTo(PAGE.margin + WIDTH, y).stroke().restore();
  }

  doc.y = y + 6;
}

/* ── Sections ─────────────────────────────────────────────────────── */

function header(doc: Doc, input: ExpensePdfInput): void {
  const y = PAGE.margin;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
    .text(input.company.name, PAGE.margin, y);
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text('Inspection · Testing · Engineering · Compliance', PAGE.margin, y + 16);

  doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT)
    .text(input.number, PAGE.margin + WIDTH - 200, y, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    .text(STATUS_LABELS[input.status] ?? input.status, PAGE.margin + WIDTH - 200, y + 15, {
      width: 200,
      align: 'right',
    });

  doc.y = y + 34;
  rule(doc);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(14).fillColor(INK)
    .text('Note de frais', PAGE.margin, doc.y, { width: WIDTH });
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED)
    .text(
      input.type === 'MISSION' ? 'Frais de mission' : 'Frais hors mission',
      PAGE.margin,
      doc.y + 2,
      { width: WIDTH },
    );
  doc.moveDown(0.6);

  keyValues(doc, [
    ['Collaborateur', input.employee.name],
    ['Matricule', input.employee.matricule],
    ['Département', input.employee.department ?? '—'],
    ['Période', monthLabel(input.month)],
  ]);
}

function totals(doc: Doc, input: ExpensePdfInput): void {
  ensure(doc, 70);
  doc.moveDown(0.4);

  const rows: Array<[string, string, boolean]> = [
    ['Total brut', dh(input.totalGross), false],
    ...(input.advanceDeduction > 0
      ? ([['Avance déduite', `− ${dh(input.advanceDeduction)}`, false]] as Array<[string, string, boolean]>)
      : []),
    ['Net à payer', dh(input.netPayable), true],
  ];

  const boxWidth = 220;
  const x = PAGE.margin + WIDTH - boxWidth;
  let y = doc.y;

  for (const [label, value, strong] of rows) {
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 10.5 : 9)
      .fillColor(strong ? ACCENT : MUTED)
      .text(label, x, y, { width: boxWidth - 100 });
    doc.font(strong ? 'Helvetica-Bold' : 'Helvetica').fontSize(strong ? 10.5 : 9)
      .fillColor(strong ? ACCENT : INK)
      .text(value, x + boxWidth - 100, y, { width: 100, align: 'right' });
    y += strong ? 18 : 14;
  }

  doc.y = y + 6;
}

function signatures(doc: Doc, input: ExpensePdfInput): void {
  ensure(doc, 110);
  doc.moveDown(1);
  rule(doc);
  doc.moveDown(0.6);

  const columns: Array<[string, string, string]> = [
    ['Demandeur', input.employee.name, ''],
    ...input.approvals.map(
      (a): [string, string, string] => [
        a.label,
        a.decision === 'APPROVED' ? 'Visé' : a.decision === 'REJECTED' ? 'Rejeté' : 'Retourné',
        fr(a.decidedAt),
      ],
    ),
  ];

  const columnWidth = WIDTH / Math.max(columns.length, 1);
  const y = doc.y;

  columns.forEach(([label, name, date], i) => {
    const x = PAGE.margin + i * columnWidth;
    doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
      .text(label.toUpperCase(), x, y, { width: columnWidth - 12, characterSpacing: 0.3 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK)
      .text(name, x, y + 10, { width: columnWidth - 12 });
    if (date) {
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
        .text(date, x, y + 22, { width: columnWidth - 12 });
    }
    doc.save().strokeColor(RULE).lineWidth(0.5)
      .moveTo(x, y + 62).lineTo(x + columnWidth - 16, y + 62).stroke().restore();
  });

  doc.y = y + 70;
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

      doc.moveDown(0.4);
      table(
        doc,
        ['Date', 'Catégorie', 'Référence', 'Description', 'Montant'],
        [55, 130, 75, WIDTH - 55 - 130 - 75 - 90, 90],
        input.lines.map((l) => [
          fr(l.date),
          l.category,
          l.reference ?? '—',
          l.description ?? '—',
          dh(l.amount),
        ]),
      );

      totals(doc, input);
      signatures(doc, input);
      footers(doc, input);

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
