/**
 * Theme Hook
 * 다크 모드/라이트 모드 토글 및 테마 관리
 */

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'spreadsheet-theme';

/**
 * 테마 훅
 * localStorage에 테마 설정을 저장하고, 시스템 환경설정을 감지
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. localStorage에서 저장된 테마 확인
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme) return savedTheme;

    // 2. 시스템 환경설정 확인 (테스트 환경에서는 스킵)
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }

    // 3. 기본값은 light
    return 'light';
  });

  // 테마 변경 시 localStorage 저장 및 DOM 클래스 업데이트
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // HTML 루트 요소에 dark 클래스 추가/제거 (Tailwind dark mode)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 시스템 환경설정 변경 감지
  useEffect(() => {
    // 테스트 환경에서는 matchMedia가 없을 수 있음
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // localStorage에 저장된 테마가 없을 때만 시스템 환경설정 반영
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!savedTheme) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  };
};
