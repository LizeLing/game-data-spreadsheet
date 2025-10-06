/**
 * ValidationPanel Component
 * 데이터 검증 결과를 표시하고 관리하는 패널
 */

import { useState, useEffect } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import { useDataValidation } from '@hooks/useDataValidation';
import type { Sheet, CellValue } from '@types';
import type { ValidationError } from '@services/validation/validationEngine';

export interface ValidationPanelProps {
  sheet: Sheet;
  onClose: () => void;
}

interface DisplayValidationError extends ValidationError {
  rowIndex: number;
  columnIndex: number;
  columnName: string;
  cellValue: CellValue;
}

export const ValidationPanel = ({ sheet, onClose }: ValidationPanelProps) => {
  const [displayResults, setDisplayResults] = useState<
    DisplayValidationError[]
  >([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);

  const setSelection = useSpreadsheetStore((state) => state.setSelection);
  const { validateSheet } = useDataValidation();

  // Convert validation results to display format
  const convertToDisplayFormat = (
    sheet: Sheet,
    errors: ValidationError[]
  ): DisplayValidationError[] => {
    return errors.map((error) => {
      let rowIndex = -1;
      let columnIndex = -1;
      let columnName = '';
      let cellValue: CellValue = null;

      // Find row and column from cellId or rowId/columnId
      if (error.cellId) {
        const [rowId, columnId] = error.cellId.split(':');
        rowIndex = sheet.rows.findIndex((r) => r.id === rowId);
        columnIndex = sheet.columns.findIndex((c) => c.id === columnId);

        if (columnIndex >= 0) {
          columnName = sheet.columns[columnIndex].name;
        }

        if (rowIndex >= 0 && columnIndex >= 0) {
          const row = sheet.rows[rowIndex];
          const cell = row.cells[columnId];
          cellValue = cell?.value ?? null;
        }
      } else if (error.rowId && error.columnId) {
        rowIndex = sheet.rows.findIndex((r) => r.id === error.rowId);
        columnIndex = sheet.columns.findIndex((c) => c.id === error.columnId);

        if (columnIndex >= 0) {
          columnName = sheet.columns[columnIndex].name;
        }

        if (rowIndex >= 0) {
          const row = sheet.rows[rowIndex];
          const cell = row.cells[error.columnId!];
          cellValue = cell?.value ?? null;
        }
      }

      return {
        ...error,
        rowIndex,
        columnIndex,
        columnName,
        cellValue,
      };
    });
  };

  // Handle validation
  const handleValidate = () => {
    if (!sheet) return;

    setIsValidating(true);
    setValidationComplete(false);

    // Simulate async validation with setTimeout
    setTimeout(() => {
      const result = validateSheet(sheet);

      const allErrors = [
        ...convertToDisplayFormat(sheet, result.errors),
        ...convertToDisplayFormat(sheet, result.warnings),
      ];

      setDisplayResults(allErrors);
      setIsValidating(false);
      setValidationComplete(true);
    }, 300);
  };

  // Auto-validate on mount
  useEffect(() => {
    handleValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Navigate to cell
  const navigateToCell = (error: DisplayValidationError) => {
    if (error.rowIndex < 0 || error.columnIndex < 0) return;

    // Set selection
    setSelection({
      startRow: error.rowIndex,
      endRow: error.rowIndex,
      startColumn: error.columnIndex,
      endColumn: error.columnIndex,
    });

    // Close dialog
    onClose();
  };

  // Get icon for severity
  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
    }
  };

  // Get severity color
  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
    }
  };

  // Calculate counts
  const errorCount = displayResults.filter(
    (r) => r.severity === 'error'
  ).length;
  const warningCount = displayResults.filter(
    (r) => r.severity === 'warning'
  ).length;

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[700px] max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">데이터 검증</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
            title="닫기 (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Sheet Info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">시트:</span> {sheet.name}
            <span className="ml-4">
              <span className="font-medium">행:</span> {sheet.rows.length}
            </span>
            <span className="ml-4">
              <span className="font-medium">열:</span> {sheet.columns.length}
            </span>
          </div>
        </div>

        {/* Validation Summary */}
        {validationComplete && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {errorCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <div className="text-red-600 dark:text-red-400 font-bold text-lg">
                        {errorCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">오류</div>
                    </div>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🟡</span>
                    <div>
                      <div className="text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                        {warningCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">경고</div>
                    </div>
                  </div>
                )}
                {errorCount === 0 && warningCount === 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">✅</span>
                    <div className="text-green-600 dark:text-green-400 font-medium text-lg">
                      검증 완료 - 문제 없음
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isValidating && (
          <div className="mb-4 p-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">데이터 검증 중...</p>
          </div>
        )}

        {/* Validation Results */}
        {!isValidating && validationComplete && displayResults.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              검증 결과:
            </h3>
            <div className="max-h-[400px] overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              {displayResults.map((error, index) => (
                <div
                  key={`${error.cellId}-${index}`}
                  onClick={() => navigateToCell(error)}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg border border-gray-100 dark:border-gray-700 transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigateToCell(error);
                    }
                  }}
                >
                  {/* Icon */}
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {getSeverityIcon(error.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium ${getSeverityColor(error.severity)} mb-1`}
                    >
                      {error.message}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {error.rowIndex >= 0 && error.columnIndex >= 0 && (
                        <>
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {String.fromCharCode(65 + error.columnIndex)}
                            {error.rowIndex + 1}
                          </span>
                          {error.columnName && (
                            <span className="text-gray-600 dark:text-gray-400">
                              ({error.columnName})
                            </span>
                          )}
                        </>
                      )}
                      {error.cellValue !== null && error.cellValue !== '' && (
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          값:{' '}
                          <span className="font-mono">
                            {String(error.cellValue)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400 dark:text-gray-500 flex-shrink-0">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? '검증 중...' : '다시 검증'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
