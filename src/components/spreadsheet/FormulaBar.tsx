/**
 * FormulaBar Component
 * 수식 입력 및 표시 바
 */

import { useState, useEffect, useRef } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import { FORMULA_FUNCTIONS } from '@services/formula/formulaFunctions';

export const FormulaBar = () => {
  const [inputValue, setInputValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredFunctions, setFilteredFunctions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const sheets = useSpreadsheetStore((state) => state.sheets);
  const activeSheetId = useSpreadsheetStore((state) => state.activeSheetId);
  const selection = useSpreadsheetStore((state) => state.selection);
  const updateCell = useSpreadsheetStore((state) => state.updateCell);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);

  // Get currently selected cell
  const getSelectedCell = () => {
    if (!activeSheet || !selection) return null;

    const rowIndex = selection.startRow;
    const columnIndex = selection.startColumn;

    const row = activeSheet.rows[rowIndex];
    const column = activeSheet.columns[columnIndex];

    if (!row || !column) return null;

    return {
      cell: row.cells[column.id],
      rowId: row.id,
      columnId: column.id,
      cellRef: `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`,
    };
  };

  // Update input when selection changes
  useEffect(() => {
    const selectedCell = getSelectedCell();
    if (selectedCell) {
      // Show formula if exists, otherwise show value
      const displayValue =
        selectedCell.cell.formula || selectedCell.cell.value || '';
      setInputValue(String(displayValue));
    } else {
      setInputValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, activeSheet]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Show autocomplete for functions
    if (value.includes('=')) {
      const lastWord = value.split(/[^A-Za-z_]/).pop() || '';
      if (lastWord.length > 0) {
        const matches = Object.keys(FORMULA_FUNCTIONS).filter((fn) =>
          fn.toLowerCase().startsWith(lastWord.toLowerCase())
        );
        if (matches.length > 0) {
          setFilteredFunctions(matches);
          setShowAutocomplete(true);
          setSelectedIndex(0);
        } else {
          setShowAutocomplete(false);
        }
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredFunctions.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (filteredFunctions.length > 0) {
          e.preventDefault();
          insertFunction(filteredFunctions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    } else if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      // Cancel edit
      const selectedCell = getSelectedCell();
      if (selectedCell) {
        const displayValue =
          selectedCell.cell.formula || selectedCell.cell.value || '';
        setInputValue(String(displayValue));
      }
      inputRef.current?.blur();
    }
  };

  // Insert function at cursor
  const insertFunction = (funcName: string) => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPos = input.selectionStart || inputValue.length;
    const before = inputValue.substring(0, cursorPos);
    const after = inputValue.substring(cursorPos);

    // Find the start of the current word
    const lastWordStart = before.split(/[^A-Za-z_]/).pop()?.length || 0;
    const newBefore = before.substring(0, before.length - lastWordStart);

    const newValue = `${newBefore}${funcName}(${after}`;
    setInputValue(newValue);
    setShowAutocomplete(false);

    // Set cursor position after function name and opening parenthesis
    setTimeout(() => {
      const newCursorPos = newBefore.length + funcName.length + 1;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);
  };

  // Submit value to cell
  const handleSubmit = () => {
    const selectedCell = getSelectedCell();
    if (!selectedCell || !activeSheet) return;

    updateCell(
      activeSheet.id,
      selectedCell.rowId,
      selectedCell.columnId,
      inputValue
    );
    inputRef.current?.blur();
  };

  const selectedCell = getSelectedCell();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Cell Reference */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 min-w-[60px]">
            {selectedCell ? selectedCell.cellRef : '-'}
          </span>
        </div>

        {/* Formula Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCell ? '값 또는 수식(=)을 입력하세요' : '셀을 선택하세요'
            }
            disabled={!selectedCell}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />

          {/* Autocomplete Dropdown */}
          {showAutocomplete && filteredFunctions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full max-w-xs bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredFunctions.map((funcName, index) => (
                <div
                  key={funcName}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    index === selectedIndex
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => insertFunction(funcName)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="font-semibold">{funcName}</span>
                  <span className="text-xs ml-2 opacity-75">함수</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Function List Button */}
        <button
          className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => {
            // Show function list
            if (inputValue && !inputValue.startsWith('=')) {
              setInputValue('=' + inputValue);
            } else if (!inputValue) {
              setInputValue('=');
            }
            setFilteredFunctions(Object.keys(FORMULA_FUNCTIONS));
            setShowAutocomplete(true);
            inputRef.current?.focus();
          }}
          title="함수 목록"
        >
          ƒx
        </button>
      </div>
    </div>
  );
};
