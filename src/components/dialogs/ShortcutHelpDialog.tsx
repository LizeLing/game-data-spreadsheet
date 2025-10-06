/**
 * Shortcut Help Dialog
 * 키보드 단축키 도움말 다이얼로그
 */

import { type KeyboardShortcut } from '@hooks/useKeyboardShortcuts';

interface ShortcutHelpDialogProps {
  shortcuts: Record<string, KeyboardShortcut[]>;
  getShortcutText: (shortcut: KeyboardShortcut) => string;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  file: '📁 파일',
  edit: '✏️ 편집',
  navigation: '🧭 탐색',
  selection: '🔲 선택',
  view: '👁️ 보기',
  help: '❓ 도움말',
};

export const ShortcutHelpDialog = ({
  shortcuts,
  getShortcutText,
  onClose,
}: ShortcutHelpDialogProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">⌨️ 키보드 단축키</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(shortcuts).map(([category, categoryShortcuts]) => {
              if (categoryShortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-900 dark:text-gray-100">
                          {getShortcutText(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white rounded hover:bg-primary-600 dark:hover:bg-primary-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
