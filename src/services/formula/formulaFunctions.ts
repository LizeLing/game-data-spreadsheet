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

  // Statistical Functions
  MEDIAN,
  MODE,
  STDEV,
  STDEVP,
  VAR,
  VARP,

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
  STAT_SCALE,
  DROP_RATE,
  EXP_CURVE,
  GACHA_RATE,
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

// ============ Statistical Functions ============

/**
 * MEDIAN: 중앙값
 */
function MEDIAN(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  const numbers = flattened
    .map(toNumber)
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  if (numbers.length === 0) return null;

  const mid = Math.floor(numbers.length / 2);
  if (numbers.length % 2 === 0) {
    return (numbers[mid - 1] + numbers[mid]) / 2;
  }
  return numbers[mid];
}

/**
 * MODE: 최빈값 (가장 자주 나타나는 값)
 */
function MODE(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  const numbers = flattened
    .map(toNumber)
    .filter((n): n is number => n !== null);

  if (numbers.length === 0) return null;

  const frequency: Map<number, number> = new Map();
  let maxFreq = 0;
  let mode: number | null = null;

  numbers.forEach((num) => {
    const freq = (frequency.get(num) || 0) + 1;
    frequency.set(num, freq);

    if (freq > maxFreq) {
      maxFreq = freq;
      mode = num;
    }
  });

  return maxFreq > 1 ? mode : null;
}

/**
 * STDEV: 표본 표준편차 (Sample Standard Deviation)
 */
function STDEV(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  const numbers = flattened
    .map(toNumber)
    .filter((n): n is number => n !== null);

  if (numbers.length < 2) return null;

  const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const variance =
    numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) /
    (numbers.length - 1);

  return Math.sqrt(variance);
}

/**
 * STDEVP: 모집단 표준편차 (Population Standard Deviation)
 */
function STDEVP(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  const numbers = flattened
    .map(toNumber)
    .filter((n): n is number => n !== null);

  if (numbers.length === 0) return null;

  const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const variance =
    numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / numbers.length;

  return Math.sqrt(variance);
}

/**
 * VAR: 표본 분산 (Sample Variance)
 */
function VAR(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  const numbers = flattened
    .map(toNumber)
    .filter((n): n is number => n !== null);

  if (numbers.length < 2) return null;

  const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  return (
    numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) /
    (numbers.length - 1)
  );
}

/**
 * VARP: 모집단 분산 (Population Variance)
 */
