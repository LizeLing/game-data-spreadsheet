/**
 * Search and Replace Utilities
 * Helper functions for finding and replacing cell values in sheets
 */

import type { Sheet, Cell, CellValue } from '@types';

export interface SearchOptions {
  matchCase?: boolean;
  matchWholeCell?: boolean;
  searchFormulas?: boolean;
  useRegex?: boolean;
}

export interface SearchResult {
  sheetId: string;
  sheetName: string;
  rowId: string;
  rowIndex: number;
  columnId: string;
  columnIndex: number;
  cellId: string;
  value: CellValue;
  formula?: string;
  matchedText: string;
}

/**
 * Search for text in a sheet
 */
export function searchInSheet(
  sheet: Sheet,
  searchText: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    matchCase = false,
    matchWholeCell = false,
    searchFormulas = false,
    useRegex = false,
  } = options;

  const results: SearchResult[] = [];

  // Build search pattern
  let pattern: RegExp;
  if (useRegex) {
    try {
      pattern = new RegExp(searchText, matchCase ? 'g' : 'gi');
    } catch {
      // Invalid regex, fall back to literal search
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(escaped, matchCase ? 'g' : 'gi');
    }
  } else {
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (matchWholeCell) {
      pattern = new RegExp(`^${escaped}$`, matchCase ? '' : 'i');
    } else {
      pattern = new RegExp(escaped, matchCase ? 'g' : 'gi');
    }
  }

  // Search through all cells
  sheet.rows.forEach((row, rowIndex) => {
    sheet.columns.forEach((column, columnIndex) => {
      const cell = row.cells[column.id];
      if (!cell) return;

      // Search in value
      const valueStr = String(cell.value ?? '');
      if (valueStr && pattern.test(valueStr)) {
        results.push({
          sheetId: sheet.id,
          sheetName: sheet.name,
          rowId: row.id,
          rowIndex,
          columnId: column.id,
          columnIndex,
          cellId: cell.id,
          value: cell.value,
          formula: cell.formula,
          matchedText: valueStr,
        });
        return; // Don't check formula if value matched
      }

      // Search in formula if enabled
      if (searchFormulas && cell.formula) {
        const formulaStr = cell.formula;
        if (pattern.test(formulaStr)) {
          results.push({
            sheetId: sheet.id,
            sheetName: sheet.name,
            rowId: row.id,
            rowIndex,
            columnId: column.id,
            columnIndex,
            cellId: cell.id,
            value: cell.value,
            formula: cell.formula,
            matchedText: formulaStr,
          });
        }
      }
    });
  });

  return results;
}

/**
 * Search across multiple sheets
 */
export function searchInSheets(
  sheets: Sheet[],
  searchText: string,
  options: SearchOptions = {}
): SearchResult[] {
  const allResults: SearchResult[] = [];

  sheets.forEach((sheet) => {
    const sheetResults = searchInSheet(sheet, searchText, options);
    allResults.push(...sheetResults);
  });

  return allResults;
}

/**
 * Replace text in cell value
 */
export function replaceInCell(
  cell: Cell,
  searchText: string,
  replaceText: string,
  options: SearchOptions = {}
): CellValue {
  const {
    matchCase = false,
    matchWholeCell = false,
    useRegex = false,
  } = options;

  const valueStr = String(cell.value ?? '');

  // Build search pattern
  let pattern: RegExp;
  if (useRegex) {
    try {
      pattern = new RegExp(searchText, matchCase ? 'g' : 'gi');
    } catch {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(escaped, matchCase ? 'g' : 'gi');
    }
  } else {
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (matchWholeCell) {
      pattern = new RegExp(`^${escaped}$`, matchCase ? '' : 'i');
    } else {
      pattern = new RegExp(escaped, matchCase ? 'g' : 'gi');
    }
  }

  // Replace text
  const newValue = valueStr.replace(pattern, replaceText);

  // Try to preserve type
  if (cell.type === 'number') {
    const num = parseFloat(newValue);
    return isNaN(num) ? newValue : num;
  } else if (cell.type === 'boolean') {
    if (newValue.toLowerCase() === 'true') return true;
    if (newValue.toLowerCase() === 'false') return false;
    return newValue;
  }

  return newValue;
}

/**
 * Count occurrences of search text
 */
export function countMatches(
  text: string,
  searchText: string,
  options: SearchOptions = {}
): number {
  const { matchCase = false, useRegex = false } = options;

  let pattern: RegExp;
  if (useRegex) {
    try {
      pattern = new RegExp(searchText, matchCase ? 'g' : 'gi');
    } catch {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pattern = new RegExp(escaped, matchCase ? 'g' : 'gi');
    }
  } else {
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern = new RegExp(escaped, matchCase ? 'g' : 'gi');
  }

  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}
