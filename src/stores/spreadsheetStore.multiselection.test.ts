/**
 * Multi-Selection Tests
 * 다중 셀 선택 기능 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSpreadsheetStore } from './spreadsheetStore';
import type { SelectionRange } from '@types';

describe('Multi-Selection Store Tests', () => {
  beforeEach(() => {
    // Reset store state before each test using setState
    useSpreadsheetStore.setState({
      sheets: [
      {
        id: 'test-sheet',
        name: 'Test Sheet',
        columns: [
          { id: 'col-A', name: 'A', type: 'text', width: 100, index: 0 },
          { id: 'col-B', name: 'B', type: 'text', width: 100, index: 1 },
          { id: 'col-C', name: 'C', type: 'text', width: 100, index: 2 },
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
                value: 'A1',
                type: 'text',
              },
              'col-B': {
                id: 'row-0:col-B',
                rowId: 'row-0',
                columnId: 'col-B',
                value: 'B1',
                type: 'text',
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
                value: 'B2',
                type: 'text',
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
          {
            id: 'row-2',
            index: 2,
            cells: {
              'col-A': {
                id: 'row-2:col-A',
                rowId: 'row-2',
                columnId: 'col-A',
                value: 'A3',
                type: 'text',
              },
              'col-B': {
                id: 'row-2:col-B',
                rowId: 'row-2',
                columnId: 'col-B',
                value: 'B3',
                type: 'text',
              },
              'col-C': {
                id: 'row-2:col-C',
                rowId: 'row-2',
                columnId: 'col-C',
                value: 'C3',
                type: 'text',
              },
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
      activeSheetId: 'test-sheet',
      selection: null,
      multiSelection: [],
    });
  });

  describe('setMultiSelection', () => {
    it('should set multiple selection ranges', () => {
      const ranges: SelectionRange[] = [
        { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
      ];

      useSpreadsheetStore.getState().setMultiSelection(ranges);

      const updatedStore = useSpreadsheetStore.getState();
      expect(updatedStore.multiSelection).toEqual(ranges);
      expect(updatedStore.multiSelection.length).toBe(2);
    });
  });

  describe('addSelectionRange', () => {
    it('should add a new selection range to multiSelection', () => {
      const range: SelectionRange = {
        startRow: 0,
        endRow: 0,
        startColumn: 0,
        endColumn: 0,
      };

      useSpreadsheetStore.getState().addSelectionRange(range);

      const updatedStore = useSpreadsheetStore.getState();
      expect(updatedStore.multiSelection.length).toBe(1);
      expect(updatedStore.multiSelection[0]).toEqual(range);
    });

    it('should append multiple ranges', () => {
      useSpreadsheetStore.getState().addSelectionRange({
        startRow: 0,
        endRow: 0,
        startColumn: 0,
        endColumn: 0,
      });
      useSpreadsheetStore.getState().addSelectionRange({
        startRow: 1,
        endRow: 1,
        startColumn: 1,
        endColumn: 1,
      });

      const updatedStore = useSpreadsheetStore.getState();
      expect(updatedStore.multiSelection.length).toBe(2);
    });
  });

  describe('removeSelectionRange', () => {
    it('should remove a selection range at given index', () => {
      const ranges: SelectionRange[] = [
        { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
        { startRow: 2, endRow: 2, startColumn: 2, endColumn: 2 },
      ];

      useSpreadsheetStore.getState().setMultiSelection(ranges);
      useSpreadsheetStore.getState().removeSelectionRange(1);

      const updatedStore = useSpreadsheetStore.getState();
      expect(updatedStore.multiSelection.length).toBe(2);
      expect(updatedStore.multiSelection[0]).toEqual(ranges[0]);
      expect(updatedStore.multiSelection[1]).toEqual(ranges[2]);
    });

    it('should handle invalid index gracefully', () => {
      const ranges: SelectionRange[] = [
        { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
      ];

      useSpreadsheetStore.getState().setMultiSelection(ranges);
      useSpreadsheetStore.getState().removeSelectionRange(5); // Invalid index

      const updatedStore = useSpreadsheetStore.getState();
      expect(updatedStore.multiSelection.length).toBe(1);
    });
  });

  describe('clearMultiSelection', () => {
    it('should clear all multi-selection ranges', () => {
      const ranges: SelectionRange[] = [
        { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 },
        { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
      ];

      useSpreadsheetStore.getState().setMultiSelection(ranges);
      let updatedStore = useSpreadsheetStore.getState();
      expect(updatedStore.multiSelection.length).toBe(2);

      useSpreadsheetStore.getState().clearMultiSelection();
      updatedStore = useSpreadsheetStore.getState();
      expect(updatedStore.multiSelection.length).toBe(0);
    });
  });

  describe('getAllSelectedRanges', () => {
    it('should return all selected ranges including primary and multi-selection', () => {
      const store = useSpreadsheetStore.getState();

      const primarySelection: SelectionRange = {
        startRow: 0,
        endRow: 0,
        startColumn: 0,
        endColumn: 0,
      };
      const multiRanges: SelectionRange[] = [
        { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
        { startRow: 2, endRow: 2, startColumn: 2, endColumn: 2 },
      ];

      store.setSelection(primarySelection);
      store.setMultiSelection(multiRanges);

      const allRanges = store.getAllSelectedRanges();

      expect(allRanges.length).toBe(3);
      expect(allRanges[0]).toEqual(primarySelection);
      expect(allRanges[1]).toEqual(multiRanges[0]);
      expect(allRanges[2]).toEqual(multiRanges[1]);
    });

    it('should return only primary selection if no multi-selection', () => {
      const store = useSpreadsheetStore.getState();

      const primarySelection: SelectionRange = {
        startRow: 0,
        endRow: 0,
        startColumn: 0,
        endColumn: 0,
      };

      store.setSelection(primarySelection);

      const allRanges = store.getAllSelectedRanges();

      expect(allRanges.length).toBe(1);
      expect(allRanges[0]).toEqual(primarySelection);
    });

    it('should return only multi-selection if no primary selection', () => {
      const store = useSpreadsheetStore.getState();

      const multiRanges: SelectionRange[] = [
        { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
      ];

      store.setMultiSelection(multiRanges);

      const allRanges = store.getAllSelectedRanges();

      expect(allRanges.length).toBe(1);
      expect(allRanges[0]).toEqual(multiRanges[0]);
    });

    it('should return empty array if no selections', () => {
      const store = useSpreadsheetStore.getState();
      const allRanges = store.getAllSelectedRanges();

      expect(allRanges.length).toBe(0);
    });
  });

  describe('applyStyleToMultiSelection', () => {
    it('should apply style to all cells in multiple selection ranges', () => {
      // Set primary selection (A1)
      useSpreadsheetStore.getState().setSelection({
        startRow: 0,
        endRow: 0,
        startColumn: 0,
        endColumn: 0,
      });

      // Set multi-selection (B2, C3)
      useSpreadsheetStore.getState().setMultiSelection([
        { startRow: 1, endRow: 1, startColumn: 1, endColumn: 1 },
        { startRow: 2, endRow: 2, startColumn: 2, endColumn: 2 },
      ]);

      // Apply bold style to all selections
      useSpreadsheetStore.getState().applyStyleToMultiSelection('test-sheet', { fontWeight: 'bold' });

      const sheet = useSpreadsheetStore.getState().sheets[0];

      // Check A1 (primary selection)
      expect(sheet.rows[0].cells['col-A'].style?.fontWeight).toBe('bold');

      // Check B2 (first multi-selection)
      expect(sheet.rows[1].cells['col-B'].style?.fontWeight).toBe('bold');

      // Check C3 (second multi-selection)
      expect(sheet.rows[2].cells['col-C'].style?.fontWeight).toBe('bold');
    });

    it('should apply style to range selections', () => {
      // Set primary selection (A1:B2)
      useSpreadsheetStore.getState().setSelection({
        startRow: 0,
        endRow: 1,
        startColumn: 0,
        endColumn: 1,
      });

      // Apply background color
      useSpreadsheetStore.getState().applyStyleToMultiSelection('test-sheet', {
        backgroundColor: '#ff0000',
      });

      const sheet = useSpreadsheetStore.getState().sheets[0];

      // Check all cells in range
      expect(sheet.rows[0].cells['col-A'].style?.backgroundColor).toBe('#ff0000');
      expect(sheet.rows[0].cells['col-B'].style?.backgroundColor).toBe('#ff0000');
      expect(sheet.rows[1].cells['col-A'].style?.backgroundColor).toBe('#ff0000');
      expect(sheet.rows[1].cells['col-B'].style?.backgroundColor).toBe('#ff0000');

      // C1 and C2 should not be affected
      expect(sheet.rows[0].cells['col-C'].style?.backgroundColor).toBeUndefined();
      expect(sheet.rows[1].cells['col-C'].style?.backgroundColor).toBeUndefined();
    });
  });
});
