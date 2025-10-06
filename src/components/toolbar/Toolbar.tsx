/**
 * Toolbar Component
 * 상단 툴바 - 파일 작업, 편집, 포맷 등
 */

import { useRef, useState, useMemo } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import { useImportExport, type ExportFormat } from '@hooks/useImportExport';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@hooks/useKeyboardShortcuts';
import { useTheme } from '@hooks/useTheme';
import type { FilterConfig, Sheet } from '@types';
import { SearchDialog } from '../dialogs/SearchDialog';
import { ValidationPanel } from '../dialogs/ValidationPanel';
import { ConditionalFormatDialog } from '../dialogs/ConditionalFormatDialog';
import { AdvancedFormatDialog } from '../dialogs/AdvancedFormatDialog';
import { ShortcutHelpDialog } from '../dialogs/ShortcutHelpDialog';
import { ChartDialog } from '../charts/ChartDialog';

export const Toolbar = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [showConditionalFormatDialog, setShowConditionalFormatDialog] =
    useState(false);
  const [showAdvancedFormatDialog, setShowAdvancedFormatDialog] =
    useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);

  const activeSheetId = useSpreadsheetStore((state) => state.activeSheetId);
  const sheets = useSpreadsheetStore((state) => state.sheets);
  const selection = useSpreadsheetStore((state) => state.selection);
  const addRow = useSpreadsheetStore((state) => state.addRow);
  const addColumn = useSpreadsheetStore((state) => state.addColumn);
  const addSheets = useSpreadsheetStore((state) => state.addSheets);
  const undo = useSpreadsheetStore((state) => state.undo);
  const redo = useSpreadsheetStore((state) => state.redo);
  const saveSpreadsheet = useSpreadsheetStore((state) => state.saveSpreadsheet);
  const saving = useSpreadsheetStore((state) => state.saving);
  const applyCellStyle = useSpreadsheetStore((state) => state.applyCellStyle);
  const filterSheet = useSpreadsheetStore((state) => state.filterSheet);
  const clearFilters = useSpreadsheetStore((state) => state.clearFilters);
  const mergeCells = useSpreadsheetStore((state) => state.mergeCells);
  const getMergedCell = useSpreadsheetStore((state) => state.getMergedCell);
  const unmergeCells = useSpreadsheetStore((state) => state.unmergeCells);
  const removeRow = useSpreadsheetStore((state) => state.removeRow);
  const removeColumn = useSpreadsheetStore((state) => state.removeColumn);
  const { importFile, exportSheet } = useImportExport();
  const { theme, toggleTheme } = useTheme();

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  // Define keyboard shortcuts
  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      // File operations
      {
        key: 's',
        ctrl: true,
        description: '스프레드시트 저장',
        category: 'file',
        action: () => saveSpreadsheet(),
      },

      // Edit operations
      {
        key: 'z',
        ctrl: true,
        description: '실행 취소',
        category: 'edit',
        action: () => undo(),
      },
      {
        key: 'y',
        ctrl: true,
        description: '다시 실행',
        category: 'edit',
        action: () => redo(),
      },
      {
        key: 'd',
        ctrl: true,
        description: '현재 행 복제',
        category: 'edit',
        action: () => {
          if (selection && activeSheet) {
            const rowIndex = selection.startRow;
            addRow(activeSheetId, rowIndex);
          }
        },
      },
      {
        key: 'Delete',
        ctrl: true,
        description: '현재 행 삭제',
        category: 'edit',
        action: () => {
          if (selection && activeSheet) {
            const rowsToDelete = [];
            for (let i = selection.startRow; i <= selection.endRow; i++) {
              const row = activeSheet.rows[i];
              if (row) rowsToDelete.push(row.id);
            }
            rowsToDelete.forEach((rowId) => removeRow(activeSheetId, rowId));
          }
        },
      },

      // Search and replace
      {
        key: 'f',
        ctrl: true,
        description: '찾기',
        category: 'edit',
        action: () => setShowSearchDialog(true),
      },
      {
        key: 'h',
        ctrl: true,
        description: '바꾸기',
        category: 'edit',
        action: () => setShowSearchDialog(true),
      },

      // View
      {
        key: 'v',
        ctrl: true,
        shift: true,
        description: '데이터 검증 패널',
        category: 'view',
        action: () => {
          if (activeSheet) {
            setShowValidationPanel(true);
          }
        },
      },

      // Help
      {
        key: '/',
        ctrl: true,
        description: '단축키 도움말',
        category: 'help',
        action: () => setShowShortcutHelp(true),
      },
    ],
    [
      saveSpreadsheet,
      undo,
      redo,
      selection,
      activeSheet,
      activeSheetId,
      addRow,
      removeRow,
    ]
  );

  // Apply keyboard shortcuts
  const { getShortcutText, getShortcutsByCategory } = useKeyboardShortcuts({
    shortcuts,
    enabled: true,
  });

  const handleAddRow = () => {
    if (selection) {
      // Insert after selected row
      addRow(activeSheetId, selection.endRow);
    } else {
      // Append at end
      addRow(activeSheetId);
    }
  };

  const handleAddColumn = () => {
    if (selection) {
      // Insert after selected column
      addColumn(activeSheetId, selection.endColumn);
    } else {
      // Append at end
      addColumn(activeSheetId);
    }
  };

  const handleDeleteRow = () => {
    if (!selection || !activeSheet) return;

    const rowsToDelete = [];
    for (let i = selection.startRow; i <= selection.endRow; i++) {
      const row = activeSheet.rows[i];
      if (row) rowsToDelete.push(row.id);
    }

    rowsToDelete.forEach((rowId) => removeRow(activeSheetId, rowId));
  };

  const handleDeleteColumn = () => {
    if (!selection || !activeSheet) return;

    const columnsToDelete = [];
    for (let i = selection.startColumn; i <= selection.endColumn; i++) {
      const column = activeSheet.columns[i];
      if (column) columnsToDelete.push(column.id);
    }

    columnsToDelete.forEach((columnId) => removeColumn(activeSheetId, columnId));
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleSave = () => {
    saveSpreadsheet();
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let format: 'csv' | 'json' | 'xlsx' = 'csv';
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      format = 'xlsx';
    } else if (file.name.endsWith('.json')) {
      format = 'json';
    }

    const result = await importFile(file, format);

    if (result && result.sheets && result.sheets.length > 0) {
      addSheets(result.sheets);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    if (!activeSheet) return;
    exportSheet(activeSheet, activeSheet.name, exportFormat);
  };

  // Formatting handlers
  const handleBold = () => {
    if (!selection) return;
    const currentWeight = 'bold'; // Toggle logic can be added
    applyCellStyle(activeSheetId, selection, { fontWeight: currentWeight });
  };

  const handleItalic = () => {
    if (!selection) return;
    applyCellStyle(activeSheetId, selection, { fontStyle: 'italic' });
  };

  const handleUnderline = () => {
    if (!selection) return;
    applyCellStyle(activeSheetId, selection, { textDecoration: 'underline' });
  };

  const handleTextColor = (color: string) => {
    if (!selection) return;
    applyCellStyle(activeSheetId, selection, { color });
  };

  const handleBackgroundColor = (color: string) => {
    if (!selection) return;
    applyCellStyle(activeSheetId, selection, { backgroundColor: color });
  };

  const handleTextAlign = (align: 'left' | 'center' | 'right') => {
    if (!selection) return;
    applyCellStyle(activeSheetId, selection, { textAlign: align });
  };

  // Cell merging handlers
  const handleMergeCells = () => {
    if (!selection) return;
    mergeCells(activeSheetId, selection);
  };

  const handleUnmergeCells = () => {
    if (!selection || !activeSheet) return;

    // Find if any cell in selection is part of a merged cell
    const { startRow, startColumn } = selection;
    const mergedCell = getMergedCell(activeSheetId, startRow, startColumn);

    if (mergedCell) {
      unmergeCells(activeSheetId, mergedCell.id);
    }
  };

  // Check if selection contains a merged cell
  const hasMergedCell =
    selection &&
    activeSheet &&
    getMergedCell(activeSheetId, selection.startRow, selection.startColumn);

  const handleApplyFilters = (filters: FilterConfig[]) => {
    filterSheet(activeSheetId, filters);
    setShowFilterDialog(false);
  };

  const handleClearFilters = () => {
    clearFilters(activeSheetId);
    setShowFilterDialog(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center gap-2">
        {/* File operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton onClick={() => console.log('New')} title="새로 만들기">
            <span className="text-sm">📄</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => console.log('Open')} title="열기">
            <span className="text-sm">📂</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleSave}
            title="저장 (Ctrl+S)"
            disabled={saving}
          >
            <span className="text-sm">{saving ? '⏳' : '💾'}</span>
          </ToolbarButton>
        </div>

        {/* Edit operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton onClick={handleUndo} title="실행 취소 (Ctrl+Z)">
            <span className="text-sm">↶</span>
          </ToolbarButton>
          <ToolbarButton onClick={handleRedo} title="다시 실행 (Ctrl+Y)">
            <span className="text-sm">↷</span>
          </ToolbarButton>
        </div>

        {/* Insert/Delete operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={handleAddRow}
            title={selection ? '선택 위치 다음에 행 삽입' : '행 추가'}
          >
            <span className="text-sm">➕ 행</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleDeleteRow}
            title="선택한 행 삭제"
            disabled={!selection}
          >
            <span className="text-sm">➖ 행</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleAddColumn}
            title={selection ? '선택 위치 다음에 열 삽입' : '열 추가'}
          >
            <span className="text-sm">➕ 열</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleDeleteColumn}
            title="선택한 열 삭제"
            disabled={!selection}
          >
            <span className="text-sm">➖ 열</span>
          </ToolbarButton>
        </div>

        {/* Search and Filter operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={() => setShowSearchDialog(true)}
            title="찾기 및 바꾸기 (Ctrl+F)"
            disabled={!activeSheet}
          >
            <span className="text-sm">🔎 찾기</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowFilterDialog(true)}
            title="데이터 필터"
            disabled={!activeSheet}
          >
            <span className="text-sm">🔍 필터</span>
          </ToolbarButton>
          {activeSheet?.filters && activeSheet.filters.length > 0 && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
              {activeSheet.filters.length}
            </span>
          )}
        </div>

        {/* Validation operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={() => setShowValidationPanel(true)}
            title="데이터 검증 (Ctrl+Shift+V)"
            disabled={!activeSheet}
          >
            <span className="text-sm">✓ 검증</span>
          </ToolbarButton>
        </div>

        {/* Conditional Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={() => setShowConditionalFormatDialog(true)}
            title="조건부 서식"
            disabled={!activeSheet}
          >
            <span className="text-sm">🎨 조건부</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowAdvancedFormatDialog(true)}
            title="고급 서식 (테두리, 폰트, 숫자 포맷)"
            disabled={!selection}
          >
            <span className="text-sm">⚙️ 고급</span>
          </ToolbarButton>
        </div>

        {/* Format operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={handleBold}
            title="굵게 (Ctrl+B)"
            disabled={!selection}
          >
            <span className="font-bold text-sm">B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleItalic}
            title="기울임 (Ctrl+I)"
            disabled={!selection}
          >
            <span className="italic text-sm">I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleUnderline}
            title="밑줄 (Ctrl+U)"
            disabled={!selection}
          >
            <span className="underline text-sm">U</span>
          </ToolbarButton>
        </div>

        {/* Color operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <input
            type="color"
            onChange={(e) => handleTextColor(e.target.value)}
            title="글자 색"
            disabled={!selection}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            type="color"
            onChange={(e) => handleBackgroundColor(e.target.value)}
            title="배경색"
            disabled={!selection}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Alignment operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={() => handleTextAlign('left')}
            title="왼쪽 정렬"
            disabled={!selection}
          >
            <span className="text-sm">⬅</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleTextAlign('center')}
            title="가운데 정렬"
            disabled={!selection}
          >
            <span className="text-sm">⬌</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => handleTextAlign('right')}
            title="오른쪽 정렬"
            disabled={!selection}
          >
            <span className="text-sm">➡</span>
          </ToolbarButton>
        </div>

        {/* Cell merging operations */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={handleMergeCells}
            title="셀 병합"
            disabled={!selection || !!hasMergedCell}
          >
            <span className="text-sm">⬜ 병합</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={handleUnmergeCells}
            title="병합 해제"
            disabled={!hasMergedCell}
          >
            <span className="text-sm">⬜ 해제</span>
          </ToolbarButton>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Import/Export */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <ToolbarButton onClick={handleImport} title="CSV/JSON/XLSX 가져오기">
            <span className="text-sm">📥 가져오기</span>
          </ToolbarButton>

          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            title="내보내기 형식"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xlsx">Excel (.xlsx)</option>
          </select>

          <ToolbarButton
            onClick={handleExport}
            title={`${exportFormat.toUpperCase()}로 내보내기`}
            disabled={!activeSheet}
          >
            <span className="text-sm">📤 내보내기</span>
          </ToolbarButton>
        </div>

        {/* Chart */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={() => setShowChartDialog(true)}
            title="차트 생성"
            disabled={!selection}
          >
            <span className="text-sm">📊</span>
          </ToolbarButton>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </ToolbarButton>
        </div>

        {/* Help */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => setShowShortcutHelp(true)}
            title="단축키 도움말 (Ctrl+/)"
          >
            <span className="text-sm">❓</span>
          </ToolbarButton>
        </div>
      </div>

      {/* Search Dialog */}
      {showSearchDialog && (
        <SearchDialog onClose={() => setShowSearchDialog(false)} />
      )}

      {/* Filter Dialog */}
      {showFilterDialog && activeSheet && (
        <FilterDialog
          sheet={activeSheet}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          onClose={() => setShowFilterDialog(false)}
        />
      )}

      {/* Validation Panel */}
      {showValidationPanel && activeSheet && (
        <ValidationPanel
          sheet={activeSheet}
          onClose={() => setShowValidationPanel(false)}
        />
      )}

      {/* Conditional Format Dialog */}
      {showConditionalFormatDialog && activeSheet && (
        <ConditionalFormatDialog
          sheet={activeSheet}
          onClose={() => setShowConditionalFormatDialog(false)}
        />
      )}

      {/* Advanced Format Dialog */}
      {showAdvancedFormatDialog && selection && (
        <AdvancedFormatDialog
          selection={selection}
          sheetId={activeSheetId}
          onClose={() => setShowAdvancedFormatDialog(false)}
        />
      )}

      {/* Shortcut Help Dialog */}
      {showShortcutHelp && (
        <ShortcutHelpDialog
          shortcuts={getShortcutsByCategory()}
          getShortcutText={getShortcutText}
          onClose={() => setShowShortcutHelp(false)}
        />
      )}

      {/* Chart Dialog */}
      {showChartDialog && activeSheet && selection && (
        <ChartDialog
          sheet={activeSheet}
          selection={selection}
          onClose={() => setShowChartDialog(false)}
        />
      )}
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const ToolbarButton = ({
  onClick,
  title,
  children,
  disabled,
}: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
};

interface FilterDialogProps {
  sheet: import('@types').Sheet;
  onApply: (filters: FilterConfig[]) => void;
  onClear: () => void;
  onClose: () => void;
}

const FilterDialog = ({
  sheet,
  onApply,
  onClear,
  onClose,
}: FilterDialogProps) => {
  const [filters, setFilters] = useState<FilterConfig[]>(sheet.filters || []);

  const addFilter = () => {
    const firstColumn = sheet.columns[0];
    if (!firstColumn) return;

    setFilters([
      ...filters,
      { columnId: firstColumn.id, operator: 'equals', value: '' },
    ]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (
    index: number,
    field: keyof FilterConfig,
    value: string
  ) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onApply(filters);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">데이터 필터</h2>

        <div className="space-y-3 mb-4">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={filter.columnId}
                onChange={(e) =>
                  updateFilter(index, 'columnId', e.target.value)
                }
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {sheet.columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>

              <select
                value={filter.operator}
                onChange={(e) =>
                  updateFilter(index, 'operator', e.target.value)
                }
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="equals">같음</option>
                <option value="contains">포함</option>
                <option value="startsWith">시작</option>
                <option value="endsWith">끝</option>
                <option value="greaterThan">초과</option>
                <option value="lessThan">미만</option>
              </select>

              <input
                type="text"
                value={String(filter.value ?? '')}
                onChange={(e) => updateFilter(index, 'value', e.target.value)}
                placeholder="값"
                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />

              <button
                onClick={() => removeFilter(index)}
                className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="필터 제거"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addFilter}
          className="mb-4 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
        >
          + 필터 추가
        </button>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClear}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            모두 지우기
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            필터 적용
          </button>
        </div>
      </div>
    </div>
  );
};

