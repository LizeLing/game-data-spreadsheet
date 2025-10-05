/**
 * Mock Data for Testing
 * Provides sample data for unit tests
 */

import { nanoid } from 'nanoid';
import type { Sheet, Column, Row, Cell, CellValue } from '@types';

/**
 * Create a mock sheet with specified data
 */
export function createMockSheet(config?: {
  name?: string;
  columns?: string[];
  rows?: Record<string, CellValue>[];
}): Sheet {
  const {
    name = 'Test Sheet',
    columns = ['A', 'B', 'C'],
    rows = [],
  } = config || {};

  const mockColumns: Column[] = columns.map((col, index) => ({
    id: `col-${col}`,
    name: col,
    type: 'text',
    width: 120,
    index,
  }));

  const mockRows: Row[] = rows.map((rowData, rowIndex) => {
    const cells: Record<string, Cell> = {};

    mockColumns.forEach((column) => {
      const cellId = `row-${rowIndex}:${column.id}`;
      const value = rowData[column.name] ?? null;

      cells[column.id] = {
        id: cellId,
        rowId: `row-${rowIndex}`,
        columnId: column.id,
        value,
        type: typeof value === 'number' ? 'number' : 'text',
      };
    });

    return {
      id: `row-${rowIndex}`,
      index: rowIndex,
      cells,
    };
  });

  return {
    id: nanoid(),
    name,
    columns: mockColumns,
    rows: mockRows,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create a simple 3x3 test sheet
 */
export function createSimpleSheet(): Sheet {
  return createMockSheet({
    name: 'Simple Sheet',
    columns: ['A', 'B', 'C'],
    rows: [
      { A: 1, B: 2, C: 3 },
      { A: 4, B: 5, C: 6 },
      { A: 7, B: 8, C: 9 },
    ],
  });
}

/**
 * Create a sheet with formulas
 */
export function createSheetWithFormulas(): Sheet {
  const sheet = createMockSheet({
    name: 'Formula Sheet',
    columns: ['A', 'B', 'C'],
    rows: [
      { A: 10, B: 20, C: null },
      { A: 30, B: 40, C: null },
    ],
  });

  // Add formulas to column C
  sheet.rows[0].cells['col-C'].formula = '=A1+B1';
  sheet.rows[0].cells['col-C'].value = 30;

  sheet.rows[1].cells['col-C'].formula = '=A2+B2';
  sheet.rows[1].cells['col-C'].value = 70;

  return sheet;
}