function VARP(...args: (CellValue | CellValue[])[]): CellValue {
  const flattened = flatten(args);
  const numbers = flattened
    .map(toNumber)
    .filter((n): n is number => n !== null);

  if (numbers.length === 0) return null;

  const avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  return numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / numbers.length;
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
function toNumber(value: CellValue | CellValue[] | undefined): number | null {
  // Handle undefined
  if (value === undefined) return null;

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

// ========== 추가 게임 전용 함수 ==========

/**
 * STAT_SCALE(level, baseValue, growthRate, formula)
 * 레벨에 따른 스탯 스케일링 계산
 *
 * @param level - 레벨
 * @param baseValue - 기본 값
 * @param growthRate - 성장률 (%, 기본값 10)
 * @param formula - 공식 타입 ('linear', 'exponential', 'logarithmic', 기본값 'linear')
 *
 * Examples:
 * - STAT_SCALE(10, 100, 10) → 190 (linear: 100 + (10-1) * 10)
 * - STAT_SCALE(10, 100, 10, "exponential") → 235.79 (exponential growth)
 */
function STAT_SCALE(
  level: CellValue | CellValue[],
  baseValue: CellValue | CellValue[],
  growthRate?: CellValue | CellValue[],
  formula?: CellValue | CellValue[]
): CellValue {
  const lvl = toNumber(level);
  const base = toNumber(baseValue);
  const growth = toNumber(growthRate) ?? 10; // Default 10%
  const formulaType = toString(formula) ?? 'linear';

  if (lvl === null || base === null) return '#VALUE!';
  if (lvl < 1) return '#VALUE!';

  switch (formulaType.toLowerCase()) {
    case 'linear':
      // base + (level - 1) * growth
      return base + (lvl - 1) * growth;

    case 'exponential':
      // base * (1 + growth/100) ^ (level - 1)
      return base * Math.pow(1 + growth / 100, lvl - 1);

    case 'logarithmic':
      // base + growth * log(level)
      return base + growth * Math.log(lvl);

    case 'quadratic':
      // base + growth * (level - 1) ^ 2
      return base + growth * Math.pow(lvl - 1, 2);

    default:
      return '#VALUE!';
  }
}

/**
 * DROP_RATE(baseRate, luckStat, enemyLevel, playerLevel)
 * 드랍 확률 계산 (행운 스탯 및 레벨 차이 반영)
 *
 * @param baseRate - 기본 드랍률 (%)
 * @param luckStat - 행운 스탯 (0-100)
 * @param enemyLevel - 적 레벨 (선택)
 * @param playerLevel - 플레이어 레벨 (선택)
 *
 * Examples:
 * - DROP_RATE(10, 50) → 15% (luck bonus: +5%)
 * - DROP_RATE(10, 50, 20, 25) → 17.5% (luck + level bonus)
 */
function DROP_RATE(
  baseRate: CellValue | CellValue[],
  luckStat?: CellValue | CellValue[],
  enemyLevel?: CellValue | CellValue[],
  playerLevel?: CellValue | CellValue[]
): CellValue {
  const base = toNumber(baseRate);
  const luck = toNumber(luckStat) ?? 0;
  const eLvl = toNumber(enemyLevel);
  const pLvl = toNumber(playerLevel);

  if (base === null) return '#VALUE!';

  let finalRate = base;

  // Luck bonus: +0.1% per luck point
  if (luck > 0) {
    finalRate += luck * 0.1;
  }

  // Level difference bonus: +2.5% if player level > enemy level
  if (eLvl !== null && pLvl !== null && pLvl > eLvl) {
    const levelDiff = pLvl - eLvl;
    finalRate += levelDiff * 2.5;
  }

  // Cap at 100%
  return Math.min(finalRate, 100);
}

/**
 * EXP_CURVE(level, baseExp, multiplier, exponent)
 * 레벨업에 필요한 경험치 계산
 *
 * @param level - 레벨
 * @param baseExp - 기본 경험치
 * @param multiplier - 배율 (기본값 1.5)
 * @param exponent - 지수 (기본값 1.5)
 *
 * Examples:
 * - EXP_CURVE(1) → 100 (default)
 * - EXP_CURVE(10, 100, 1.5, 1.5) → 1837 (100 * 1.5 * 10^1.5)
 */
function EXP_CURVE(
  level: CellValue | CellValue[],
  baseExp?: CellValue | CellValue[],
  multiplier?: CellValue | CellValue[],
  exponent?: CellValue | CellValue[]
): CellValue {
  const lvl = toNumber(level);
  const base = toNumber(baseExp) ?? 100;
  const mult = toNumber(multiplier) ?? 1.5;
  const exp = toNumber(exponent) ?? 1.5;

  if (lvl === null || lvl < 1) return '#VALUE!';

  // Formula: baseExp * multiplier * level ^ exponent
  return Math.round(base * mult * Math.pow(lvl, exp));
}

/**
 * GACHA_RATE(rarity, pityCounter, baseRate, pityThreshold)
 * 가챠 확률 계산 (천장 시스템 포함)
 *
 * @param rarity - 희귀도 레벨 (1-6: common, uncommon, rare, epic, legendary, mythic)
 * @param pityCounter - 현재 뽑기 횟수
 * @param baseRate - 기본 확률 (%, 선택)
 * @param pityThreshold - 천장 임계값 (선택, 기본값 90)
 *
 * Examples:
 * - GACHA_RATE(6, 0) → 0.6% (mythic base rate)
 * - GACHA_RATE(6, 89, 0.6, 90) → 100% (pity reached)
 */
function GACHA_RATE(
  rarity: CellValue | CellValue[],
  pityCounter?: CellValue | CellValue[],
  baseRate?: CellValue | CellValue[],
  pityThreshold?: CellValue | CellValue[]
): CellValue {
  const rarityLevel = toNumber(rarity);
  const pity = toNumber(pityCounter) ?? 0;
  let base = toNumber(baseRate);
  const threshold = toNumber(pityThreshold) ?? 90;

  if (rarityLevel === null || rarityLevel < 1 || rarityLevel > 6) {
    return '#VALUE!';
  }

  // Default base rates for each rarity (if not provided)
  if (base === null) {
    const defaultRates = [40, 25, 15, 10, 5, 0.6]; // common ~ mythic
    base = defaultRates[rarityLevel - 1];
  }

  // Pity system: if pity counter >= threshold, guarantee (100%)
  if (pity >= threshold) {
    return 100;
  }

  // Soft pity: increase rate gradually from 75% of threshold
  const softPityStart = Math.floor(threshold * 0.75);
  if (pity >= softPityStart) {
    const progressRatio = (pity - softPityStart) / (threshold - softPityStart);
    // Increase rate up to 10x at threshold
    const multiplier = 1 + progressRatio * 9;
    return Math.min(base * multiplier, 99);
  }

  return base;
}

/**
 * Helper: Convert to string
 */
function toString(value: CellValue | CellValue[] | undefined): string {
  if (value === undefined) return '';
  if (Array.isArray(value)) {
    return value.length === 1 ? String(value[0]) : '';
  }
  return String(value ?? '');
}
