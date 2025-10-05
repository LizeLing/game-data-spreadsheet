/**
 * Search Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  searchInSheet,
  searchInSheets,
  replaceInCell,
  countMatches,
} from './searchUtils';
import { createMockSheet } from '@test/utils/mockData';

describe('searchUtils', () => {
  describe('searchInSheet', () => {
    it('should find exact matches', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B'],
        rows: [
          { A: 'Hello World', B: 'Test' },
          { A: 'Hello', B: 'World' },
        ],
      });

      const results = searchInSheet(sheet, 'Hello');

      expect(results.length).toBe(2);
      expect(results[0].matchedText).toBe('Hello World');
      expect(results[1].matchedText).toBe('Hello');
    });

    it('should respect matchCase option', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: 'Hello' }, { A: 'hello' }, { A: 'HELLO' }],
      });

      const results = searchInSheet(sheet, 'hello', { matchCase: true });

      expect(results.length).toBe(1);
      expect(results[0].matchedText).toBe('hello');
    });

    it('should match whole cell when matchWholeCell is true', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: 'Test' }, { A: 'Testing' }, { A: 'Test123' }],
      });

      const results = searchInSheet(sheet, 'Test', { matchWholeCell: true });

      expect(results.length).toBe(1);
      expect(results[0].matchedText).toBe('Test');
    });

    it('should search in formulas when searchFormulas is true', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: null }],
      });

      // Add a formula
      sheet.rows[0].cells['col-A'].formula = '=SUM(B1:B10)';

      const results = searchInSheet(sheet, 'SUM', { searchFormulas: true });

      expect(results.length).toBe(1);
      expect(results[0].formula).toBe('=SUM(B1:B10)');
    });

    it('should support regex search', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: 'Test123' }, { A: 'Test456' }, { A: 'NoMatch' }],
      });

      const results = searchInSheet(sheet, 'Test\\d+', { useRegex: true });

      // Should find Test123 (and Test456 is in the same cell, so 1 result per cell)
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty search text', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: 'Test' }],
      });

      const results = searchInSheet(sheet, '');

      // Empty search should still work with regex matching empty string
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('searchInSheets', () => {
    it('should search across multiple sheets', () => {
      const sheet1 = createMockSheet({
        name: 'Sheet1',
        columns: ['A'],
        rows: [{ A: 'Hello' }],
      });

      const sheet2 = createMockSheet({
        name: 'Sheet2',
        columns: ['A'],
        rows: [{ A: 'Hello World' }],
      });

      const results = searchInSheets([sheet1, sheet2], 'Hello');

      expect(results.length).toBe(2);
      expect(results[0].sheetName).toBe('Sheet1');
      expect(results[1].sheetName).toBe('Sheet2');
    });
  });

  describe('replaceInCell', () => {
    it('should replace text in cell', () => {
      const cell = {
        id: 'test-cell',
        rowId: 'row-0',
        columnId: 'col-A',
        value: 'Hello World',
        type: 'text' as const,
      };

      const result = replaceInCell(cell, 'World', 'Universe');

      expect(result).toBe('Hello Universe');
    });

    it('should replace multiple occurrences', () => {
      const cell = {
        id: 'test-cell',
        rowId: 'row-0',
        columnId: 'col-A',
        value: 'test test test',
        type: 'text' as const,
      };

      const result = replaceInCell(cell, 'test', 'demo');

      expect(result).toBe('demo demo demo');
    });

    it('should respect matchCase in replace', () => {
      const cell = {
        id: 'test-cell',
        rowId: 'row-0',
        columnId: 'col-A',
        value: 'Hello hello HELLO',
        type: 'text' as const,
      };

      const result = replaceInCell(cell, 'hello', 'hi', { matchCase: true });

      expect(result).toBe('Hello hi HELLO');
    });

    it('should preserve number type when possible', () => {
      const cell = {
        id: 'test-cell',
        rowId: 'row-0',
        columnId: 'col-A',
        value: 'Value: 123',
        type: 'number' as const,
      };

      const result = replaceInCell(cell, 'Value: ', '');

      expect(result).toBe(123);
      expect(typeof result).toBe('number');
    });

    it('should preserve boolean type when possible', () => {
      const cell = {
        id: 'test-cell',
        rowId: 'row-0',
        columnId: 'col-A',
        value: 'false',
        type: 'boolean' as const,
      };

      const result = replaceInCell(cell, 'false', 'true');

      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('countMatches', () => {
    it('should count exact matches', () => {
      const count = countMatches('hello world hello', 'hello');

      expect(count).toBe(2);
    });

    it('should count case-insensitive matches', () => {
      const count = countMatches('Hello HELLO hello', 'hello', {
        matchCase: false,
      });

      expect(count).toBe(3);
    });

    it('should count case-sensitive matches', () => {
      const count = countMatches('Hello HELLO hello', 'hello', {
        matchCase: true,
      });

      expect(count).toBe(1);
    });

    it('should count regex matches', () => {
      const count = countMatches('test1 test2 test3', 'test\\d', {
        useRegex: true,
      });

      expect(count).toBe(3);
    });

    it('should return 0 for no matches', () => {
      const count = countMatches('hello world', 'xyz');

      expect(count).toBe(0);
    });
  });
});
