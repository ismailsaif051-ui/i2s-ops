import ExcelJS from 'exceljs';

/**
 * Génération de classeurs Excel pour les exports — même intention que les PDF
 * du dossier : une pièce que l'utilisateur peut ouvrir tel quel, pas un CSV
 * brut. Charte alignée sur le design system (accent orange, entête blanche).
 */

export interface XlsxColumn {
  header: string;
  key: string;
  width?: number;
  numFmt?: string;
}

export async function buildXlsx(
  sheetName: string,
  columns: XlsxColumn[],
  rows: Array<Record<string, unknown>>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'I2S OPS';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD14E27' } };
  header.alignment = { vertical: 'middle' };
  header.height = 20;

  for (const row of rows) sheet.addRow(row);

  columns.forEach((c, i) => {
    if (c.numFmt) sheet.getColumn(i + 1).numFmt = c.numFmt;
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Lit un classeur Excel en lignes indexées par en-tête de colonne — le
 * pendant de buildXlsx. L'ordre des colonnes n'a pas d'importance, seul
 * l'intitulé compte : un classeur exporté puis réimporté fonctionne tel quel.
 */
export async function readXlsxRows(buffer: Buffer): Promise<Array<Record<string, unknown>>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '').trim();
  });

  const rows: Array<Record<string, unknown>> = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, unknown> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      record[header] = cell.value;
      hasValue = true;
    });
    if (hasValue) rows.push(record);
  });

  return rows;
}
