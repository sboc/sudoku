export type ThemeId = 'ocean' | 'midnight' | 'dusk' | 'forest';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  metaColor: string; // for <meta name="theme-color">
  // swatch colors for the settings modal preview
  bgCell: string;
  bgCellHi: string;
  borderBox: string;
  accent: string;
  accentSoft: string;
  text1: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    metaColor: '#07101e',
    bgCell: '#0e1d36',
    bgCellHi: '#162a4a',
    borderBox: '#2a4878',
    accent: '#3b7ff6',
    accentSoft: '#5aa0ff',
    text1: '#dce8f8',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    metaColor: '#000000',
    bgCell: '#10101a',
    bgCellHi: '#181824',
    borderBox: '#303050',
    accent: '#6366f1',
    accentSoft: '#818cf8',
    text1: '#f0f0f8',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    metaColor: '#0d0818',
    bgCell: '#1a1035',
    bgCellHi: '#241550',
    borderBox: '#3e2272',
    accent: '#8b5cf6',
    accentSoft: '#a78bfa',
    text1: '#ede9fe',
  },
  {
    id: 'forest',
    name: 'Forest',
    metaColor: '#051209',
    bgCell: '#0c2216',
    bgCellHi: '#102e1c',
    borderBox: '#1a4830',
    accent: '#10b981',
    accentSoft: '#34d399',
    text1: '#d0fae4',
  },
];

export const DEFAULT_THEME: ThemeId = 'ocean';
