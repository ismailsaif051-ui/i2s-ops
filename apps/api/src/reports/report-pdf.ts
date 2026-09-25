import PDFDocument from 'pdfkit';
import type { TemplateField, TemplateSchema, TemplateSection } from '@i2s/contracts';

/**
 * Rendu PDF d'un rapport d'inspection.
 *
 * Le document est produit à partir du schéma du formulaire, comme l'écran de
 * saisie : tous les formulaires du référentiel passent par ce seul rendu, et un
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
  /** Photographies de l'inspection, dans l'ordre où elles ont été prises. */
  photos?: Array<{ sectionKey: string | null; caption: string; mimeType: string; content: Buffer }>;
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

/**
 * Valeur d'un champ telle qu'elle doit se lire sur un rapport : nombre au
 * format français avec son unité, date en jj/mm/aaaa. Sans l'unité, « CMU :
 * 12,35 » ne dit pas s'il s'agit de tonnes ou de kilogrammes.
 */
function fieldText(field: Pick<TemplateField, 'type' | 'unit' | 'decimals'>, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  // Un champ calculé est un nombre : il se lit comme tel, unité comprise.
  if ((field.type === 'number' || field.type === 'formula') && typeof value === 'number' && Number.isFinite(value)) {
    const formatted = value.toLocaleString('fr-FR', {
      minimumFractionDigits: field.decimals ?? 0,
      maximumFractionDigits: field.decimals ?? 3,
      // Pas d'espace des milliers sous 10 000 : une année de fabrication
      // s'imprimerait « 2 019 ».
      useGrouping: Math.abs(value) >= 10000,
    });
    return field.unit ? `${formatted} ${field.unit}` : formatted;
  }

  if (field.type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }

  const plain = text(value);
  return field.unit && plain !== '—' ? `${plain} ${field.unit}` : plain;
}

/** Libellé de colonne ou de champ, suivi de son unité comme à l'écran. */
function labelWithUnit(field: Pick<TemplateField, 'label' | 'unit'>): string {
  return field.unit ? `${field.label.fr} (${field.unit})` : field.label.fr;
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
  mention(doc, section.reference);
}

/** Mention imprimée au modèle : textes réglementaires visés, attestation, lieu de signature. */
function mention(doc: Doc, reference: string | undefined): void {
  if (!reference) return;
  doc.font('Helvetica-Oblique').fontSize(8);
  ensure(doc, doc.heightOfString(reference, { width: WIDTH }) + 6);
  doc.fillColor(INK).text(reference, PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.5);
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
    // Les libellés aussi : un libellé long sur deux lignes chevauchait sa valeur.
    doc.font('Helvetica').fontSize(6.5);
    const labelHeight = Math.max(
      9,
      ...pair.map(([label]) =>
        doc.heightOfString(label.toUpperCase(), { width: columnWidth, characterSpacing: 0.3 }) + 1.5,
      ),
    );

    ensure(doc, labelHeight + used + 6);
    const y = doc.y;

    pair.forEach(([label, value], column) => {
      const x = PAGE.margin + column * (columnWidth + 16);
      doc.font('Helvetica').fontSize(6.5).fillColor(MUTED)
        .text(label.toUpperCase(), x, y, { width: columnWidth, characterSpacing: 0.3 });
      doc.font('Helvetica').fontSize(9).fillColor(INK)
        .text(value, x, y + labelHeight, { width: columnWidth });
    });

    doc.y = y + labelHeight + used + 6;
  }
}

interface Column {
  label: string;
  /** Poids relatif dans la largeur : la largeur prévue par le formulaire. */
  weight: number;
}

/** Au-delà, une grille ne laisse que quelques millimètres par case : chaque ligne devient une fiche. */
const MAX_TABLE_COLUMNS = 9;

function emptyRows(doc: Doc): void {
  ensure(doc, 20);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED)
    .text('Aucune ligne saisie.', PAGE.margin, doc.y, { width: WIDTH });
  doc.moveDown(0.4);
}

