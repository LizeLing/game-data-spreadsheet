/**
 * Toast Component
 * 사용자에게 즉각적인 피드백을 제공하는 알림 컴포넌트
 */

import { useEffect, useState } from 'react';
import { useToastStore, type Toast as ToastType } from '@stores/toastStore';

const Toast = ({ toast }: { toast: ToastType }) => {
  const removeToast = useToastStore((state) => state.removeToast);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Exit animation before removal
    if (toast.duration && toast.duration > 0) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300); // Start exit animation 300ms before removal

      return () => clearTimeout(exitTimer);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  };

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-800',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: '✕',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: '⚠',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: 'ℹ',
    },
  };

  const style = typeStyles[toast.type];

  return (
    <div
      className={`
        ${style.bg} ${style.border} ${style.text}
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        min-w-[300px] max-w-md
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <span className="text-xl" aria-hidden="true">
        {style.icon}
      </span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      {toast.dismissible && (
        <button
          onClick={handleClose}
          className={`
            ${style.text} hover:opacity-70 transition-opacity
            ml-2 text-lg leading-none
          `}
          aria-label="알림 닫기"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-label="알림 목록"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
};

export default Toast;
