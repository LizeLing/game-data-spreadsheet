/**
 * Formula Parser
 * 수식을 파싱하여 AST(Abstract Syntax Tree)로 변환
 */

export type ASTNodeType =
  | 'function'
  | 'operator'
  | 'cell'
  | 'range'
  | 'literal'
  | 'unary';

export interface FormulaAST {
  type: ASTNodeType;
  value: string | number | boolean;
  children?: FormulaAST[];
  operator?: string;
}

export interface Token {
  type:
    | 'function'
    | 'cell'
    | 'range'
    | 'number'
    | 'string'
    | 'operator'
    | 'lparen'
    | 'rparen'
    | 'comma'
    | 'boolean';
  value: string;
}

export class FormulaParser {
  private tokens: Token[] = [];
  private position: number = 0;

  /**
   * 수식 파싱
   */
  parse(formula: string): FormulaAST {
    // Remove leading '=' if present
    const cleanFormula = formula.trim().startsWith('=')
      ? formula.trim().substring(1)
      : formula.trim();

    this.tokens = this.tokenize(cleanFormula);
    this.position = 0;

    return this.parseExpression();
  }

  /**
   * 토큰화
   */
  private tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers
      if (/\d/.test(char) || (char === '.' && /\d/.test(formula[i + 1]))) {
        let num = '';
        while (
          i < formula.length &&
          (/\d/.test(formula[i]) || formula[i] === '.')
        ) {
          num += formula[i];
          i++;
        }
        tokens.push({ type: 'number', value: num });
        continue;
      }

      // Strings (in quotes)
      if (char === '"') {
        let str = '';
        i++; // Skip opening quote
        while (i < formula.length && formula[i] !== '"') {
          str += formula[i];
          i++;
        }
        i++; // Skip closing quote
        tokens.push({ type: 'string', value: str });
        continue;
      }

