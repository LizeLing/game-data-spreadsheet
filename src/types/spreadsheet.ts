/**
 * Spreadsheet Core Types
 * 스프레드시트의 핵심 타입 정의
 */

// Cell Value Types
export type CellValue = string | number | boolean | Date | null;

export type CellType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'formula'
  | 'select'
  | 'multiselect';

// Border Style
export interface BorderStyle {
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted' | 'double';
  color?: string;
}

// Cell Style
export interface CellStyle {
  // Font
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';

  // Color
  color?: string;
  backgroundColor?: string;

  // Alignment
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';

  // Border
  border?: {
    top?: BorderStyle;
    right?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
  };

  // Number format
  numberFormat?: string;
}

// Conditional Format
export interface ConditionalFormat {
  id: string;
  range: SelectionRange;
  condition: {
    type: 'value' | 'formula' | 'text';
    operator:
      | 'equals'
      | 'greaterThan'
      | 'lessThan'
      | 'between'
      | 'contains'
      | 'notEquals'
      | 'greaterThanOrEqual'
      | 'lessThanOrEqual';
    value: CellValue | CellValue[];
    formula?: string;
  };
  style: CellStyle;
  priority: number;
}

// Validation Rule
export interface ValidationRule {
  type: 'required' | 'range' | 'regex' | 'custom' | 'unique';
  params?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
    validator?: (value: CellValue) => boolean;
  };
  message?: string;
}

// Cell
export interface Cell {
  id: string; // rowId:columnId
  rowId: string;
  columnId: string;
  value: CellValue;
  type: CellType;
  formula?: string;
  style?: CellStyle;
  validation?: ValidationRule;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Column
export interface Column {
  id: string;
  name: string;
  type: CellType;
  width?: number;
  frozen?: boolean;
  hidden?: boolean;
  index: number;
  validation?: ValidationRule;
  options?: string[]; // For select/multiselect types
}

// Row
export interface Row {
  id: string;
  index: number;
  cells: Record<string, Cell>; // columnId -> Cell
  height?: number;
  hidden?: boolean;
  metadata?: Record<string, unknown>;
}

// Merged Cell
export interface MergedCell {
  id: string;
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  value: CellValue;
}

// Sheet
export interface Sheet {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
  frozenRows?: number;
  frozenColumns?: number;
  conditionalFormats?: ConditionalFormat[];
  filters?: FilterConfig[];
  mergedCells?: MergedCell[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Spreadsheet
export interface Spreadsheet {
  id: string;
  name: string;
  sheets: Sheet[];
  activeSheetId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Selection Range
export interface SelectionRange {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

// Multi Selection - 여러 개의 셀 범위를 동시에 선택
export interface MultiSelection {
  ranges: SelectionRange[];
  primary?: SelectionRange; // 주 선택 영역 (포커스된 영역)
}

// History Entry (for undo/redo)
export interface HistoryEntry {
  id: string;
  timestamp: Date;
  type: 'cell' | 'row' | 'column' | 'sheet';
  action: 'add' | 'update' | 'delete';
  before?: unknown;
  after?: unknown;
  sheetId: string;
}

// Sort Configuration
export interface SortConfig {
  columnId: string;
  direction: 'asc' | 'desc';
}

// Filter Configuration
export interface FilterConfig {
  columnId: string;
  operator:
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan';
  value: CellValue;
}

// Persistence Types
export interface SpreadsheetMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoSaveBackup {
  spreadsheetId: string;
  data: Spreadsheet;
  timestamp: Date;
}
