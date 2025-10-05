/**
 * Formula Functions
 * 내장 함수 라이브러리
 */

import type { CellValue } from '@types';

export type FormulaFunction = (
  ...args: (CellValue | CellValue[])[]
) => CellValue;

/**
 * 내장 함수 맵
 */
export const FORMULA_FUNCTIONS: Record<string, FormulaFunction> = {
  // Math Functions
  SUM,
  AVERAGE,
  MIN,
  MAX,
  COUNT,
  COUNTA,
  ROUND,
  CEILING,
  FLOOR,
  ABS,
  SQRT,
  POWER,

  // Logical Functions
  IF,
  AND,
  OR,
  NOT,

  // Text Functions
  CONCATENATE,
  LEFT,
  RIGHT,
  MID,
  UPPER,
  LOWER,
  LEN,

  // Game Data Functions
  DAMAGE_CALC,
  STAT_TOTAL,
  RARITY_BONUS,
};

// ============ Math Functions ============

/**
 * SUM: 합계
 */
function SUM(...args: (CellValue | CellValue[])[]): CellValue {
  const numbers = flattenAndFilter(args);
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0);
}

/**
 * AVERAGE: 평균
 */
function AVERAGE(...args: (CellValue | CellValue[])[]): CellValue {
  const numbers = flattenAndFilter(args);
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * MIN: 최소값
 */
function MIN(...args: (CellValue | CellValue[])[]): CellValue {
  const numbers = flattenAndFilter(args);
  if (numbers.length === 0) return 0;
  return Math.min(...numbers);
}

/**
 * MAX: 최대값
 */
function MAX(...args: (CellValue | CellValue[])[]): CellValue {
  const numbers = flattenAndFilter(args);
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
}

/**
 * COUNT: 숫자 개수
 */
function COUNT(...args: (CellValue | CellValue[])[]): CellValue {
  const numbers = flattenAndFilter(args);
  return numbers.length;
}

/**
 * COUNTA: 비어있지 않은 셀 개수
 */
function COUNTA(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  return flattened.filter((v) => v !== null && v !== undefined && v !== '')
    .length;
}

/**
 * ROUND: 반올림
 */
function ROUND(
  value: CellValue | CellValue[],
  decimals: CellValue | CellValue[] = 0
): CellValue {
  const num = toNumber(value);
  const dec = toNumber(decimals);
  if (num === null || dec === null) return null;

  const factor = Math.pow(10, dec);
  return Math.round(num * factor) / factor;
}

/**
 * CEILING: 올림
 */
function CEILING(value: CellValue | CellValue[]): CellValue {
  const num = toNumber(value);
  return num !== null ? Math.ceil(num) : null;
}

/**
 * FLOOR: 내림
 */
function FLOOR(value: CellValue | CellValue[]): CellValue {
  const num = toNumber(value);
  return num !== null ? Math.floor(num) : null;
}

/**
 * ABS: 절대값
 */
function ABS(value: CellValue | CellValue[]): CellValue {
  const num = toNumber(value);
  return num !== null ? Math.abs(num) : null;
}

/**
 * SQRT: 제곱근
 */
function SQRT(value: CellValue | CellValue[]): CellValue {
  const num = toNumber(value);
  return num !== null && num >= 0 ? Math.sqrt(num) : null;
}

/**
 * POWER: 거듭제곱
 */
function POWER(
  base: CellValue | CellValue[],
  exponent: CellValue | CellValue[]
): CellValue {
  const b = toNumber(base);
  const e = toNumber(exponent);
  return b !== null && e !== null ? Math.pow(b, e) : null;
}

// ============ Logical Functions ============

/**
 * IF: 조건문
 */
function IF(
  condition: CellValue | CellValue[],
  trueValue: CellValue | CellValue[],
  falseValue: CellValue | CellValue[]
): CellValue {
  return (toBoolean(condition) ? trueValue : falseValue) as CellValue;
}

/**
 * AND: 논리곱
 */
function AND(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  return flattened.every((v) => toBoolean(v));
}

/**
 * OR: 논리합
 */
function OR(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  return flattened.some((v) => toBoolean(v));
}

/**
 * NOT: 논리부정
 */
function NOT(value: CellValue | CellValue[]): CellValue {
  return !toBoolean(value);
}

// ============ Text Functions ============

/**
 * CONCATENATE: 문자열 연결
 */
function CONCATENATE(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  return flattened.map((v) => String(v ?? '')).join('');
}

/**
 * LEFT: 왼쪽부터 문자열 추출
 */
function LEFT(
  text: CellValue | CellValue[],
  numChars: CellValue | CellValue[] = 1
): CellValue {
  const str = String(text ?? '');
  const n = toNumber(numChars) ?? 1;
  return str.substring(0, n);
}

/**
 * RIGHT: 오른쪽부터 문자열 추출
 */
function RIGHT(
  text: CellValue | CellValue[],
  numChars: CellValue | CellValue[] = 1
): CellValue {
  const str = String(text ?? '');
  const n = toNumber(numChars) ?? 1;
  return str.substring(str.length - n);
}

/**
 * MID: 중간부터 문자열 추출
 */
function MID(
  text: CellValue | CellValue[],
  startNum: CellValue | CellValue[],
  numChars: CellValue | CellValue[]
): CellValue {
  const str = String(text ?? '');
  const start = (toNumber(startNum) ?? 1) - 1; // Excel uses 1-based indexing
  const length = toNumber(numChars) ?? 0;
  return str.substring(start, start + length);
}

/**
 * UPPER: 대문자 변환
 */
function UPPER(text: CellValue | CellValue[]): CellValue {
  return String(text ?? '').toUpperCase();
}

/**
 * LOWER: 소문자 변환
 */
function LOWER(text: CellValue | CellValue[]): CellValue {
  return String(text ?? '').toLowerCase();
}

/**
 * LEN: 문자열 길이
 */
function LEN(text: CellValue | CellValue[]): CellValue {
  return String(text ?? '').length;
}

// ============ Game Data Functions ============

/**
 * DAMAGE_CALC: 데미지 계산
 * DAMAGE_CALC(attack, defense) = attack * (100 / (100 + defense))
 */
function DAMAGE_CALC(
  attack: CellValue | CellValue[],
  defense: CellValue | CellValue[]
): CellValue {
  const atk = toNumber(attack);
  const def = toNumber(defense);

  if (atk === null || def === null) return null;

  return Math.floor(atk * (100 / (100 + def)));
}

/**
 * STAT_TOTAL: 스탯 합계 (여러 스탯 값을 합산)
 */
function STAT_TOTAL(...stats: (CellValue | CellValue[])[]): CellValue {
  return SUM(...stats);
}

/**
 * RARITY_BONUS: 레어도에 따른 보너스 계산
 */
function RARITY_BONUS(rarity: CellValue | CellValue[]): CellValue {
  const rarityStr = String(rarity ?? '').toLowerCase();

  const bonusMap: Record<string, number> = {
    common: 1.0,
    uncommon: 1.1,
    rare: 1.25,
    epic: 1.5,
    legendary: 2.0,
    mythic: 3.0,
  };

  return bonusMap[rarityStr] ?? 1.0;
}

// ============ Helper Functions ============

/**
 * Flatten nested arrays
 */
function flatten(arr: (CellValue | CellValue[])[]): CellValue[] {
  const result: CellValue[] = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }

  return result;
}

/**
 * Flatten and filter numbers
 */
function flattenAndFilter(arr: (CellValue | CellValue[])[]): number[] {
  const flattened = flatten(arr);
  const numbers: number[] = [];

  for (const item of flattened) {
    const num = toNumber(item);
    if (num !== null) {
      numbers.push(num);
    }
  }

  return numbers;
}

/**
 * Convert to number
 */
function toNumber(value: CellValue | CellValue[]): number | null {
  // If array is passed, reject it (ranges should only be in function contexts)
  if (Array.isArray(value)) {
    // For single-element arrays, take the first element
    if (value.length === 1) return toNumber(value[0]);
    return null;
  }

  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Convert to boolean
 */
function toBoolean(value: CellValue | CellValue[]): boolean {
  // If array is passed, check if it's non-empty
  if (Array.isArray(value)) {
    // For single-element arrays, convert the first element
    if (value.length === 1) return toBoolean(value[0]);
    return value.length > 0;
  }

  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return value.length > 0;
  }
  return value !== null && value !== undefined;
}
