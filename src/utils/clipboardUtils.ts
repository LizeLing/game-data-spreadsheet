/**
 * Clipboard Utilities
 * Functions for handling clipboard operations (copy, cut, paste)
 */

import type { Cell, CellValue, CellStyle } from '@types';

/**
 * Clipboard data structure
 */
export interface ClipboardData {
  cells: Cell[][]; // 2D array of cells [row][column]
  isCut: boolean; // Track if it was a cut operation
}

/**
 * Convert 2D cell array to TSV (Tab-Separated Values) format
 * This format is compatible with Excel, Google Sheets, etc.
 */
export const cellsToTSV = (cells: Cell[][]): string => {
  if (!cells || cells.length === 0) return '';

  return cells
    .map((row) =>
      row
        .map((cell) => {
          // Format cell value for TSV
          let value = cell.value;

          // Handle null/undefined
          if (value === null || value === undefined) return '';

          // Handle different value types
          if (value instanceof Date) {
            value = value.toISOString();
          } else if (typeof value === 'boolean') {
            value = value.toString();
          } else if (typeof value === 'number') {
            value = value.toString();
          } else {
            value = String(value);
          }

          // Escape tabs and newlines in the value
          value = value.replace(/\t/g, '    ').replace(/\n/g, ' ');

          // If value contains commas, quotes, or starts with =, wrap in quotes
          if (
            value.includes(',') ||
            value.includes('"') ||
            value.startsWith('=')
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }

          return value;
        })
        .join('\t')
    )
    .join('\n');
};

/**
 * Parse TSV (Tab-Separated Values) format into 2D array of values
 * Handles external clipboard data from Excel, Google Sheets, etc.
 */
export const tsvToCellValues = (tsv: string): CellValue[][] => {
  if (!tsv) return [];

  const lines = tsv.split('\n');
  const result: CellValue[][] = [];

  for (const line of lines) {
    if (line === '') continue;

    const values: CellValue[] = [];
    const cells = line.split('\t');

    for (let cell of cells) {
      // Remove surrounding quotes if present
      if (cell.startsWith('"') && cell.endsWith('"')) {
        cell = cell.slice(1, -1).replace(/""/g, '"');
      }

      // Parse the value
      values.push(parseTSVValue(cell));
    }

    result.push(values);
  }

  return result;
};

/**
 * Parse a single TSV cell value to appropriate type
 */
const parseTSVValue = (value: string): CellValue => {
  if (!value || value === '') return null;

  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }

  // Try to parse as boolean
  const lower = value.toLowerCase().trim();
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Try to parse as date (ISO format)
  if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Return as string
  return value;
};

/**
 * Convert clipboard data to JSON format (internal format)
 * Preserves all cell properties including styles and formulas
 */
export const cellsToJSON = (clipboardData: ClipboardData): string => {
  return JSON.stringify(clipboardData);
};

/**
 * Parse JSON clipboard data (internal format)
 */
export const jsonToClipboardData = (json: string): ClipboardData | null => {
  try {
    const data = JSON.parse(json);

    // Validate structure
    if (!data || typeof data !== 'object') return null;
    if (!Array.isArray(data.cells)) return null;
    if (typeof data.isCut !== 'boolean') return null;

    return data as ClipboardData;
  } catch (error) {
    console.error('Failed to parse clipboard JSON:', error);
    return null;
  }
};

/**
 * Create a marker to identify internal clipboard data
 */
export const INTERNAL_CLIPBOARD_MARKER = '##GAME_DATA_SPREADSHEET##';

/**
 * Create clipboard text with both internal and TSV formats
 * Format: MARKER + JSON + NEWLINE + TSV
 * This allows pasting into external apps while preserving internal data
 */
export const createClipboardText = (clipboardData: ClipboardData): string => {
  const json = cellsToJSON(clipboardData);
  const tsv = cellsToTSV(clipboardData.cells);

  return `${INTERNAL_CLIPBOARD_MARKER}\n${json}\n${tsv}`;
};

/**
 * Parse clipboard text (handles both internal and external formats)
 */
export const parseClipboardText = (
  text: string
): {
  clipboardData: ClipboardData | null;
  cellValues: CellValue[][];
  isInternal: boolean;
} => {
  // Check if it's internal format
  if (text.startsWith(INTERNAL_CLIPBOARD_MARKER)) {
    const parts = text.split('\n');
    if (parts.length >= 2) {
      const jsonPart = parts[1];
      const clipboardData = jsonToClipboardData(jsonPart);

      if (clipboardData) {
        // Extract cell values from clipboard data
        const cellValues = clipboardData.cells.map((row) =>
          row.map((cell) => cell.value)
        );

        return {
          clipboardData,
          cellValues,
          isInternal: true,
        };
      }
    }
  }

  // External format (TSV)
  const cellValues = tsvToCellValues(text);

  return {
    clipboardData: null,
    cellValues,
    isInternal: false,
  };
};

/**
 * Copy cell style (deep copy)
 */
export const copyCellStyle = (style?: CellStyle): CellStyle | undefined => {
  if (!style) return undefined;

  return {
    ...style,
    border: style.border
      ? {
          top: style.border.top ? { ...style.border.top } : undefined,
          right: style.border.right ? { ...style.border.right } : undefined,
          bottom: style.border.bottom ? { ...style.border.bottom } : undefined,
          left: style.border.left ? { ...style.border.left } : undefined,
        }
      : undefined,
  };
};

/**
 * Create a cell copy (deep copy)
 */
export const createCellCopy = (
  cell: Cell,
  newRowId: string,
  newColumnId: string
): Cell => {
  return {
    id: `${newRowId}:${newColumnId}`,
    rowId: newRowId,
    columnId: newColumnId,
    value: cell.value,
    type: cell.type,
    formula: cell.formula,
    style: copyCellStyle(cell.style),
    validation: cell.validation ? { ...cell.validation } : undefined,
    error: cell.error,
    metadata: cell.metadata ? { ...cell.metadata } : undefined,
  };
};

/**
 * Check if clipboard API is available
 */
export const isClipboardAPIAvailable = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard !== 'undefined' &&
    typeof navigator.clipboard.writeText === 'function' &&
    typeof navigator.clipboard.readText === 'function'
  );
};

/**
 * Write text to clipboard
 */
export const writeToClipboard = async (text: string): Promise<boolean> => {
  if (!isClipboardAPIAvailable()) {
    console.error('Clipboard API not available');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to write to clipboard:', error);
    return false;
  }
};

/**
 * Read text from clipboard
 */
export const readFromClipboard = async (): Promise<string | null> => {
  if (!isClipboardAPIAvailable()) {
    console.error('Clipboard API not available');
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return null;
  }
};
