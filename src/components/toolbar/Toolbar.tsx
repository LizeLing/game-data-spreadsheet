/**
 * Toolbar Component
 * 상단 툴바 - 파일 작업, 편집, 포맷 등
 */

import { useRef, useState, useEffect } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import { useImportExport, type ExportFormat } from '@hooks/useImportExport';
import type { FilterConfig, Sheet } from '@types';
import { SearchDialog } from '../dialogs/SearchDialog';
import { ValidationPanel } from '../dialogs/ValidationPanel';

export const Toolbar = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);

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
  const { importFile, exportSheet } = useImportExport();

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  // Keyboard shortcuts (Ctrl+S for save, Ctrl+Shift+V for validation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveSpreadsheet();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        if (activeSheet) {
          setShowValidationPanel(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveSpreadsheet, activeSheet]);

  const handleAddRow = () => {
    addRow(activeSheetId);
  };

  const handleAddColumn = () => {
    addColumn(activeSheetId);
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
    <div className="bg-white border-b border-gray-200 px-4 py-2">
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

        {/* Insert operations */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <ToolbarButton onClick={handleAddRow} title="행 추가">
            <span className="text-sm">➕ 행</span>
          </ToolbarButton>
          <ToolbarButton onClick={handleAddColumn} title="열 추가">
            <span className="text-sm">➕ 열</span>
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
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      className="px-3 py-1.5 rounded hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">데이터 필터</h2>

        <div className="space-y-3 mb-4">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={filter.columnId}
                onChange={(e) =>
                  updateFilter(index, 'columnId', e.target.value)
                }
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={() => removeFilter(index)}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                title="필터 제거"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addFilter}
          className="mb-4 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          + 필터 추가
        </button>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onClear}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            모두 지우기
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            필터 적용
          </button>
        </div>
      </div>
    </div>
  );
};

