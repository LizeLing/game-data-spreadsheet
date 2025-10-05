/**
 * Validation Engine - Select Type Tests
 * select 및 multiselect 타입 검증 테스트
 */

import { describe, it, expect } from 'vitest';
import { validateValueType, validateCell } from './validationEngine';
import type { Cell } from '@types';

describe('Select Type Validation', () => {
  describe('validateValueType - select', () => {
    it('should validate select with valid option', () => {
      const result = validateValueType(
        'Apple',
        'select',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(true);
    });

    it('should reject select with invalid option', () => {
      const result = validateValueType(
        'Grape',
        'select',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('유효한 옵션이 아닙니다');
      expect(result.message).toContain('Apple, Banana, Orange');
    });

    it('should allow empty value for select', () => {
      const result = validateValueType('', 'select', ['Option1', 'Option2']);
      expect(result.valid).toBe(true);
    });

    it('should allow null value for select', () => {
      const result = validateValueType(null, 'select', ['Option1', 'Option2']);
      expect(result.valid).toBe(true);
    });

    it('should allow undefined value for select', () => {
      const result = validateValueType(
        undefined,
        'select',
        ['Option1', 'Option2']
      );
      expect(result.valid).toBe(true);
    });

    it('should validate when no options provided', () => {
      const result = validateValueType('AnyValue', 'select', []);
      expect(result.valid).toBe(true);
    });

    it('should validate when options is undefined', () => {
      const result = validateValueType('AnyValue', 'select');
      expect(result.valid).toBe(true);
    });

    it('should trim whitespace and validate', () => {
      const result = validateValueType(
        '  Apple  ',
        'select',
        ['Apple', 'Banana']
      );
      expect(result.valid).toBe(true);
    });

    it('should be case-sensitive', () => {
      const result = validateValueType('apple', 'select', ['Apple', 'Banana']);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateValueType - multiselect', () => {
    it('should validate multiselect with valid options', () => {
      const result = validateValueType(
        'Apple, Banana',
        'multiselect',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(true);
    });

    it('should validate multiselect with single option', () => {
      const result = validateValueType(
        'Apple',
        'multiselect',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(true);
    });

    it('should validate multiselect with all options', () => {
      const result = validateValueType(
        'Apple, Banana, Orange',
        'multiselect',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(true);
    });

    it('should reject multiselect with one invalid option', () => {
      const result = validateValueType(
        'Apple, Grape',
        'multiselect',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('유효하지 않은 옵션: Grape');
      expect(result.message).toContain('Apple, Banana, Orange');
    });

    it('should reject multiselect with multiple invalid options', () => {
      const result = validateValueType(
        'Grape, Mango, Apple',
        'multiselect',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('유효하지 않은 옵션: Grape, Mango');
    });

    it('should allow empty value for multiselect', () => {
      const result = validateValueType('', 'multiselect', ['Option1', 'Option2']);
      expect(result.valid).toBe(true);
    });

    it('should trim whitespace in multiselect values', () => {
      const result = validateValueType(
        '  Apple  , Banana ,  Orange  ',
        'multiselect',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(true);
    });

    it('should handle empty items in comma-separated list', () => {
      const result = validateValueType(
        'Apple,,Banana',
        'multiselect',
        ['Apple', 'Banana', 'Orange']
      );
      expect(result.valid).toBe(true);
    });

    it('should validate when no options provided', () => {
      const result = validateValueType('Any, Values', 'multiselect', []);
      expect(result.valid).toBe(true);
    });

    it('should validate when options is undefined', () => {
      const result = validateValueType('Any, Values', 'multiselect');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCell with select options', () => {
    it('should validate cell with select type and valid option', () => {
      const cell: Cell = {
        id: 'row-0:col-rarity',
        rowId: 'row-0',
        columnId: 'col-rarity',
        value: 'rare',
        type: 'select',
      };

      const result = validateCell(
        cell,
        'select',
        ['common', 'uncommon', 'rare', 'epic', 'legendary']
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate cell with select type and invalid option', () => {
      const cell: Cell = {
        id: 'row-0:col-rarity',
        rowId: 'row-0',
        columnId: 'col-rarity',
        value: 'mythic',
        type: 'select',
      };

      const result = validateCell(
        cell,
        'select',
        ['common', 'uncommon', 'rare', 'epic', 'legendary']
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('유효한 옵션이 아닙니다');
    });

    it('should validate cell with multiselect type and valid options', () => {
      const cell: Cell = {
        id: 'row-0:col-tags',
        rowId: 'row-0',
        columnId: 'col-tags',
        value: 'weapon, tradable',
        type: 'multiselect',
      };

      const result = validateCell(
        cell,
        'multiselect',
        ['weapon', 'armor', 'consumable', 'quest', 'tradable', 'bound']
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate cell with multiselect type and invalid options', () => {
      const cell: Cell = {
        id: 'row-0:col-tags',
        rowId: 'row-0',
        columnId: 'col-tags',
        value: 'weapon, magic',
        type: 'multiselect',
      };

      const result = validateCell(
        cell,
        'multiselect',
        ['weapon', 'armor', 'consumable', 'quest', 'tradable', 'bound']
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('유효하지 않은 옵션: magic');
    });
  });

  describe('Game template scenarios', () => {
    it('should validate character class selection', () => {
      const cell: Cell = {
        id: 'row-0:col-class',
        rowId: 'row-0',
        columnId: 'col-class',
        value: 'warrior',
        type: 'select',
      };

      const result = validateCell(
        cell,
        'select',
        ['warrior', 'mage', 'rogue', 'cleric', 'ranger', 'paladin']
      );

      expect(result.valid).toBe(true);
    });

    it('should validate item rarity selection', () => {
      const cell: Cell = {
        id: 'row-0:col-rarity',
        rowId: 'row-0',
        columnId: 'col-rarity',
        value: 'legendary',
        type: 'select',
      };

      const result = validateCell(
        cell,
        'select',
        ['common', 'uncommon', 'rare', 'epic', 'legendary']
      );

      expect(result.valid).toBe(true);
    });

    it('should validate character tags (multiselect)', () => {
      const cell: Cell = {
        id: 'row-0:col-tags',
        rowId: 'row-0',
        columnId: 'col-tags',
        value: 'melee, tank, physical',
        type: 'multiselect',
      };

      const result = validateCell(
        cell,
        'multiselect',
        ['melee', 'magic', 'physical', 'tank', 'dps', 'support']
      );

      expect(result.valid).toBe(true);
    });

    it('should invalidate incorrect character tags', () => {
      const cell: Cell = {
        id: 'row-0:col-tags',
        rowId: 'row-0',
        columnId: 'col-tags',
        value: 'melee, healer',
        type: 'multiselect',
      };

      const result = validateCell(
        cell,
        'multiselect',
        ['melee', 'magic', 'physical', 'tank', 'dps', 'support']
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('healer');
    });
  });
});
