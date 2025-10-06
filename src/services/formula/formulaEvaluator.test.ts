/**
 * Formula Evaluator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormulaEvaluator } from './formulaEvaluator';
import { createMockSheet } from '@test/utils/mockData';

describe('FormulaEvaluator', () => {
  let evaluator: FormulaEvaluator;

  beforeEach(() => {
    evaluator = new FormulaEvaluator();
  });

  describe('Basic Operations', () => {
    it('should evaluate addition', () => {
      const sheet = createMockSheet({
        rows: [{ A: 10, B: 20 }],
      });

      const result = evaluator.evaluate('test', '=10+20', sheet);
      expect(result).toBe(30);
    });

    it('should evaluate subtraction', () => {
      const sheet = createMockSheet({
        rows: [{ A: 50, B: 20 }],
      });

      const result = evaluator.evaluate('test', '=50-20', sheet);
      expect(result).toBe(30);
    });

    it('should evaluate multiplication', () => {
      const sheet = createMockSheet({
        rows: [{ A: 5, B: 4 }],
      });

      const result = evaluator.evaluate('test', '=5*4', sheet);
      expect(result).toBe(20);
    });

    it('should evaluate division', () => {
      const sheet = createMockSheet({
        rows: [{ A: 100, B: 4 }],
      });

      const result = evaluator.evaluate('test', '=100/4', sheet);
      expect(result).toBe(25);
    });

    it('should throw error on division by zero', () => {
      const sheet = createMockSheet({
        rows: [{ A: 10, B: 0 }],
      });

      expect(() => {
        evaluator.evaluate('test', '=10/0', sheet);
      }).toThrow('Division by zero');
    });

    it('should evaluate exponentiation', () => {
      const sheet = createMockSheet({
        rows: [{ A: 2, B: 3 }],
      });

      const result = evaluator.evaluate('test', '=2^3', sheet);
      expect(result).toBe(8);
    });
  });

  describe('Cell References', () => {
    it('should evaluate cell reference', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B'],
        rows: [{ A: 42, B: 100 }],
      });

      const result = evaluator.evaluate('test', '=A1', sheet);
      expect(result).toBe(42);
    });

    it('should evaluate cell references in arithmetic', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B'],
        rows: [{ A: 10, B: 20 }],
      });

      const result = evaluator.evaluate('test', '=A1+B1', sheet);
      expect(result).toBe(30);
    });

    it('should return null for non-existent cell', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: 10 }],
      });

      const result = evaluator.evaluate('test', '=Z99', sheet);
      expect(result).toBeNull();
    });
  });

  describe('Functions', () => {
    it('should evaluate SUM function', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B', 'C'],
        rows: [{ A: 10, B: 20, C: 30 }],
      });

      const result = evaluator.evaluate('test', '=SUM(A1,B1,C1)', sheet);
      expect(result).toBe(60);
    });

    it('should evaluate AVERAGE function', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B', 'C'],
        rows: [{ A: 10, B: 20, C: 30 }],
      });

      const result = evaluator.evaluate('test', '=AVERAGE(A1,B1,C1)', sheet);
      expect(result).toBe(20);
    });

    it('should evaluate MIN function', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B', 'C'],
        rows: [{ A: 10, B: 5, C: 30 }],
      });

      const result = evaluator.evaluate('test', '=MIN(A1,B1,C1)', sheet);
      expect(result).toBe(5);
    });

    it('should evaluate MAX function', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B', 'C'],
        rows: [{ A: 10, B: 5, C: 30 }],
      });

      const result = evaluator.evaluate('test', '=MAX(A1,B1,C1)', sheet);
      expect(result).toBe(30);
    });

    it('should evaluate IF function', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: 10 }],
      });

      const result = evaluator.evaluate('test', '=IF(A1>5,"yes","no")', sheet);
      expect(result).toBe('yes');

      const result2 = evaluator.evaluate(
        'test2',
        '=IF(A1<5,"yes","no")',
        sheet
      );
      expect(result2).toBe('no');
    });
  });

  describe('Circular Reference Detection', () => {
    it('should detect direct circular reference', () => {
      const sheet = createMockSheet({
        columns: ['A'],
        rows: [{ A: null }],
      });

      // A1 references itself
      sheet.rows[0].cells['col-A'].formula = '=A1';

      expect(() => {
        evaluator.evaluate('row-0:col-A', '=A1', sheet);
      }).toThrow('Circular reference detected');
    });

    it('should detect indirect circular reference', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B'],
        rows: [{ A: null, B: null }],
      });

      // A1 = B1, B1 = A1 (circular)
      sheet.rows[0].cells['col-A'].formula = '=B1';
      sheet.rows[0].cells['col-B'].formula = '=A1';

      expect(() => {
        evaluator.evaluate('row-0:col-A', '=B1', sheet);
      }).toThrow('Circular reference detected');
    });
  });

  describe('Nested Formulas', () => {
    it('should evaluate nested formulas', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B', 'C'],
        rows: [{ A: 10, B: null, C: null }],
      });

      // B1 = A1 * 2
      sheet.rows[0].cells['col-B'].formula = '=A1*2';
      sheet.rows[0].cells['col-B'].value = null;

      // C1 = B1 + 5
      const result = evaluator.evaluate('row-0:col-C', '=B1+5', sheet);

      // B1 should evaluate to 20, so C1 should be 25
      expect(result).toBe(25);
    });

    it('should evaluate complex nested expressions', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B'],
        rows: [{ A: 5, B: 10 }],
      });

      const result = evaluator.evaluate('test', '=(A1+B1)*2', sheet);
      expect(result).toBe(30);
    });
  });

  describe('String Concatenation', () => {
    it('should concatenate strings with & operator', () => {
      const sheet = createMockSheet({
        columns: ['A', 'B'],
        rows: [{ A: 'Hello', B: 'World' }],
      });

      const result = evaluator.evaluate('test', '=A1&" "&B1', sheet);
      expect(result).toBe('Hello World');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid syntax', () => {
      const sheet = createMockSheet();

      expect(() => {
        evaluator.evaluate('test', '=A1+', sheet);
      }).toThrow();
    });

    it('should handle unknown function', () => {
      const sheet = createMockSheet();

      expect(() => {
        evaluator.evaluate('test', '=UNKNOWN(A1)', sheet);
      }).toThrow();
    });
  });

  describe('Statistical Functions', () => {
    it('should calculate MEDIAN with odd count', () => {
      const sheet = createMockSheet({
        rows: [{ A: 1 }, { A: 2 }, { A: 3 }, { A: 4 }, { A: 5 }],
      });

      const result = evaluator.evaluate('test', '=MEDIAN(A1:A5)', sheet);
      expect(result).toBe(3);
    });

    it('should calculate MEDIAN with even count', () => {
      const sheet = createMockSheet({
        rows: [{ A: 1 }, { A: 2 }, { A: 3 }, { A: 4 }],
      });

      const result = evaluator.evaluate('test', '=MEDIAN(A1:A4)', sheet);
      expect(result).toBe(2.5);
    });

    it('should calculate MODE', () => {
      const sheet = createMockSheet({
        rows: [{ A: 1 }, { A: 2 }, { A: 2 }, { A: 3 }, { A: 2 }],
      });

      const result = evaluator.evaluate('test', '=MODE(A1:A5)', sheet);
      expect(result).toBe(2);
    });

    it('should calculate STDEV (sample)', () => {
      const sheet = createMockSheet({
        rows: [{ A: 2 }, { A: 4 }, { A: 6 }, { A: 8 }],
      });

      const result = evaluator.evaluate('test', '=STDEV(A1:A4)', sheet);
      // STDEV of [2, 4, 6, 8] ≈ 2.58
      expect(result).toBeCloseTo(2.58, 1);
    });

    it('should calculate STDEVP (population)', () => {
      const sheet = createMockSheet({
        rows: [{ A: 2 }, { A: 4 }, { A: 6 }, { A: 8 }],
      });

      const result = evaluator.evaluate('test', '=STDEVP(A1:A4)', sheet);
      // STDEVP of [2, 4, 6, 8] ≈ 2.24
      expect(result).toBeCloseTo(2.24, 1);
    });

    it('should calculate VAR (sample variance)', () => {
      const sheet = createMockSheet({
        rows: [{ A: 2 }, { A: 4 }, { A: 6 }, { A: 8 }],
      });

      const result = evaluator.evaluate('test', '=VAR(A1:A4)', sheet);
      // VAR of [2, 4, 6, 8] ≈ 6.67
      expect(result).toBeCloseTo(6.67, 1);
    });

    it('should calculate VARP (population variance)', () => {
      const sheet = createMockSheet({
        rows: [{ A: 2 }, { A: 4 }, { A: 6 }, { A: 8 }],
      });

      const result = evaluator.evaluate('test', '=VARP(A1:A4)', sheet);
      // VARP of [2, 4, 6, 8] = 5
      expect(result).toBe(5);
    });
  });
});
