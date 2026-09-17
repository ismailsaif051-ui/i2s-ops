import PDFDocument from 'pdfkit';
import { dh } from '../common/pdf-format';

/**
 * Ordre de virement — pièce remise à la banque (ou classée en comptabilité)
 * pour régler une note de frais. Généré au clic sur « Enregistrer le
 * règlement » : il n'existe qu'une fois la note effectivement payée. Même
 * gabarit de page que expense-pdf.ts et mission-order-pdf.ts.
 */

const PAGE = { size: 'A4' as const, margin: 42 };
const WIDTH = 595.28 - PAGE.margin * 2;

const INK = '#1a1b18';
const MUTED = '#4a4f52';
const ACCENT = '#d14e27';
const RULE = '#c4bfb4';
const WASH = '#f4f2ed';

type Doc = PDFKit.PDFDocument;

export interface TransferOrderPdfInput {
  reference: string;
  company: { name: string; address: string | null; phone: string | null };
  issuedAt: Date;
  beneficiary: {
    name: string;
    matricule: string;
    position: string | null;
    department: string | null;
    bankName: string | null;
    bankRib: string | null;
  };
  expenseReportNumber: string;
  periodMonth: Date;
  amount: number;
  paymentMethod: string;
  bankReference: string | null;
  issuedBy: string | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: 'Virement bancaire',
  CASH: 'Espèces',
  CHECK: 'Chèque',
};

const fr = (date: Date | null | undefined): string =>
  date ? date.toLocaleDateString('fr-FR') : '—';

const monthLabel = (date: Date): string =>
  date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

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

function header(doc: Doc, input: TransferOrderPdfInput): void {
  const y = PAGE.margin;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
    .text(input.company.name, PAGE.margin, y);
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text('Inspection · Testing · Engineering · Compliance', PAGE.margin, y + 16);

  doc.font('Helvetica-Bold').fontSize(15).fillColor(ACCENT)
    .text('ORDRE DE VIREMENT', PAGE.margin + WIDTH - 220, y, { width: 220, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
    .text(input.reference, PAGE.margin + WIDTH - 220, y + 18, { width: 220, align: 'right' });

  doc.y = y + 38;
  rule(doc);
  doc.moveDown(0.8);

  keyValues(doc, [
    ['Date d’émission', fr(input.issuedAt)],
    ['Note de frais réglée', input.expenseReportNumber],
    ['Bénéficiaire', input.beneficiary.name],
    ['Matricule', input.beneficiary.matricule],
    ['Fonction', input.beneficiary.position ?? '—'],
    ['Département', input.beneficiary.department ?? '—'],
    ['Période concernée', monthLabel(input.periodMonth)],
    ['Mode de règlement', PAYMENT_METHOD_LABELS[input.paymentMethod] ?? input.paymentMethod],
  ]);
}

function bankBlock(doc: Doc, input: TransferOrderPdfInput): void {
  ensure(doc, 60);
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK)
    .text('Coordonnées bancaires du bénéficiaire', PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.2);

  keyValues(doc, [
    ['Banque', input.beneficiary.bankName ?? '—'],
    ['RIB', input.beneficiary.bankRib ?? '— (à compléter avant exécution)'],
  ]);

  if (input.bankReference) {
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
      .text(`Référence de virement : ${input.bankReference}`, PAGE.margin, doc.y, { width: WIDTH });
    doc.moveDown(0.4);
  }
}

function amountBox(doc: Doc, input: TransferOrderPdfInput): void {
  ensure(doc, 56);
  doc.moveDown(0.8);
  const y = doc.y;

  doc.save().rect(PAGE.margin, y, WIDTH, 44).fill(WASH).restore();
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    .text('MONTANT À VIRER', PAGE.margin + 16, y + 10, { characterSpacing: 0.3 });
  doc.font('Helvetica-Bold').fontSize(20).fillColor(ACCENT)
    .text(dh(input.amount), PAGE.margin + 16, y + 20, { width: WIDTH - 32 });

  doc.y = y + 44 + 10;
}

function signatureBlock(doc: Doc, input: TransferOrderPdfInput): void {
  ensure(doc, 80);
  doc.moveDown(1);
  rule(doc);
  doc.moveDown(0.6);

  const columnWidth = (WIDTH - 16) / 2;
  const y = doc.y;

  doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
    .text('ÉMIS PAR — RAF', PAGE.margin, y, { width: columnWidth, characterSpacing: 0.3 });
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK)
    .text(input.issuedBy ?? '—', PAGE.margin, y + 10, { width: columnWidth });
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text(`Le ${fr(input.issuedAt)}`, PAGE.margin, y + 24, { width: columnWidth });

  const x2 = PAGE.margin + columnWidth + 16;
  doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
    .text('VISA DIRECTION FINANCIÈRE', x2, y, { width: columnWidth, characterSpacing: 0.3 });
  doc.save().strokeColor(RULE).lineWidth(0.5)
    .moveTo(x2, y + 18).lineTo(x2 + columnWidth, y + 18).stroke().restore();
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text('Signature manuscrite — sans accord sur système', x2, y + 22, { width: columnWidth });

  doc.y = y + 40;
}

function footers(doc: Doc, input: TransferOrderPdfInput): void {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    const y = doc.page.height - PAGE.margin + 4;

    doc.save().strokeColor(RULE).lineWidth(0.5)
      .moveTo(PAGE.margin, y - 6).lineTo(PAGE.margin + WIDTH, y - 6).stroke().restore();

    doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
      .text(
        `${input.reference} · ${input.company.name}` +
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

export function renderTransferOrderPdf(input: TransferOrderPdfInput): Promise<Buffer> {
  return new Promise((resolvePdf, reject) => {
    const doc = new PDFDocument({
      size: PAGE.size,
      margin: PAGE.margin,
      bufferPages: true,
      info: {
        Title: `${input.reference} — Ordre de virement`,
        Author: input.company.name,
        Subject: input.beneficiary.name,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolvePdf(Buffer.concat(chunks)));

    try {
      header(doc, input);
      bankBlock(doc, input);
      amountBox(doc, input);
      signatureBlock(doc, input);
      footers(doc, input);

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