      // Operators
      if (['+', '-', '*', '/', '^', '>', '<', '=', '&'].includes(char)) {
        let op = char;
        i++;
        // Check for two-character operators
        if (
          i < formula.length &&
          ['=', '>'].includes(char) &&
          formula[i] === '='
        ) {
          op += formula[i];
          i++;
        } else if (
          char === '<' &&
          i < formula.length &&
          (formula[i] === '=' || formula[i] === '>')
        ) {
          op += formula[i];
          i++;
        }
        tokens.push({ type: 'operator', value: op });
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'lparen', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'rparen', value: ')' });
        i++;
        continue;
      }

      // Comma
      if (char === ',') {
        tokens.push({ type: 'comma', value: ',' });
        i++;
        continue;
      }

      // Cell references, ranges, functions, and booleans
      if (/[A-Za-z]/.test(char)) {
        let identifier = '';
        while (i < formula.length && /[A-Za-z0-9_]/.test(formula[i])) {
          identifier += formula[i];
          i++;
        }

        const upperIdent = identifier.toUpperCase();

        // Check for boolean values
        if (upperIdent === 'TRUE' || upperIdent === 'FALSE') {
          tokens.push({ type: 'boolean', value: upperIdent });
          continue;
        }

        // Check if it's a function (followed by '(')
        if (i < formula.length && formula[i] === '(') {
          tokens.push({ type: 'function', value: upperIdent });
          continue;
        }

        // Check for cell range (A1:B2)
        if (i < formula.length && formula[i] === ':') {
          const rangeStart = identifier;
          i++; // Skip ':'
          let rangeEnd = '';
          while (i < formula.length && /[A-Za-z0-9]/.test(formula[i])) {
            rangeEnd += formula[i];
            i++;
          }
          tokens.push({ type: 'range', value: `${rangeStart}:${rangeEnd}` });
          continue;
        }

        // Cell reference
        if (this.isCellReference(identifier)) {
          tokens.push({ type: 'cell', value: identifier.toUpperCase() });
        } else {
          tokens.push({ type: 'function', value: upperIdent });
        }
        continue;
      }

      // Unknown character
      throw new Error(`Unexpected character: ${char}`);
    }

    return tokens;
  }

  /**
   * Parse expression (handles operators)
   */
  private parseExpression(): FormulaAST {
    return this.parseComparison();
  }

  /**
   * Parse comparison operators (=, <>, <, >, <=, >=)
   */
  private parseComparison(): FormulaAST {
    let node = this.parseConcatenation();

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (
        token.type === 'operator' &&
        ['=', '<>', '<', '>', '<=', '>='].includes(token.value)
      ) {
        this.position++;
        const right = this.parseConcatenation();
        node = {
          type: 'operator',
          value: token.value,
          operator: token.value,
          children: [node, right],
        };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Parse concatenation operator (&)
   */
  private parseConcatenation(): FormulaAST {
    let node = this.parseAddSubtract();

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (token.type === 'operator' && token.value === '&') {
        this.position++;
        const right = this.parseAddSubtract();
        node = {
          type: 'operator',
          value: '&',
          operator: '&',
          children: [node, right],
        };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Parse addition and subtraction
   */
  private parseAddSubtract(): FormulaAST {
    let node = this.parseMultiplyDivide();

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (
        token.type === 'operator' &&
        (token.value === '+' || token.value === '-')
      ) {
        this.position++;
        const right = this.parseMultiplyDivide();
        node = {
          type: 'operator',
          value: token.value,
          operator: token.value,
          children: [node, right],
        };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Parse multiplication and division
   */
  private parseMultiplyDivide(): FormulaAST {
    let node = this.parsePower();

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (
        token.type === 'operator' &&
        (token.value === '*' || token.value === '/')
      ) {
        this.position++;
        const right = this.parsePower();
        node = {
          type: 'operator',
          value: token.value,
          operator: token.value,
          children: [node, right],
        };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Parse power operator (^)
   */
  private parsePower(): FormulaAST {
    let node = this.parseUnary();

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (token.type === 'operator' && token.value === '^') {
        this.position++;
        const right = this.parseUnary();
        node = {
          type: 'operator',
          value: '^',
          operator: '^',
          children: [node, right],
        };
      } else {
        break;
      }
    }

    return node;
  }

  /**
   * Parse unary operators (-, +)
   */
  private parseUnary(): FormulaAST {
    if (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (
        token.type === 'operator' &&
        (token.value === '-' || token.value === '+')
      ) {
        this.position++;
        const operand = this.parseUnary();
        return {
          type: 'unary',
          value: token.value,
          operator: token.value,
          children: [operand],
        };
      }
    }

    return this.parsePrimary();
  }

  /**
   * Parse primary expressions (literals, cells, functions, parentheses)
   */
  private parsePrimary(): FormulaAST {
    if (this.position >= this.tokens.length) {
      throw new Error('Unexpected end of formula');
    }

    const token = this.tokens[this.position];

    // Number literal
    if (token.type === 'number') {
      this.position++;
      return {
        type: 'literal',
        value: parseFloat(token.value),
      };
    }

    // String literal
    if (token.type === 'string') {
      this.position++;
      return {
        type: 'literal',
        value: token.value,
      };
    }

    // Boolean literal
    if (token.type === 'boolean') {
      this.position++;
      return {
        type: 'literal',
        value: token.value === 'TRUE',
      };
    }

    // Cell reference
    if (token.type === 'cell') {
      this.position++;
      return {
        type: 'cell',
        value: token.value,
      };
    }

    // Range
    if (token.type === 'range') {
      this.position++;
      return {
        type: 'range',
        value: token.value,
      };
    }

    // Function
    if (token.type === 'function') {
      const funcName = token.value;
      this.position++;

      // Expect '('
      if (
        this.position >= this.tokens.length ||
        this.tokens[this.position].type !== 'lparen'
      ) {
        throw new Error(`Expected '(' after function ${funcName}`);
      }
      this.position++; // Skip '('

      const args: FormulaAST[] = [];

      // Parse arguments
      if (
        this.position < this.tokens.length &&
        this.tokens[this.position].type !== 'rparen'
      ) {
        args.push(this.parseExpression());

        while (
          this.position < this.tokens.length &&
          this.tokens[this.position].type === 'comma'
        ) {
          this.position++; // Skip ','
          args.push(this.parseExpression());
        }
      }

      // Expect ')'
      if (
        this.position >= this.tokens.length ||
        this.tokens[this.position].type !== 'rparen'
      ) {
        throw new Error(`Expected ')' after function arguments`);
      }
      this.position++; // Skip ')'

      return {
        type: 'function',
        value: funcName,
        children: args,
      };
    }

    // Parenthesized expression
    if (token.type === 'lparen') {
      this.position++; // Skip '('
      const expr = this.parseExpression();

      if (
        this.position >= this.tokens.length ||
        this.tokens[this.position].type !== 'rparen'
      ) {
        throw new Error("Expected ')'");
      }
      this.position++; // Skip ')'

      return expr;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  /**
   * Extract all cell references from AST
   */
  extractReferences(ast: FormulaAST): string[] {
    const refs: Set<string> = new Set();

    const traverse = (node: FormulaAST) => {
      if (node.type === 'cell') {
        refs.add(node.value as string);
      } else if (node.type === 'range') {
        const rangeCells = this.expandRange(node.value as string);
        rangeCells.forEach((cell) => refs.add(cell));
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(ast);
    return Array.from(refs);
  }

  /**
   * Expand range (A1:B2) to individual cells
   */
  private expandRange(range: string): string[] {
    const [start, end] = range.split(':');
    const startCol = start.match(/[A-Z]+/)?.[0] || '';
    const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
    const endCol = end.match(/[A-Z]+/)?.[0] || '';
    const endRow = parseInt(end.match(/\d+/)?.[0] || '0');

    const cells: string[] = [];
    const startColIndex = this.columnToIndex(startCol);
    const endColIndex = this.columnToIndex(endCol);

    for (let col = startColIndex; col <= endColIndex; col++) {
      for (let row = startRow; row <= endRow; row++) {
        cells.push(`${this.indexToColumn(col)}${row}`);
      }
    }

    return cells;
  }

  /**
   * Check if string is a cell reference (e.g., A1, B2, AA10)
   */
  private isCellReference(str: string): boolean {
    return /^[A-Z]+\d+$/i.test(str);
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

  /**
   * Convert index to column letter (0=A, 1=B, 25=Z, 26=AA)
   */
  private indexToColumn(index: number): string {
    let col = '';
    let num = index + 1;
    while (num > 0) {
      const remainder = (num - 1) % 26;
      col = String.fromCharCode('A'.charCodeAt(0) + remainder) + col;
      num = Math.floor((num - 1) / 26);
    }
    return col;
  }
}
