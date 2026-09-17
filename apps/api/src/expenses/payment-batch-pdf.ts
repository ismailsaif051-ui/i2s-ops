import PDFDocument from 'pdfkit';
import { dh } from '../common/pdf-format';

/**
 * Ordre de virement groupé — la pièce que RAF remet à la banque pour régler
 * en une fois tous les bénéficiaires d'un lot préparé et validé par RH.
 * Même gabarit de page que les autres PDF du module frais.
 */

const PAGE = { size: 'A4' as const, margin: 42 };
const WIDTH = 595.28 - PAGE.margin * 2;

const INK = '#1a1b18';
const MUTED = '#4a4f52';
const ACCENT = '#d14e27';
const RULE = '#c4bfb4';
const WASH = '#f4f2ed';

type Doc = PDFKit.PDFDocument;

export interface PaymentBatchPdfLine {
  beneficiary: string;
  matricule: string;
  department: string | null;
  bankName: string | null;
  bankRib: string | null;
  reportNumber: string;
  amount: number;
}

export interface PaymentBatchPdfInput {
  number: string;
  status: string;
  company: { name: string; address: string | null; phone: string | null };
  createdAt: Date;
  lines: PaymentBatchPdfLine[];
  totalAmount: number;
  preparedBy: string | null;
  validatedBy: string | null;
  validatedAt: Date | null;
  paidBy: string | null;
  paidAt: Date | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'En préparation',
  VALIDATED: 'Validé — en attente de règlement',
  PAID: 'Réglé',
};

const fr = (date: Date | null | undefined): string =>
  date ? date.toLocaleDateString('fr-FR') : '—';

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
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK)
        .text(value, x, y + 9, { width: columnWidth });
    });

    doc.y = y + 9 + used + 8;
  }
}

function header(doc: Doc, input: PaymentBatchPdfInput): void {
  const y = PAGE.margin;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
    .text(input.company.name, PAGE.margin, y);
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text('Inspection · Testing · Engineering · Compliance', PAGE.margin, y + 16);

  doc.font('Helvetica-Bold').fontSize(15).fillColor(ACCENT)
    .text('ORDRE DE VIREMENT GROUPÉ', PAGE.margin + WIDTH - 260, y, { width: 260, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
    .text(input.number, PAGE.margin + WIDTH - 260, y + 18, { width: 260, align: 'right' });

  doc.y = y + 38;
  rule(doc);
  doc.moveDown(0.8);

  keyValues(doc, [
    ['Date de préparation', fr(input.createdAt)],
    ['Statut', STATUS_LABELS[input.status] ?? input.status],
    ['Bénéficiaires', String(input.lines.length)],
    ['Montant total', dh(input.totalAmount)],
  ]);
}

function beneficiaryTable(doc: Doc, lines: PaymentBatchPdfLine[]): void {
  const widths = [100, 50, 75, 120, 80, WIDTH - 100 - 50 - 75 - 120 - 80];
  const headers = ['Bénéficiaire', 'Matricule', 'Banque', 'RIB', 'Note', 'Montant'];
  const colX = (i: number) => PAGE.margin + widths.slice(0, i).reduce((s, w) => s + w, 0);

  doc.moveDown(0.6);
  ensure(doc, 40);
  let y = doc.y;
  doc.save().rect(PAGE.margin, y, WIDTH, 16).fill(ACCENT).restore();
  headers.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#ffffff')
      .text(h, colX(i) + 4, y + 5, {
        width: widths[i] - 8,
        align: i === headers.length - 1 ? 'right' : 'left',
        lineBreak: false,
      });
  });
  y += 16;

  lines.forEach((line, i) => {
    if (y + 16 > doc.page.height - PAGE.margin) {
      doc.addPage();
      y = doc.y;
    }
    doc.save().rect(PAGE.margin, y, WIDTH, 16).fill(i % 2 === 0 ? '#ffffff' : WASH).restore();

    doc.font('Helvetica-Bold').fontSize(8).fillColor(INK)
      .text(line.beneficiary, colX(0) + 4, y + 4.5, { width: widths[0] - 8, height: 10, ellipsis: true });
    doc.font('Helvetica').fontSize(8).fillColor(INK)
      .text(line.matricule, colX(1) + 4, y + 4.5, { width: widths[1] - 8, height: 10, ellipsis: true });
    doc.font('Helvetica').fontSize(7.5).fillColor(line.bankName ? INK : MUTED)
      .text(line.bankName ?? '—', colX(2) + 4, y + 4.5, {
        width: widths[2] - 8,
        height: 10,
        ellipsis: true,
      });
    doc.font('Helvetica').fontSize(7).fillColor(line.bankRib ? INK : MUTED)
      .text(line.bankRib ?? 'à compléter', colX(3) + 4, y + 4.5, {
        width: widths[3] - 8,
        height: 9,
        ellipsis: true,
        characterSpacing: 0.1,
      });
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(line.reportNumber, colX(4) + 4, y + 4.5, { width: widths[4] - 8, height: 10, ellipsis: true });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(INK)
      .text(dh(line.amount), colX(5) + 4, y + 4.5, { width: widths[5] - 8, align: 'right' });

    y += 16;
  });

  if (y + 18 > doc.page.height - PAGE.margin) {
    doc.addPage();
    y = doc.y;
  }
  const total = lines.reduce((s, l) => s + l.amount, 0);
  doc.save().rect(PAGE.margin, y, WIDTH, 18).fill(ACCENT).restore();
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff')
    .text('TOTAL', colX(0) + 4, y + 5, { width: widths[0] - 8 });
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff')
    .text(dh(total), colX(5) + 4, y + 5, { width: widths[5] - 8, align: 'right' });
  y += 18;

  doc.y = y + 8;
}

