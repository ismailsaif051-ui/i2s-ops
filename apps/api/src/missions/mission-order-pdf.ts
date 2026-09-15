import PDFDocument from 'pdfkit';

/**
 * Rendu PDF de l'ordre de mission signé.
 *
 * docs/05-WORKFLOWS.md (W3) : « Signature : identité authentifiée + horodatage
 * serveur + empreinte SHA-256 du PDF + adresse IP. Le PDF signé devient
 * immuable. » C'est la pièce que l'inspecteur emporte sur site — même
 * gabarit que report-pdf.ts et expense-pdf.ts.
 */

const PAGE = { size: 'A4' as const, margin: 42 };
const WIDTH = 595.28 - PAGE.margin * 2;

const INK = '#1a1b18';
const MUTED = '#4a4f52';
const ACCENT = '#d14e27';
const RULE = '#c4bfb4';
const WASH = '#f4f2ed';

type Doc = PDFKit.PDFDocument;

export interface MissionOrderPdfInput {
  number: string;
  object: string;
  instructions: string | null;
  hseInstructions: string | null;
  company: { name: string; address: string | null; phone: string | null };
  client: string;
  affair: { number: string; title: string };
  mission: { number: string; plannedStartDate: Date | null; plannedEndDate: Date | null };
  site: { name: string; city: string | null } | null;
  vehicle: string | null;
  team: Array<{ name: string; matricule: string; role: string }>;
  signedBy: string | null;
  signedAt: Date | null;
  signatureHash: string | null;
  signatureIp: string | null;
}

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
      doc.font('Helvetica').fontSize(9).fillColor(INK)
        .text(value, x, y + 9, { width: columnWidth });
    });

    doc.y = y + 9 + used + 6;
  }
}

function paragraph(doc: Doc, label: string, body: string): void {
  ensure(doc, 40);
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK)
    .text(label, PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(9).fillColor(INK)
    .text(body, PAGE.margin, doc.y, { width: WIDTH });
}

function teamTable(doc: Doc, team: MissionOrderPdfInput['team']): void {
  ensure(doc, 40);
  doc.moveDown(0.6);
  const columnWidth = WIDTH / 3;
  let y = doc.y;
  doc.save().rect(PAGE.margin, y, WIDTH, 16).fill(WASH).restore();
  ['Intervenant', 'Matricule', 'Rôle'].forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED)
      .text(h, PAGE.margin + i * columnWidth + 4, y + 5, { width: columnWidth - 8 });
  });
  y += 16;

  for (const member of team) {
    if (y + 16 > doc.page.height - PAGE.margin) {
      doc.addPage();
      y = doc.y;
    }
    doc.font('Helvetica').fontSize(8.5).fillColor(INK)
      .text(member.name, PAGE.margin + 4, y + 4, { width: columnWidth - 8 });
    doc.font('Helvetica').fontSize(8.5).fillColor(INK)
      .text(member.matricule, PAGE.margin + columnWidth + 4, y + 4, { width: columnWidth - 8 });
    doc.font('Helvetica').fontSize(8.5).fillColor(INK)
      .text(member.role, PAGE.margin + 2 * columnWidth + 4, y + 4, { width: columnWidth - 8 });
    y += 16;
    doc.save().strokeColor(RULE).lineWidth(0.3)
      .moveTo(PAGE.margin, y).lineTo(PAGE.margin + WIDTH, y).stroke().restore();
  }

  doc.y = y + 6;
}

function header(doc: Doc, input: MissionOrderPdfInput): void {
  const y = PAGE.margin;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
    .text(input.company.name, PAGE.margin, y);
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text('Inspection · Testing · Engineering · Compliance', PAGE.margin, y + 16);

  doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT)
    .text(input.number, PAGE.margin + WIDTH - 200, y, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    .text('Ordre de mission signé', PAGE.margin + WIDTH - 200, y + 15, {
      width: 200,
      align: 'right',
    });

  doc.y = y + 34;
  rule(doc);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(14).fillColor(INK)
    .text(input.object, PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.6);

  keyValues(doc, [
    ['Client', input.client],
    ['Affaire', `${input.affair.number} — ${input.affair.title}`],
    ['Mission', input.mission.number],
    ['Site', input.site ? `${input.site.name}${input.site.city ? ' — ' + input.site.city : ''}` : '—'],
    ['Début prévu', fr(input.mission.plannedStartDate)],
    ['Fin prévue', fr(input.mission.plannedEndDate)],
    ['Véhicule', input.vehicle ?? '—'],
  ]);
}

function signatureBlock(doc: Doc, input: MissionOrderPdfInput): void {
  ensure(doc, 90);
  doc.moveDown(1);
  rule(doc);
  doc.moveDown(0.6);

  doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
    .text('SIGNÉ PAR', PAGE.margin, doc.y, { characterSpacing: 0.3 });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(INK)
    .text(input.signedBy ?? '—', PAGE.margin, doc.y + 2);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    .text(
      input.signedAt
        ? `Le ${input.signedAt.toLocaleDateString('fr-FR')} à ${input.signedAt.toLocaleTimeString('fr-FR')}` +
            (input.signatureIp ? ` · IP ${input.signatureIp}` : '')
        : '—',
      PAGE.margin,
      doc.y + 2,
    );
  if (input.signatureHash) {
    doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
      .text(`Empreinte SHA-256 · ${input.signatureHash}`, PAGE.margin, doc.y + 4, {
        width: WIDTH,
        characterSpacing: 0.2,
      });
  }
  doc.moveDown(0.6);
}

function footers(doc: Doc, input: MissionOrderPdfInput): void {
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

export function renderMissionOrderPdf(input: MissionOrderPdfInput): Promise<Buffer> {
  return new Promise((resolvePdf, reject) => {
    const doc = new PDFDocument({
      size: PAGE.size,
      margin: PAGE.margin,
      bufferPages: true,
      info: {
        Title: `${input.number} — Ordre de mission`,
        Author: input.company.name,
        Subject: `${input.affair.number} · ${input.client}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolvePdf(Buffer.concat(chunks)));

    try {
      header(doc, input);

      if (input.instructions) paragraph(doc, 'Instructions', input.instructions);
      if (input.hseInstructions) paragraph(doc, 'Consignes HSE', input.hseInstructions);

      ensure(doc, 30);
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK)
        .text('Intervenants désignés', PAGE.margin, doc.y, { width: WIDTH });
      teamTable(doc, input.team);

      signatureBlock(doc, input);
      footers(doc, input);

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
