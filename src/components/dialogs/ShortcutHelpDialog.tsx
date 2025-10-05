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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">⌨️ 키보드 단축키</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
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
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
