import { useState, useEffect } from 'react';
import type { ThemeId } from '../core/themes';
import { DEFAULT_THEME, THEMES } from '../core/themes';

const STORAGE_KEY = 'sudoku:theme';

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const valid = saved && THEMES.some(t => t.id === saved);
    const initial = valid ? saved : DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', initial);
    return initial;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    const t = THEMES.find(x => x.id === theme);
    if (meta && t) meta.setAttribute('content', t.metaColor);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return [theme, setThemeState] as const;
};
