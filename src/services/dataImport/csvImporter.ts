import Papa from 'papaparse';
import type { Sheet, Cell, CellValue } from '@types';

export interface CSVImportOptions {
  hasHeader?: boolean;
  delimiter?: string;
}

export interface CSVImportResult {
  success: boolean;
  sheet?: Sheet;
  error?: string;
}

export const importFromCSV = (
  file: File,
  options: CSVImportOptions = {}
): Promise<CSVImportResult> => {
  return new Promise((resolve) => {
    const { hasHeader = true, delimiter = ',' } = options;

    Papa.parse(file, {
      delimiter,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as string[][];

          if (data.length === 0) {
            resolve({ success: false, error: 'CSV file is empty' });
            return;
          }

          const sheet: Sheet = {
            id: `sheet-${Date.now()}`,
            name: file.name.replace('.csv', ''),
            rows: [],
            columns: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Create columns
          const columnCount = Math.max(...data.map((row) => row.length));
          for (let i = 0; i < columnCount; i++) {
            const columnId = `col-${i}`;
            sheet.columns.push({
              id: columnId,
              name:
                hasHeader && data[0]?.[i]
                  ? data[0][i]
                  : String.fromCharCode(65 + i),
              width: 120,
              type: 'text',
              index: i,
              frozen: false,
              hidden: false,
            });
          }

          // Create rows
          const startIndex = hasHeader ? 1 : 0;
          for (let rowIndex = startIndex; rowIndex < data.length; rowIndex++) {
            const rowData = data[rowIndex];
            const rowId = `row-${rowIndex - startIndex}`;

            const cells: Record<string, Cell> = {};
            for (let colIndex = 0; colIndex < columnCount; colIndex++) {
              const rawValue = rowData[colIndex] || '';
              const cellValue = convertCellValue(rawValue);
              const column = sheet.columns[colIndex];

              cells[column.id] = {
                id: `${rowId}:${column.id}`,
                rowId,
                columnId: column.id,
                value: cellValue,
                type: detectCellType(cellValue),
              };
            }

            sheet.rows.push({
              id: rowId,
              index: rowIndex - startIndex,
              cells,
              height: 32,
            });
          }

          resolve({ success: true, sheet });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
      error: (error) => {
        resolve({ success: false, error: error.message });
      },
    });
  });
};

const convertCellValue = (value: string): CellValue => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  if (!isNaN(Number(value)) && value.trim() !== '') {
    return Number(value);
  }

  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  return value;
};

const detectCellType = (
  value: CellValue
): 'text' | 'number' | 'boolean' | 'date' | 'formula' => {
  if (value === null || value === undefined) return 'text';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (typeof value === 'string' && value.startsWith('=')) return 'formula';
  return 'text';
};
