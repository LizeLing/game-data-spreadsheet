/**
 * Search and Replace Dialog
 * Modal dialog for finding and replacing text in spreadsheet
 */

import { useState } from 'react';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import type { SearchResult, SearchOptions } from '@utils/searchUtils';

interface SearchDialogProps {
  onClose: () => void;
}

export const SearchDialog = ({ onClose }: SearchDialogProps) => {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeCell, setMatchWholeCell] = useState(false);
  const [searchFormulas, setSearchFormulas] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [searchInAllSheets, setSearchInAllSheets] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [showReplace, setShowReplace] = useState(false);

  const searchInCurrentSheet = useSpreadsheetStore(
    (state) => state.searchInCurrentSheet
  );
  const searchInAllSheetsStore = useSpreadsheetStore(
    (state) => state.searchInAllSheets
  );
  const replaceInSelection = useSpreadsheetStore(
    (state) => state.replaceInSelection
  );
  const replaceAll = useSpreadsheetStore((state) => state.replaceAll);
  const setSelection = useSpreadsheetStore((state) => state.setSelection);
  const setActiveSheet = useSpreadsheetStore((state) => state.setActiveSheet);

  const handleSearch = () => {
    if (!searchText) return;

    const options: SearchOptions = {
      matchCase,
      matchWholeCell,
      searchFormulas,
      useRegex,
    };

    const searchResults = searchInAllSheets
      ? searchInAllSheetsStore(searchText, options)
      : searchInCurrentSheet(searchText, options);

    setResults(searchResults);
    setSelectedResultIndex(0);

    if (searchResults.length > 0) {
      navigateToResult(searchResults[0]);
    }
  };

  const handleFindNext = () => {
    if (results.length === 0) {
      handleSearch();
      return;
    }

    const nextIndex = (selectedResultIndex + 1) % results.length;
    setSelectedResultIndex(nextIndex);
    navigateToResult(results[nextIndex]);
  };

  const handleFindPrevious = () => {
    if (results.length === 0) {
      handleSearch();
      return;
    }

    const prevIndex =
      (selectedResultIndex - 1 + results.length) % results.length;
    setSelectedResultIndex(prevIndex);
    navigateToResult(results[prevIndex]);
  };

  const navigateToResult = (result: SearchResult) => {
    // Switch to the sheet if necessary
    setActiveSheet(result.sheetId);

    // Set selection to the cell
    setSelection({
      startRow: result.rowIndex,
      endRow: result.rowIndex,
      startColumn: result.columnIndex,
      endColumn: result.columnIndex,
    });
  };

  const handleReplace = () => {
    if (!searchText || !replaceText) return;

    const options: SearchOptions = {
      matchCase,
      matchWholeCell,
      useRegex,
    };

    const count = replaceInSelection(searchText, replaceText, options);

    // Re-search to update results
    handleSearch();

    console.log(`Replaced ${count} occurrence(s)`);
  };

  const handleReplaceAll = () => {
    if (!searchText || !replaceText) return;

    const options: SearchOptions = {
      matchCase,
      matchWholeCell,
      useRegex,
    };

    const count = replaceAll(searchText, replaceText, options);

    // Re-search to update results
    handleSearch();

    console.log(`Replaced ${count} occurrence(s) in sheet`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">찾기 및 바꾸기</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            찾기
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색할 텍스트 입력"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            autoFocus
          />
        </div>

        {/* Replace Input */}
        {showReplace && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              바꿀 내용
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="바꿀 텍스트 입력"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        )}

        {/* Options */}
        <div className="mb-4 space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">대소문자 구분</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={matchWholeCell}
              onChange={(e) => setMatchWholeCell(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">셀 전체 일치</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={searchFormulas}
              onChange={(e) => setSearchFormulas(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">수식 내 검색</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">정규식 사용</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={searchInAllSheets}
              onChange={(e) => setSearchInAllSheets(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">모든 시트에서 검색</span>
          </label>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {results.length}개 일치 항목 발견
              {results.length > 0 && (
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  ({selectedResultIndex + 1} / {results.length})
                </span>
              )}
            </div>

            {/* Results List */}
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {results.slice(0, 10).map((result, index) => (
                <div
                  key={`${result.cellId}-${index}`}
                  className={`text-xs p-2 rounded cursor-pointer ${
                    index === selectedResultIndex
                      ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => {
                    setSelectedResultIndex(index);
                    navigateToResult(result);
                  }}
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{result.sheetName}</span> •{' '}
                  <span className="text-gray-600 dark:text-gray-400">
                    {String.fromCharCode(65 + result.columnIndex)}
                    {result.rowIndex + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">: {String(result.matchedText).substring(0, 50)}</span>
                </div>
              ))}
              {results.length > 10 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 p-2">
                  ... 외 {results.length - 10}개 더 보기
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Search buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              모두 찾기
            </button>
            <button
              onClick={handleFindPrevious}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
              title="Shift+Enter"
            >
              ← 이전
            </button>
            <button
              onClick={handleFindNext}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
              title="Enter"
            >
              다음 →
            </button>
          </div>

          {/* Replace buttons */}
          {!showReplace ? (
            <button
              onClick={() => setShowReplace(true)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              바꾸기 옵션 표시
            </button>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  onClick={handleReplace}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={!searchText || !replaceText}
                >
                  선택 영역 바꾸기
                </button>
                <button
                  onClick={handleReplaceAll}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  disabled={!searchText || !replaceText}
                >
                  모두 바꾸기
                </button>
              </div>
              <button
                onClick={() => setShowReplace(false)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
              >
                바꾸기 옵션 숨기기
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
