/**
 * XLSX Exporter
 * Export spreadsheet data to Excel (.xlsx) format with styling
 */

import * as XLSX from 'xlsx';
import type { Sheet, CellStyle } from '@types';

export interface XLSXExportOptions {
  includeFormatting?: boolean;
  sheetName?: string;
  multipleSheets?: boolean;
}

/**
 * Export sheets to XLSX file
 */
export const exportToXLSX = (
  sheets: Sheet[],
  filename: string,
  options: XLSXExportOptions = {}
): void => {
  const { includeFormatting = true } = options;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    // Convert sheet data to worksheet
    const worksheetData: any[][] = [];

    // Add headers
    worksheetData.push(sheet.columns.map((col) => col.name));

    // Add data rows
    sheet.rows.forEach((row) => {
      const rowData: any[] = [];
      sheet.columns.forEach((col) => {
        const cell = row.cells[col.id];
        rowData.push(cell?.value ?? '');
      });
      worksheetData.push(rowData);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply formatting if requested
    if (includeFormatting) {
      applyXLSXFormatting(worksheet, sheet);
    }

    // Set column widths
    worksheet['!cols'] = sheet.columns.map((col) => ({
      wch: Math.floor((col.width || 120) / 8),
    }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name.substring(0, 31) // Excel sheet name limit
    );
  });

  // Write file
  XLSX.writeFile(
    workbook,
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  );
};

/**
 * Apply cell styles to XLSX worksheet
 */
function applyXLSXFormatting(worksheet: XLSX.WorkSheet, sheet: Sheet): void {
  sheet.rows.forEach((row, rowIdx) => {
    sheet.columns.forEach((col, colIdx) => {
      const cell = row.cells[col.id];
      if (!cell?.style) return;

      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      const xlsxCell = worksheet[cellAddress];

      if (xlsxCell) {
        xlsxCell.s = convertCellStyleToXLSX(cell.style);
      }
    });
  });

  // Apply header styles
  sheet.columns.forEach((col, colIdx) => {
    const headerAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    const headerCell = worksheet[headerAddress];

    if (headerCell) {
      headerCell.s = {
        font: {
          bold: true,
          color: { rgb: '000000' },
        },
        fill: {
          fgColor: { rgb: 'E0E0E0' },
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
      };
    }
  });
}

/**
 * Convert internal CellStyle to XLSX style object
 */
function convertCellStyleToXLSX(style: CellStyle): any {
  const xlsxStyle: any = {};

  // Font styling
  if (
    style.fontWeight ||
    style.fontStyle ||
    style.color ||
    style.textDecoration
  ) {
    xlsxStyle.font = {
      bold: style.fontWeight === 'bold',
      italic: style.fontStyle === 'italic',
      underline: style.textDecoration === 'underline',
      strike: style.textDecoration === 'line-through',
      color: style.color ? { rgb: style.color.replace('#', '') } : undefined,
    };
  }

  // Fill (background color)
  if (style.backgroundColor) {
    xlsxStyle.fill = {
      fgColor: { rgb: style.backgroundColor.replace('#', '') },
    };
  }

  // Alignment
  if (style.textAlign || style.verticalAlign) {
    xlsxStyle.alignment = {
      horizontal: style.textAlign || 'left',
      vertical: style.verticalAlign || 'top',
    };
  }

  // Border
  if (style.border) {
    xlsxStyle.border = {};
    if (style.border.top) {
      xlsxStyle.border.top = {
        style: style.border.top.style || 'thin',
        color: { rgb: style.border.top.color?.replace('#', '') || '000000' },
      };
    }
    if (style.border.right) {
      xlsxStyle.border.right = {
        style: style.border.right.style || 'thin',
        color: { rgb: style.border.right.color?.replace('#', '') || '000000' },
      };
    }
    if (style.border.bottom) {
      xlsxStyle.border.bottom = {
        style: style.border.bottom.style || 'thin',
        color: { rgb: style.border.bottom.color?.replace('#', '') || '000000' },
      };
    }
    if (style.border.left) {
      xlsxStyle.border.left = {
        style: style.border.left.style || 'thin',
        color: { rgb: style.border.left.color?.replace('#', '') || '000000' },
      };
    }
  }

  // Number format
  if (style.numberFormat) {
    xlsxStyle.numFmt = style.numberFormat;
  }

  return xlsxStyle;
}

/**
 * Export single sheet to XLSX
 */
export const exportSheetToXLSX = (
  sheet: Sheet,
  filename: string,
  options: XLSXExportOptions = {}
): void => {
  exportToXLSX([sheet], filename, { ...options, multipleSheets: false });
};
