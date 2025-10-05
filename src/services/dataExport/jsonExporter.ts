import { saveAs } from 'file-saver';
import type { Sheet } from '@types';

export interface JSONExportOptions {
  pretty?: boolean;
  indent?: number;
}

export const exportToJSON = (
  sheet: Sheet,
  filename: string,
  options: JSONExportOptions = {}
): void => {
  const { pretty = true, indent = 2 } = options;

  const data: Record<string, any>[] = [];

  sheet.rows.forEach((row) => {
    const rowData: Record<string, any> = {};

    sheet.columns.forEach((col) => {
      const cell = row.cells[col.id];
      rowData[col.name] = cell?.value ?? null;
    });

    data.push(rowData);
  });

  const jsonString = pretty
    ? JSON.stringify(data, null, indent)
    : JSON.stringify(data);

  const blob = new Blob([jsonString], {
    type: 'application/json;charset=utf-8;',
  });
  saveAs(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
};

// XLSX Exporter
import * as XLSX from 'xlsx';
import type { CellStyle, BorderStyle } from '@types';

export interface XLSXExportOptions {
  includeFormatting?: boolean;
  includeFormulas?: boolean;
  sheetName?: string;
}

export const exportToXLSX = (
  sheets: Sheet[],
  filename: string,
  options: XLSXExportOptions = {}
): void => {
  const { includeFormatting = true, includeFormulas = true } = options;

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = convertSheetToWorksheet(sheet, {
      includeFormatting,
      includeFormulas,
    });
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sanitizeSheetName(sheet.name)
    );
  });

  const wbout = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: includeFormatting,
  });

  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

function convertSheetToWorksheet(
  sheet: Sheet,
  options: { includeFormatting: boolean; includeFormulas: boolean }
): XLSX.WorkSheet {
  const { includeFormatting, includeFormulas } = options;

  const data: any[][] = [];

  const headerRow = sheet.columns.map((col) => col.name);
  data.push(headerRow);

  sheet.rows.forEach((row) => {
    const rowData: any[] = [];
    sheet.columns.forEach((col) => {
      const cell = row.cells[col.id];
      if (cell) {
        if (includeFormulas && cell.formula) {
          rowData.push(cell.formula);
        } else {
          rowData.push(formatCellValueForXLSX(cell.value));
        }
      } else {
        rowData.push(null);
      }
    });
    data.push(rowData);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  const colWidths = sheet.columns.map((col) => ({
    wch: col.width ? col.width / 7 : 15,
  }));
  worksheet['!cols'] = colWidths;

  const rowHeights = sheet.rows.map((row) => ({
    hpx: row.height || 25,
  }));
  rowHeights.unshift({ hpx: 25 });
  worksheet['!rows'] = rowHeights;

  if (includeFormatting) {
    applyXLSXFormatting(worksheet, sheet);
  }

  return worksheet;
}

function applyXLSXFormatting(worksheet: XLSX.WorkSheet, sheet: Sheet): void {
  sheet.columns.forEach((col, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    if (!worksheet[cellAddress]) return;

    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'F3F4F6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  });

  sheet.rows.forEach((row, rowIndex) => {
    sheet.columns.forEach((col, colIndex) => {
      const cell = row.cells[col.id];
      if (!cell || !cell.style) return;

      const cellAddress = XLSX.utils.encode_cell({
        r: rowIndex + 1,
        c: colIndex,
      });
      if (!worksheet[cellAddress]) return;

      worksheet[cellAddress].s = convertCellStyleToXLSX(cell.style);
    });
  });
}

function convertCellStyleToXLSX(style: CellStyle): any {
  const xlsxStyle: any = {};

  if (
    style.fontWeight ||
    style.fontStyle ||
    style.textDecoration ||
    style.fontSize ||
    style.color
  ) {
    xlsxStyle.font = {};

    if (style.fontWeight === 'bold') {
      xlsxStyle.font.bold = true;
    }
    if (style.fontStyle === 'italic') {
      xlsxStyle.font.italic = true;
    }
    if (style.textDecoration === 'underline') {
      xlsxStyle.font.underline = true;
    }
    if (style.textDecoration === 'line-through') {
      xlsxStyle.font.strike = true;
    }
    if (style.fontSize) {
      xlsxStyle.font.sz = style.fontSize;
    }
    if (style.color) {
      xlsxStyle.font.color = { rgb: style.color.replace('#', '') };
    }
  }

  if (style.backgroundColor) {
    xlsxStyle.fill = {
      fgColor: { rgb: style.backgroundColor.replace('#', '') },
    };
  }

  if (style.textAlign || style.verticalAlign) {
    xlsxStyle.alignment = {};

    if (style.textAlign) {
      xlsxStyle.alignment.horizontal = style.textAlign;
    }
    if (style.verticalAlign) {
      xlsxStyle.alignment.vertical =
        style.verticalAlign === 'middle' ? 'center' : style.verticalAlign;
    }
  }

  if (style.border) {
    xlsxStyle.border = {};

    const convertBorder = (borderStyle?: BorderStyle) => {
      if (!borderStyle) return undefined;
      return {
        style: borderStyle.style || 'thin',
        color: borderStyle.color
          ? { rgb: borderStyle.color.replace('#', '') }
          : { rgb: '000000' },
      };
    };

    if (style.border.top) {
      xlsxStyle.border.top = convertBorder(style.border.top);
    }
    if (style.border.right) {
      xlsxStyle.border.right = convertBorder(style.border.right);
    }
    if (style.border.bottom) {
      xlsxStyle.border.bottom = convertBorder(style.border.bottom);
    }
    if (style.border.left) {
      xlsxStyle.border.left = convertBorder(style.border.left);
    }
  }

  if (style.numberFormat) {
    xlsxStyle.numFmt = style.numberFormat;
  }

  return xlsxStyle;
}

function formatCellValueForXLSX(value: any): any {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  return String(value);
}

function sanitizeSheetName(name: string): string {
  return name
    .replace(/[:\\/?*[\]]/g, '_')
    .substring(0, 31)
    .trim();
}
