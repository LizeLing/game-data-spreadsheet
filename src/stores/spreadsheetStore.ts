/**
 * Spreadsheet Store
 * Zustand를 사용한 스프레드시트 전역 상태 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { debounce } from 'lodash';
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type {
  Sheet,
  Row,
  Column,
  Cell,
  CellValue,
  CellType,
  CellStyle,
  SelectionRange,
  HistoryEntry,
  SortConfig,
  FilterConfig,
  ConditionalFormat,
  Spreadsheet,
  SpreadsheetMetadata,
  MergedCell,
} from '@types';
import { generateColumns, generateRows } from '@utils/gridUtils';
import { generateCellId, compareCellValues } from '@utils/cellUtils';
import { formulaEvaluator } from '@services/formula/formulaEvaluator';
import { formulaCache } from '@services/formula/formulaCache';
import {
  createClipboardText,
  parseClipboardText,
  writeToClipboard,
  readFromClipboard,
  createCellCopy,
  type ClipboardData,
} from '@utils/clipboardUtils';
import {
  searchInSheet,
  searchInSheets,
  replaceInCell,
  type SearchOptions,
} from '@utils/searchUtils';

// IndexedDB Schema
interface SpreadsheetDB extends DBSchema {
  spreadsheets: {
    key: string;
    value: {
      id: string;
      name: string;
      data: Spreadsheet;
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: { 'by-updated': Date };
  };
  autosaves: {
    key: string;
    value: {
      spreadsheetId: string;
      data: Spreadsheet;
      timestamp: Date;
    };
    indexes: { 'by-timestamp': Date };
  };
}

// IndexedDB Service
class IndexedDBService {
  private db: IDBPDatabase<SpreadsheetDB> | null = null;
  private readonly DB_NAME = 'GameDataSpreadsheetDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<SpreadsheetDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Spreadsheets store
          if (!db.objectStoreNames.contains('spreadsheets')) {
            const spreadsheetStore = db.createObjectStore('spreadsheets', {
              keyPath: 'id',
            });
            spreadsheetStore.createIndex('by-updated', 'updatedAt');
          }

          // Autosaves store
          if (!db.objectStoreNames.contains('autosaves')) {
            const autosaveStore = db.createObjectStore('autosaves', {
              keyPath: 'spreadsheetId',
            });
            autosaveStore.createIndex('by-timestamp', 'timestamp');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  async save(spreadsheet: Spreadsheet): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('spreadsheets', {
      id: spreadsheet.id,
      name: spreadsheet.name,
      data: spreadsheet,
      createdAt: spreadsheet.createdAt,
      updatedAt: new Date(),
    });
  }

  async load(id: string): Promise<Spreadsheet | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const result = await this.db.get('spreadsheets', id);
    return result?.data || null;
  }

  async list(): Promise<SpreadsheetMetadata[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    const all = await this.db.getAll('spreadsheets');
    return all.map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete('spreadsheets', id);
    await this.db.delete('autosaves', id);
  }

  async autoSave(id: string, data: Spreadsheet): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put('autosaves', {
      spreadsheetId: id,
      data,
      timestamp: new Date(),
    });
  }

  async getAutoSaveBackup(id: string): Promise<Spreadsheet | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const result = await this.db.get('autosaves', id);
    return result?.data || null;
  }

  async clearOldBackups(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    const cutoffDate = new Date(Date.now() - maxAge);
    const tx = this.db.transaction('autosaves', 'readwrite');
    const index = tx.store.index('by-timestamp');

    let cursor = await index.openCursor();
    while (cursor) {
      if (cursor.value.timestamp < cutoffDate) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  }
}

// Create singleton instance
const dbService = new IndexedDBService();

interface SpreadsheetState {
  sheets: Sheet[];
  activeSheetId: string;
  selection: SelectionRange | null;
  multiSelection: SelectionRange[]; // 다중 선택 영역들
  history: HistoryEntry[];
  historyIndex: number;

  // Persistence state
  spreadsheetId: string;
  spreadsheetName: string;
  saving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  updatedAt: Date;

  // Sheet management
  addSheet: (name: string) => void;
  addSheets: (sheets: Sheet[]) => void;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  duplicateSheet: (id: string) => void;

  // Row management
  addRow: (sheetId: string, afterIndex?: number) => void;
  removeRow: (sheetId: string, rowId: string) => void;
  updateRow: (sheetId: string, rowId: string, updates: Partial<Row>) => void;

  // Column management
  addColumn: (sheetId: string, afterIndex?: number) => void;
  removeColumn: (sheetId: string, columnId: string) => void;
  updateColumn: (
    sheetId: string,
    columnId: string,
    updates: Partial<Column>
  ) => void;
  resizeColumn: (sheetId: string, columnId: string, width: number) => void;

  // Cell management
  updateCell: (
    sheetId: string,
    rowId: string,
    columnId: string,
    value: CellValue
  ) => void;
  updateCells: (
    sheetId: string,
    updates: Array<{ rowId: string; columnId: string; value: CellValue }>
  ) => void;
  clearCell: (sheetId: string, rowId: string, columnId: string) => void;

  // Cell styling
  applyCellStyle: (
    sheetId: string,
    selection: SelectionRange,
    style: Partial<CellStyle>
  ) => void;
  applyStyleToMultiSelection: (
    sheetId: string,
    style: Partial<CellStyle>
  ) => void;
  updateCellStyle: (
    sheetId: string,
    rowId: string,
    columnId: string,
    style: Partial<CellStyle>
  ) => void;

  // Conditional formatting
  addConditionalFormat: (sheetId: string, format: ConditionalFormat) => void;
  removeConditionalFormat: (sheetId: string, formatId: string) => void;
  updateConditionalFormat: (
    sheetId: string,
    formatId: string,
    updates: Partial<ConditionalFormat>
  ) => void;

  // Selection
  setSelection: (range: SelectionRange | null) => void;
  clearSelection: () => void;
  setMultiSelection: (ranges: SelectionRange[]) => void;
  addSelectionRange: (range: SelectionRange) => void;
  removeSelectionRange: (index: number) => void;
  clearMultiSelection: () => void;
  getAllSelectedRanges: () => SelectionRange[]; // selection + multiSelection 통합

  // Cell merging
  mergeCells: (sheetId: string, selection: SelectionRange) => void;
  unmergeCells: (sheetId: string, mergedCellId: string) => void;
  getMergedCell: (
    sheetId: string,
    rowIndex: number,
    columnIndex: number
  ) => MergedCell | undefined;

  // Clipboard operations
  copySelection: () => Promise<boolean>;
  cutSelection: () => Promise<boolean>;
  pasteFromClipboard: () => Promise<boolean>;

  // Search and Replace
  searchInCurrentSheet: (
    searchText: string,
    options?: import('@utils/searchUtils').SearchOptions
  ) => import('@utils/searchUtils').SearchResult[];
  searchInAllSheets: (
    searchText: string,
    options?: import('@utils/searchUtils').SearchOptions
  ) => import('@utils/searchUtils').SearchResult[];
  replaceInSelection: (
    searchText: string,
    replaceText: string,
    options?: import('@utils/searchUtils').SearchOptions
  ) => number;
  replaceAll: (
    searchText: string,
    replaceText: string,
    options?: import('@utils/searchUtils').SearchOptions
  ) => number;

  // History
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;

  // Utility
  getActiveSheet: () => Sheet | undefined;
  getCell: (
    sheetId: string,
    rowId: string,
    columnId: string
  ) => Cell | undefined;
  sortSheet: (sheetId: string, config: SortConfig) => void;
  filterSheet: (sheetId: string, filters: FilterConfig[]) => void;
  clearFilters: (sheetId: string) => void;

  // Persistence methods
  initDB: () => Promise<void>;
  saveSpreadsheet: () => Promise<void>;
  loadSpreadsheet: (id: string) => Promise<void>;
  loadBackup: () => Promise<void>;
  setSpreadsheetName: (name: string) => void;
  _triggerAutoSave: () => void;
  _recalculateDependents: (sheetId: string, cellId: string) => void;
}

const createDefaultSheet = (id: string, name: string): Sheet => {
  const columns = generateColumns(10, 0, 'text');
  const rows = generateRows(100, columns);

  return {
    id,
    name,
    columns,
    rows,
    frozenRows: 0,
    frozenColumns: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Debounced auto-save function (2 seconds)
const debouncedAutoSave = debounce(async (state: SpreadsheetState) => {
  try {
    const spreadsheet: Spreadsheet = {
      id: state.spreadsheetId,
      name: state.spreadsheetName,
      sheets: state.sheets,
      activeSheetId: state.activeSheetId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await dbService.autoSave(state.spreadsheetId, spreadsheet);
    useSpreadsheetStore.setState({
      lastSaved: new Date(),
      hasUnsavedChanges: false,
      saving: false,
    });
  } catch (error) {
    console.error('Auto-save failed:', error);
    useSpreadsheetStore.setState({ saving: false });
  }
}, 2000);

export const useSpreadsheetStore = create<SpreadsheetState>()(
  immer((set, get) => ({
    sheets: [createDefaultSheet('sheet-1', 'Sheet 1')],
    activeSheetId: 'sheet-1',
    selection: null,
    multiSelection: [],
    history: [],
    historyIndex: -1,

    // Persistence state
    spreadsheetId: 'default-spreadsheet',
    spreadsheetName: 'Untitled Spreadsheet',
    saving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    updatedAt: new Date(),

    // Sheet management
    addSheet: (name) =>
      set((state) => {
        const id = `sheet-${Date.now()}`;
        const newSheet = createDefaultSheet(id, name);
        state.sheets.push(newSheet);
        state.activeSheetId = id;
      }),

    addSheets: (sheets) =>
      set((state) => {
        sheets.forEach((sheet) => {
          state.sheets.push(sheet);
        });
        if (sheets.length > 0) {
          state.activeSheetId = sheets[0].id;
        }
        state.hasUnsavedChanges = true;
      }),

    removeSheet: (id) =>
      set((state) => {
        if (state.sheets.length <= 1) return; // Keep at least one sheet
        const index = state.sheets.findIndex((s) => s.id === id);
        if (index !== -1) {
          state.sheets.splice(index, 1);
          if (state.activeSheetId === id) {
            state.activeSheetId = state.sheets[0].id;
          }
        }
      }),

    renameSheet: (id, name) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === id);
        if (sheet) {
          sheet.name = name;
          sheet.updatedAt = new Date();
        }
      }),

    setActiveSheet: (id) =>
      set((state) => {
        state.activeSheetId = id;
      }),

    duplicateSheet: (id) =>
      set((state) => {
        const originalSheet = state.sheets.find((s) => s.id === id);
        if (originalSheet) {
          const newId = `sheet-${Date.now()}`;
          const newSheet: Sheet = {
            ...originalSheet,
            id: newId,
            name: `${originalSheet.name} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Deep copy rows and cells
            rows: originalSheet.rows.map((row) => ({
              ...row,
              id: `${newId}-${row.index}`,
              cells: { ...row.cells },
            })),
          };
          state.sheets.push(newSheet);
          state.activeSheetId = newId;
        }
      }),

    // Row management
    addRow: (sheetId, afterIndex) => {
      let newRowId = '';

      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const index = afterIndex ?? sheet.rows.length;
        newRowId = `row-${Date.now()}`;
        const cells: Record<string, Cell> = {};

        sheet.columns.forEach((col) => {
          cells[col.id] = {
            id: generateCellId(newRowId, col.id),
            rowId: newRowId,
            columnId: col.id,
            value: null,
            type: col.type,
          };
        });

        const newRow: Row = {
          id: newRowId,
          index,
          cells,
          height: 32,
          hidden: false,
        };

        sheet.rows.splice(index, 0, newRow);
        // Update indices
        sheet.rows.forEach((row, idx) => {
          row.index = idx;
        });
        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      });

      // Add to history with full row object
      const addedSheet = get().sheets.find((s) => s.id === sheetId);
      const addedRow = addedSheet?.rows.find((r) => r.id === newRowId);
      if (addedRow) {
        get().addHistory({
          type: 'row',
          action: 'add',
          sheetId,
          after: { ...addedRow }, // Store full row object for redo
        });
      }
    },

    removeRow: (sheetId, rowId) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const index = sheet.rows.findIndex((r) => r.id === rowId);
        if (index !== -1) {
          sheet.rows.splice(index, 1);
          // Update indices
          sheet.rows.forEach((row, idx) => {
            row.index = idx;
          });
          sheet.updatedAt = new Date();
        }
      }),

    updateRow: (sheetId, rowId, updates) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const row = sheet.rows.find((r) => r.id === rowId);
        if (row) {
          Object.assign(row, updates);
          sheet.updatedAt = new Date();
        }
      }),

    // Column management
    addColumn: (sheetId, afterIndex) => {
      let newColumnId = '';

      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const index = afterIndex ?? sheet.columns.length;
        newColumnId = `col-${Date.now()}`;

        const newColumn: Column = {
          id: newColumnId,
          name: `Column ${sheet.columns.length + 1}`,
          type: 'text',
          width: 120,
          index,
          frozen: false,
          hidden: false,
        };

        sheet.columns.splice(index, 0, newColumn);

        // Add cell to each row
        sheet.rows.forEach((row) => {
          row.cells[newColumnId] = {
            id: generateCellId(row.id, newColumnId),
            rowId: row.id,
            columnId: newColumnId,
            value: null,
            type: 'text',
          };
        });

        // Update indices
        sheet.columns.forEach((col, idx) => {
          col.index = idx;
        });
        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      });

      // Add to history with full column object
      const addedSheet = get().sheets.find((s) => s.id === sheetId);
      const addedColumn = addedSheet?.columns.find((c) => c.id === newColumnId);
      if (addedColumn) {
        get().addHistory({
          type: 'column',
          action: 'add',
          sheetId,
          after: { ...addedColumn }, // Store full column object for redo
        });
      }
    },

    removeColumn: (sheetId, columnId) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const index = sheet.columns.findIndex((c) => c.id === columnId);
        if (index !== -1) {
          sheet.columns.splice(index, 1);
          // Remove cell from each row
          sheet.rows.forEach((row) => {
            delete row.cells[columnId];
          });
          // Update indices
          sheet.columns.forEach((col, idx) => {
            col.index = idx;
          });
          sheet.updatedAt = new Date();
        }
      }),

    updateColumn: (sheetId, columnId, updates) => {
      // Save before state for history
      const sheet = get().sheets.find((s) => s.id === sheetId);
      if (!sheet) return;

      const column = sheet.columns.find((c) => c.id === columnId);
      if (!column) return;

      const beforeColumn = { ...column };

      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const column = sheet.columns.find((c) => c.id === columnId);
        if (column) {
          // If type is being updated, also update all cells in this column
          if (updates.type && updates.type !== column.type) {
            sheet.rows.forEach((row) => {
              const cell = row.cells[columnId];
              if (cell) {
                cell.type = updates.type as CellType;
                // Clear formula if changing from formula type
                if (column.type === 'formula' && updates.type !== 'formula') {
                  cell.formula = undefined;
                }
              }
            });
          }

          Object.assign(column, updates);
          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;
        }
      });

      // Get the updated column for after state
      const afterSheet = get().sheets.find((s) => s.id === sheetId);
      const afterColumn = afterSheet?.columns.find((c) => c.id === columnId);

      // Add to history only for name changes (important changes)
      if (updates.name !== undefined && afterColumn) {
        get().addHistory({
          type: 'column',
          action: 'update',
          sheetId,
          before: beforeColumn,
          after: { ...afterColumn },
        });
      }

      get()._triggerAutoSave();
    },

    resizeColumn: (sheetId, columnId, width) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const column = sheet.columns.find((c) => c.id === columnId);
        if (column) {
          column.width = width;
          sheet.updatedAt = new Date();
        }
      }),

    // Cell management
    updateCell: (sheetId, rowId, columnId, value) => {
      // Save before state for history
      const sheet = get().sheets.find((s) => s.id === sheetId);
      if (!sheet) return;

      const row = sheet.rows.find((r) => r.id === rowId);
      if (!row || !row.cells[columnId]) return;

      const beforeCell = { ...row.cells[columnId] };

      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const row = sheet.rows.find((r) => r.id === rowId);
        if (row && row.cells[columnId]) {
          const cell = row.cells[columnId];
          const cellId = generateCellId(rowId, columnId);

          // Check if value is a formula (starts with '=')
          if (typeof value === 'string' && value.startsWith('=')) {
            cell.formula = value;
            try {
              // Evaluate formula
              const result = formulaEvaluator.evaluate(cellId, value, sheet);
              cell.value = result;

              // Cache the result
              formulaCache.set(cellId, result);

              // Update cell type based on result
              if (typeof result === 'number') {
                cell.type = 'number';
              } else if (typeof result === 'boolean') {
                cell.type = 'boolean';
              } else if (result instanceof Date) {
                cell.type = 'date';
              } else {
                cell.type = 'text';
              }
            } catch (error) {
              // If formula evaluation fails, show error
              cell.value = `#ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
              cell.type = 'text';
            }
          } else {
            // Regular value (not a formula)
            cell.formula = undefined;
            cell.value = value;

            // Invalidate cache for this cell
            formulaCache.invalidate(cellId);
          }

          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;

          // Recalculate dependent cells
          get()._recalculateDependents(sheetId, cellId);
        }
      });

      // Get the updated cell for after state
      const afterSheet = get().sheets.find((s) => s.id === sheetId);
      const afterRow = afterSheet?.rows.find((r) => r.id === rowId);
      const afterCell = afterRow?.cells[columnId];

      // Add to history
      get().addHistory({
        type: 'cell',
        action: 'update',
        sheetId,
        before: beforeCell, // Store the entire cell object (has rowId, columnId already)
        after: afterCell ? { ...afterCell } : undefined, // Store after state for redo
      });

      get()._triggerAutoSave();
    },

    updateCells: (sheetId, updates) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        updates.forEach(({ rowId, columnId, value }) => {
          const row = sheet.rows.find((r) => r.id === rowId);
          if (row && row.cells[columnId]) {
            row.cells[columnId].value = value;
          }
        });
        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      });
      get()._triggerAutoSave();
    },

    clearCell: (sheetId, rowId, columnId) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const row = sheet.rows.find((r) => r.id === rowId);
        if (row && row.cells[columnId]) {
          row.cells[columnId].value = null;
          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;
        }
      });
      get()._triggerAutoSave();
    },

    // Cell styling
    applyCellStyle: (sheetId, selection, style) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        // Apply style to all cells in selection range
        for (
          let rowIndex = selection.startRow;
          rowIndex <= selection.endRow;
          rowIndex++
        ) {
          const row = sheet.rows[rowIndex];
          if (!row) continue;

          for (
            let colIndex = selection.startColumn;
            colIndex <= selection.endColumn;
            colIndex++
          ) {
            const column = sheet.columns[colIndex];
            if (!column) continue;

            const cell = row.cells[column.id];
            if (cell) {
              cell.style = {
                ...cell.style,
                ...style,
              };
            }
          }
        }

        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      });
      get()._triggerAutoSave();
    },

    applyStyleToMultiSelection: (sheetId, style) => {
      const ranges = get().getAllSelectedRanges();

      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        // Apply style to all cells in all selected ranges
        ranges.forEach((selection) => {
          for (
            let rowIndex = selection.startRow;
            rowIndex <= selection.endRow;
            rowIndex++
          ) {
            const row = sheet.rows[rowIndex];
            if (!row) continue;

            for (
              let colIndex = selection.startColumn;
              colIndex <= selection.endColumn;
              colIndex++
            ) {
              const column = sheet.columns[colIndex];
              if (!column) continue;

              const cell = row.cells[column.id];
              if (cell) {
                cell.style = {
                  ...cell.style,
                  ...style,
                };
              }
            }
          }
        });

        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      });
      get()._triggerAutoSave();
    },

    updateCellStyle: (sheetId, rowId, columnId, style) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const row = sheet.rows.find((r) => r.id === rowId);
        if (row && row.cells[columnId]) {
          row.cells[columnId].style = {
            ...row.cells[columnId].style,
            ...style,
          };
          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;
        }
      });
      get()._triggerAutoSave();
    },

    // Conditional formatting
    addConditionalFormat: (sheetId, format) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        if (!sheet.conditionalFormats) {
          sheet.conditionalFormats = [];
        }

        sheet.conditionalFormats.push(format);
        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      });
      get()._triggerAutoSave();
    },

    removeConditionalFormat: (sheetId, formatId) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet || !sheet.conditionalFormats) return;

        const index = sheet.conditionalFormats.findIndex(
          (f) => f.id === formatId
        );
        if (index !== -1) {
          sheet.conditionalFormats.splice(index, 1);
          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;
        }
      });
      get()._triggerAutoSave();
    },

    updateConditionalFormat: (sheetId, formatId, updates) => {
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet || !sheet.conditionalFormats) return;

        const format = sheet.conditionalFormats.find((f) => f.id === formatId);
        if (format) {
          Object.assign(format, updates);
          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;
        }
      });
      get()._triggerAutoSave();
    },

    // Selection
    setSelection: (range) =>
      set((state) => {
        state.selection = range;
      }),

    clearSelection: () =>
      set((state) => {
        state.selection = null;
      }),

    setMultiSelection: (ranges) =>
      set((state) => {
        state.multiSelection = ranges;
      }),

    addSelectionRange: (range) =>
      set((state) => {
        state.multiSelection.push(range);
      }),

    removeSelectionRange: (index) =>
      set((state) => {
        if (index >= 0 && index < state.multiSelection.length) {
          state.multiSelection.splice(index, 1);
        }
      }),

    clearMultiSelection: () =>
      set((state) => {
        state.multiSelection = [];
      }),

    getAllSelectedRanges: () => {
      const state = get();
      const ranges: SelectionRange[] = [];

      // 주 선택 영역 추가
      if (state.selection) {
        ranges.push(state.selection);
      }

      // 다중 선택 영역들 추가
      ranges.push(...state.multiSelection);

      return ranges;
    },

    // Cell merging
    mergeCells: (sheetId, selection) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        const { startRow, endRow, startColumn, endColumn } = selection;

        // Validate selection (must be at least 2x1 or 1x2)
        if (startRow === endRow && startColumn === endColumn) {
          console.warn('Cannot merge a single cell');
          return;
        }

        // Check if any cell in the range is already part of a merged cell
        if (sheet.mergedCells) {
          for (
            let rowIdx = startRow;
            rowIdx <= endRow;
            rowIdx++
          ) {
            for (
              let colIdx = startColumn;
              colIdx <= endColumn;
              colIdx++
            ) {
              const existingMerge = sheet.mergedCells.find(
                (mc) =>
                  rowIdx >= mc.startRow &&
                  rowIdx <= mc.endRow &&
                  colIdx >= mc.startColumn &&
                  colIdx <= mc.endColumn
              );
              if (existingMerge) {
                console.warn('Selection overlaps with existing merged cell');
                return;
              }
            }
          }
        }

        // Get value from top-left cell
        const topLeftRow = sheet.rows[startRow];
        const topLeftColumnId = sheet.columns[startColumn]?.id;
        const topLeftCell = topLeftRow?.cells[topLeftColumnId];
        const mergedValue = topLeftCell?.value ?? null;

        // Create merged cell
        const mergedCell: MergedCell = {
          id: `merge-${Date.now()}`,
          startRow,
          endRow,
          startColumn,
          endColumn,
          value: mergedValue,
        };

        // Add to sheet
        if (!sheet.mergedCells) {
          sheet.mergedCells = [];
        }
        sheet.mergedCells.push(mergedCell);

        // Mark as unsaved
        state.hasUnsavedChanges = true;
        state.updatedAt = new Date();
      }),

    unmergeCells: (sheetId, mergedCellId) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet || !sheet.mergedCells) return;

        // Remove merged cell
        sheet.mergedCells = sheet.mergedCells.filter(
          (mc) => mc.id !== mergedCellId
        );

        // Mark as unsaved
        state.hasUnsavedChanges = true;
        state.updatedAt = new Date();
      }),

    getMergedCell: (sheetId, rowIndex, columnIndex) => {
      const state = get();
      const sheet = state.sheets.find((s) => s.id === sheetId);
      if (!sheet || !sheet.mergedCells) return undefined;

      return sheet.mergedCells.find(
        (mc) =>
          rowIndex >= mc.startRow &&
          rowIndex <= mc.endRow &&
          columnIndex >= mc.startColumn &&
          columnIndex <= mc.endColumn
      );
    },

    // Clipboard operations
    copySelection: async () => {
      const state = get();
      const sheet = state.getActiveSheet();
      const selection = state.selection;

      if (!sheet || !selection) {
        console.warn('No selection to copy');
        return false;
      }

      try {
        // Extract selected cells
        const cells: Cell[][] = [];

        for (
          let rowIndex = selection.startRow;
          rowIndex <= selection.endRow;
          rowIndex++
        ) {
          const row = sheet.rows[rowIndex];
          if (!row) continue;

          const cellRow: Cell[] = [];

          for (
            let colIndex = selection.startColumn;
            colIndex <= selection.endColumn;
            colIndex++
          ) {
            const column = sheet.columns[colIndex];
            if (!column) continue;

            const cell = row.cells[column.id];
            if (cell) {
              // Create a copy of the cell
              cellRow.push({ ...cell });
            }
          }

          if (cellRow.length > 0) {
            cells.push(cellRow);
          }
        }

        if (cells.length === 0) {
          console.warn('No cells to copy');
          return false;
        }

        // Create clipboard data
        const clipboardData: ClipboardData = {
          cells,
          isCut: false,
        };

        // Create clipboard text (both internal and TSV formats)
        const text = createClipboardText(clipboardData);

        // Write to clipboard
        const success = await writeToClipboard(text);

        if (success) {
          console.log(
            `Copied ${cells.length} rows x ${cells[0].length} columns to clipboard`
          );
        }

        return success;
      } catch (error) {
        console.error('Failed to copy selection:', error);
        return false;
      }
    },

    cutSelection: async () => {
      const state = get();
      const sheet = state.getActiveSheet();
      const selection = state.selection;

      if (!sheet || !selection) {
        console.warn('No selection to cut');
        return false;
      }

      try {
        // Extract selected cells (same as copy)
        const cells: Cell[][] = [];

        for (
          let rowIndex = selection.startRow;
          rowIndex <= selection.endRow;
          rowIndex++
        ) {
          const row = sheet.rows[rowIndex];
          if (!row) continue;

          const cellRow: Cell[] = [];

          for (
            let colIndex = selection.startColumn;
            colIndex <= selection.endColumn;
            colIndex++
          ) {
            const column = sheet.columns[colIndex];
            if (!column) continue;

            const cell = row.cells[column.id];
            if (cell) {
              // Create a copy of the cell
              cellRow.push({ ...cell });
            }
          }

          if (cellRow.length > 0) {
            cells.push(cellRow);
          }
        }

        if (cells.length === 0) {
          console.warn('No cells to cut');
          return false;
        }

        // Create clipboard data with isCut flag
        const clipboardData: ClipboardData = {
          cells,
          isCut: true,
        };

        // Create clipboard text
        const text = createClipboardText(clipboardData);

        // Write to clipboard
        const success = await writeToClipboard(text);

        if (success) {
          // Clear the source cells
          set((state) => {
            const sheet = state.getActiveSheet();
            if (!sheet || !state.selection) return;

            for (
              let rowIndex = state.selection.startRow;
              rowIndex <= state.selection.endRow;
              rowIndex++
            ) {
              const row = sheet.rows[rowIndex];
              if (!row) continue;

              for (
                let colIndex = state.selection.startColumn;
                colIndex <= state.selection.endColumn;
                colIndex++
              ) {
                const column = sheet.columns[colIndex];
                if (!column) continue;

                const cell = row.cells[column.id];
                if (cell) {
                  cell.value = null;
                  cell.formula = undefined;
                  cell.error = undefined;
                }
              }
            }

            sheet.updatedAt = new Date();
            state.hasUnsavedChanges = true;
          });

          // Add to history
          get().addHistory({
            type: 'cell',
            action: 'update',
            sheetId: sheet.id,
            before: { cells: clipboardData.cells },
            after: { cells: [] },
          });

          // Trigger auto-save
          get()._triggerAutoSave();

          console.log(
            `Cut ${cells.length} rows x ${cells[0].length} columns to clipboard`
          );
        }

        return success;
      } catch (error) {
        console.error('Failed to cut selection:', error);
        return false;
      }
    },

    pasteFromClipboard: async () => {
      const state = get();
      const sheet = state.getActiveSheet();
      const selection = state.selection;

      if (!sheet || !selection) {
        console.warn('No selection to paste into');
        return false;
      }

      try {
        // Read from clipboard
        const text = await readFromClipboard();
        if (!text) {
          console.warn('No clipboard data available');
          return false;
        }

        // Parse clipboard text
        const { clipboardData, cellValues, isInternal } =
          parseClipboardText(text);

        // Determine paste starting position
        const startRowIndex = selection.startRow;
        const startColIndex = selection.startColumn;

        // Store original cells for undo
        const originalCells: Cell[][] = [];

        if (isInternal && clipboardData) {
          // Internal paste - preserve all cell properties including styles and formulas
          set((state) => {
            const sheet = state.getActiveSheet();
            if (!sheet) return;

            for (let i = 0; i < clipboardData.cells.length; i++) {
              const targetRowIndex = startRowIndex + i;
              if (targetRowIndex >= sheet.rows.length) break;

              const row = sheet.rows[targetRowIndex];
              if (!row) continue;

              const originalRow: Cell[] = [];

              for (let j = 0; j < clipboardData.cells[i].length; j++) {
                const targetColIndex = startColIndex + j;
                if (targetColIndex >= sheet.columns.length) break;

                const column = sheet.columns[targetColIndex];
                if (!column) continue;

                const targetCell = row.cells[column.id];
                const sourceCell = clipboardData.cells[i][j];

                if (targetCell && sourceCell) {
                  // Store original for undo
                  originalRow.push({ ...targetCell });

                  // Create a copy of the source cell with new IDs
                  const newCell = createCellCopy(sourceCell, row.id, column.id);

                  // Update the target cell
                  row.cells[column.id] = newCell;

                  // If cell has a formula, re-evaluate it in the new context
                  if (newCell.formula) {
                    const cellId = generateCellId(row.id, column.id);
                    try {
                      const result = formulaEvaluator.evaluate(
                        cellId,
                        newCell.formula,
                        sheet
                      );
                      newCell.value = result;
                      formulaCache.set(cellId, result);
                    } catch (error) {
                      newCell.value = `#ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
                      newCell.type = 'text';
                    }
                  }
                }
              }

              if (originalRow.length > 0) {
                originalCells.push(originalRow);
              }
            }

            sheet.updatedAt = new Date();
            state.hasUnsavedChanges = true;
          });
        } else {
          // External paste - only paste values
          set((state) => {
            const sheet = state.getActiveSheet();
            if (!sheet) return;

            for (let i = 0; i < cellValues.length; i++) {
              const targetRowIndex = startRowIndex + i;
              if (targetRowIndex >= sheet.rows.length) break;

              const row = sheet.rows[targetRowIndex];
              if (!row) continue;

              const originalRow: Cell[] = [];

              for (let j = 0; j < cellValues[i].length; j++) {
                const targetColIndex = startColIndex + j;
                if (targetColIndex >= sheet.columns.length) break;

                const column = sheet.columns[targetColIndex];
                if (!column) continue;

                const targetCell = row.cells[column.id];
                const value = cellValues[i][j];

                if (targetCell) {
                  // Store original for undo
                  originalRow.push({ ...targetCell });

                  // Update value (clear formula)
                  targetCell.value = value;
                  targetCell.formula = undefined;
                  targetCell.error = undefined;

                  // Update type based on value
                  if (typeof value === 'number') {
                    targetCell.type = 'number';
                  } else if (typeof value === 'boolean') {
                    targetCell.type = 'boolean';
                  } else if (value instanceof Date) {
                    targetCell.type = 'date';
                  } else {
                    targetCell.type = 'text';
                  }
                }
              }

              if (originalRow.length > 0) {
                originalCells.push(originalRow);
              }
            }

            sheet.updatedAt = new Date();
            state.hasUnsavedChanges = true;
          });
        }

        // Add to history
        get().addHistory({
          type: 'cell',
          action: 'update',
          sheetId: sheet.id,
          before: { cells: originalCells },
          after: { cells: clipboardData?.cells || cellValues },
        });

        // Trigger auto-save
        get()._triggerAutoSave();

        const rowCount = clipboardData?.cells.length || cellValues.length;
        const colCount =
          clipboardData?.cells[0]?.length || cellValues[0]?.length || 0;
        console.log(
          `Pasted ${rowCount} rows x ${colCount} columns from clipboard (${isInternal ? 'internal' : 'external'} format)`
        );

        return true;
      } catch (error) {
        console.error('Failed to paste from clipboard:', error);
        return false;
      }
    },

    // Search and Replace
    searchInCurrentSheet: (searchText, options = {}) => {
      const state = get();
      const sheet = state.getActiveSheet();

      if (!sheet) {
        console.warn('No active sheet');
        return [];
      }

      return searchInSheet(sheet, searchText, options);
    },

    searchInAllSheets: (searchText, options = {}) => {
      const state = get();
      return searchInSheets(state.sheets, searchText, options);
    },

    replaceInSelection: (searchText, replaceText, options = {}) => {
      const state = get();
      const sheet = state.getActiveSheet();
      const selection = state.selection;

      if (!sheet || !selection) {
        console.warn('No selection for replace');
        return 0;
      }

      let replaceCount = 0;
      const beforeCells: Cell[][] = [];
      const afterCells: Cell[][] = [];

      set((state) => {
        const sheet = state.getActiveSheet();
        if (!sheet || !state.selection) return;

        for (
          let rowIndex = state.selection.startRow;
          rowIndex <= state.selection.endRow;
          rowIndex++
        ) {
          const row = sheet.rows[rowIndex];
          if (!row) continue;

          const beforeRow: Cell[] = [];
          const afterRow: Cell[] = [];

          for (
            let colIndex = state.selection.startColumn;
            colIndex <= state.selection.endColumn;
            colIndex++
          ) {
            const column = sheet.columns[colIndex];
            if (!column) continue;

            const cell = row.cells[column.id];
            if (!cell) continue;

            // Store original
            beforeRow.push({ ...cell });

            // Replace
            const newValue = replaceInCell(
              cell,
              searchText,
              replaceText,
              options
            );

            if (newValue !== cell.value) {
              cell.value = newValue;
              cell.formula = undefined; // Clear formula when replacing value
              cell.error = undefined;
              replaceCount++;

              afterRow.push({ ...cell });
            }
          }

          if (beforeRow.length > 0) {
            beforeCells.push(beforeRow);
            afterCells.push(afterRow);
          }
        }

        if (replaceCount > 0) {
          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;
        }
      });

      if (replaceCount > 0) {
        // Add to history
        get().addHistory({
          type: 'cell',
          action: 'update',
          sheetId: sheet.id,
          before: { cells: beforeCells },
          after: { cells: afterCells },
        });

        // Trigger auto-save
        get()._triggerAutoSave();

        console.log(`Replaced ${replaceCount} occurrences in selection`);
      }

      return replaceCount;
    },

    replaceAll: (searchText, replaceText, options = {}) => {
      const state = get();
      const sheet = state.getActiveSheet();

      if (!sheet) {
        console.warn('No active sheet');
        return 0;
      }

      let replaceCount = 0;
      const beforeCells: Cell[][] = [];
      const afterCells: Cell[][] = [];

      set((state) => {
        const sheet = state.getActiveSheet();
        if (!sheet) return;

        sheet.rows.forEach((row) => {
          const beforeRow: Cell[] = [];
          const afterRow: Cell[] = [];

          sheet.columns.forEach((column) => {
            const cell = row.cells[column.id];
            if (!cell) return;

            // Store original
            beforeRow.push({ ...cell });

            // Replace
            const newValue = replaceInCell(
              cell,
              searchText,
              replaceText,
              options
            );

            if (newValue !== cell.value) {
              cell.value = newValue;
              cell.formula = undefined;
              cell.error = undefined;
              replaceCount++;

              afterRow.push({ ...cell });
            }
          });

          if (beforeRow.length > 0) {
            beforeCells.push(beforeRow);
            afterCells.push(afterRow);
          }
        });

        if (replaceCount > 0) {
          sheet.updatedAt = new Date();
          state.hasUnsavedChanges = true;
        }
      });

      if (replaceCount > 0) {
        // Add to history
        get().addHistory({
          type: 'cell',
          action: 'update',
          sheetId: sheet.id,
          before: { cells: beforeCells },
          after: { cells: afterCells },
        });

        // Trigger auto-save
        get()._triggerAutoSave();

        console.log(`Replaced ${replaceCount} occurrences in sheet`);
      }

      return replaceCount;
    },

    // History
    addHistory: (entry) =>
      set((state) => {
        const historyEntry: HistoryEntry = {
          ...entry,
          id: `history-${Date.now()}`,
          timestamp: new Date(),
        };

        // Remove future history if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
          state.history.splice(state.historyIndex + 1);
        }

        state.history.push(historyEntry);
        state.historyIndex = state.history.length - 1;

        // Limit history size
        if (state.history.length > 100) {
          state.history.shift();
          state.historyIndex--;
        }
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex < 0 || state.history.length === 0) {
          console.log('Nothing to undo');
          return;
        }

        const entry = state.history[state.historyIndex];
        const sheet = state.sheets.find((s) => s.id === entry.sheetId);
        if (!sheet) return;

        // Apply reverse action
        switch (entry.type) {
          case 'cell':
            if (entry.action === 'update' && entry.before) {
              const cellData = entry.before as any;
              const row = sheet.rows.find((r) => r.id === cellData.rowId);
              if (row && row.cells[cellData.columnId]) {
                row.cells[cellData.columnId] = cellData;
              }
            }
            break;

          case 'row':
            if (entry.action === 'add' && entry.after) {
              // Remove added row
              const rowData = entry.after as any;
              const rowIndex = sheet.rows.findIndex((r) => r.id === rowData.id);
              if (rowIndex !== -1) {
                sheet.rows.splice(rowIndex, 1);
              }
            } else if (entry.action === 'delete' && entry.before) {
              // Restore deleted row
              const rowData = entry.before as any;
              sheet.rows.push(rowData);
            }
            break;

          case 'column':
            if (entry.action === 'add' && entry.after) {
              // Remove added column
              const colData = entry.after as any;
              const colIndex = sheet.columns.findIndex(
                (c) => c.id === colData.id
              );
              if (colIndex !== -1) {
                sheet.columns.splice(colIndex, 1);
                // Remove column from all rows
                sheet.rows.forEach((row) => {
                  delete row.cells[colData.id];
                });
              }
            } else if (entry.action === 'delete' && entry.before) {
              // Restore deleted column
              const colData = entry.before as any;
              sheet.columns.push(colData.column);
              // Restore cells
              Object.entries(colData.cells || {}).forEach(([rowId, cell]) => {
                const row = sheet.rows.find((r) => r.id === rowId);
                if (row) {
                  row.cells[colData.column.id] = cell as Cell;
                }
              });
            } else if (entry.action === 'update' && entry.before) {
              // Restore column state (for name changes, etc.)
              const colData = entry.before as any;
              const column = sheet.columns.find((c) => c.id === colData.id);
              if (column) {
                Object.assign(column, colData);
              }
            }
            break;

          case 'sheet':
            if (entry.action === 'add' && entry.after) {
              // Remove added sheet
              const sheetData = entry.after as any;
              const sheetIndex = state.sheets.findIndex(
                (s) => s.id === sheetData.id
              );
              if (sheetIndex !== -1) {
                state.sheets.splice(sheetIndex, 1);
              }
            } else if (entry.action === 'delete' && entry.before) {
              // Restore deleted sheet
              const sheetData = entry.before as any;
              state.sheets.push(sheetData);
            }
            break;
        }

        state.historyIndex--;
        state.hasUnsavedChanges = true;
      }),

    redo: () =>
      set((state) => {
        if (
          state.historyIndex >= state.history.length - 1 ||
          state.history.length === 0
        ) {
          console.log('Nothing to redo');
          return;
        }

        const entry = state.history[state.historyIndex + 1];
        const sheet = state.sheets.find((s) => s.id === entry.sheetId);
        if (!sheet) return;

        // Apply forward action
        switch (entry.type) {
          case 'cell':
            if (entry.action === 'update' && entry.after) {
              const cellData = entry.after as any;
              const row = sheet.rows.find((r) => r.id === cellData.rowId);
              if (row && row.cells[cellData.columnId]) {
                row.cells[cellData.columnId] = cellData;
              }
            }
            break;

          case 'row':
            if (entry.action === 'add' && entry.after) {
              // Re-add row
              const rowData = entry.after as any;
              sheet.rows.push(rowData);
            } else if (entry.action === 'delete' && entry.after) {
              // Re-delete row
              const rowData = entry.after as any;
              const rowIndex = sheet.rows.findIndex((r) => r.id === rowData.id);
              if (rowIndex !== -1) {
                sheet.rows.splice(rowIndex, 1);
              }
            }
            break;

          case 'column':
            if (entry.action === 'add' && entry.after) {
              // Re-add column
              const colData = entry.after as any;
              sheet.columns.push(colData);
            } else if (entry.action === 'delete' && entry.after) {
              // Re-delete column
              const colData = entry.after as any;
              const colIndex = sheet.columns.findIndex(
                (c) => c.id === colData.id
              );
              if (colIndex !== -1) {
                sheet.columns.splice(colIndex, 1);
                // Remove column from all rows
                sheet.rows.forEach((row) => {
                  delete row.cells[colData.id];
                });
              }
            } else if (entry.action === 'update' && entry.after) {
              // Restore column state (for name changes, etc.)
              const colData = entry.after as any;
              const column = sheet.columns.find((c) => c.id === colData.id);
              if (column) {
                Object.assign(column, colData);
              }
            }
            break;

          case 'sheet':
            if (entry.action === 'add' && entry.after) {
              // Re-add sheet
              const sheetData = entry.after as any;
              state.sheets.push(sheetData);
            } else if (entry.action === 'delete' && entry.after) {
              // Re-delete sheet
              const sheetData = entry.after as any;
              const sheetIndex = state.sheets.findIndex(
                (s) => s.id === sheetData.id
              );
              if (sheetIndex !== -1) {
                state.sheets.splice(sheetIndex, 1);
              }
            }
            break;
        }

        state.historyIndex++;
        state.hasUnsavedChanges = true;
      }),

    // Utility
    getActiveSheet: () => {
      const state = get();
      return state.sheets.find((s) => s.id === state.activeSheetId);
    },

    getCell: (sheetId, rowId, columnId) => {
      const state = get();
      const sheet = state.sheets.find((s) => s.id === sheetId);
      if (!sheet) return undefined;

      const row = sheet.rows.find((r) => r.id === rowId);
      return row?.cells[columnId];
    },

    sortSheet: (sheetId, config) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) return;

        sheet.rows.sort((a, b) => {
          const aCell = a.cells[config.columnId];
          const bCell = b.cells[config.columnId];
          return compareCellValues(
            aCell?.value,
            bCell?.value,
            config.direction
          );
        });

        // Update indices
        sheet.rows.forEach((row, idx) => {
          row.index = idx;
        });
        sheet.updatedAt = new Date();
      }),

    filterSheet: (sheetId, filters) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) {
          console.error(`Sheet ${sheetId} not found`);
          return;
        }

        // Store filters in sheet
        sheet.filters = filters.length > 0 ? filters : undefined;

        // Helper function to check if a cell value matches a filter
        const matchesFilter = (
          cellValue: CellValue,
          filter: FilterConfig
        ): boolean => {
          const { operator, value } = filter;

          // Handle null/undefined values
          if (cellValue === null || cellValue === undefined) {
            return (
              operator === 'equals' && (value === null || value === undefined)
            );
          }

          switch (operator) {
            case 'equals':
              return cellValue === value;
            case 'contains':
              return String(cellValue)
                .toLowerCase()
                .includes(String(value).toLowerCase());
            case 'startsWith':
              return String(cellValue)
                .toLowerCase()
                .startsWith(String(value).toLowerCase());
            case 'endsWith':
              return String(cellValue)
                .toLowerCase()
                .endsWith(String(value).toLowerCase());
            case 'greaterThan':
              return Number(cellValue) > Number(value);
            case 'lessThan':
              return Number(cellValue) < Number(value);
            default:
              return true;
          }
        };

        // Apply filters to rows
        sheet.rows.forEach((row) => {
          if (filters.length === 0) {
            // No filters - show all rows
            row.hidden = false;
          } else {
            // Check if row matches ALL filters (AND logic)
            const matchesAllFilters = filters.every((filter) => {
              const cell = row.cells[filter.columnId];
              return cell && matchesFilter(cell.value, filter);
            });

            // Hide row if it doesn't match all filters
            row.hidden = !matchesAllFilters;
          }
        });

        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      }),

    clearFilters: (sheetId) =>
      set((state) => {
        const sheet = state.sheets.find((s) => s.id === sheetId);
        if (!sheet) {
          console.error(`Sheet ${sheetId} not found`);
          return;
        }

        // Clear filters from sheet
        sheet.filters = undefined;

        // Show all rows
        sheet.rows.forEach((row) => {
          row.hidden = false;
        });

        sheet.updatedAt = new Date();
        state.hasUnsavedChanges = true;
      }),

    // Persistence methods
    initDB: async () => {
      await dbService.init();
    },

    saveSpreadsheet: async () => {
      set((state) => {
        state.saving = true;
      });

      try {
        const state = get();
        const spreadsheet: Spreadsheet = {
          id: state.spreadsheetId,
          name: state.spreadsheetName,
          sheets: state.sheets,
          activeSheetId: state.activeSheetId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await dbService.save(spreadsheet);

        set((state) => {
          state.saving = false;
          state.lastSaved = new Date();
          state.hasUnsavedChanges = false;
        });
      } catch (error) {
        console.error('Failed to save spreadsheet:', error);
        set((state) => {
          state.saving = false;
        });
      }
    },

    loadSpreadsheet: async (id: string) => {
      try {
        const spreadsheet = await dbService.load(id);
        if (spreadsheet) {
          set((state) => {
            state.spreadsheetId = spreadsheet.id;
            state.spreadsheetName = spreadsheet.name;
            state.sheets = spreadsheet.sheets;
            state.activeSheetId = spreadsheet.activeSheetId;
            state.lastSaved = spreadsheet.updatedAt;
            state.hasUnsavedChanges = false;
          });
        }
      } catch (error) {
        console.error('Failed to load spreadsheet:', error);
      }
    },

    loadBackup: async () => {
      try {
        const state = get();
        const backup = await dbService.getAutoSaveBackup(state.spreadsheetId);
        if (backup) {
          set((state) => {
            state.sheets = backup.sheets;
            state.activeSheetId = backup.activeSheetId;
            state.hasUnsavedChanges = true;
          });
        }
      } catch (error) {
        console.error('Failed to load backup:', error);
      }
    },

    setSpreadsheetName: (name: string) => {
      set((state) => {
        state.spreadsheetName = name;
        state.hasUnsavedChanges = true;
      });
      get()._triggerAutoSave();
    },

    _triggerAutoSave: () => {
      const state = get();
      set({ saving: true });
      debouncedAutoSave(state);
    },

    _recalculateDependents: (sheetId, cellId) => {
      const state = get();
      const sheet = state.sheets.find((s) => s.id === sheetId);
      if (!sheet) return;

      // Get all cells that depend on this cell
      const dependents = formulaEvaluator.getDependents(cellId);

      // Recalculate each dependent cell
      dependents.forEach((dependentCellId) => {
        // Parse cellId to get row and column
        const [rowId, columnId] = dependentCellId.split(':');
        const row = sheet.rows.find((r) => r.id === rowId);
        if (!row || !row.cells[columnId]) return;

        const cell = row.cells[columnId];
        if (!cell.formula) return;

        try {
          // Re-evaluate the formula
          const result = formulaEvaluator.evaluate(
            dependentCellId,
            cell.formula,
            sheet
          );

          set((state) => {
            const sheet = state.sheets.find((s) => s.id === sheetId);
            if (!sheet) return;

            const row = sheet.rows.find((r) => r.id === rowId);
            if (!row || !row.cells[columnId]) return;

            row.cells[columnId].value = result;

            // Update cell type based on result
            if (typeof result === 'number') {
              row.cells[columnId].type = 'number';
            } else if (typeof result === 'boolean') {
              row.cells[columnId].type = 'boolean';
            } else if (result instanceof Date) {
              row.cells[columnId].type = 'date';
            } else {
              row.cells[columnId].type = 'text';
            }
          });

          // Update cache
          formulaCache.set(dependentCellId, result);

          // Recursively recalculate cells that depend on this dependent cell
          get()._recalculateDependents(sheetId, dependentCellId);
        } catch (error) {
          // If recalculation fails, show error
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === sheetId);
            if (!sheet) return;

            const row = sheet.rows.find((r) => r.id === rowId);
            if (!row || !row.cells[columnId]) return;

            row.cells[columnId].value =
              `#ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
            row.cells[columnId].type = 'text';
          });
        }
      });
    },
  }))
);
