/**
 * Context Menu Component
 * 우클릭 컨텍스트 메뉴
 */

import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off-screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Check if menu goes off right edge
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Check if menu goes off bottom edge
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      if (adjustedX !== x || adjustedY !== y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [x, y]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled && !item.separator) {
      item.action();
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white shadow-lg rounded-lg border border-gray-200 py-1 min-w-[200px] z-50"
      style={{ left: x, top: y }}
    >
      {items.map((item) => {
        if (item.separator) {
          return (
            <div
              key={item.id}
              className="h-px bg-gray-200 my-1"
              role="separator"
            />
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full px-4 py-2 text-left text-sm flex items-center justify-between gap-2
              ${
                item.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
              }
              transition-colors
            `}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="text-base">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <kbd className="text-xs text-gray-400 font-mono">
                {item.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
};
