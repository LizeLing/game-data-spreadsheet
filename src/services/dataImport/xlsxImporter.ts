/**
 * XLSX Importer
 * Import Excel (.xlsx) files into spreadsheet format
 */

import * as XLSX from 'xlsx';
import type {
  Sheet,
  Column,
  Row,
  Cell,
  CellStyle,
  CellValue,
  CellType,
} from '@types';

export interface XLSXImportOptions {
  preserveFormatting?: boolean;
  sheetIndex?: number; // Import specific sheet by index
  sheetName?: string; // Import specific sheet by name
}

export interface XLSXImportResult {
  sheets: Sheet[];
  success: boolean;
  error?: string;
}

/**
 * Import XLSX file and convert to Sheet format
 */
export const importFromXLSX = async (
  file: File,
  options: XLSXImportOptions = {}
): Promise<XLSXImportResult> => {
  const { preserveFormatting = true, sheetIndex, sheetName } = options;

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { cellStyles: preserveFormatting });

    const sheets: Sheet[] = [];

    // Determine which sheets to import
    const sheetNamesToImport =
      sheetName !== undefined
        ? [sheetName]
        : sheetIndex !== undefined
          ? [workbook.SheetNames[sheetIndex]]
          : workbook.SheetNames;

    for (const name of sheetNamesToImport) {
      if (!workbook.Sheets[name]) {
        console.warn(`Sheet "${name}" not found in workbook`);
        continue;
      }

      const worksheet = workbook.Sheets[name];
      const sheet = convertXLSXToSheet(name, worksheet, preserveFormatting);
      sheets.push(sheet);
    }

    return { sheets, success: true };
  } catch (error) {
    return {
      sheets: [],
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};

/**
 * Convert XLSX worksheet to internal Sheet format
 */
function convertXLSXToSheet(
  name: string,
  worksheet: XLSX.WorkSheet,
  preserveFormatting: boolean
): Sheet {
  // Get data range
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Extract headers from first row
  const headers: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    const cell = worksheet[cellAddress];
    headers.push(cell ? String(cell.v) : `Column ${col + 1}`);
  }

  // Create columns
  const columns: Column[] = headers.map((header, index) => ({
    id: `col-${String.fromCharCode(65 + index)}`, // A, B, C, ...
    name: header,
    type: 'text' as CellType,
    width: 120,
    index,
  }));

  // Create rows
  const rows: Row[] = [];
  for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
    const rowId = `row-${rowNum - 1}`;
    const cells: Record<string, Cell> = {};

    columns.forEach((column, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colIndex });
      const xlsxCell = worksheet[cellAddress];

      const cellId = `${rowId}:${column.id}`;
      const { value, type } = extractCellValue(xlsxCell);

      cells[column.id] = {
        id: cellId,
        rowId,
        columnId: column.id,
        value,
        type,
        style: preserveFormatting ? extractCellStyle(xlsxCell) : undefined,
      };
    });

    rows.push({
      id: rowId,
      index: rowNum - 1,
      cells,
    });
  }

  return {
    id: `sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    columns,
    rows,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Extract cell value and determine type
 */
function extractCellValue(xlsxCell: XLSX.CellObject | undefined): {
  value: CellValue;
  type: CellType;
} {
  if (!xlsxCell || xlsxCell.v === undefined) {
    return { value: null, type: 'text' };
  }

  // Check cell type
  switch (xlsxCell.t) {
    case 'n': // Number
      return { value: xlsxCell.v as number, type: 'number' };

    case 'b': // Boolean
      return { value: xlsxCell.v as boolean, type: 'boolean' };

    case 'd': // Date
      return { value: xlsxCell.v as Date, type: 'date' };

    case 's': // String
      return { value: String(xlsxCell.v), type: 'text' };

    case 'e': // Error
      return { value: String(xlsxCell.v), type: 'text' };

    default:
      return { value: String(xlsxCell.v), type: 'text' };
  }
}

/**
 * Extract cell style from XLSX cell
 */
function extractCellStyle(
  xlsxCell: XLSX.CellObject | undefined
): CellStyle | undefined {
  if (!xlsxCell || !xlsxCell.s) {
    return undefined;
  }

  const s = xlsxCell.s as any;
  const style: CellStyle = {};

  // Font styling
  if (s.font) {
    if (s.font.bold) style.fontWeight = 'bold';
    if (s.font.italic) style.fontStyle = 'italic';
    if (s.font.underline) style.textDecoration = 'underline';
    if (s.font.strike) style.textDecoration = 'line-through';
    if (s.font.color?.rgb) {
      style.color = `#${s.font.color.rgb}`;
    }
  }

  // Fill (background color)
  if (s.fill?.fgColor?.rgb) {
    style.backgroundColor = `#${s.fill.fgColor.rgb}`;
  }

  // Alignment
  if (s.alignment) {
    if (s.alignment.horizontal) {
      style.textAlign = s.alignment.horizontal;
    }
    if (s.alignment.vertical) {
      style.verticalAlign = s.alignment.vertical;
    }
  }

  // Border
  if (s.border) {
    style.border = {};
    if (s.border.top) {
      style.border.top = {
        style: s.border.top.style || 'solid',
        color: s.border.top.color?.rgb
          ? `#${s.border.top.color.rgb}`
          : '#000000',
      };
    }
    if (s.border.right) {
      style.border.right = {
        style: s.border.right.style || 'solid',
        color: s.border.right.color?.rgb
          ? `#${s.border.right.color.rgb}`
          : '#000000',
      };
    }
    if (s.border.bottom) {
      style.border.bottom = {
        style: s.border.bottom.style || 'solid',
        color: s.border.bottom.color?.rgb
          ? `#${s.border.bottom.color.rgb}`
          : '#000000',
      };
    }
    if (s.border.left) {
      style.border.left = {
        style: s.border.left.style || 'solid',
        color: s.border.left.color?.rgb
          ? `#${s.border.left.color.rgb}`
          : '#000000',
      };
    }
  }

  // Number format
  if (s.numFmt) {
    style.numberFormat = s.numFmt;
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * Get list of sheet names from XLSX file (without full import)
 */
export const getXLSXSheetNames = async (file: File): Promise<string[]> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { bookSheets: true });
    return workbook.SheetNames;
  } catch (error) {
    console.error('Failed to read XLSX sheet names:', error);
    return [];
  }
};
