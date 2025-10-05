/**
 * Toolbar Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toolbar } from './Toolbar';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import type { Sheet } from '@types';

// Mock the store
vi.mock('@stores/spreadsheetStore', () => ({
  useSpreadsheetStore: vi.fn(),
}));

// Mock the useImportExport hook
vi.mock('@hooks/useImportExport', () => ({
  useImportExport: () => ({
    importFile: vi.fn(),
    exportSheet: vi.fn(),
  }),
}));

describe('Toolbar', () => {
  const mockSheet: Sheet = {
    id: 'sheet-1',
    name: 'Test Sheet',
    columns: [
      { id: 'col-A', name: 'Column A', type: 'text', index: 0 },
      { id: 'col-B', name: 'Column B', type: 'number', index: 1 },
    ],
    rows: [
      {
        id: 'row-0',
        index: 0,
        cells: {
          'col-A': {
            id: 'row-0:col-A',
            rowId: 'row-0',
            columnId: 'col-A',
            value: 'Test',
            type: 'text',
          },
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultStoreState = {
    activeSheetId: 'sheet-1',
    sheets: [mockSheet],
    selection: null,
    addRow: vi.fn(),
    addColumn: vi.fn(),
    addSheets: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    saveSpreadsheet: vi.fn(),
    saving: false,
    applyCellStyle: vi.fn(),
    filterSheet: vi.fn(),
    clearFilters: vi.fn(),
    getMergedCell: vi.fn(() => undefined),
    mergeCells: vi.fn(),
    unmergeCells: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector(defaultStoreState)
    );
  });

  it('renders toolbar with all sections', () => {
    render(<Toolbar />);

    // File operations
    expect(screen.getByTitle(/새로 만들기/i)).toBeInTheDocument();
    expect(screen.getByTitle(/저장/i)).toBeInTheDocument();

    // Edit operations
    expect(screen.getByTitle(/실행 취소/i)).toBeInTheDocument();
    expect(screen.getByTitle(/다시 실행/i)).toBeInTheDocument();

    // Insert operations
    expect(screen.getByTitle(/행 추가/i)).toBeInTheDocument();
    expect(screen.getByTitle(/열 추가/i)).toBeInTheDocument();

    // Filter operations
    expect(screen.getByTitle(/데이터 필터/i)).toBeInTheDocument();

    // Format operations
    expect(screen.getByTitle(/굵게/i)).toBeInTheDocument();
    expect(screen.getByTitle(/기울임/i)).toBeInTheDocument();
    expect(screen.getByTitle(/밑줄/i)).toBeInTheDocument();
  });

  it('calls addRow when Add Row button is clicked', () => {
    const addRow = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, addRow })
    );

    render(<Toolbar />);
    fireEvent.click(screen.getByTitle(/행 추가/i));

    expect(addRow).toHaveBeenCalledWith('sheet-1');
  });

  it('calls addColumn when Add Column button is clicked', () => {
    const addColumn = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, addColumn })
    );

    render(<Toolbar />);
    fireEvent.click(screen.getByTitle(/열 추가/i));

    expect(addColumn).toHaveBeenCalledWith('sheet-1');
  });

  it('calls undo when Undo button is clicked', () => {
    const undo = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, undo })
    );

    render(<Toolbar />);
    fireEvent.click(screen.getByTitle(/실행 취소/i));

    expect(undo).toHaveBeenCalled();
  });

  it('calls redo when Redo button is clicked', () => {
    const redo = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, redo })
    );

    render(<Toolbar />);
    fireEvent.click(screen.getByTitle(/다시 실행/i));

    expect(redo).toHaveBeenCalled();
  });

  it('calls saveSpreadsheet when Save button is clicked', () => {
    const saveSpreadsheet = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, saveSpreadsheet })
    );

    render(<Toolbar />);
    fireEvent.click(screen.getByTitle(/저장/i));

    expect(saveSpreadsheet).toHaveBeenCalled();
  });

  it('disables formatting buttons when no selection', () => {
    render(<Toolbar />);

    expect(screen.getByTitle(/굵게/i)).toBeDisabled();
    expect(screen.getByTitle(/기울임/i)).toBeDisabled();
    expect(screen.getByTitle(/밑줄/i)).toBeDisabled();
  });

  it('enables formatting buttons when selection exists', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<Toolbar />);

    expect(screen.getByTitle(/굵게/i)).not.toBeDisabled();
    expect(screen.getByTitle(/기울임/i)).not.toBeDisabled();
    expect(screen.getByTitle(/밑줄/i)).not.toBeDisabled();
  });

  it('opens filter dialog when Filter button is clicked', async () => {
    render(<Toolbar />);

    fireEvent.click(screen.getByTitle(/데이터 필터/i));

    await waitFor(() => {
      expect(
        screen.getByText(/데이터 필터/i, { selector: 'h2' })
      ).toBeInTheDocument();
    });
  });

  it('shows filter count badge when filters are active', () => {
    const sheetWithFilters: Sheet = {
      ...mockSheet,
      filters: [{ columnId: 'col-A', operator: 'equals', value: 'Test' }],
    };

    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, sheets: [sheetWithFilters] })
    );

    render(<Toolbar />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('applies filters when Apply Filters is clicked in dialog', async () => {
    const filterSheet = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, filterSheet })
    );

    render(<Toolbar />);

    // Open dialog
    fireEvent.click(screen.getByTitle(/데이터 필터/i));

    // Wait for dialog
    await waitFor(() => {
      expect(
        screen.getByText(/데이터 필터/i, { selector: 'h2' })
      ).toBeInTheDocument();
    });

    // Click Apply
    fireEvent.click(screen.getByText(/필터 적용/i));

    expect(filterSheet).toHaveBeenCalled();
  });

  it('clears filters when Clear All is clicked in dialog', async () => {
    const clearFilters = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({ ...defaultStoreState, clearFilters })
    );

    render(<Toolbar />);

    // Open dialog
    fireEvent.click(screen.getByTitle(/데이터 필터/i));

    // Wait for dialog
    await waitFor(() => {
      expect(
        screen.getByText(/데이터 필터/i, { selector: 'h2' })
      ).toBeInTheDocument();
    });

    // Click Clear All
    fireEvent.click(screen.getByText(/모두 지우기/i));

    expect(clearFilters).toHaveBeenCalled();
  });
});
