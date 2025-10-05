/**
 * FormulaBar Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormulaBar } from './FormulaBar';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import type { Sheet, SelectionRange } from '@types';

// Mock the store
vi.mock('@stores/spreadsheetStore', () => ({
  useSpreadsheetStore: vi.fn(),
}));

describe('FormulaBar', () => {
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
            value: 'Test Value',
            type: 'text',
          },
          'col-B': {
            id: 'row-0:col-B',
            rowId: 'row-0',
            columnId: 'col-B',
            value: 42,
            type: 'number',
          },
        },
      },
      {
        id: 'row-1',
        index: 1,
        cells: {
          'col-A': {
            id: 'row-1:col-A',
            rowId: 'row-1',
            columnId: 'col-A',
            value: null,
            type: 'text',
            formula: '=A1&" Suffix"',
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
    selection: null as SelectionRange | null,
    updateCell: vi.fn(),
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

  it('renders with no selection', () => {
    render(<FormulaBar />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/셀을 선택하세요/i)).toBeDisabled();
  });

  it('shows cell reference when cell is selected', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('shows cell value in input when cell is selected', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(
      /값 또는 수식/i
    ) as HTMLInputElement;
    expect(input.value).toBe('Test Value');
  });

  it('shows formula instead of value when cell has formula', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 1, endRow: 1, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(
      /값 또는 수식/i
    ) as HTMLInputElement;
    expect(input.value).toBe('=A1&" Suffix"');
  });

  it('enables input when cell is selected', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(/값 또는 수식/i);
    expect(input).not.toBeDisabled();
  });

  it('calls updateCell when Enter is pressed', () => {
    const updateCell = vi.fn();
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
          updateCell,
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(/값 또는 수식/i);
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should call updateCell with the current value (from cell)
    expect(updateCell).toHaveBeenCalledWith(
      'sheet-1',
      'row-0',
      'col-A',
      expect.any(String)
    );
  });

  it('shows autocomplete when typing formula function', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(/값 또는 수식/i);
    fireEvent.change(input, { target: { value: '=SU' } });

    expect(screen.getByText('SUM')).toBeInTheDocument();
  });

  it('allows selecting function from autocomplete with Tab', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(/값 또는 수식/i);
    fireEvent.change(input, { target: { value: '=SU' } });

    // Autocomplete should show SUM
    expect(screen.getByText('SUM')).toBeInTheDocument();

    // Tab should close autocomplete
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(screen.queryByText('SUM')).not.toBeInTheDocument();
  });

  it('closes autocomplete when Escape is pressed', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(/값 또는 수식/i);
    fireEvent.change(input, { target: { value: '=SU' } });

    expect(screen.getByText('SUM')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByText('SUM')).not.toBeInTheDocument();
  });

  it('navigates autocomplete with arrow keys', () => {
    (
      useSpreadsheetStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector: (state: typeof defaultStoreState) => unknown) =>
        selector({
          ...defaultStoreState,
          selection: { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        })
    );

    render(<FormulaBar />);

    const input = screen.getByPlaceholderText(/값 또는 수식/i);
    fireEvent.change(input, { target: { value: '=A' } });

    // Should show multiple functions starting with A
    const avgElement = screen.getByText('AVERAGE');
    expect(avgElement).toBeInTheDocument();

    // Arrow down to select second item
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Arrow up to go back
    fireEvent.keyDown(input, { key: 'ArrowUp' });
  });
});
