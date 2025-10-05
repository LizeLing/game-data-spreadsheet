/**
 * Keyboard Shortcuts Hook
 * 전역 키보드 단축키 관리
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category: 'file' | 'edit' | 'navigation' | 'selection' | 'view' | 'help';
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * 키보드 단축키 훅
 * @param options - 단축키 설정 및 옵션
 */
export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions) => {
  const { shortcuts, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow some shortcuts even in input fields
      const allowInInput = ['F2', 'Escape', 'Enter'];
      if (isInput && !allowInInput.includes(event.key)) {
        // Only allow Ctrl/Cmd + key combinations in input fields
        if (!event.ctrlKey && !event.metaKey) {
          return;
        }
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

      for (const shortcut of shortcuts) {
        const ctrlPressed = isMac ? event.metaKey : event.ctrlKey;
        const metaPressed = isMac ? event.ctrlKey : event.metaKey;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl === undefined || shortcut.ctrl === ctrlPressed;
        const shiftMatches =
          shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatches = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const metaMatches =
          shortcut.meta === undefined || shortcut.meta === metaPressed;

        if (
          keyMatches &&
          ctrlMatches &&
          shiftMatches &&
          altMatches &&
          metaMatches
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  /**
   * Get formatted shortcut display text
   */
  const getShortcutText = useCallback((shortcut: KeyboardShortcut): string => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const parts: string[] = [];

    if (shortcut.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.meta && !isMac) {
      parts.push('Meta');
    }

    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
  }, []);

  /**
   * Group shortcuts by category
   */
  const getShortcutsByCategory = useCallback(() => {
    const grouped: Record<string, KeyboardShortcut[]> = {
      file: [],
      edit: [],
      navigation: [],
      selection: [],
      view: [],
      help: [],
    };

    shortcuts.forEach((shortcut) => {
      grouped[shortcut.category].push(shortcut);
    });

    return grouped;
  }, [shortcuts]);

  return {
    getShortcutText,
    getShortcutsByCategory,
  };
};

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  // File operations
  {
    key: 's',
    ctrl: true,
    description: '스프레드시트 저장',
    category: 'file',
  },
  {
    key: 'o',
    ctrl: true,
    description: '파일 열기',
    category: 'file',
  },

  // Edit operations
  {
    key: 'z',
    ctrl: true,
    description: '실행 취소',
    category: 'edit',
  },
  {
    key: 'y',
    ctrl: true,
    description: '다시 실행',
    category: 'edit',
  },
  {
    key: 'c',
    ctrl: true,
    description: '복사',
    category: 'edit',
  },
  {
    key: 'x',
    ctrl: true,
    description: '잘라내기',
    category: 'edit',
  },
  {
    key: 'v',
    ctrl: true,
    description: '붙여넣기',
    category: 'edit',
  },
  {
    key: 'd',
    ctrl: true,
    description: '현재 행 복제',
    category: 'edit',
  },
  {
    key: 'Delete',
    ctrl: true,
    description: '현재 행 삭제',
    category: 'edit',
  },

  // Search and replace
  {
    key: 'f',
    ctrl: true,
    description: '찾기',
    category: 'edit',
  },
  {
    key: 'h',
    ctrl: true,
    description: '바꾸기',
    category: 'edit',
  },

  // Navigation
  {
    key: 'Home',
    ctrl: true,
    description: '첫 셀로 이동',
    category: 'navigation',
  },
  {
    key: 'End',
    ctrl: true,
    description: '마지막 셀로 이동',
    category: 'navigation',
  },

  // Selection
  {
    key: 'a',
    ctrl: true,
    description: '모두 선택',
    category: 'selection',
  },
  {
    key: 'ArrowUp',
    ctrl: true,
    shift: true,
    description: '위쪽으로 범위 확장',
    category: 'selection',
  },
  {
    key: 'ArrowDown',
    ctrl: true,
    shift: true,
    description: '아래쪽으로 범위 확장',
    category: 'selection',
  },
  {
    key: 'ArrowLeft',
    ctrl: true,
    shift: true,
    description: '왼쪽으로 범위 확장',
    category: 'selection',
  },
  {
    key: 'ArrowRight',
    ctrl: true,
    shift: true,
    description: '오른쪽으로 범위 확장',
    category: 'selection',
  },

  // Cell editing
  {
    key: 'F2',
    description: '셀 편집 모드',
    category: 'edit',
  },
  {
    key: 'Escape',
    description: '편집 취소',
    category: 'edit',
  },
  {
    key: 'Enter',
    ctrl: true,
    description: '편집 완료 후 아래로 이동',
    category: 'edit',
  },

  // View
  {
    key: 'v',
    ctrl: true,
    shift: true,
    description: '데이터 검증 패널',
    category: 'view',
  },

  // Help
  {
    key: '/',
    ctrl: true,
    description: '단축키 도움말',
    category: 'help',
  },
];
