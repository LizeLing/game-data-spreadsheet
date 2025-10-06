/**
 * SpreadsheetGrid Component
 * AG Grid를 사용한 스프레드시트 그리드 컴포넌트
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact } from '@ag-grid-community/react';
import type {
  ColDef,
  CellValueChangedEvent,
  ICellRendererParams,
  IHeaderParams,
  CellContextMenuEvent,
} from '@ag-grid-community/core';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import { useDataValidation } from '@hooks/useDataValidation';
import { ContextMenu, type ContextMenuItem } from '@components/ui/ContextMenu';
import type { Sheet, Cell, CellType } from '@types';
import type { ValidationResult } from '@services/validation/validationEngine';
import {
  cellStyleToCSS,
  mergeStyles,
  getConditionalStyle,
  applyNumberFormat,
  formatCellValue,
} from '@utils/cellUtils';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface SpreadsheetGridProps {
  sheetId?: string;
}

// Custom Header Component for Column Name Editing
const EditableHeaderComponent = (props: IHeaderParams) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(props.displayName || '');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sheets = useSpreadsheetStore((state) => state.sheets);
  const activeSheetId = useSpreadsheetStore((state) => state.activeSheetId);
  const updateColumn = useSpreadsheetStore((state) => state.updateColumn);

  const sheet = sheets.find((s) => s.id === activeSheetId);
  const columnId = props.column.getColId();
  const column = sheet?.columns.find((c) => c.id === columnId);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setEditValue(props.displayName || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!sheet || !columnId) return;

    const trimmedValue = editValue.trim();

    // Don't save if empty or unchanged
    if (!trimmedValue || trimmedValue === props.displayName) {
      setIsEditing(false);
      return;
    }

    // Update column name (Store will handle history)
    updateColumn(sheet.id, columnId, { name: trimmedValue });

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(props.displayName || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleTypeChange = (newType: CellType) => {
    if (!sheet || !columnId) return;

    updateColumn(sheet.id, columnId, { type: newType });
    setShowTypeMenu(false);
  };

  const handleTypeIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // AG Grid 이벤트 전파 완전 차단
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }

    console.log('Type icon clicked, current showTypeMenu:', showTypeMenu);

    // 메뉴 위치 계산
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 2,
        left: rect.right + window.scrollX - 120, // 메뉴 너비만큼 왼쪽으로
      });
    }

    setShowTypeMenu((prev) => !prev);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 버튼이나 메뉴 내부 클릭이 아닌 경우에만 닫기
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowTypeMenu(false);
      }
    };

    if (showTypeMenu) {
      // 캡처 단계에서 이벤트 처리 (AG Grid보다 먼저)
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showTypeMenu]);

  // Type icons and labels
  const typeConfig: Record<CellType, { icon: string; label: string }> = {
    text: { icon: '📝', label: '텍스트' },
    number: { icon: '#️⃣', label: '숫자' },
    boolean: { icon: '✓', label: '참/거짓' },
    date: { icon: '📅', label: '날짜' },
    formula: { icon: 'ƒ', label: '수식' },
    select: { icon: '▼', label: '선택' },
    multiselect: { icon: '☰', label: '다중선택' },
  };

  const currentType = column?.type || 'text';
  const typeInfo = typeConfig[currentType];

  if (isEditing) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          style={{
            width: '100%',
            padding: '2px 4px',
            border: '2px solid #1976d2',
            borderRadius: '2px',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        userSelect: 'none',
      }}
      onClick={(e) => {
        // Prevent header click from propagating
        e.stopPropagation();
      }}
    >
      <span
        onDoubleClick={handleDoubleClick}
        style={{
          flex: 1,
          cursor: 'pointer',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title="열 이름을 변경하려면 더블클릭하세요"
      >
        {props.displayName}
      </span>

      <button
        ref={buttonRef}
        onClick={handleTypeIconClick}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.nativeEvent) {
            e.nativeEvent.stopImmediatePropagation();
          }
        }}
        style={{
          marginLeft: '4px',
          padding: '2px 4px',
          cursor: 'pointer',
          fontSize: '11px',
          borderRadius: '3px',
          backgroundColor: showTypeMenu ? '#e3f2fd' : 'transparent',
          border: 'none',
          outline: 'none',
          zIndex: 10,
          position: 'relative',
        }}
        title={`타입: ${typeInfo.label} (클릭하여 변경)`}
      >
        {typeInfo.icon}
      </button>

      {showTypeMenu &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 10000,
              minWidth: '120px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (e.nativeEvent) {
                e.nativeEvent.stopImmediatePropagation();
              }
            }}
          >
            {Object.entries(typeConfig).map(([type, config]) => (
              <div
                key={type}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.nativeEvent) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  handleTypeChange(type as CellType);
                }}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: type === currentType ? '#e3f2fd' : 'transparent',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => {
                  if (type !== currentType) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (type !== currentType) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

// Custom Cell Renderer Params Interface
interface CustomCellRendererParams extends ICellRendererParams {
  validateCell?: (
    cell: Cell,
    columnType?: CellType,
    columnOptions?: string[]
  ) => ValidationResult;
  sheet?: Sheet;
}

// Custom Cell Renderer Component (DO NOT USE HOOKS HERE - it's not a React component!)
const CustomCellRenderer = (props: CustomCellRendererParams) => {
  const sheet = props.sheet;
  if (!sheet) return <div>{props.value}</div>;

  const rowId = props.data._rowId;
  const columnId = props.colDef?.field;
  if (!rowId || !columnId) return <div>{props.value}</div>;

  const row = sheet.rows.find((r) => r.id === rowId);
  if (!row) return <div>{props.value}</div>;

  const cell = row.cells[columnId];
  if (!cell) return <div>{props.value}</div>;

  const rowIndex = row.index;
  const column = sheet.columns.find((c) => c.id === columnId);
  const columnIndex = column?.index ?? 0;

  // Check if this cell is part of a merged cell
  const mergedCell = sheet.mergedCells?.find(
    (mc) =>
      rowIndex >= mc.startRow &&
      rowIndex <= mc.endRow &&
      columnIndex >= mc.startColumn &&
      columnIndex <= mc.endColumn
  );

  // If this is not the top-left cell of a merged region, hide it
  if (
    mergedCell &&
    (rowIndex !== mergedCell.startRow || columnIndex !== mergedCell.startColumn)
  ) {
    return <div style={{ display: 'none' }} />;
  }

  const conditionalStyle = getConditionalStyle(
    cell,
    rowIndex,
    columnIndex,
    sheet.conditionalFormats
  );

  const finalStyle = mergeStyles(cell.style, conditionalStyle);
  const cssStyle = cellStyleToCSS(finalStyle);

  let displayValue = cell.value;
  if (finalStyle.numberFormat && typeof cell.value === 'number') {
    displayValue = applyNumberFormat(cell.value, finalStyle.numberFormat);
  } else {
    displayValue = formatCellValue(cell.value, cell.type);
  }

  // Check for validation errors (using passed validateCell function)
  let validationResult: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };
  let hasError = false;
  let hasWarning = false;

  if (props.validateCell && column) {
    validationResult = props.validateCell(cell, column.type, column.options);
    hasError = validationResult.errors.length > 0;
    hasWarning = validationResult.warnings.length > 0;
  }

  // Build validation style (red background for errors)
  let validationStyle: React.CSSProperties = {};
  let tooltipMessage = String(displayValue);

  if (hasError) {
    validationStyle = {
      backgroundColor: '#fee2e2', // red-100 background
      color: '#991b1b', // red-900 text
    };
    tooltipMessage = validationResult.errors.map((e) => e.message).join(', ');
  } else if (hasWarning) {
    validationStyle = {
      backgroundColor: '#fef3c7', // yellow-100 background
      color: '#92400e', // yellow-900 text
    };
    tooltipMessage = validationResult.warnings.map((w) => w.message).join(', ');
  }

  // Calculate merged cell dimensions
  let mergedStyles: React.CSSProperties = {};
  if (mergedCell) {
    const rowSpan = mergedCell.endRow - mergedCell.startRow + 1;
    const colSpan = mergedCell.endColumn - mergedCell.startColumn + 1;

    // Use the merged cell's value if available
    if (mergedCell.value !== undefined && mergedCell.value !== null) {
      displayValue = formatCellValue(mergedCell.value, cell.type);
    }

    mergedStyles = {
      gridRow: `span ${rowSpan}`,
      gridColumn: `span ${colSpan}`,
      border: '1px solid #3b82f6', // blue border for merged cells
      backgroundColor: '#eff6ff', // light blue background
    };
  }

  return (
    <div
      style={{
        ...cssStyle,
        ...mergedStyles,
        ...validationStyle,
        width: '100%',
        height: '100%',
        padding: '4px 8px',
        boxSizing: 'border-box',
        border: mergedStyles.border || cssStyle.border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: cssStyle.textAlign || 'left',
      }}
      title={tooltipMessage}
    >
      {displayValue}
    </div>
  );
};

export const SpreadsheetGrid = ({ sheetId }: SpreadsheetGridProps) => {
  const gridRef = useRef<AgGridReact>(null);

  const activeSheetId = useSpreadsheetStore((state) => state.activeSheetId);
  const sheets = useSpreadsheetStore((state) => state.sheets);
  const selection = useSpreadsheetStore((state) => state.selection);
  const updateCell = useSpreadsheetStore((state) => state.updateCell);
  const setSelection = useSpreadsheetStore((state) => state.setSelection);
  const copySelection = useSpreadsheetStore((state) => state.copySelection);
  const cutSelection = useSpreadsheetStore((state) => state.cutSelection);
  const pasteFromClipboard = useSpreadsheetStore(
    (state) => state.pasteFromClipboard
  );
  const addRow = useSpreadsheetStore((state) => state.addRow);
  const addColumn = useSpreadsheetStore((state) => state.addColumn);
  const removeRow = useSpreadsheetStore((state) => state.removeRow);
  const removeColumn = useSpreadsheetStore((state) => state.removeColumn);
  const mergeCells = useSpreadsheetStore((state) => state.mergeCells);
  const unmergeCells = useSpreadsheetStore((state) => state.unmergeCells);
  const getMergedCell = useSpreadsheetStore((state) => state.getMergedCell);
  const applyCellStyle = useSpreadsheetStore((state) => state.applyCellStyle);
  const sortSheet = useSpreadsheetStore((state) => state.sortSheet);

  // Initialize data validation hook at component level
  const { validateCell } = useDataValidation();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const currentSheetId = sheetId || activeSheetId;
  const sheet = sheets.find((s) => s.id === currentSheetId);

  // Memoize cellRendererParams to prevent infinite re-renders
  // This is critical! Without useMemo, AG Grid will re-render infinitely
  // because it detects new object references on every render
  const cellRendererParams = useMemo<
    Omit<CustomCellRendererParams, keyof ICellRendererParams>
  >(
    () => ({
      validateCell: validateCell,
      sheet: sheet,
    }),
    [validateCell, sheet]
  );

  // Convert sheet data to AG Grid format
  const columnDefs: ColDef[] = useMemo(() => {
    if (!sheet) return [];

    return sheet.columns.map((col) => ({
      field: col.id,
      headerName: col.name,
      width: col.width,
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: CustomCellRenderer,
      cellRendererParams: cellRendererParams,
      headerComponent: EditableHeaderComponent,
    }));
  }, [sheet, cellRendererParams]);

  const rowData = useMemo(() => {
    if (!sheet) return [];

    return sheet.rows.map((row) => {
      const rowObj: Record<string, any> = { _rowId: row.id };
      Object.entries(row.cells).forEach(([colId, cell]) => {
        rowObj[colId] = cell.value;
      });
      return rowObj;
    });
  }, [sheet]);

  // Handle cell value changes
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (!sheet) return;

      const rowId = event.data._rowId;
      const columnId = event.colDef.field;
      const newValue = event.newValue;

      if (columnId && rowId) {
        updateCell(sheet.id, rowId, columnId, newValue);
      }
    },
    [sheet, updateCell]
  );

  // Handle cell click (single cell selection)
  const onCellClicked = useCallback(
    (event: any) => {
      if (!sheet) return;

      const rowIndex = event.rowIndex;
      const colId = event.column?.getColId();

      if (rowIndex === undefined || !colId) return;

      const colIndex = sheet.columns.findIndex((col) => col.id === colId);

      if (colIndex < 0) return;

      // Set selection to single cell
      setSelection({
        startRow: rowIndex,
        endRow: rowIndex,
        startColumn: colIndex,
        endColumn: colIndex,
      });
    },
    [sheet, setSelection]
  );

  // Handle range selection
  const onRangeSelectionChanged = useCallback(() => {
    const gridApi = gridRef.current?.api;
    if (!gridApi || !sheet) return;

    const cellRanges = gridApi.getCellRanges();
    if (!cellRanges || cellRanges.length === 0) {
      // Don't clear selection on empty ranges - keep last selection
      return;
    }

    // Get the first range (primary selection)
    const range = cellRanges[0];
    const startRow = Math.min(
      range.startRow?.rowIndex ?? 0,
      range.endRow?.rowIndex ?? 0
    );
    const endRow = Math.max(
      range.startRow?.rowIndex ?? 0,
      range.endRow?.rowIndex ?? 0
    );

    const columns = range.columns || [];
    const startCol = sheet.columns.findIndex(
      (col) => col.id === columns[0]?.getColId()
    );
    const endCol = sheet.columns.findIndex(
      (col) => col.id === columns[columns.length - 1]?.getColId()
    );

    setSelection({
      startRow,
      endRow,
      startColumn: startCol >= 0 ? startCol : 0,
      endColumn: endCol >= 0 ? endCol : 0,
    });
  }, [sheet, setSelection]);

  // Handle cell context menu (right-click)
  const onCellContextMenu = useCallback(
    (event: CellContextMenuEvent) => {
      event.event?.preventDefault();

      const rowIndex = event.rowIndex;
      const columnId = event.column?.getColId();
      const columnIndex = sheet?.columns.findIndex((col) => col.id === columnId);

      if (rowIndex === null || rowIndex === undefined || columnIndex === undefined || columnIndex < 0 || !sheet) {
        return;
      }

      const row = sheet.rows[rowIndex];
      if (!row) return;

      const hasMergedCell = getMergedCell(currentSheetId, rowIndex, columnIndex);

      const menuItems: ContextMenuItem[] = [
        {
          id: 'copy',
          label: '복사',
          icon: '📋',
          shortcut: 'Ctrl+C',
          action: () => copySelection(),
        },
        {
          id: 'cut',
          label: '잘라내기',
          icon: '✂️',
          shortcut: 'Ctrl+X',
          action: () => cutSelection(),
        },
        {
          id: 'paste',
          label: '붙여넣기',
          icon: '📄',
          shortcut: 'Ctrl+V',
          action: () => pasteFromClipboard(),
        },
        {
          id: 'separator1',
          label: '',
          separator: true,
          action: () => {},
        },
        {
          id: 'insert-row-above',
          label: '위에 행 삽입',
          icon: '⬆️',
          action: () => addRow(currentSheetId, rowIndex - 1),
        },
        {
          id: 'insert-row-below',
          label: '아래에 행 삽입',
          icon: '⬇️',
          action: () => addRow(currentSheetId, rowIndex),
        },
        {
          id: 'delete-row',
          label: '행 삭제',
          icon: '🗑️',
          shortcut: 'Ctrl+Del',
          action: () => {
            if (selection) {
              const rowsToDelete = [];
              for (let i = selection.startRow; i <= selection.endRow; i++) {
                const r = sheet.rows[i];
                if (r) rowsToDelete.push(r.id);
              }
              rowsToDelete.forEach((rowId) => removeRow(currentSheetId, rowId));
            } else {
              removeRow(currentSheetId, row.id);
            }
          },
        },
        {
          id: 'separator2',
          label: '',
          separator: true,
          action: () => {},
        },
        {
          id: 'insert-column-left',
          label: '왼쪽에 열 삽입',
          icon: '⬅️',
          action: () => addColumn(currentSheetId, columnIndex - 1),
        },
        {
          id: 'insert-column-right',
          label: '오른쪽에 열 삽입',
          icon: '➡️',
          action: () => addColumn(currentSheetId, columnIndex),
        },
        {
          id: 'delete-column',
          label: '열 삭제',
          icon: '🗑️',
          action: () => {
            const column = sheet.columns[columnIndex];
            if (column) {
              removeColumn(currentSheetId, column.id);
            }
          },
        },
        {
          id: 'separator3',
          label: '',
          separator: true,
          action: () => {},
        },
        {
          id: 'merge-cells',
          label: '셀 병합',
          icon: '⬜',
          disabled: !selection || !!hasMergedCell,
          action: () => {
            if (selection) {
              mergeCells(currentSheetId, selection);
            }
          },
        },
        {
          id: 'unmerge-cells',
          label: '병합 해제',
          icon: '⬛',
          disabled: !hasMergedCell,
          action: () => {
            if (hasMergedCell) {
              unmergeCells(currentSheetId, hasMergedCell.id);
            }
          },
        },
        {
          id: 'separator4',
          label: '',
          separator: true,
          action: () => {},
        },
        {
          id: 'sort-asc',
          label: '오름차순 정렬',
          icon: '↑',
          action: () => {
            const column = sheet.columns[columnIndex];
            if (column) {
              sortSheet(currentSheetId, { columnId: column.id, direction: 'asc' });
            }
          },
        },
        {
          id: 'sort-desc',
          label: '내림차순 정렬',
          icon: '↓',
          action: () => {
            const column = sheet.columns[columnIndex];
            if (column) {
              sortSheet(currentSheetId, { columnId: column.id, direction: 'desc' });
            }
          },
        },
      ];

      const mouseEvent = event.event as MouseEvent;
      setContextMenu({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
        items: menuItems,
      });
    },
    [
      sheet,
      currentSheetId,
      selection,
      getMergedCell,
      copySelection,
      cutSelection,
      pasteFromClipboard,
      addRow,
      addColumn,
      removeRow,
      removeColumn,
      mergeCells,
      unmergeCells,
      sortSheet,
    ]
  );

  // Handle keyboard shortcuts for clipboard operations
  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      if (!isCtrlOrCmd) return;

      // Prevent default behavior for clipboard shortcuts
      switch (event.key.toLowerCase()) {
        case 'c':
          // Copy (Ctrl+C / Cmd+C)
          event.preventDefault();
          await copySelection();
          break;

        case 'x':
          // Cut (Ctrl+X / Cmd+X)
          event.preventDefault();
          await cutSelection();
          break;

        case 'v':
          // Paste (Ctrl+V / Cmd+V)
          event.preventDefault();
          await pasteFromClipboard();
          break;

        default:
          // Do nothing for other shortcuts
          break;
      }
    },
    [copySelection, cutSelection, pasteFromClipboard]
  );

  // Add keyboard event listener
  useEffect(() => {
    // Attach to document instead of grid element for global keyboard handling
    const handleKeyDownWrapper = (event: Event) => {
      handleKeyDown(event as KeyboardEvent);
    };

    document.addEventListener('keydown', handleKeyDownWrapper);

    return () => {
      document.removeEventListener('keydown', handleKeyDownWrapper);
    };
  }, [handleKeyDown]);

  if (!sheet) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">No sheet selected</p>
      </div>
    );
  }

  return (
    <div className="ag-theme-alpine w-full h-full">
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={rowData}
        onCellValueChanged={onCellValueChanged}
        onCellClicked={onCellClicked}
        onRangeSelectionChanged={onRangeSelectionChanged}
        onCellContextMenu={onCellContextMenu}
        defaultColDef={{
          flex: 1,
          minWidth: 100,
          editable: true,
          sortable: true,
          filter: true,
          resizable: true,
        }}
        animateRows={true}
        rowSelection="multiple"
        enableRangeSelection={true}
        suppressRowClickSelection={true}
        suppressCellFocus={false}
        enableCellTextSelection={true}
        ensureDomOrder={true}
        domLayout="normal"
      />
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
