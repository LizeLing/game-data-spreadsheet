/**
 * Clipboard Utilities Tests
 */

import { describe, it, expect, vi } from 'vitest';
import type { Cell } from '@types';
import {
  cellsToTSV,
  tsvToCellValues,
  cellsToJSON,
  jsonToClipboardData,
  createClipboardText,
  parseClipboardText,
  copyCellStyle,
  createCellCopy,
  isClipboardAPIAvailable,
  type ClipboardData,
} from './clipboardUtils';

describe('clipboardUtils', () => {
  describe('cellsToTSV', () => {
    it('should convert cells to TSV format', () => {
      const cells: Cell[][] = [
        [
          {
            id: 'row-0:col-0',
            rowId: 'row-0',
            columnId: 'col-0',
            value: 'Name',
            type: 'text',
          },
          {
            id: 'row-0:col-1',
            rowId: 'row-0',
            columnId: 'col-1',
            value: 100,
            type: 'number',
          },
        ],
        [
          {
            id: 'row-1:col-0',
            rowId: 'row-1',
            columnId: 'col-0',
            value: 'Item',
            type: 'text',
          },
          {
            id: 'row-1:col-1',
            rowId: 'row-1',
            columnId: 'col-1',
            value: 200,
            type: 'number',
          },
        ],
      ];

      const tsv = cellsToTSV(cells);
      expect(tsv).toBe('Name\t100\nItem\t200');
    });

    it('should handle null and undefined values', () => {
      const cells: Cell[][] = [
        [
          {
            id: 'row-0:col-0',
            rowId: 'row-0',
            columnId: 'col-0',
            value: null,
            type: 'text',
          },
          {
            id: 'row-0:col-1',
            rowId: 'row-0',
            columnId: 'col-1',
            value: undefined,
            type: 'text',
          },
        ],
      ];

      const tsv = cellsToTSV(cells);
      expect(tsv).toBe('\t');
    });

    it('should handle boolean values', () => {
      const cells: Cell[][] = [
        [
          {
            id: 'row-0:col-0',
            rowId: 'row-0',
            columnId: 'col-0',
            value: true,
            type: 'boolean',
          },
          {
            id: 'row-0:col-1',
            rowId: 'row-0',
            columnId: 'col-1',
            value: false,
            type: 'boolean',
          },
        ],
      ];

      const tsv = cellsToTSV(cells);
      expect(tsv).toBe('true\tfalse');
    });

    it('should handle date values', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const cells: Cell[][] = [
        [
          {
            id: 'row-0:col-0',
            rowId: 'row-0',
            columnId: 'col-0',
            value: date,
            type: 'date',
          },
        ],
      ];

      const tsv = cellsToTSV(cells);
      expect(tsv).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should escape special characters', () => {
      const cells: Cell[][] = [
        [
          {
            id: 'row-0:col-0',
            rowId: 'row-0',
            columnId: 'col-0',
            value: 'Hello, World',
            type: 'text',
          },
          {
            id: 'row-0:col-1',
            rowId: 'row-0',
            columnId: 'col-1',
            value: '=SUM(A1:A10)',
            type: 'formula',
          },
        ],
      ];

      const tsv = cellsToTSV(cells);
      expect(tsv).toBe('"Hello, World"\t"=SUM(A1:A10)"');
    });

    it('should return empty string for empty cells', () => {
      const cells: Cell[][] = [];
      const tsv = cellsToTSV(cells);
      expect(tsv).toBe('');
    });
  });

  describe('tsvToCellValues', () => {
    it('should parse TSV to cell values', () => {
      const tsv = 'Name\t100\nItem\t200';
      const values = tsvToCellValues(tsv);

      expect(values).toEqual([
        ['Name', 100],
        ['Item', 200],
      ]);
    });

    it('should parse boolean values', () => {
      const tsv = 'true\tfalse\tTRUE\tFALSE';
      const values = tsvToCellValues(tsv);

      expect(values).toEqual([[true, false, true, false]]);
    });

    it('should parse number values', () => {
      const tsv = '100\t200.5\t-50\t0';
      const values = tsvToCellValues(tsv);

      expect(values).toEqual([[100, 200.5, -50, 0]]);
    });

    it('should parse date values in ISO format', () => {
      const tsv = '2024-01-01\t2024-12-31T23:59:59.000Z';
      const values = tsvToCellValues(tsv);

      expect(values[0][0]).toBeInstanceOf(Date);
      expect(values[0][1]).toBeInstanceOf(Date);
    });

    it('should handle quoted values', () => {
      const tsv = '"Hello, World"\t"=SUM(A1:A10)"';
      const values = tsvToCellValues(tsv);

      expect(values).toEqual([['Hello, World', '=SUM(A1:A10)']]);
    });

    it('should handle escaped quotes', () => {
      const tsv = '"She said ""Hello"""';
      const values = tsvToCellValues(tsv);

      expect(values).toEqual([['She said "Hello"']]);
    });

    it('should handle empty cells', () => {
      const tsv = 'A\t\tC\n\tB\t';
      const values = tsvToCellValues(tsv);

      expect(values).toEqual([
        ['A', null, 'C'],
        [null, 'B', null],
      ]);
    });

    it('should return empty array for empty string', () => {
      const values = tsvToCellValues('');
      expect(values).toEqual([]);
    });
  });

  describe('cellsToJSON and jsonToClipboardData', () => {
    it('should serialize and deserialize clipboard data', () => {
      const clipboardData: ClipboardData = {
        cells: [
          [
            {
              id: 'row-0:col-0',
              rowId: 'row-0',
              columnId: 'col-0',
              value: 'Test',
              type: 'text',
            },
          ],
        ],
        isCut: false,
      };

      const json = cellsToJSON(clipboardData);
      const parsed = jsonToClipboardData(json);

      expect(parsed).toEqual(clipboardData);
    });

    it('should preserve cell styles', () => {
      const clipboardData: ClipboardData = {
        cells: [
          [
            {
              id: 'row-0:col-0',
              rowId: 'row-0',
              columnId: 'col-0',
              value: 'Styled',
              type: 'text',
              style: {
                fontWeight: 'bold',
                color: '#FF0000',
                backgroundColor: '#FFFF00',
              },
            },
          ],
        ],
        isCut: true,
      };

      const json = cellsToJSON(clipboardData);
      const parsed = jsonToClipboardData(json);

      expect(parsed?.cells[0][0].style).toEqual(
        clipboardData.cells[0][0].style
      );
      expect(parsed?.isCut).toBe(true);
    });

    it('should return null for invalid JSON', () => {
      const parsed = jsonToClipboardData('invalid json');
      expect(parsed).toBeNull();
    });

    it('should return null for invalid structure', () => {
      const parsed = jsonToClipboardData('{"foo": "bar"}');
      expect(parsed).toBeNull();
    });
  });

  describe('createClipboardText and parseClipboardText', () => {
    it('should create and parse internal clipboard text', () => {
      const clipboardData: ClipboardData = {
        cells: [
          [
            {
              id: 'row-0:col-0',
              rowId: 'row-0',
              columnId: 'col-0',
              value: 'Test',
              type: 'text',
              style: {
                fontWeight: 'bold',
              },
            },
          ],
        ],
        isCut: false,
      };

      const text = createClipboardText(clipboardData);
      const parsed = parseClipboardText(text);

      expect(parsed.isInternal).toBe(true);
      expect(parsed.clipboardData).toEqual(clipboardData);
      expect(parsed.cellValues).toEqual([['Test']]);
    });

    it('should parse external TSV text', () => {
      const tsv = 'Name\t100\nItem\t200';
      const parsed = parseClipboardText(tsv);

      expect(parsed.isInternal).toBe(false);
      expect(parsed.clipboardData).toBeNull();
      expect(parsed.cellValues).toEqual([
        ['Name', 100],
        ['Item', 200],
      ]);
    });

    it('should include TSV in internal format for external compatibility', () => {
      const clipboardData: ClipboardData = {
        cells: [
          [
            {
              id: 'row-0:col-0',
              rowId: 'row-0',
              columnId: 'col-0',
              value: 'Excel',
              type: 'text',
            },
            {
              id: 'row-0:col-1',
              rowId: 'row-0',
              columnId: 'col-1',
              value: 123,
              type: 'number',
            },
          ],
        ],
        isCut: false,
      };

      const text = createClipboardText(clipboardData);

      // Should contain both marker and TSV
      expect(text).toContain('##GAME_DATA_SPREADSHEET##');
      expect(text).toContain('Excel\t123');
    });
  });

  describe('copyCellStyle', () => {
    it('should create a deep copy of cell style', () => {
      const style = {
        fontWeight: 'bold' as const,
        color: '#FF0000',
        border: {
          top: { width: 1, style: 'solid' as const, color: '#000000' },
        },
      };

      const copied = copyCellStyle(style);

      expect(copied).toEqual(style);
      expect(copied).not.toBe(style);
      expect(copied?.border).not.toBe(style.border);
      expect(copied?.border?.top).not.toBe(style.border.top);
    });

    it('should return undefined for undefined style', () => {
      const copied = copyCellStyle(undefined);
      expect(copied).toBeUndefined();
    });
  });

  describe('createCellCopy', () => {
    it('should create a copy of a cell with new IDs', () => {
      const originalCell: Cell = {
        id: 'row-0:col-0',
        rowId: 'row-0',
        columnId: 'col-0',
        value: 'Original',
        type: 'text',
        style: {
          fontWeight: 'bold',
        },
      };

      const copy = createCellCopy(originalCell, 'row-1', 'col-1');

      expect(copy.id).toBe('row-1:col-1');
      expect(copy.rowId).toBe('row-1');
      expect(copy.columnId).toBe('col-1');
      expect(copy.value).toBe('Original');
      expect(copy.style).toEqual(originalCell.style);
      expect(copy.style).not.toBe(originalCell.style);
    });

    it('should preserve formula', () => {
      const originalCell: Cell = {
        id: 'row-0:col-0',
        rowId: 'row-0',
        columnId: 'col-0',
        value: 100,
        type: 'formula',
        formula: '=SUM(A1:A10)',
      };

      const copy = createCellCopy(originalCell, 'row-1', 'col-1');

      expect(copy.formula).toBe('=SUM(A1:A10)');
    });
  });

  describe('isClipboardAPIAvailable', () => {
    it('should return true if clipboard API is available', () => {
      // Mock navigator.clipboard
      Object.defineProperty(global.navigator, 'clipboard', {
        value: {
          writeText: vi.fn(),
          readText: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const available = isClipboardAPIAvailable();
      expect(available).toBe(true);
    });

    it('should return false if clipboard API is not available', () => {
      // Remove clipboard from navigator
      Object.defineProperty(global.navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const available = isClipboardAPIAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Round-trip tests', () => {
    it('should preserve all data in copy-paste cycle', () => {
      const originalCells: Cell[][] = [
        [
          {
            id: 'row-0:col-0',
            rowId: 'row-0',
            columnId: 'col-0',
            value: 'Name',
            type: 'text',
            style: {
              fontWeight: 'bold',
              backgroundColor: '#FFFF00',
            },
          },
          {
            id: 'row-0:col-1',
            rowId: 'row-0',
            columnId: 'col-1',
            value: 100,
            type: 'number',
            style: {
              numberFormat: '#,##0.00',
            },
          },
        ],
        [
          {
            id: 'row-1:col-0',
            rowId: 'row-1',
            columnId: 'col-0',
            value: 'Item',
            type: 'text',
          },
          {
            id: 'row-1:col-1',
            rowId: 'row-1',
            columnId: 'col-1',
            value: 200,
            type: 'number',
            formula: '=SUM(B1:B1)',
          },
        ],
      ];

      const clipboardData: ClipboardData = {
        cells: originalCells,
        isCut: false,
      };

      // Create clipboard text
      const text = createClipboardText(clipboardData);

      // Parse it back
      const parsed = parseClipboardText(text);

      expect(parsed.isInternal).toBe(true);
      expect(parsed.clipboardData?.cells).toEqual(originalCells);
      expect(parsed.clipboardData?.isCut).toBe(false);
    });

    it('should handle external paste from Excel-like format', () => {
      // Simulate Excel paste
      const excelData =
        'Name\tQuantity\tPrice\nApple\t10\t1.50\nBanana\t20\t0.75';

      const parsed = parseClipboardText(excelData);

      expect(parsed.isInternal).toBe(false);
      expect(parsed.cellValues).toEqual([
        ['Name', 'Quantity', 'Price'],
        ['Apple', 10, 1.5],
        ['Banana', 20, 0.75],
      ]);
    });
  });
});
