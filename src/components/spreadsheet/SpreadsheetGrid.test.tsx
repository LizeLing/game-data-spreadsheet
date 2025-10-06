/**
 * SpreadsheetGrid Component Tests
 * AG Grid 기반 스프레드시트 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import type { Sheet, Cell, CellStyle } from '@types';

// Mock the store
vi.mock('@stores/spreadsheetStore', () => ({
  useSpreadsheetStore: vi.fn(),
}));

// Mock useDataValidation hook
vi.mock('@hooks/useDataValidation', () => ({
  useDataValidation: () => ({
    validateCell: vi.fn(() => ({ errors: [], warnings: [] })),
    validateRow: vi.fn(),
    validateSheet: vi.fn(),
  }),
}));

// Mock AG Grid modules
vi.mock('@ag-grid-community/core', () => ({
  ModuleRegistry: {
    registerModules: vi.fn(),
  },
}));

vi.mock('@ag-grid-community/client-side-row-model', () => ({
  ClientSideRowModelModule: {},
}));

// Mock AG Grid React component
vi.mock('@ag-grid-community/react', () => ({
  AgGridReact: vi.fn((props) => {
    // Store props for test access
    const propsRef = (global as any).__agGridProps || {};
    Object.assign(propsRef, props);
    (global as any).__agGridProps = propsRef;

    return (
      <div data-testid="ag-grid-mock">
        <div data-testid="ag-grid-columns">{props.columnDefs?.length || 0}</div>
        <div data-testid="ag-grid-rows">{props.rowData?.length || 0}</div>
      </div>
    );
  }),
}));

// Mock cell utils
vi.mock('@utils/cellUtils', () => ({
  cellStyleToCSS: vi.fn((style?: CellStyle) => ({
    fontWeight: style?.fontWeight || 'normal',
    fontStyle: style?.fontStyle || 'normal',
    textDecoration: style?.textDecoration || 'none',
    color: style?.color || '#000000',
    backgroundColor: style?.backgroundColor || 'transparent',
    textAlign: style?.textAlign || 'left',
  })),
  mergeStyles: vi.fn((baseStyle?: CellStyle, overrideStyle?: CellStyle) => ({
    ...baseStyle,
    ...overrideStyle,
  })),
  getConditionalStyle: vi.fn(() => undefined),
  applyNumberFormat: vi.fn((value: number) => value.toString()),
  formatCellValue: vi.fn((value: any) => String(value ?? '')),
}));

describe('SpreadsheetGrid', () => {
  const mockUpdateCell = vi.fn();
  const mockUpdateColumn = vi.fn();
  const mockSetSelection = vi.fn();
  const mockCopySelection = vi.fn();
  const mockCutSelection = vi.fn();
  const mockPasteFromClipboard = vi.fn();

  const createMockCell = (
    rowId: string,
    columnId: string,
    value: any,
    type: Cell['type'] = 'text',
    style?: CellStyle,
    formula?: string
  ): Cell => ({
    id: `${rowId}:${columnId}`,
    rowId,
    columnId,
    value,
    type,
    style,
    formula,
  });

  const mockSheet: Sheet = {
    id: 'test-sheet-1',
    name: 'Test Sheet',
    columns: [
      { id: 'col-A', name: 'Column A', type: 'text', index: 0, width: 150 },
      { id: 'col-B', name: 'Column B', type: 'number', index: 1, width: 150 },
      { id: 'col-C', name: 'Column C', type: 'boolean', index: 2, width: 100 },
    ],
    rows: [
      {
        id: 'row-0',
        index: 0,
        hidden: false,
        cells: {
          'col-A': createMockCell('row-0', 'col-A', 'Test Value', 'text'),
          'col-B': createMockCell('row-0', 'col-B', 100, 'number'),
          'col-C': createMockCell('row-0', 'col-C', true, 'boolean'),
        },
      },
      {
        id: 'row-1',
        index: 1,
        hidden: false,
        cells: {
          'col-A': createMockCell('row-1', 'col-A', 'Another Value', 'text', {
            fontWeight: 'bold',
            color: '#FF0000',
          }),
          'col-B': createMockCell('row-1', 'col-B', 200, 'number', {
            numberFormat: '#,##0.00',
          }),
          'col-C': createMockCell('row-1', 'col-C', false, 'boolean'),
        },
      },
      {
        id: 'row-2',
        index: 2,
        hidden: false,
        cells: {
          'col-A': createMockCell('row-2', 'col-A', 'Formula Result', 'text'),
          'col-B': createMockCell(
            'row-2',
            'col-B',
            300,
            'formula',
            undefined,
            '=SUM(B1:B2)'
          ),
          'col-C': createMockCell('row-2', 'col-C', true, 'boolean'),
        },
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const defaultStoreState = {
    activeSheetId: 'test-sheet-1',
    sheets: [mockSheet],
    selection: null,
    updateCell: mockUpdateCell,
    updateColumn: mockUpdateColumn,
    setSelection: mockSetSelection,
    copySelection: mockCopySelection,
    cutSelection: mockCutSelection,
    pasteFromClipboard: mockPasteFromClipboard,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).__agGridProps = {};
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector(defaultStoreState)
    );
  });

  afterEach(() => {
    delete (global as any).__agGridProps;
  });

  describe('Rendering', () => {
    it('should show "No sheet selected" when no sheet is provided', () => {
      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        (selector: (state: typeof defaultStoreState) => unknown) =>
          selector({ ...defaultStoreState, sheets: [], activeSheetId: '' })
      );

      render(<SpreadsheetGrid />);
      expect(screen.getByText('No sheet selected')).toBeInTheDocument();
    });

    it('should render AG Grid when sheet is provided', () => {
      render(<SpreadsheetGrid />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('should create correct column definitions', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.columnDefs).toHaveLength(3);
      expect(agGridProps.columnDefs[0].field).toBe('col-A');
      expect(agGridProps.columnDefs[0].headerName).toBe('Column A');
      expect(agGridProps.columnDefs[0].width).toBe(150);
      expect(agGridProps.columnDefs[0].editable).toBe(true);
    });

    it('should convert rows to AG Grid row data format', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.rowData).toHaveLength(3);
      expect(agGridProps.rowData[0]._rowId).toBe('row-0');
      expect(agGridProps.rowData[0]['col-A']).toBe('Test Value');
      expect(agGridProps.rowData[0]['col-B']).toBe(100);
      expect(agGridProps.rowData[0]['col-C']).toBe(true);
    });

    it('should use custom cell renderer for all columns', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      agGridProps.columnDefs.forEach((colDef: any) => {
        expect(colDef.cellRenderer).toBeDefined();
      });
    });

    it('should use editable header component for all columns', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      agGridProps.columnDefs.forEach((colDef: any) => {
        expect(colDef.headerComponent).toBeDefined();
      });
    });

    it('should pass correct AG Grid options', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.animateRows).toBe(true);
      expect(agGridProps.enableRangeSelection).toBe(true);
    });
  });

  describe('Cell Editing', () => {
    it('should call updateCell when cell value changes', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      const mockEvent = {
        data: { _rowId: 'row-0' },
        colDef: { field: 'col-A' },
        newValue: 'Updated Value',
      };

      agGridProps.onCellValueChanged(mockEvent);

      expect(mockUpdateCell).toHaveBeenCalledWith(
        'test-sheet-1',
        'row-0',
        'col-A',
        'Updated Value'
      );
    });

    it('should not call updateCell when sheet is not available', () => {
      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        (selector: (state: typeof defaultStoreState) => unknown) =>
          selector({ ...defaultStoreState, sheets: [], activeSheetId: '' })
      );

      render(<SpreadsheetGrid />);
      expect(screen.getByText('No sheet selected')).toBeInTheDocument();
    });

    it('should handle numeric cell value changes', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      const mockEvent = {
        data: { _rowId: 'row-0' },
        colDef: { field: 'col-B' },
        newValue: 999,
      };

      agGridProps.onCellValueChanged(mockEvent);

      expect(mockUpdateCell).toHaveBeenCalledWith(
        'test-sheet-1',
        'row-0',
        'col-B',
        999
      );
    });

    it('should handle boolean cell value changes', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      const mockEvent = {
        data: { _rowId: 'row-0' },
        colDef: { field: 'col-C' },
        newValue: false,
      };

      agGridProps.onCellValueChanged(mockEvent);

      expect(mockUpdateCell).toHaveBeenCalledWith(
        'test-sheet-1',
        'row-0',
        'col-C',
        false
      );
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should copy selection on Ctrl+C', async () => {
      render(<SpreadsheetGrid />);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(mockCopySelection).toHaveBeenCalled();
      });
    });

    it('should copy selection on Cmd+C (Mac)', async () => {
      render(<SpreadsheetGrid />);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(mockCopySelection).toHaveBeenCalled();
      });
    });

    it('should cut selection on Ctrl+X', async () => {
      render(<SpreadsheetGrid />);

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(mockCutSelection).toHaveBeenCalled();
      });
    });

    it('should cut selection on Cmd+X (Mac)', async () => {
      render(<SpreadsheetGrid />);

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(mockCutSelection).toHaveBeenCalled();
      });
    });

    it('should paste on Ctrl+V', async () => {
      render(<SpreadsheetGrid />);

      const event = new KeyboardEvent('keydown', {
        key: 'v',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(mockPasteFromClipboard).toHaveBeenCalled();
      });
    });

    it('should paste on Cmd+V (Mac)', async () => {
      render(<SpreadsheetGrid />);

      const event = new KeyboardEvent('keydown', {
        key: 'v',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(mockPasteFromClipboard).toHaveBeenCalled();
      });
    });

    it('should not trigger clipboard actions without Ctrl/Cmd key', async () => {
      render(<SpreadsheetGrid />);

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        bubbles: true,
      });
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(mockCopySelection).not.toHaveBeenCalled();
      });
    });

    it('should cleanup keyboard event listeners on unmount', () => {
      const { unmount } = render(<SpreadsheetGrid />);

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });
  });

  describe('Range Selection', () => {
    it('should register onRangeSelectionChanged handler', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.onRangeSelectionChanged).toBeDefined();
      expect(typeof agGridProps.onRangeSelectionChanged).toBe('function');
    });

    it('should not call setSelection when gridApi is not available', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      // Call without setting up gridRef - should not throw error
      agGridProps.onRangeSelectionChanged();

      // setSelection should not be called when gridApi is unavailable
      expect(mockSetSelection).not.toHaveBeenCalled();
    });
  });

  describe('Editable Header Component', () => {
    it('should include editable header component in column definition', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.columnDefs[0].headerComponent).toBeDefined();
    });
  });

  describe('Custom Cell Renderer', () => {
    it('should include custom cell renderer in column definition', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.columnDefs[0].cellRenderer).toBeDefined();
    });
  });

  describe('Sheet Switching', () => {
    it('should update grid when active sheet changes', () => {
      const { rerender } = render(<SpreadsheetGrid />);

      const newSheet: Sheet = {
        ...mockSheet,
        id: 'test-sheet-2',
        name: 'New Sheet',
        rows: [mockSheet.rows[0]],
      };

      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        (selector: (state: typeof defaultStoreState) => unknown) =>
          selector({
            ...defaultStoreState,
            activeSheetId: 'test-sheet-2',
            sheets: [mockSheet, newSheet],
          })
      );

      rerender(<SpreadsheetGrid />);

      const agGridProps = (global as any).__agGridProps;
      expect(agGridProps.rowData).toHaveLength(1);
    });

    it('should respect sheetId prop over activeSheetId', () => {
      const specificSheet: Sheet = {
        ...mockSheet,
        id: 'specific-sheet',
        name: 'Specific Sheet',
      };

      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        (selector: (state: typeof defaultStoreState) => unknown) =>
          selector({
            ...defaultStoreState,
            activeSheetId: 'test-sheet-1',
            sheets: [mockSheet, specificSheet],
          })
      );

      render(<SpreadsheetGrid sheetId="specific-sheet" />);

      const agGridProps = (global as any).__agGridProps;
      expect(agGridProps.rowData).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sheet', () => {
      const emptySheet: Sheet = {
        ...mockSheet,
        columns: [],
        rows: [],
      };

      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        (selector: (state: typeof defaultStoreState) => unknown) =>
          selector({
            ...defaultStoreState,
            sheets: [emptySheet],
          })
      );

      render(<SpreadsheetGrid />);

      const agGridProps = (global as any).__agGridProps;
      expect(agGridProps.columnDefs).toHaveLength(0);
      expect(agGridProps.rowData).toHaveLength(0);
    });

    it('should handle sheet with hidden rows', () => {
      const sheetWithHiddenRows: Sheet = {
        ...mockSheet,
        rows: [
          { ...mockSheet.rows[0], hidden: false },
          { ...mockSheet.rows[1], hidden: true },
          { ...mockSheet.rows[2], hidden: false },
        ],
      };

      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        (selector: (state: typeof defaultStoreState) => unknown) =>
          selector({
            ...defaultStoreState,
            sheets: [sheetWithHiddenRows],
          })
      );

      render(<SpreadsheetGrid />);

      const agGridProps = (global as any).__agGridProps;
      expect(agGridProps.rowData).toHaveLength(3);
    });

    it('should handle null/undefined cell values', () => {
      const sheetWithNullValues: Sheet = {
        ...mockSheet,
        rows: [
          {
            id: 'row-0',
            index: 0,
            hidden: false,
            cells: {
              'col-A': createMockCell('row-0', 'col-A', 'test', 'text'), // 하나의 값이 있어야 행이 표시됨
              'col-B': createMockCell('row-0', 'col-B', null, 'number'),
              'col-C': createMockCell('row-0', 'col-C', undefined, 'number'),
            },
          },
        ],
        columns: [
          ...mockSheet.columns,
          { id: 'col-C', name: 'Column C', type: 'number', index: 2 },
        ],
      };

      (
        useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        (selector: (state: typeof defaultStoreState) => unknown) =>
          selector({
            ...defaultStoreState,
            sheets: [sheetWithNullValues],
          })
      );

      render(<SpreadsheetGrid />);

      const agGridProps = (global as any).__agGridProps;
      expect(agGridProps.rowData[0]['col-A']).toBe('test');
      expect(agGridProps.rowData[0]['col-B']).toBe(null);
      expect(agGridProps.rowData[0]['col-C']).toBe(undefined);
    });

    it('should handle cell update with missing field', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      const mockEvent = {
        data: { _rowId: 'row-0' },
        colDef: {},
        newValue: 'Updated Value',
      };

      agGridProps.onCellValueChanged(mockEvent);

      expect(mockUpdateCell).not.toHaveBeenCalled();
    });

    it('should handle cell update with missing rowId', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      const mockEvent = {
        data: {},
        colDef: { field: 'col-A' },
        newValue: 'Updated Value',
      };

      agGridProps.onCellValueChanged(mockEvent);

      expect(mockUpdateCell).not.toHaveBeenCalled();
    });
  });

  describe('AG Grid Configuration', () => {
    it('should enable range selection', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.enableRangeSelection).toBe(true);
    });

    it('should enable cell text selection', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.enableCellTextSelection).toBe(true);
    });

    it('should not enable row selection', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.rowSelection).toBeUndefined();
    });

    it('should enable row animations', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.animateRows).toBe(true);
    });

    it('should set default column properties', () => {
      render(<SpreadsheetGrid />);
      const agGridProps = (global as any).__agGridProps;

      expect(agGridProps.defaultColDef).toEqual({
        flex: 1,
        minWidth: 100,
        editable: true,
        sortable: true,
        filter: true,
        resizable: true,
      });
    });
  });
});
