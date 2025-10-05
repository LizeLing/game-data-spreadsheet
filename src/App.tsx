/**
 * Main App Component
 * 게임 데이터 스프레드시트 메인 애플리케이션
 */

import { useEffect } from 'react';
import { Toolbar } from '@components/toolbar/Toolbar';
import { Sidebar } from '@components/sidebar/Sidebar';
import { SpreadsheetGrid } from '@components/spreadsheet/SpreadsheetGrid';
import { FormulaBar } from '@components/spreadsheet/FormulaBar';
import { useSpreadsheetStore } from '@stores/spreadsheetStore';
import ErrorBoundary from '@components/error/ErrorBoundary';
import { ToastContainer } from '@components/ui/Toast';

function App() {
  const initDB = useSpreadsheetStore((state) => state.initDB);
  const saving = useSpreadsheetStore((state) => state.saving);
  const lastSaved = useSpreadsheetStore((state) => state.lastSaved);
  const hasUnsavedChanges = useSpreadsheetStore(
    (state) => state.hasUnsavedChanges
  );

  useEffect(() => {
    // Initialize IndexedDB on app load
    initDB().catch((error) => {
      console.error('Failed to initialize database:', error);
    });
  }, [initDB]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">게임 데이터 스프레드시트</h1>
              <p className="text-sm text-primary-100">
                빠르고 효율적인 게임 데이터 관리
              </p>
            </div>
            <div className="text-right text-sm">
              {saving && <div className="text-primary-200">저장 중...</div>}
              {!saving && lastSaved && (
                <div className="text-primary-200">
                  마지막 저장: {lastSaved.toLocaleTimeString()}
                </div>
              )}
              {!saving && hasUnsavedChanges && !lastSaved && (
                <div className="text-yellow-300">저장되지 않은 변경사항</div>
              )}
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <Toolbar />

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Grid area */}
          <main className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Formula Bar */}
            <FormulaBar />

            {/* Spreadsheet Grid */}
            <div className="flex-1 overflow-hidden">
              <SpreadsheetGrid />
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 px-6 py-2 text-xs">
          <div className="flex justify-between items-center">
            <span>© 2025 게임 데이터 스프레드시트</span>
            <span>Ctrl+/ 키를 눌러 단축키 보기</span>
          </div>
        </footer>

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
