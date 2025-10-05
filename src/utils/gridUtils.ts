/**
 * Grid Utilities
 * 그리드 관련 유틸리티 함수들
 */

import type { Column, Row, CellType } from '@types';

/**
 * 열 인덱스를 문자로 변환 (0 -> A, 1 -> B, ...)
 */
export const columnIndexToLetter = (index: number): string => {
  let letter = '';
  let num = index;

  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter;
    num = Math.floor(num / 26) - 1;
  }

  return letter;
};

/**
 * 문자를 열 인덱스로 변환 (A -> 0, B -> 1, ...)
 */
export const letterToColumnIndex = (letter: string): number => {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
};

/**
 * 기본 컬럼 생성
 */
export const generateColumns = (
  count: number,
  startIndex = 0,
  type: CellType = 'text'
): Column[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const letter = columnIndexToLetter(index);
    return {
      id: `col-${letter}`,
      name: letter,
      type,
      width: 120,
      index,
      frozen: false,
      hidden: false,
    };
  });
};

/**
 * 기본 행 생성
 */
export const generateRows = (
  count: number,
  columns: Column[],
  startIndex = 0
): Row[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const rowId = `row-${index + 1}`;

    const cells: Record<string, any> = {};
    columns.forEach((col) => {
      cells[col.id] = {
        id: `${rowId}:${col.id}`,
        rowId,
        columnId: col.id,
        value: null,
        type: col.type,
      };
    });

    return {
      id: rowId,
      index,
      cells,
      height: 32,
      hidden: false,
    };
  });
};

/**
 * 셀 참조 생성 (A1 형식)
 */
export const getCellReference = (
  rowIndex: number,
  columnIndex: number
): string => {
  return `${columnIndexToLetter(columnIndex)}${rowIndex + 1}`;
};

/**
 * 셀 참조 파싱 (A1 -> {row: 0, col: 0})
 */
export const parseCellReference = (
  reference: string
): { rowIndex: number; columnIndex: number } | null => {
  const match = reference.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const [, letter, number] = match;
  return {
    rowIndex: parseInt(number) - 1,
    columnIndex: letterToColumnIndex(letter),
  };
};

/**
 * 범위 참조 생성 (A1:C3 형식)
 */
export const getRangeReference = (
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): string => {
  const start = getCellReference(startRow, startCol);
  const end = getCellReference(endRow, endCol);
  return `${start}:${end}`;
};

/**
 * 컬럼 너비 자동 계산
 */
export const calculateOptimalColumnWidth = (
  values: string[],
  minWidth = 60,
  maxWidth = 300
): number => {
  if (!values.length) return minWidth;

  // Approximate character width (in pixels)
  const charWidth = 8;
  const padding = 24; // Cell padding

  const maxLength = Math.max(...values.map((v) => String(v).length));
  const calculatedWidth = maxLength * charWidth + padding;

  return Math.min(Math.max(calculatedWidth, minWidth), maxWidth);
};

/**
 * 행 번호 생성
 */
export const getRowNumber = (index: number): string => {
  return String(index + 1);
};

/**
 * 선택 범위 유효성 검사
 */
export const isValidRange = (
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  maxRows: number,
  maxCols: number
): boolean => {
  return (
    startRow >= 0 &&
    endRow >= startRow &&
    endRow < maxRows &&
    startCol >= 0 &&
    endCol >= startCol &&
    endCol < maxCols
  );
};

/**
 * 범위 내 셀 개수 계산
 */
export const getRangeCellCount = (
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): number => {
  return (endRow - startRow + 1) * (endCol - startCol + 1);
};

/**
 * 열 삽입 위치 계산
 */
export const calculateColumnInsertIndex = (
  columns: Column[],
  afterColumnId?: string
): number => {
  if (!afterColumnId) return columns.length;

  const index = columns.findIndex((col) => col.id === afterColumnId);
  return index === -1 ? columns.length : index + 1;
};

/**
 * 행 삽입 위치 계산
 */
export const calculateRowInsertIndex = (
  rows: Row[],
  afterRowId?: string
): number => {
  if (!afterRowId) return rows.length;

  const index = rows.findIndex((row) => row.id === afterRowId);
  return index === -1 ? rows.length : index + 1;
};
