import PDFDocument from 'pdfkit';
import type { TemplateSchema, TemplateSection } from '@i2s/contracts';

/**
 * Rendu PDF d'un rapport d'inspection.
 *
 * Le document est produit à partir du schéma du formulaire, comme l'écran de
 * saisie : les 61 formulaires du référentiel passent par ce seul rendu, et un
 * formulaire ajouté demain sortira sans qu'on touche à ce fichier.
 *
 * Ce PDF est la pièce remise au client. Il porte donc ce qui l'engage — numéro,
 * révision, rédacteur, vérificateur, grille de vérification visée — et rien
 * qui ne soit pas dans le rapport.
 */

/* ── Gabarit ──────────────────────────────────────────────────────── */

const PAGE = { size: 'A4' as const, margin: 42 };
const WIDTH = 595.28 - PAGE.margin * 2;

const INK = '#1a1b18';
const MUTED = '#4a4f52';
const ACCENT = '#d14e27';
const RULE = '#c4bfb4';
const WASH = '#f4f2ed';
const NC = '#8c2f1e';

type Doc = PDFKit.PDFDocument;

export interface ReportPdfInput {
  number: string;
  revision: number;
  status: string;
  company: { name: string; address: string | null; phone: string | null; email: string | null };
  client: string;
  affair: { number: string; title: string };
  mission: { number: string; site: string | null };
  template: { formCode: string; version: string; title: string; titleEn: string | null };
  inspection: { date: Date; data: Record<string, unknown>; schema: TemplateSchema } | null;
  devices: Array<{ code: string; designation: string; validUntil: Date | null }>;
  author: string;
  checker: string | null;
  submittedAt: Date | null;
  checkedAt: Date | null;
  issuedAt: Date | null;
  checks: Array<{ criterion: string; applicable: boolean; conform: boolean | null; comment: string | null }>;
}

const fr = (date: Date | null | undefined): string =>
  date ? date.toLocaleDateString('fr-FR') : '—';

/** Rend une valeur brute lisible, quel que soit son type dans le JSON. */
function text(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.map(text).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const VERDICTS: Record<string, string> = {
  C: 'Conforme',
  NC: 'Non conforme',
  SO: 'Sans objet',
  NA: 'Non applicable',
};

/* ── Éléments de mise en page ─────────────────────────────────────── */

function rule(doc: Doc, y?: number): void {
  const at = y ?? doc.y;
  doc.save().strokeColor(RULE).lineWidth(0.5)
    .moveTo(PAGE.margin, at).lineTo(PAGE.margin + WIDTH, at).stroke().restore();
}

function sectionTitle(doc: Doc, index: number, section: TemplateSection): void {
  ensure(doc, 60);
  doc.moveDown(0.8);

  const y = doc.y;
  doc.save()
    .rect(PAGE.margin, y - 3, WIDTH, 20).fill(WASH)
    .fillColor(ACCENT).font('Helvetica-Bold').fontSize(8)
    .text(String(index).padStart(2, '0'), PAGE.margin + 6, y + 3, { width: 18 })
    .fillColor(INK).fontSize(9.5)
    .text(section.label.fr, PAGE.margin + 26, y + 2, { width: WIDTH - 32 })
    .restore();

  doc.y = y + 24;
}

/** Deux colonnes d'étiquettes et valeurs, comme sur les formulaires papier. */
function keyValues(doc: Doc, entries: Array<[string, string]>): void {
  const columnWidth = (WIDTH - 16) / 2;

  for (let i = 0; i < entries.length; i += 2) {
    const pair = entries.slice(i, i + 2);

    // Mesurer d'abord, avec la police qui servira au rendu : sans quoi la
    // réservation est fausse et pdfkit déborde de lui-même sur la page suivante.
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

function table(doc: Doc, headers: string[], rows: string[][]): void {
  if (rows.length === 0) {
    ensure(doc, 20);
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED)
      .text('Aucune ligne saisie.', PAGE.margin, doc.y, { width: WIDTH });
    doc.moveDown(0.4);
    return;
  }

  const columnWidth = WIDTH / headers.length;
  ensure(doc, 40);

  let y = doc.y;
  doc.save().rect(PAGE.margin, y, WIDTH, 16).fill(WASH).restore();
  headers.forEach((header, i) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED)
      .text(header, PAGE.margin + i * columnWidth + 4, y + 5, {
        width: columnWidth - 8,
        lineBreak: false,
        ellipsis: true,
      });
  });
  y += 16;

  doc.font('Helvetica').fontSize(8);

  for (const row of rows) {
    const height = Math.max(
      16,
      ...row.map((cell) => doc.heightOfString(cell, { width: columnWidth - 8 }) + 8),
    );

    if (y + height > doc.page.height - PAGE.margin) {
      doc.addPage();
      y = doc.y;
    }

    row.forEach((cell, i) => {
      doc.font('Helvetica').fontSize(8).fillColor(INK)
        .text(cell, PAGE.margin + i * columnWidth + 4, y + 4, { width: columnWidth - 8 });
    });

    y += height;
    doc.save().strokeColor(RULE).lineWidth(0.3)
      .moveTo(PAGE.margin, y).lineTo(PAGE.margin + WIDTH, y).stroke().restore();
  }

  doc.y = y + 6;
}