function drawHeader(doc: Doc, columns: Column[], widths: number[], y: number): number {
  doc.font('Helvetica-Bold').fontSize(7);
  // Mesurer l'en-tête : une hauteur fixe laissait les libellés longs
  // déborder sur la première ligne du tableau.
  const height = Math.max(
    16,
    ...columns.map((c, i) => doc.heightOfString(c.label, { width: widths[i] - 8 }) + 8),
  );
  doc.save().rect(PAGE.margin, y, WIDTH, height).fill(WASH).restore();
  let x = PAGE.margin;
  columns.forEach((c, i) => {
    doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED)
      .text(c.label, x + 4, y + 4, { width: widths[i] - 8 });
    x += widths[i];
  });
  return y + height;
}

function table(doc: Doc, columns: Column[], rows: string[][]): void {
  if (rows.length === 0) return emptyRows(doc);

  const total = columns.reduce((sum, c) => sum + c.weight, 0);
  const widths = columns.map((c) => (WIDTH * c.weight) / total);
  ensure(doc, 48);

  let y = drawHeader(doc, columns, widths, doc.y);

  for (const row of rows) {
    doc.font('Helvetica').fontSize(8);
    const height = Math.max(
      16,
      ...row.map((cell, i) => doc.heightOfString(cell, { width: widths[i] - 8 }) + 8),
    );

    if (y + height > doc.page.height - PAGE.margin - 24) {
      doc.addPage();
      // L'en-tête est répété : une page de chiffres sans colonnes nommées est illisible.
      y = drawHeader(doc, columns, widths, doc.y);
    }

    let x = PAGE.margin;
    row.forEach((cell, i) => {
      doc.font('Helvetica').fontSize(8).fillColor(INK)
        .text(cell, x + 4, y + 4, { width: widths[i] - 8 });
      x += widths[i];
    });

    y += height;
    doc.save().strokeColor(RULE).lineWidth(0.3)
      .moveTo(PAGE.margin, y).lineTo(PAGE.margin + WIDTH, y).stroke().restore();
  }

  doc.y = y + 6;
}

/**
 * Tableau trop large pour la page (PMI à vingt colonnes, paramètres de
 * soudage par passe) : chaque ligne s'imprime comme une fiche numérotée,
 * libellé et valeur côte à côte, trois par rangée.
 */
function recordCards(doc: Doc, labels: string[], rows: string[][]): void {
  if (rows.length === 0) return emptyRows(doc);

  const perRow = 3;
  const gap = 12;
  const cell = (WIDTH - gap * (perRow - 1)) / perRow;

  rows.forEach((row, index) => {
    ensure(doc, 40);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(ACCENT)
      .text(`Ligne ${index + 1}`, PAGE.margin, doc.y, { width: WIDTH });
    doc.moveDown(0.2);

    for (let i = 0; i < labels.length; i += perRow) {
      const slice = labels.slice(i, i + perRow);
      // Un libellé tronqué n'a pas sa place dans un rapport : il passe à la ligne.
      // Pas de capitales : elles feraient lire « CO » pour le cobalt.
      doc.font('Helvetica').fontSize(6);
      const labelHeight = Math.max(
        ...slice.map((label) => doc.heightOfString(label, { width: cell })),
      );
      doc.font('Helvetica').fontSize(8.5);
      const used = Math.max(...slice.map((_, k) => doc.heightOfString(row[i + k], { width: cell })));
      ensure(doc, labelHeight + 2 + used + 4);
      const y = doc.y;
      slice.forEach((label, k) => {
        const x = PAGE.margin + k * (cell + gap);
        doc.font('Helvetica').fontSize(6).fillColor(MUTED)
          .text(label, x, y, { width: cell });
        doc.font('Helvetica').fontSize(8.5).fillColor(INK).text(row[i + k], x, y + labelHeight + 2, { width: cell });
      });
      doc.y = y + labelHeight + 2 + used + 4;
    }

    rule(doc);
    doc.moveDown(0.4);
  });
}

/** Ajoute une page si la hauteur demandée ne tient pas sur celle en cours. */
function ensure(doc: Doc, height: number): void {
  if (doc.y + height > doc.page.height - PAGE.margin - 24) doc.addPage();
}

