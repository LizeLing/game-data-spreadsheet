/**
 * SpreadsheetStore Tests
 * Testing key store functionality: undo/redo, filters, cell updates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSpreadsheetStore } from './spreadsheetStore';
import type { Sheet, FilterConfig } from '@types';

describe('SpreadsheetStore', () => {
  let testSheetId: string;

  beforeEach(() => {
    // Reset store to initial state
    useSpreadsheetStore.setState({
      sheets: [],
      activeSheetId: '',
      selection: null,
      history: [],
      historyIndex: -1,
      hasUnsavedChanges: false,
    });

    // Generate unique sheet ID for this test
    testSheetId = `test-sheet-${Date.now()}-${Math.random()}`;

    // Create a fresh test sheet
    const testSheet: Sheet = {
      id: testSheetId,
      name: 'Test Sheet',
      columns: [
        { id: 'col-A', name: 'Column A', type: 'text', index: 0 },
        { id: 'col-B', name: 'Column B', type: 'number', index: 1 },
        { id: 'col-C', name: 'Column C', type: 'text', index: 2 },
      ],
      rows: [
        {
          id: 'row-0',
          index: 0,
          hidden: false,
          cells: {
            'col-A': {
              id: 'row-0:col-A',
              rowId: 'row-0',
              columnId: 'col-A',
              value: 'A1',
              type: 'text',
            },
            'col-B': {
              id: 'row-0:col-B',
              rowId: 'row-0',
              columnId: 'col-B',
              value: 10,
              type: 'number',
            },
            'col-C': {
              id: 'row-0:col-C',
              rowId: 'row-0',
              columnId: 'col-C',
              value: 'C1',
              type: 'text',
            },
          },
        },
        {
          id: 'row-1',
          index: 1,
          hidden: false,
          cells: {
            'col-A': {
              id: 'row-1:col-A',
              rowId: 'row-1',
              columnId: 'col-A',
              value: 'A2',
              type: 'text',
            },
            'col-B': {
              id: 'row-1:col-B',
              rowId: 'row-1',
              columnId: 'col-B',
              value: 20,
              type: 'number',
            },
            'col-C': {
              id: 'row-1:col-C',
              rowId: 'row-1',
              columnId: 'col-C',
              value: 'C2',
              type: 'text',
            },
          },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { addSheets } = useSpreadsheetStore.getState();
    addSheets([testSheet]);
  });

  describe('Undo/Redo', () => {
    it('should undo cell update', () => {
      const { updateCell, undo } = useSpreadsheetStore.getState();

      // Update a cell
      updateCell(testSheetId, 'row-0', 'col-A', 'Modified');

      // Get fresh state after update
      const sheets = useSpreadsheetStore.getState().sheets;
      const testSheet = sheets.find((s) => s.id === testSheetId);
      expect(testSheet?.rows[0].cells['col-A'].value).toBe('Modified');

      // Undo
      undo();

      const updatedSheets = useSpreadsheetStore.getState().sheets;
      const updatedTestSheet = updatedSheets.find((s) => s.id === testSheetId);
      expect(updatedTestSheet?.rows[0].cells['col-A'].value).toBe('A1');
    });

    it('should redo cell update', () => {
      const { updateCell, undo, redo } = useSpreadsheetStore.getState();

      // Update a cell
      updateCell(testSheetId, 'row-0', 'col-A', 'Modified');
      const sheets = useSpreadsheetStore.getState().sheets;
      expect(
        sheets.find((s) => s.id === testSheetId)!.rows[0].cells['col-A'].value
      ).toBe('Modified');

      // Undo
      undo();
      let updatedSheets = useSpreadsheetStore.getState().sheets;
      expect(
        updatedSheets.find((s) => s.id === testSheetId)!.rows[0].cells['col-A']
          .value
      ).toBe('A1');

      // Redo
      redo();
      updatedSheets = useSpreadsheetStore.getState().sheets;
      expect(
        updatedSheets.find((s) => s.id === testSheetId)!.rows[0].cells['col-A']
          .value
      ).toBe('Modified');
    });

    it('should handle multiple undo operations', () => {
      const { updateCell, undo } = useSpreadsheetStore.getState();

      // Make multiple changes
      updateCell(testSheetId, 'row-0', 'col-A', 'Change1');
      updateCell(testSheetId, 'row-0', 'col-A', 'Change2');
      updateCell(testSheetId, 'row-0', 'col-A', 'Change3');

      // Undo twice
      undo();
      undo();

      const sheets = useSpreadsheetStore.getState().sheets;
      expect(
        sheets.find((s) => s.id === testSheetId)!.rows[0].cells['col-A'].value
      ).toBe('Change1');
    });

    it('should undo row addition', () => {
      const { addRow, undo, sheets } = useSpreadsheetStore.getState();

      const initialRowCount = sheets.find((s) => s.id === testSheetId)!.rows
        .length;

      // Add a row
      addRow(testSheetId);

      expect(
        useSpreadsheetStore.getState().sheets.find((s) => s.id === testSheetId)!
          .rows.length
      ).toBe(initialRowCount + 1);

      // Undo
      undo();

      expect(
        useSpreadsheetStore.getState().sheets.find((s) => s.id === testSheetId)!
          .rows.length
      ).toBe(initialRowCount);
    });

    it('should undo column addition', () => {
      const { addColumn, undo, sheets } = useSpreadsheetStore.getState();

      const initialColCount = sheets.find((s) => s.id === testSheetId)!.columns
        .length;

      // Add a column
      addColumn(testSheetId);

      expect(
        useSpreadsheetStore.getState().sheets.find((s) => s.id === testSheetId)!
          .columns.length
      ).toBe(initialColCount + 1);

      // Undo
      undo();

      expect(
        useSpreadsheetStore.getState().sheets.find((s) => s.id === testSheetId)!
          .columns.length
      ).toBe(initialColCount);
    });
  });

  describe('Filter Operations', () => {
    it('should apply filter to sheet', () => {
      const { filterSheet } = useSpreadsheetStore.getState();

      const filters: FilterConfig[] = [
        { columnId: 'col-A', operator: 'equals', value: 'A1' },
      ];

      filterSheet(testSheetId, filters);

      const updatedSheet = useSpreadsheetStore
        .getState()
        .sheets.find((s) => s.id === testSheetId)!;

      // First row should be visible (matches filter)
      expect(updatedSheet.rows[0].hidden).toBe(false);

      // Second row should be hidden (doesn't match filter)
      expect(updatedSheet.rows[1].hidden).toBe(true);
    });

    it('should apply multiple filters (AND logic)', () => {
      const { filterSheet } = useSpreadsheetStore.getState();

      const filters: FilterConfig[] = [
        { columnId: 'col-A', operator: 'equals', value: 'A1' },
        { columnId: 'col-B', operator: 'greaterThan', value: 5 },
      ];

      filterSheet(testSheetId, filters);

      const sheet = useSpreadsheetStore
        .getState()
        .sheets.find((s) => s.id === testSheetId)!;

      // First row matches both filters (A1 = 'A1' AND 10 > 5)
      expect(sheet.rows[0].hidden).toBe(false);

      // Second row doesn't match first filter
      expect(sheet.rows[1].hidden).toBe(true);
    });

    it('should clear filters', () => {
      const { filterSheet, clearFilters } = useSpreadsheetStore.getState();

      // Apply filter
      const filters: FilterConfig[] = [
        { columnId: 'col-A', operator: 'equals', value: 'A1' },
      ];
      filterSheet(testSheetId, filters);

      // Verify filter is applied
      const sheets = useSpreadsheetStore.getState().sheets;
      expect(sheets.find((s) => s.id === testSheetId)!.rows[1].hidden).toBe(
        true
      );

      // Clear filters
      clearFilters(testSheetId);

      const updatedSheet = useSpreadsheetStore
        .getState()
        .sheets.find((s) => s.id === testSheetId)!;

      // All rows should be visible
      expect(updatedSheet.rows[0].hidden).toBe(false);
      expect(updatedSheet.rows[1].hidden).toBe(false);

      // Filters should be removed
      expect(updatedSheet.filters).toBeUndefined();
    });

    it('should filter with contains operator', () => {
      const { filterSheet } = useSpreadsheetStore.getState();

      const filters: FilterConfig[] = [
        { columnId: 'col-C', operator: 'contains', value: '1' },
      ];

      filterSheet(testSheetId, filters);

      const sheet = useSpreadsheetStore
        .getState()
        .sheets.find((s) => s.id === testSheetId)!;

      // First row contains '1' in column C (C1)
      expect(sheet.rows[0].hidden).toBe(false);

      // Second row doesn't contain '1' in column C (C2)
      expect(sheet.rows[1].hidden).toBe(true);
    });

    it('should filter with greaterThan operator', () => {
      const { filterSheet } = useSpreadsheetStore.getState();

      const filters: FilterConfig[] = [
        { columnId: 'col-B', operator: 'greaterThan', value: 15 },
      ];

      filterSheet(testSheetId, filters);

      const sheet = useSpreadsheetStore
        .getState()
        .sheets.find((s) => s.id === testSheetId)!;

      // First row: 10 is not > 15
      expect(sheet.rows[0].hidden).toBe(true);

      // Second row: 20 is > 15
      expect(sheet.rows[1].hidden).toBe(false);
    });

    it('should filter with lessThan operator', () => {
      const { filterSheet } = useSpreadsheetStore.getState();

      const filters: FilterConfig[] = [
        { columnId: 'col-B', operator: 'lessThan', value: 15 },
      ];

      filterSheet(testSheetId, filters);

      const sheet = useSpreadsheetStore
        .getState()
        .sheets.find((s) => s.id === testSheetId)!;

      // First row: 10 < 15
      expect(sheet.rows[0].hidden).toBe(false);

      // Second row: 20 is not < 15
      expect(sheet.rows[1].hidden).toBe(true);
    });
  });

  describe('Cell Operations', () => {
    it('should update cell value', () => {
      const { updateCell } = useSpreadsheetStore.getState();

      updateCell(testSheetId, 'row-0', 'col-A', 'Updated Value');

      const sheets = useSpreadsheetStore.getState().sheets;
      expect(
        sheets.find((s) => s.id === testSheetId)!.rows[0].cells['col-A'].value
      ).toBe('Updated Value');
    });

    it('should update cell with formula', () => {
      const { updateCell } = useSpreadsheetStore.getState();

      updateCell(testSheetId, 'row-0', 'col-C', '=A1&" suffix"');

      const sheets = useSpreadsheetStore.getState().sheets;
      const cell = sheets.find((s) => s.id === testSheetId)!.rows[0].cells[
        'col-C'
      ];
      expect(cell.formula).toBe('=A1&" suffix"');
      expect(cell.value).toBe('A1 suffix');
    });

    it('should mark spreadsheet as having unsaved changes', () => {
      const { updateCell } = useSpreadsheetStore.getState();

      updateCell(testSheetId, 'row-0', 'col-A', 'Modified');

      const updated = useSpreadsheetStore.getState();
      expect(updated.hasUnsavedChanges).toBe(true);
    });
  });

  describe('Sheet Operations', () => {
    it('should add a new row', () => {
      const { addRow, sheets } = useSpreadsheetStore.getState();

      const initialCount = sheets.find((s) => s.id === testSheetId)!.rows
        .length;

      addRow(testSheetId);

      const updatedSheets = useSpreadsheetStore.getState().sheets;
      expect(updatedSheets.find((s) => s.id === testSheetId)!.rows.length).toBe(
        initialCount + 1
      );
    });

    it('should add a new column', () => {
      const { addColumn, sheets } = useSpreadsheetStore.getState();

      const initialCount = sheets.find((s) => s.id === testSheetId)!.columns
        .length;

      addColumn(testSheetId);

      const updatedSheets = useSpreadsheetStore.getState().sheets;
      expect(
        updatedSheets.find((s) => s.id === testSheetId)!.columns.length
      ).toBe(initialCount + 1);
    });
  });

  describe('Column Operations', () => {
    it('should update column name', () => {
      const { updateColumn } = useSpreadsheetStore.getState();

      updateColumn(testSheetId, 'col-A', { name: 'New Column Name' });

      const sheets = useSpreadsheetStore.getState().sheets;
      const column = sheets
        .find((s) => s.id === testSheetId)!
        .columns.find((c) => c.id === 'col-A');
      expect(column?.name).toBe('New Column Name');
    });

    it('should preserve other column properties when updating name', () => {
      const { updateColumn } = useSpreadsheetStore.getState();

      const sheets = useSpreadsheetStore.getState().sheets;
      const beforeColumn = sheets
        .find((s) => s.id === testSheetId)!
        .columns.find((c) => c.id === 'col-B');
      const beforeType = beforeColumn?.type;
      const beforeIndex = beforeColumn?.index;

      updateColumn(testSheetId, 'col-B', { name: 'Updated Name' });

      const afterSheets = useSpreadsheetStore.getState().sheets;
      const afterColumn = afterSheets
        .find((s) => s.id === testSheetId)!
        .columns.find((c) => c.id === 'col-B');

      expect(afterColumn?.name).toBe('Updated Name');
      expect(afterColumn?.type).toBe(beforeType);
      expect(afterColumn?.index).toBe(beforeIndex);
    });

    it('should add to history when column name changes', () => {
      const beforeHistoryLength = useSpreadsheetStore.getState().history.length;

      const { updateColumn } = useSpreadsheetStore.getState();
      updateColumn(testSheetId, 'col-A', { name: 'History Test' });

      const afterHistoryLength = useSpreadsheetStore.getState().history.length;
      expect(afterHistoryLength).toBe(beforeHistoryLength + 1);

      const latestEntry =
        useSpreadsheetStore.getState().history[afterHistoryLength - 1];
      expect(latestEntry.type).toBe('column');
      expect(latestEntry.action).toBe('update');
    });

    it('should undo column name change', () => {
      const { updateColumn, undo } = useSpreadsheetStore.getState();

      const originalName = 'Column A';

      // Change column name
      updateColumn(testSheetId, 'col-A', { name: 'Changed Name' });

      let sheets = useSpreadsheetStore.getState().sheets;
      expect(
        sheets
          .find((s) => s.id === testSheetId)!
          .columns.find((c) => c.id === 'col-A')?.name
      ).toBe('Changed Name');

      // Undo
      undo();

      sheets = useSpreadsheetStore.getState().sheets;
      expect(
        sheets
          .find((s) => s.id === testSheetId)!
          .columns.find((c) => c.id === 'col-A')?.name
      ).toBe(originalName);
    });

    it('should redo column name change', () => {
      const { updateColumn, undo, redo } = useSpreadsheetStore.getState();

      // Change column name
      updateColumn(testSheetId, 'col-A', { name: 'Redo Test' });

      // Undo
      undo();

      let sheets = useSpreadsheetStore.getState().sheets;
      expect(
        sheets
          .find((s) => s.id === testSheetId)!
          .columns.find((c) => c.id === 'col-A')?.name
      ).toBe('Column A');

      // Redo
      redo();

      sheets = useSpreadsheetStore.getState().sheets;
      expect(
        sheets
          .find((s) => s.id === testSheetId)!
          .columns.find((c) => c.id === 'col-A')?.name
      ).toBe('Redo Test');
    });

    it('should mark spreadsheet as having unsaved changes', () => {
      // Reset unsaved changes flag
      useSpreadsheetStore.setState({ hasUnsavedChanges: false });

      const { updateColumn } = useSpreadsheetStore.getState();
      updateColumn(testSheetId, 'col-A', { name: 'Trigger Save' });

      const state = useSpreadsheetStore.getState();
      expect(state.hasUnsavedChanges).toBe(true);
    });
  });
});