/** Ajoute une page si la hauteur demandée ne tient pas sur celle en cours. */
function ensure(doc: Doc, height: number): void {
  if (doc.y + height > doc.page.height - PAGE.margin - 24) doc.addPage();
}

/* ── Sections ─────────────────────────────────────────────────────── */

function renderSection(doc: Doc, section: TemplateSection, value: unknown, input: ReportPdfInput): void {
  switch (section.type) {
    case 'table': {
      const columns = section.columns ?? [];
      const rows = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
      table(
        doc,
        ['#', ...columns.map((c) => c.label.fr)],
        rows.map((row, i) => [String(i + 1), ...columns.map((c) => text(row[c.key]))]),
      );
      break;
    }

    case 'checklist': {
      const record = (value ?? {}) as Record<string, string>;
      for (const group of section.groups ?? []) {
        ensure(doc, 30);
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK)
          .text(group.label.fr, PAGE.margin, doc.y, { width: WIDTH });
        doc.moveDown(0.2);

        for (const point of group.points) {
          const verdict = record[point.key];

          doc.font('Helvetica').fontSize(8);
          const height = doc.heightOfString(point.label.fr, { width: WIDTH - 110 });
          ensure(doc, height + 4);

          const y = doc.y;
          doc.fillColor(INK).text(point.label.fr, PAGE.margin + 8, y, { width: WIDTH - 110 });
          doc.font(verdict === 'NC' ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
            .fillColor(verdict === 'NC' ? NC : MUTED)
            .text(VERDICTS[verdict ?? ''] ?? '—', PAGE.margin + WIDTH - 96, y, {
              width: 96,
              align: 'right',
            });
          doc.y = y + height + 2;
        }
        doc.moveDown(0.3);
      }
      break;
    }

    case 'criteria': {
      const record = (value ?? {}) as Record<string, { applicable: boolean; conform: boolean | null }>;
      for (const criterion of section.criteria ?? []) {
        const state = record[criterion.key];
        const verdict = !state?.applicable
          ? 'Sans objet'
          : state.conform === true
            ? 'Conforme'
            : state.conform === false
              ? 'Non conforme'
              : '—';

        doc.font('Helvetica').fontSize(8);
        const height = doc.heightOfString(criterion.label.fr, { width: WIDTH - 110 });
        ensure(doc, height + 16);

        const y = doc.y;
        doc.fillColor(INK).text(criterion.label.fr, PAGE.margin + 8, y, { width: WIDTH - 110 });
        doc.font(verdict === 'Non conforme' ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
          .fillColor(verdict === 'Non conforme' ? NC : MUTED)
          .text(verdict, PAGE.margin + WIDTH - 96, y, { width: 96, align: 'right' });

        doc.y = y + height + 2;

        if (criterion.standards.length > 0) {
          const standards = criterion.standards.join(' · ');
          doc.font('Helvetica').fontSize(6.5).fillColor(MUTED);
          const line = doc.heightOfString(standards, { width: WIDTH - 110 });
          ensure(doc, line + 4);
          doc.text(standards, PAGE.margin + 8, doc.y, { width: WIDTH - 110 });
          doc.y += 4;
        }
      }
      break;
    }

    case 'verdict': {
      const chosen = text(value);
      ensure(doc, 24);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(ACCENT)
        .text(chosen, PAGE.margin, doc.y, { width: WIDTH });
      doc.moveDown(0.4);
      break;
    }

    case 'devices': {
      table(
        doc,
        ['Repère', 'Désignation', 'Étalonné jusqu’au'],
        input.devices.map((d) => [d.code, d.designation, fr(d.validUntil)]),
      );
      break;
    }

    case 'photos': {
      ensure(doc, 24);
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED)
        .text('Les photographies sont jointes séparément au dossier.', PAGE.margin, doc.y, {
          width: WIDTH,
        });
      doc.moveDown(0.4);
      break;
    }

    case 'signature-matrix':
      // Les visas figurent au pied du rapport, une seule fois.
      break;

    default: {
      const record = (value ?? {}) as Record<string, unknown>;
      keyValues(
        doc,
        (section.fields ?? []).map((field) => [field.label.fr, text(record[field.key])]),
      );
    }
  }
}

