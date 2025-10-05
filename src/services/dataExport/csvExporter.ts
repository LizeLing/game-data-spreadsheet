import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import type { Sheet } from '@types';

export interface CSVExportOptions {
  includeHeader?: boolean;
  delimiter?: string;
}

export const exportToCSV = (
  sheet: Sheet,
  filename: string,
  options: CSVExportOptions = {}
): void => {
  const { includeHeader = true, delimiter = ',' } = options;

  const data: string[][] = [];

  if (includeHeader) {
    data.push(sheet.columns.map((col) => col.name));
  }

  sheet.rows.forEach((row) => {
    const rowData: string[] = [];

    sheet.columns.forEach((col) => {
      const cell = row.cells[col.id];
      const value = cell?.value ?? '';
      rowData.push(formatCellValue(value));
    });

    data.push(rowData);
  });

  const csv = Papa.unparse(data, {
    delimiter,
    newline: '\n',
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  return String(value);
};
