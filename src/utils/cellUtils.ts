/**
 * Cell Utilities
 * 셀 관련 유틸리티 함수들
 */

import type { CellValue, CellType } from '@types';

/**
 * 셀 ID 생성
 */
export const generateCellId = (rowId: string, columnId: string): string => {
  return `${rowId}:${columnId}`;
};

/**
 * 문자열을 적절한 타입으로 파싱
 */
export const parseCellValue = (value: string): CellValue => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }

  // Date
  const date = new Date(value);
  if (date instanceof Date && !isNaN(date.getTime())) {
    // Check if it looks like a date string
    if (value.includes('-') || value.includes('/')) {
      return date;
    }
  }

  // Default to string
  return value;
};

/**
 * 셀 값 포맷팅
 */
export const formatCellValue = (value: CellValue, type?: CellType): string => {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'date':
      return value instanceof Date ? value.toLocaleDateString() : String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    default:
      return String(value);
  }
};

/**
 * 셀 타입 자동 감지
 */
export const getCellType = (value: CellValue): CellType => {
  if (value === null || value === undefined) return 'text';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (value instanceof Date) return 'date';
  if (typeof value === 'string' && value.startsWith('=')) return 'formula';
  return 'text';
};

/**
 * 셀 값 비교 (정렬용)
 */
export const compareCellValues = (
  a: CellValue,
  b: CellValue,
  direction: 'asc' | 'desc' = 'asc'
): number => {
  // null/undefined handling
  const aIsNull = a === null || a === undefined;
  const bIsNull = b === null || b === undefined;

  if (aIsNull && bIsNull) return 0; // Both null/undefined are equal
  if (aIsNull) return direction === 'asc' ? 1 : -1;
  if (bIsNull) return direction === 'asc' ? -1 : 1;

  // Same type comparison
  if (typeof a === typeof b) {
    if (a < b) return direction === 'asc' ? -1 : 1;
    if (a > b) return direction === 'asc' ? 1 : -1;
    return 0;
  }

  // Different types - convert to string
  const aStr = String(a);
  const bStr = String(b);
  return direction === 'asc'
    ? aStr.localeCompare(bStr)
    : bStr.localeCompare(aStr);
};

/**
 * 셀 값 유효성 검사
 */
export const isValidCellValue = (value: CellValue, type: CellType): boolean => {
  switch (type) {
    case 'number':
      return typeof value === 'number' || !isNaN(Number(value));
    case 'boolean':
      return typeof value === 'boolean';
    case 'date':
      return value instanceof Date || !isNaN(new Date(String(value)).getTime());
    case 'text':
    case 'select':
    case 'multiselect':
      return typeof value === 'string';
    default:
      return true;
  }
};

/**
 * 통화 포맷팅
 */