/* ── Document ─────────────────────────────────────────────────────── */

function header(doc: Doc, input: ReportPdfInput): void {
  const y = PAGE.margin;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(INK)
    .text(input.company.name, PAGE.margin, y);
  doc.font('Helvetica').fontSize(7).fillColor(MUTED)
    .text('Inspection · Testing · Engineering · Compliance', PAGE.margin, y + 16);

  doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT)
    .text(input.number, PAGE.margin + WIDTH - 200, y, { width: 200, align: 'right' });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    .text(
      `${input.template.formCode} · version ${input.template.version}` +
        (input.revision > 0 ? ` · révision ${input.revision}` : ''),
      PAGE.margin + WIDTH - 200,
      y + 15,
      { width: 200, align: 'right' },
    );

  doc.y = y + 34;
  rule(doc);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').fontSize(14).fillColor(INK)
    .text(input.template.title, PAGE.margin, doc.y, { width: WIDTH });
  if (input.template.titleEn) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED)
      .text(input.template.titleEn, PAGE.margin, doc.y + 2, { width: WIDTH });
  }
  doc.moveDown(0.6);

  keyValues(doc, [
    ['Client', input.client],
    ['Affaire', `${input.affair.number} — ${input.affair.title}`],
    ['Mission', input.mission.number],
    ['Lieu', input.mission.site ?? '—'],
    ['Date d’essai', fr(input.inspection?.date ?? null)],
    ['Émis le', fr(input.issuedAt)],
  ]);
}

function verificationBlock(doc: Doc, input: ReportPdfInput): void {
  if (input.checks.length === 0) return;

  ensure(doc, 100);
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(INK)
    .text('Vérification', PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.3);

  for (const check of input.checks) {
    const verdict = !check.applicable
      ? 'Sans objet'
      : check.conform === true
        ? 'Conforme'
        : check.conform === false
          ? 'Non conforme'
          : '—';

    doc.font('Helvetica').fontSize(8);
    const height = doc.heightOfString(check.criterion, { width: WIDTH - 110 });
    ensure(doc, height + 4);

    const y = doc.y;
    doc.fillColor(INK).text(check.criterion, PAGE.margin + 8, y, { width: WIDTH - 110 });
    doc.font('Helvetica').fontSize(8).fillColor(verdict === 'Non conforme' ? NC : MUTED)
      .text(verdict, PAGE.margin + WIDTH - 96, y, { width: 96, align: 'right' });
    doc.y = y + height + 2;

    if (check.comment) {
      doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(MUTED);
      const commentHeight = doc.heightOfString(check.comment, { width: WIDTH - 110 });
      ensure(doc, commentHeight + 4);
      doc.text(check.comment, PAGE.margin + 8, doc.y, { width: WIDTH - 110 });
      doc.y += 4;
    }
  }
}

function signatures(doc: Doc, input: ReportPdfInput): void {
  ensure(doc, 110);
  doc.moveDown(1);
  rule(doc);
  doc.moveDown(0.6);

  const columns: Array<[string, string, string]> = [
    ['Examen effectué par', input.author, fr(input.submittedAt)],
    ['Rapport vérifié par', input.checker ?? '—', fr(input.checkedAt)],
    ['Rapport émis le', fr(input.issuedAt), ''],
  ];

  const columnWidth = WIDTH / columns.length;
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

/** Pied de page identique sur toutes les pages, posé à la fin. */
function footers(doc: Doc, input: ReportPdfInput): void {
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

/**
 * Produit le PDF complet. Le document est bufferisé : les pieds de page ont
 * besoin du nombre total de pages, qu'on ne connaît qu'à la fin.
 */
export function renderReportPdf(input: ReportPdfInput): Promise<Buffer> {
  return new Promise((resolvePdf, reject) => {
    const doc = new PDFDocument({
      size: PAGE.size,
      margin: PAGE.margin,
      bufferPages: true,
      info: {
        Title: `${input.number} — ${input.template.title}`,
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

      if (input.inspection) {
        const sections = input.inspection.schema.sections ?? [];
        sections.forEach((section, index) => {
          if (section.type === 'signature-matrix') return;
          sectionTitle(doc, index + 1, section);
          renderSection(doc, section, input.inspection!.data[section.key], input);
        });
      } else {
        doc.moveDown(1);
        doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED)
          .text(
            'Aucune saisie n’est rattachée à ce rapport : son contenu a été établi hors de la plateforme.',
            PAGE.margin,
            doc.y,
            { width: WIDTH },
          );
      }

      verificationBlock(doc, input);
      signatures(doc, input);
      footers(doc, input);

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
