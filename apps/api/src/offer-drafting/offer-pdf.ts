import PDFDocument from 'pdfkit';
import { NATURE_LABELS, NATURE_SECTIONS, SECTIONS } from './offer-drafting.prompt';
import type { OfferDocumentNature } from './offer-drafting.types';
import { dh } from '../common/pdf-format';

type Doc = PDFKit.PDFDocument;

const PAGE = { size: 'A4' as const, margin: 48 };
const WIDTH = 595.28 - PAGE.margin * 2;

const INK = '#1a1b18';
const MUTED = '#4a4f52';
const ACCENT = '#d14e27';
const RULE = '#c4bfb4';
const WASH = '#f4f2ed';

export interface OfferPdfInput {
  company: { name: string; address: string | null; city: string | null; phone: string | null; email: string | null; ice: string | null };
  offer: {
    number: string;
    version: number;
    amountHT: number;
    validUntil: Date | null;
    status: string;
  };
  client: { name: string; city: string | null; address: string | null };
  title: string;
  tender: { reference: string; publisher: string | null } | null;
  nature: OfferDocumentNature;
  reviewed: boolean;
  sections: Record<string, string>;
  lines: Array<{
    designation: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amountHT: number;
  }>;
  vatRate: number;
}

const money = dh;

const fr = (date: Date | null): string =>
  date ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

/** Passe à la page suivante s'il ne reste pas la place demandée. */
function ensure(doc: Doc, height: number): void {
  if (doc.y + height > doc.page.height - PAGE.margin - 28) doc.addPage();
}

function rule(doc: Doc): void {
  doc
    .moveTo(PAGE.margin, doc.y)
    .lineTo(PAGE.margin + WIDTH, doc.y)
    .lineWidth(0.5)
    .strokeColor(RULE)
    .stroke();
  doc.moveDown(0.6);
}

/**
 * Le document d'offre.
 *
 * Le texte vient de la rédaction relue ; le tableau des prix est construit ici
 * à partir des lignes de l'offre en base. Les deux ne se rencontrent qu'à la
 * mise en page — le modèle n'a jamais vu un prix, et n'en a donc écrit aucun.
 */
export function buildOfferPdf(input: OfferPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ ...PAGE, bufferPages: true, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  header(doc, input);
  body(doc, input);
  if (input.nature !== 'TECHNIQUE') prices(doc, input);
  signature(doc, input);
  footers(doc, input);

  doc.end();
  return done;
}

function header(doc: Doc, input: OfferPdfInput): void {
  doc.font('Helvetica-Bold').fontSize(15).fillColor(INK).text(input.company.name, { continued: false });

  const coords = [input.company.address, input.company.city, input.company.phone, input.company.email]
    .filter(Boolean)
    .join(' · ');
  if (coords) doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(coords);
  if (input.company.ice) doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(`ICE ${input.company.ice}`);

  doc.moveDown(1);
  rule(doc);

  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(ACCENT)
    .text(NATURE_LABELS[input.nature].toUpperCase());

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(MUTED)
    .text(`${input.offer.number} — version ${input.offer.version}`);

  doc.moveDown(0.8);

  // Bloc client / objet, dans un lavis pour le détacher du corps du texte.
  const top = doc.y;
  const entries: Array<[string, string]> = [
    ['Client', input.client.name],
    ['Lieu', input.client.city ?? '—'],
    ['Objet', input.title],
    ['Validité de l’offre', fr(input.offer.validUntil)],
  ];
  if (input.tender) {
    entries.push(['Appel d’offres', input.tender.reference]);
    if (input.tender.publisher) entries.push(['Émetteur', input.tender.publisher]);
  }

  const lineHeight = 15;
  const boxHeight = entries.length * lineHeight + 14;
  doc.rect(PAGE.margin, top, WIDTH, boxHeight).fillColor(WASH).fill();

  let y = top + 8;
  for (const [label, value] of entries) {
    doc.font('Helvetica').fontSize(7).fillColor(MUTED).text(label.toUpperCase(), PAGE.margin + 10, y, {
      width: 110,
    });
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(INK)
      .text(value, PAGE.margin + 128, y - 1.5, { width: WIDTH - 138, ellipsis: true, height: 12 });
    y += lineHeight;
  }

  doc.y = top + boxHeight + 16;
  doc.x = PAGE.margin;
}

function body(doc: Doc, input: OfferPdfInput): void {
  let index = 1;

  for (const key of NATURE_SECTIONS[input.nature]) {
    const text = input.sections[key]?.trim();
    if (!text) continue;

    const label = `${index}. ${SECTIONS[key].label}`;

    doc.font('Helvetica-Bold').fontSize(10);
    const titleHeight = doc.heightOfString(label, { width: WIDTH });
    doc.font('Helvetica').fontSize(9);
    const textHeight = doc.heightOfString(text, { width: WIDTH, lineGap: 1.6 });

    // On ne laisse jamais un titre seul en bas de page.
    ensure(doc, titleHeight + Math.min(textHeight, 60) + 14);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(ACCENT).text(label, PAGE.margin, doc.y, {
      width: WIDTH,
    });
    doc.moveDown(0.35);

    doc.font('Helvetica').fontSize(9).fillColor(INK).text(text, PAGE.margin, doc.y, {
      width: WIDTH,
      align: 'justify',
      lineGap: 1.6,
    });

    doc.moveDown(1);
    index += 1;
  }
}

