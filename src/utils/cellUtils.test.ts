/**
 * Cell Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateCellId,
  parseCellValue,
  formatCellValue,
  getCellType,
  compareCellValues,
} from './cellUtils';

describe('cellUtils', () => {
  describe('generateCellId', () => {
    it('should generate cell ID from row and column IDs', () => {
      expect(generateCellId('row-0', 'col-A')).toBe('row-0:col-A');
      expect(generateCellId('row-5', 'col-Z')).toBe('row-5:col-Z');
    });
  });

  describe('parseCellValue', () => {
    it('should parse empty values as null', () => {
      expect(parseCellValue('')).toBeNull();
    });

    it('should parse boolean values', () => {
      expect(parseCellValue('true')).toBe(true);
      expect(parseCellValue('TRUE')).toBe(true);
      expect(parseCellValue('false')).toBe(false);
      expect(parseCellValue('FALSE')).toBe(false);
    });

    it('should parse numeric values', () => {
      expect(parseCellValue('42')).toBe(42);
      expect(parseCellValue('3.14')).toBe(3.14);
      expect(parseCellValue('-100')).toBe(-100);
    });

    it('should parse date values', () => {
      const result = parseCellValue('2024-10-05');
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getFullYear()).toBe(2024);
    });

    it('should return string for non-parseable values', () => {
      expect(parseCellValue('hello')).toBe('hello');
      expect(parseCellValue('test 123')).toBe('test 123');
    });
  });

  describe('formatCellValue', () => {
    it('should return empty string for null/undefined', () => {
      expect(formatCellValue(null)).toBe('');
      expect(formatCellValue(undefined)).toBe('');
    });

    it('should format numbers', () => {
      const formatted = formatCellValue(1000, 'number');
      expect(formatted).toContain('1'); // locale-aware formatting
    });

    it('should format dates', () => {
      const date = new Date('2024-10-05');
      const formatted = formatCellValue(date, 'date');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should format booleans', () => {
      expect(formatCellValue(true, 'boolean')).toBe('true');
      expect(formatCellValue(false, 'boolean')).toBe('false');
    });

    it('should format text', () => {
      expect(formatCellValue('hello', 'text')).toBe('hello');
      expect(formatCellValue(123)).toBe('123');
    });
  });

  describe('getCellType', () => {
    it('should detect text type for null/undefined', () => {
      expect(getCellType(null)).toBe('text');
      expect(getCellType(undefined)).toBe('text');
    });

    it('should detect boolean type', () => {
      expect(getCellType(true)).toBe('boolean');
      expect(getCellType(false)).toBe('boolean');
    });

    it('should detect number type', () => {
      expect(getCellType(42)).toBe('number');
      expect(getCellType(3.14)).toBe('number');
    });

    it('should detect date type', () => {
      expect(getCellType(new Date())).toBe('date');
    });

    it('should detect formula type', () => {
      expect(getCellType('=SUM(A1:A10)')).toBe('formula');
      expect(getCellType('=A1+B1')).toBe('formula');
    });

    it('should default to text type', () => {
      expect(getCellType('hello')).toBe('text');
      expect(getCellType('123abc')).toBe('text');
    });
  });

  describe('compareCellValues', () => {
    it('should handle null/undefined values', () => {
      expect(compareCellValues(null, 10, 'asc')).toBeGreaterThan(0);
      expect(compareCellValues(10, null, 'asc')).toBeLessThan(0);
      expect(compareCellValues(null, null, 'asc')).toBe(0);
    });

    it('should compare numbers ascending', () => {
      expect(compareCellValues(1, 10, 'asc')).toBeLessThan(0);
      expect(compareCellValues(10, 1, 'asc')).toBeGreaterThan(0);
      expect(compareCellValues(5, 5, 'asc')).toBe(0);
    });

    it('should compare numbers descending', () => {
      expect(compareCellValues(1, 10, 'desc')).toBeGreaterThan(0);
      expect(compareCellValues(10, 1, 'desc')).toBeLessThan(0);
    });

    it('should compare strings ascending', () => {
      expect(compareCellValues('apple', 'banana', 'asc')).toBeLessThan(0);
      expect(compareCellValues('zebra', 'apple', 'asc')).toBeGreaterThan(0);
    });

    it('should compare strings descending', () => {
      expect(compareCellValues('apple', 'banana', 'desc')).toBeGreaterThan(0);
      expect(compareCellValues('zebra', 'apple', 'desc')).toBeLessThan(0);
    });

    it('should compare mixed types as strings', () => {
      const result = compareCellValues(100, 'hello', 'asc');
      expect(typeof result).toBe('number');
    });
  });
});