export const formatCurrency = (value: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * 퍼센트 포맷팅
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * 셀 값 검색
 */
export const matchesCellValue = (
  value: CellValue,
  searchTerm: string,
  caseSensitive = false
): boolean => {
  if (!value || !searchTerm) return false;

  const valueStr = String(value);
  const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const target = caseSensitive ? valueStr : valueStr.toLowerCase();

  return target.includes(search);
};

/**
 * 숫자 포맷 적용
 */
export const applyNumberFormat = (
  value: CellValue,
  format?: string
): string => {
  if (typeof value !== 'number') return String(value || '');
  if (!format) return value.toString();

  switch (format) {
    case '#,##0':
      return Math.round(value).toLocaleString();
    case '#,##0.00':
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case '0.00%':
      return `${(value * 100).toFixed(2)}%`;
    case '$#,##0.00':
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case '0.00E+00':
      return value.toExponential(2);
    default:
      return value.toString();
  }
};

/**
 * Conditional Formatting Utilities
 */
import type { CellStyle, ConditionalFormat, Cell } from '@types';

/**
 * 조건부 서식이 셀에 적용되는지 확인
 */
export const isConditionalFormatApplicable = (
  format: ConditionalFormat,
  cell: Cell,
  rowIndex: number,
  columnIndex: number
): boolean => {
  const { range } = format;
  if (
    rowIndex < range.startRow ||
    rowIndex > range.endRow ||
    columnIndex < range.startColumn ||
    columnIndex > range.endColumn
  ) {
    return false;
  }

  return evaluateCondition(format.condition, cell.value);
};

/**
 * 조건 평가
 */
export const evaluateCondition = (
  condition: ConditionalFormat['condition'],
  value: CellValue
): boolean => {
  const { type, operator, value: conditionValue } = condition;

  switch (type) {
    case 'value':
      return evaluateValueCondition(value, operator, conditionValue);
    case 'text':
      return evaluateTextCondition(value, operator, conditionValue);
    case 'formula':
      return false;
    default:
      return false;
  }
};

/**
 * 값 조건 평가
 */
const evaluateValueCondition = (
  cellValue: CellValue,
  operator: ConditionalFormat['condition']['operator'],
  conditionValue: CellValue | CellValue[]
): boolean => {
  const numValue =
    typeof cellValue === 'number' ? cellValue : Number(cellValue);

  if (isNaN(numValue)) return false;

  switch (operator) {
    case 'equals':
      return numValue === Number(conditionValue);
    case 'notEquals':
      return numValue !== Number(conditionValue);
    case 'greaterThan':
      return numValue > Number(conditionValue);
    case 'lessThan':
      return numValue < Number(conditionValue);
    case 'greaterThanOrEqual':
      return numValue >= Number(conditionValue);
    case 'lessThanOrEqual':
      return numValue <= Number(conditionValue);
    case 'between':
      if (Array.isArray(conditionValue) && conditionValue.length === 2) {
        const [min, max] = conditionValue.map(Number);
        return numValue >= min && numValue <= max;
      }
      return false;
    default:
      return false;
  }
};

/**
 * 텍스트 조건 평가
 */
const evaluateTextCondition = (
  cellValue: CellValue,
  operator: ConditionalFormat['condition']['operator'],
  conditionValue: CellValue | CellValue[]
): boolean => {
  const strValue = String(cellValue || '').toLowerCase();
  const strCondition = String(conditionValue || '').toLowerCase();

  switch (operator) {
    case 'equals':
      return strValue === strCondition;
    case 'notEquals':
      return strValue !== strCondition;
    case 'contains':
      return strValue.includes(strCondition);
    default:
      return false;
  }
};

/**
 * 셀에 적용될 조건부 서식 스타일 가져오기
 */
export const getConditionalStyle = (
  cell: Cell,
  rowIndex: number,
  columnIndex: number,
  conditionalFormats: ConditionalFormat[] = []
): CellStyle | null => {
  const sortedFormats = [...conditionalFormats].sort(
    (a, b) => a.priority - b.priority
  );

  for (const format of sortedFormats) {
    if (isConditionalFormatApplicable(format, cell, rowIndex, columnIndex)) {
      return format.style;
    }
  }

  return null;
};

/**
 * 셀 스타일을 CSS 객체로 변환
 */
export const cellStyleToCSS = (style?: CellStyle): React.CSSProperties => {
  if (!style) return {};

  const cssStyle: React.CSSProperties = {};

  if (style.fontFamily) cssStyle.fontFamily = style.fontFamily;
  if (style.fontSize) cssStyle.fontSize = `${style.fontSize}px`;
  if (style.fontWeight) cssStyle.fontWeight = style.fontWeight;
  if (style.fontStyle) cssStyle.fontStyle = style.fontStyle;
  if (style.textDecoration) cssStyle.textDecoration = style.textDecoration;
  if (style.color) cssStyle.color = style.color;
  if (style.backgroundColor) cssStyle.backgroundColor = style.backgroundColor;
  if (style.textAlign) cssStyle.textAlign = style.textAlign;

  if (style.verticalAlign) {
    cssStyle.display = 'flex';
    cssStyle.alignItems =
      style.verticalAlign === 'top'
        ? 'flex-start'
        : style.verticalAlign === 'bottom'
          ? 'flex-end'
          : 'center';
  }

  if (style.border) {
    const { top, right, bottom, left } = style.border;
    if (top) {
      cssStyle.borderTop = `${top.width || 1}px ${top.style || 'solid'} ${top.color || '#000'}`;
    }
    if (right) {
      cssStyle.borderRight = `${right.width || 1}px ${right.style || 'solid'} ${right.color || '#000'}`;
    }
    if (bottom) {
      cssStyle.borderBottom = `${bottom.width || 1}px ${bottom.style || 'solid'} ${bottom.color || '#000'}`;
    }
    if (left) {
      cssStyle.borderLeft = `${left.width || 1}px ${left.style || 'solid'} ${left.color || '#000'}`;
    }
  }

  return cssStyle;
};

/**
 * 두 스타일 병합
 */
export const mergeStyles = (
  baseStyle?: CellStyle,
  conditionalStyle?: CellStyle | null
): CellStyle => {
  if (!conditionalStyle) return baseStyle || {};
  if (!baseStyle) return conditionalStyle;
  return { ...baseStyle, ...conditionalStyle };
};

// Game Data Preset Colors
export const RARITY_COLORS: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
  mythic: '#f44336',
};