/**
 * Le tableau des prix.
 *
 * Les montants sortent des lignes de l'offre, et le total est recalculé ici :
 * un document client ne recopie pas un total, il l'additionne.
 */
function prices(doc: Doc, input: OfferPdfInput): void {
  const rowHeight = 22;
  ensure(doc, 90 + rowHeight * Math.min(input.lines.length, 4));

  doc.font('Helvetica-Bold').fontSize(10).fillColor(ACCENT).text('Bordereau des prix', PAGE.margin, doc.y, {
    width: WIDTH,
  });
  doc.moveDown(0.5);

  const cols = [
    { label: 'Désignation', width: WIDTH - 250, align: 'left' as const },
    { label: 'Unité', width: 60, align: 'left' as const },
    { label: 'Qté', width: 45, align: 'right' as const },
    { label: 'P.U. HT', width: 70, align: 'right' as const },
    { label: 'Montant HT', width: 75, align: 'right' as const },
  ];

  function row(cells: string[], bold: boolean, y: number): void {
    let x = PAGE.margin;
    cells.forEach((cell, i) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .fillColor(bold ? INK : INK)
        .text(cell, x + 4, y + 6, { width: cols[i].width - 8, align: cols[i].align, ellipsis: true, height: 11 });
      x += cols[i].width;
    });
  }

  // En-tête
  let y = doc.y;
  doc.rect(PAGE.margin, y, WIDTH, rowHeight).fillColor(WASH).fill();
  let x = PAGE.margin;
  cols.forEach((c) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor(MUTED)
      .text(c.label.toUpperCase(), x + 4, y + 8, { width: c.width - 8, align: c.align });
    x += c.width;
  });
  y += rowHeight;

  let total = 0;
  for (const line of input.lines) {
    if (y + rowHeight > doc.page.height - PAGE.margin - 90) {
      doc.addPage();
      y = doc.y;
    }

    row(
      [
        line.designation,
        line.unit,
        String(line.quantity),
        money(line.unitPrice),
        money(line.amountHT),
      ],
      false,
      y,
    );

    doc
      .moveTo(PAGE.margin, y + rowHeight)
      .lineTo(PAGE.margin + WIDTH, y + rowHeight)
      .lineWidth(0.4)
      .strokeColor(RULE)
      .stroke();

    total += line.amountHT;
    y += rowHeight;
  }

  const vat = Math.round(total * input.vatRate) / 100;
  const totals: Array<[string, string]> = [
    ['Total HT', money(total)],
    [`TVA ${input.vatRate} %`, money(vat)],
    ['Total TTC', money(total + vat)],
  ];

  for (const [label, value] of totals) {
    const bold = label === 'Total TTC';
    doc
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 9.5 : 8.5)
      .fillColor(INK)
      .text(label, PAGE.margin + WIDTH - 260, y + 6, { width: 160, align: 'right' });
    doc
      .font('Helvetica-Bold')
      .fontSize(bold ? 9.5 : 8.5)
      .fillColor(bold ? ACCENT : INK)
      .text(value, PAGE.margin + WIDTH - 95, y + 6, { width: 95, align: 'right' });
    y += 18;
  }

  doc.y = y + 12;
  doc.x = PAGE.margin;
}

function signature(doc: Doc, input: OfferPdfInput): void {
  ensure(doc, 70);
  rule(doc);

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      input.reviewed
        ? 'Offre établie par I2S TESTING. Sauf mention contraire, les prix s’entendent hors taxes, hors accès et hors moyens de mise à disposition.'
        : 'PROJET — texte non relu. Ce document ne doit pas être remis au client en l’état.',
      PAGE.margin,
      doc.y,
      { width: WIDTH },
    );
}

/**
 * Pieds de page.
 *
 * Écrits dans la marge basse : la marge inférieure est mise à zéro le temps de
 * l'écriture, sinon pdfkit ajoute une page à chaque pied.
 */
function footers(doc: Doc, input: OfferPdfInput): void {
  const range = doc.bufferedPageRange();
  const bottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);

    const y = doc.page.height - 34;
    doc
      .moveTo(PAGE.margin, y - 8)
      .lineTo(PAGE.margin + WIDTH, y - 8)
      .lineWidth(0.4)
      .strokeColor(RULE)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(MUTED)
      .text(
        `${input.offer.number} v${input.offer.version} — ${input.client.name}`,
        PAGE.margin,
        y,
        { width: WIDTH - 80, align: 'left' },
      );

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(MUTED)
      .text(`${i + 1} / ${range.count}`, PAGE.margin + WIDTH - 80, y, {
        width: 80,
        align: 'right',
      });
  }

  doc.page.margins.bottom = bottom;
}
