import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME } from './themes';
import type { ThemeId } from './themes';

describe('themes', () => {
  it('THEMES array has 8 entries', () => {
    expect(THEMES).toHaveLength(8);
  });

  it('each theme has required fields', () => {
    for (const t of THEMES) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.name).toBe('string');
      expect(typeof t.metaColor).toBe('string');
      expect(typeof t.bgCell).toBe('string');
      expect(typeof t.bgCellHi).toBe('string');
      expect(typeof t.borderBox).toBe('string');
      expect(typeof t.accent).toBe('string');
      expect(typeof t.accentSoft).toBe('string');
      expect(typeof t.text1).toBe('string');
    }
  });

  it('theme ids are unique', () => {
    const ids = THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('DEFAULT_THEME is a valid theme id', () => {
    const ids = THEMES.map(t => t.id) as ThemeId[];
    expect(ids).toContain(DEFAULT_THEME);
  });

  it('DEFAULT_THEME is ocean', () => {
    expect(DEFAULT_THEME).toBe('ocean');
  });
});