/** Vrai si cette section est la première planche photo du formulaire. */
function premierePlanche(input: ReportPdfInput, section: TemplateSection): boolean {
  const planches = (input.inspection?.schema.sections ?? []).filter((s) => s.type === 'photos');
  return planches[0]?.key === section.key;
}

/**
 * Planche photographique : deux vues par rangée, légende dessous. Une image
 * que pdfkit ne sait pas lire est signalée à sa place plutôt que d'interrompre
 * l'émission — le rapport part, le défaut se voit.
 */
function photoGrid(
  doc: Doc,
  photos: Array<{ caption: string; mimeType: string; content: Buffer }>,
): void {
  if (photos.length === 0) {
    ensure(doc, 20);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED)
      .text('Aucune photographie.', PAGE.margin, doc.y, { width: WIDTH });
    doc.moveDown(0.4);
    return;
  }

  const gap = 14;
  const largeur = (WIDTH - gap) / 2;
  const hauteur = largeur * 0.72;

  for (let i = 0; i < photos.length; i += 2) {
    const rangee = photos.slice(i, i + 2);
    ensure(doc, hauteur + 24);
    const y = doc.y;

    rangee.forEach((photo, colonne) => {
      const x = PAGE.margin + colonne * (largeur + gap);
      try {
        doc.image(photo.content, x, y, { fit: [largeur, hauteur], align: 'center' });
      } catch {
        doc.save().rect(x, y, largeur, hauteur).fill(WASH).restore();
        doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED)
          .text('Image illisible', x, y + hauteur / 2 - 4, { width: largeur, align: 'center' });
      }
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
        .text(photo.caption, x, y + hauteur + 4, { width: largeur });
    });

    doc.y = y + hauteur + 20;
  }

  doc.moveDown(0.4);
}

/* ── Sections ─────────────────────────────────────────────────────── */

function renderSection(doc: Doc, section: TemplateSection, value: unknown, input: ReportPdfInput): void {
  switch (section.type) {
    case 'table': {
      const columns = section.columns ?? [];
      const rows = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];

      if (columns.length > MAX_TABLE_COLUMNS) {
        // L'unité est portée par chaque valeur : le libellé reste court.
        recordCards(
          doc,
          columns.map((c) => c.label.fr),
          rows.map((row) => columns.map((c) => fieldText(c, row[c.key]))),
        );
        break;
      }

      // Dans une grille, l'unité va dans l'en-tête et la valeur reste nue.
      table(
        doc,
        [{ label: '#', weight: 0.6 }, ...columns.map((c) => ({ label: labelWithUnit(c), weight: c.span ?? 6 }))],
        rows.map((row, i) => [
          String(i + 1),
          ...columns.map((c) => fieldText({ ...c, unit: undefined }, row[c.key])),
        ]),
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
        [
          { label: 'Repère', weight: 1 },
          { label: 'Désignation', weight: 2 },
          { label: 'Étalonné jusqu’au', weight: 1 },
        ],
        input.devices.map((d) => [d.code, d.designation, fr(d.validUntil)]),
      );
      break;
    }

    case 'photos': {
      // Une photo prise pour une autre section ne s'imprime pas ici ; celles
      // qu'aucune section ne réclame rejoignent la première planche.
      const planches = (input.photos ?? []).filter(
        (p) => p.sectionKey === section.key || (p.sectionKey === null && premierePlanche(input, section)),
      );
      photoGrid(doc, planches);
      break;
    }

    case 'signature-matrix':
      // Les visas figurent au pied du rapport, une seule fois.
      break;

    default: {
      const record = (value ?? {}) as Record<string, unknown>;
      keyValues(
        doc,
        (section.fields ?? []).map((field) => [field.label.fr, fieldText(field, record[field.key])]),
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
          if (section.type === 'signature-matrix') {
            // Les visas sont imprimés une seule fois en pied de rapport, mais la
            // mention qui les accompagne au modèle (certification, « Fait à ») reste.
            if (section.reference) {
              doc.moveDown(0.8);
              mention(doc, section.reference);
            }
            return;
          }
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