export const QUALITY_COLORS: Record<string, string> = {
  poor: '#9d9d9d',
  normal: '#ffffff',
  good: '#1eff00',
  excellent: '#0070dd',
  superior: '#a335ee',
  perfect: '#ff8000',
};

export const STATUS_COLORS: Record<string, string> = {
  active: '#4caf50',
  inactive: '#9e9e9e',
  pending: '#ff9800',
  error: '#f44336',
  warning: '#ffc107',
};

export const NUMBER_FORMATS = {
  integer: '#,##0',
  decimal: '#,##0.00',
  percentage: '0.00%',
  currency: '$#,##0.00',
  scientific: '0.00E+00',
};

/**
 * Game Data Preset Functions
 */

/**
 * Rarity 컬럼에 자동으로 조건부 서식 적용
 */
export const createRarityConditionalFormats = (
  sheetId: string,
  columnIndex: number,
  rowCount: number
): ConditionalFormat[] => {
  return Object.entries(RARITY_COLORS).map(([rarity, color], index) => ({
    id: `${sheetId}-rarity-${rarity}`,
    range: {
      startRow: 0,
      endRow: rowCount - 1,
      startColumn: columnIndex,
      endColumn: columnIndex,
    },
    condition: {
      type: 'text' as const,
      operator: 'equals' as const,
      value: rarity,
    },
    style: {
      backgroundColor: color,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    priority: index,
  }));
};

/**
 * Quality/Grade 컬럼에 자동으로 조건부 서식 적용
 */
export const createQualityConditionalFormats = (
  sheetId: string,
  columnIndex: number,
  rowCount: number
): ConditionalFormat[] => {
  return Object.entries(QUALITY_COLORS).map(([quality, color], index) => ({
    id: `${sheetId}-quality-${quality}`,
    range: {
      startRow: 0,
      endRow: rowCount - 1,
      startColumn: columnIndex,
      endColumn: columnIndex,
    },
    condition: {
      type: 'text' as const,
      operator: 'equals' as const,
      value: quality,
    },
    style: {
      backgroundColor: color,
      color: quality === 'normal' ? '#000000' : '#ffffff',
      fontWeight: 'bold',
    },
    priority: index,
  }));
};

/**
 * Status 컬럼에 자동으로 조건부 서식 적용
 */
export const createStatusConditionalFormats = (
  sheetId: string,
  columnIndex: number,
  rowCount: number
): ConditionalFormat[] => {
  return Object.entries(STATUS_COLORS).map(([status, color], index) => ({
    id: `${sheetId}-status-${status}`,
    range: {
      startRow: 0,
      endRow: rowCount - 1,
      startColumn: columnIndex,
      endColumn: columnIndex,
    },
    condition: {
      type: 'text' as const,
      operator: 'equals' as const,
      value: status,
    },
    style: {
      backgroundColor: color,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    priority: index,
  }));
};

/**
 * 숫자 범위에 따른 조건부 서식 (예: HP, 공격력 등)
 */
export const createNumericRangeFormats = (
  sheetId: string,
  columnIndex: number,
  rowCount: number,
  ranges: { min: number; max: number; color: string }[]
): ConditionalFormat[] => {
  return ranges.map((range, index) => ({
    id: `${sheetId}-range-${index}`,
    range: {
      startRow: 0,
      endRow: rowCount - 1,
      startColumn: columnIndex,
      endColumn: columnIndex,
    },
    condition: {
      type: 'value' as const,
      operator: 'between' as const,
      value: [range.min, range.max],
    },
    style: {
      backgroundColor: range.color,
      color: '#ffffff',
    },
    priority: index,
  }));
};

/**
 * 게임 데이터 헤더 스타일
 */
export const HEADER_STYLE: CellStyle = {
  backgroundColor: '#1976d2',
  color: '#ffffff',
  fontWeight: 'bold',
  fontSize: 14,
  textAlign: 'center',
  verticalAlign: 'middle',
};

/**
 * ID 컬럼 스타일
 */
export const ID_COLUMN_STYLE: CellStyle = {
  backgroundColor: '#f5f5f5',
  fontFamily: 'monospace',
  textAlign: 'left',
};

/**
 * 읽기 전용 컬럼 스타일
 */
export const READONLY_COLUMN_STYLE: CellStyle = {
  backgroundColor: '#fafafa',
  color: '#757575',
};