function signatureBox(
  doc: Doc,
  x: number,
  width: number,
  label: string,
  name: string | null,
  caption: string,
): void {
  const y = doc.y;
  doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
    .text(label, x, y, { width, characterSpacing: 0.3 });
  if (name) {
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK).text(name, x, y + 10, { width });
  } else {
    doc.save().strokeColor(RULE).lineWidth(0.5)
      .moveTo(x, y + 18).lineTo(x + width, y + 18).stroke().restore();
  }
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text(caption, x, y + 22, { width });
}

function signatureBlock(doc: Doc, input: PaymentBatchPdfInput): void {
  ensure(doc, 100);
  doc.moveDown(1);
  rule(doc);
  doc.moveDown(0.6);

  const columnWidth = (WIDTH - 32) / 3;
  const top = doc.y;

  signatureBox(doc, PAGE.margin, columnWidth, 'PRÉPARÉ PAR — RH', input.preparedBy, 'Le ' + fr(input.createdAt));
  doc.y = top;
  signatureBox(
    doc,
    PAGE.margin + columnWidth + 16,
    columnWidth,
    'VALIDÉ PAR — RH',
    input.validatedBy,
    input.validatedAt ? `Le ${fr(input.validatedAt)}` : '—',
  );
  doc.y = top;
  signatureBox(
    doc,
    PAGE.margin + 2 * (columnWidth + 16),
    columnWidth,
    'EXÉCUTÉ PAR — RAF',
    input.paidBy,
    input.paidAt ? `Le ${fr(input.paidAt)}` : '—',
  );

  doc.y = top + 40;
}

function footers(doc: Doc, input: PaymentBatchPdfInput): void {
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

export function renderPaymentBatchPdf(input: PaymentBatchPdfInput): Promise<Buffer> {
  return new Promise((resolvePdf, reject) => {
    const doc = new PDFDocument({
      size: PAGE.size,
      margin: PAGE.margin,
      bufferPages: true,
      info: {
        Title: `${input.number} — Ordre de virement groupé`,
        Author: input.company.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolvePdf(Buffer.concat(chunks)));

    try {
      header(doc, input);
      beneficiaryTable(doc, input.lines);
      signatureBlock(doc, input);
      footers(doc, input);

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
