/**
 * Validation Engine
 * 셀, 행, 시트 레벨의 검증 엔진
 */

import type { Cell, Row, Sheet, CellType, Column } from '@types';

// Validation result types
export interface ValidationError {
  cellId?: string;
  rowId?: string;
  columnId?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * 값이 특정 타입에 맞는지 검증
 */
export const validateValueType = (
  value: any,
  expectedType: CellType
): { valid: boolean; message?: string } => {
  // 빈 값은 허용
  if (value === null || value === undefined || value === '') {
    return { valid: true };
  }

  switch (expectedType) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          message: `"${value}"는 숫자 형식이 아닙니다`,
        };
      }
      return { valid: true };

    case 'boolean':
      const boolStr = String(value).toLowerCase().trim();
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'];
      if (!validBooleans.includes(boolStr) && typeof value !== 'boolean') {
        return {
          valid: false,
          message: `"${value}"는 참/거짓 형식이 아닙니다 (true/false, 1/0, yes/no)`,
        };
      }
      return { valid: true };

    case 'date':
      const dateVal = new Date(value);
      if (isNaN(dateVal.getTime())) {
        return {
          valid: false,
          message: `"${value}"는 올바른 날짜 형식이 아닙니다`,
        };
      }
      return { valid: true };

    case 'text':
      // 텍스트는 모든 값 허용
      return { valid: true };

    case 'formula':
      // 수식은 별도 검증 (이미 formulaEvaluator에서 처리됨)
      return { valid: true };

    case 'select':
    case 'multiselect':
      // 선택 타입은 별도 옵션 검증 필요 (추후 구현)
      return { valid: true };

    default:
      return { valid: true };
  }
};

// Cell-level validation
export const validateCell = (
  cell: Cell,
  columnType?: CellType
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. 컬럼 타입 검증
  if (columnType && columnType !== 'formula') {
    const typeCheck = validateValueType(cell.value, columnType);
    if (!typeCheck.valid) {
      errors.push({
        cellId: cell.id,
        columnId: cell.columnId,
        message: typeCheck.message || '타입이 일치하지 않습니다',
        severity: 'error',
      });
    }
  }

  // 2. 셀의 기존 validation 규칙 검증
  if (cell.validation) {
    const { type, params, message } = cell.validation;

    switch (type) {
      case 'required':
        if (cell.value === null || cell.value === '') {
          errors.push({
            cellId: cell.id,
            message: message || 'This field is required',
            severity: 'error',
          });
        }
        break;

      case 'range':
        if (typeof cell.value === 'number' && params) {
          if (params.min !== undefined && cell.value < params.min) {
            errors.push({
              cellId: cell.id,
              message: message || `Value must be at least ${params.min}`,
              severity: 'error',
            });
          }
          if (params.max !== undefined && cell.value > params.max) {
            errors.push({
              cellId: cell.id,
              message: message || `Value must be at most ${params.max}`,
              severity: 'error',
            });
          }
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

// Row-level validation
export const validateRow = (
  row: Row,
  columns: Column[]
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate each cell
  columns.forEach((column) => {
    const cell = row.cells[column.id];
    if (cell) {
      const cellResult = validateCell(cell, column.type);
      errors.push(...cellResult.errors);
      warnings.push(...cellResult.warnings);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

// Sheet-level validation
export const validateSheet = (sheet: Sheet): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate all rows
  sheet.rows.forEach((row) => {
    const rowResult = validateRow(row, sheet.columns);
    errors.push(...rowResult.errors);
    warnings.push(...rowResult.warnings);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};
