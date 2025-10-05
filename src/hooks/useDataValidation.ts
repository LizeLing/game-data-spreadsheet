/**
 * Data Validation Hook
 * 실시간 데이터 검증을 위한 React Hook
 */

import { useState, useCallback } from 'react';
import type { Cell, Row, Sheet, CellType, Column } from '@types';
import {
  validateCell,
  validateRow,
  validateSheet,
  type ValidationResult,
} from '@services/validation/validationEngine';

export const useDataValidation = () => {
  const [validationResults, setValidationResults] = useState<
    Record<string, ValidationResult>
  >({});
  const [isValidating, setIsValidating] = useState(false);

  // Validate cell (DO NOT update state during render!)
  const validateCellData = useCallback(
    (cell: Cell, columnType?: CellType): ValidationResult => {
      const result = validateCell(cell, columnType);
      // ❌ REMOVED: State update during render causes infinite loop
      // setValidationResults((prev) => ({
      //   ...prev,
      //   [`cell_${cell.id}`]: result,
      // }));
      return result;
    },
    []
  );

  // Validate row
  const validateRowData = useCallback(
    (row: Row, columns: Column[]): ValidationResult => {
      const result = validateRow(row, columns);
      // ❌ REMOVED: State update during render causes infinite loop
      // setValidationResults((prev) => ({
      //   ...prev,
      //   [`row_${row.id}`]: result,
      // }));
      return result;
    },
    []
  );

  // Validate sheet (can be called manually, not during render)
  const validateSheetData = useCallback((sheet: Sheet): ValidationResult => {
    setIsValidating(true);
    const result = validateSheet(sheet);
    setValidationResults((prev) => ({
      ...prev,
      [`sheet_${sheet.id}`]: result,
    }));
    setIsValidating(false);
    return result;
  }, []);

  return {
    validateCell: validateCellData,
    validateRow: validateRowData,
    validateSheet: validateSheetData,
    validationResults,
    isValidating,
  };
};
