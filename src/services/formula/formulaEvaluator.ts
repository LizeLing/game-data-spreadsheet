/**
 * Formula Evaluator
 * 수식 평가 및 의존성 관리
 */

import type { CellValue, Sheet, Cell } from '@types';
import { FormulaParser, type FormulaAST } from './formulaParser';
import { FORMULA_FUNCTIONS } from './formulaFunctions';

export class FormulaEvaluator {
  private parser: FormulaParser;
  private dependencies: Map<string, Set<string>>; // cellId -> dependent cellIds
  private evaluating: Set<string>; // Track cells being evaluated to detect circular refs

  constructor() {
    this.parser = new FormulaParser();
    this.dependencies = new Map();
    this.evaluating = new Set();
  }

  /**
   * Evaluate formula for a cell
   */
  evaluate(cellId: string, formula: string, sheet: Sheet): CellValue {
    try {
      // Check for circular reference before evaluation
      if (this.evaluating.has(cellId)) {
        throw new Error('Circular reference detected');
      }

      this.evaluating.add(cellId);

      // Parse formula
      const ast = this.parser.parse(formula);

      // Extract references and update dependencies
      const refs = this.parser.extractReferences(ast);
      this.updateDependencies(cellId, refs);

      // Detect circular references using DFS
      if (this.hasCircularReference(cellId)) {
        throw new Error('Circular reference detected');
      }

      // Evaluate AST
      const result = this.evaluateAST(ast, sheet);

      // Result should be a single value, not an array
      // Arrays are only valid within function arguments
      if (Array.isArray(result)) {
        throw new Error('Range cannot be used as a standalone expression');
      }

      this.evaluating.delete(cellId);
      return result;
    } catch (error) {
      this.evaluating.delete(cellId);
      throw error;
    }
  }

  /**
   * Evaluate AST node
   */
  private evaluateAST(node: FormulaAST, sheet: Sheet): CellValue | CellValue[] {
    switch (node.type) {
      case 'literal':
        return node.value;

      case 'cell':
        return this.evaluateCell(node.value as string, sheet);

      case 'range':
        return this.evaluateRange(node.value as string, sheet);

      case 'operator':
        return this.evaluateOperator(node, sheet);

      case 'unary':
        return this.evaluateUnary(node, sheet);

      case 'function':
        return this.evaluateFunction(node, sheet);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Evaluate cell reference
   */
  private evaluateCell(cellRef: string, sheet: Sheet): CellValue {
    const cell = this.getCellByReference(cellRef, sheet);
    if (!cell) return null;

    // If cell has formula, evaluate it recursively
    if (cell.formula) {
      return this.evaluate(cell.id, cell.formula, sheet);
    }

    return cell.value;
  }

  /**
   * Evaluate range reference
   */
  private evaluateRange(range: string, sheet: Sheet): CellValue[] {
    const cellRefs = this.parser['expandRange'](range);
    return cellRefs.map((ref) => this.evaluateCell(ref, sheet));
  }

  /**
   * Evaluate operator
   */
  private evaluateOperator(node: FormulaAST, sheet: Sheet): CellValue {
    if (!node.children || node.children.length !== 2) {
      throw new Error('Operator requires two operands');
    }

    const left = this.evaluateAST(node.children[0], sheet);
    const right = this.evaluateAST(node.children[1], sheet);

    const op = node.operator || node.value;

    switch (op) {
      case '+':
        return this.toNumber(left) + this.toNumber(right);
      case '-':
        return this.toNumber(left) - this.toNumber(right);
      case '*':
        return this.toNumber(left) * this.toNumber(right);
      case '/': {
        const divisor = this.toNumber(right);
        if (divisor === 0) throw new Error('Division by zero');
        return this.toNumber(left) / divisor;
      }
      case '^':
        return Math.pow(this.toNumber(left), this.toNumber(right));
      case '&':
        return String(left ?? '') + String(right ?? '');
      case '=':
        return left === right;
      case '<>':
        return left !== right;
      case '>':
        return this.toNumber(left) > this.toNumber(right);
      case '<':
        return this.toNumber(left) < this.toNumber(right);
      case '>=':
        return this.toNumber(left) >= this.toNumber(right);
      case '<=':
        return this.toNumber(left) <= this.toNumber(right);
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }

  /**
   * Evaluate unary operator
   */
  private evaluateUnary(node: FormulaAST, sheet: Sheet): CellValue {
    if (!node.children || node.children.length !== 1) {
      throw new Error('Unary operator requires one operand');
    }

    const operand = this.evaluateAST(node.children[0], sheet);
    const op = node.operator || node.value;

    switch (op) {
      case '-':
        return -this.toNumber(operand);
      case '+':
        return this.toNumber(operand);
      default:
        throw new Error(`Unknown unary operator: ${op}`);
    }
  }

  /**
   * Evaluate function
   */
  private evaluateFunction(node: FormulaAST, sheet: Sheet): CellValue {
    const funcName = (node.value as string).toUpperCase();
    const func = FORMULA_FUNCTIONS[funcName];

    if (!func) {
      throw new Error(`Unknown function: ${funcName}`);
    }

    // Evaluate arguments
    const args = (node.children || []).map((child) =>
      this.evaluateAST(child, sheet)
    );

    // Call function
    return func(...args);
  }

  /**
   * Get cell by A1 reference
   */
  private getCellByReference(cellRef: string, sheet: Sheet): Cell | undefined {
    const colMatch = cellRef.match(/[A-Z]+/);
    const rowMatch = cellRef.match(/\d+/);

    if (!colMatch || !rowMatch) return undefined;

    const colLetter = colMatch[0];
    const rowNum = parseInt(rowMatch[0]);

    const colIndex = this.columnToIndex(colLetter);
    const rowIndex = rowNum - 1; // A1 = row 0

    const column = sheet.columns[colIndex];
    const row = sheet.rows[rowIndex];

    if (!column || !row) return undefined;

    return row.cells[column.id];
  }

  /**
   * Update dependencies for a cell
   */
  private updateDependencies(cellId: string, refs: string[]): void {
    // Clear old dependencies for this cell
    this.dependencies.forEach((deps) => deps.delete(cellId));

    // Add new dependencies
    for (const ref of refs) {
      if (!this.dependencies.has(ref)) {
        this.dependencies.set(ref, new Set());
      }
      this.dependencies.get(ref)!.add(cellId);
    }
  }

  /**
   * Detect circular reference using DFS
   */
  private hasCircularReference(cellId: string): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (id: string): boolean => {
      visited.add(id);
      recStack.add(id);

      const deps = this.dependencies.get(id) || new Set();
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (dfs(dep)) return true;
        } else if (recStack.has(dep)) {
          return true; // Cycle detected
        }
      }

      recStack.delete(id);
      return false;
    };

    return dfs(cellId);
  }

  /**
   * Get all cells that depend on a given cell
   */
  getDependents(cellId: string): Set<string> {
    return this.dependencies.get(cellId) || new Set();
  }

  /**
   * Clear all dependencies
   */
  clearDependencies(): void {
    this.dependencies.clear();
  }

  /**
   * Convert value to number
   */
  private toNumber(value: CellValue | CellValue[]): number {
    // Reject arrays - they should only be used in functions
    if (Array.isArray(value)) {
      throw new Error('Cannot use range in this context');
    }

    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * Convert column letter to index (A=0, B=1, Z=25, AA=26)
   */
  private columnToIndex(col: string): number {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return index - 1;
  }
}

/**
 * Singleton instance
 */
export const formulaEvaluator = new FormulaEvaluator();
