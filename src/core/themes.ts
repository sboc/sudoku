export type ThemeId = 'ocean' | 'midnight' | 'dusk' | 'forest' | 'slate' | 'terra' | 'parchment' | 'mist';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  metaColor: string;
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
    bgCell: '#131320',
    bgCellHi: '#1e1e32',
    borderBox: '#363660',
    accent: '#6366f1',
    accentSoft: '#818cf8',
    text1: '#f0f0f8',
  },
  {
    id: 'dusk',
    name: 'Dusk',
    metaColor: '#0d0818',
    bgCell: '#1a1035',
    bgCellHi: '#2a1858',
    borderBox: '#4a2880',
    accent: '#8b5cf6',
    accentSoft: '#a78bfa',
    text1: '#ede9fe',
  },
  {
    id: 'forest',
    name: 'Forest',
    metaColor: '#051209',
    bgCell: '#0c2216',
    bgCellHi: '#153424',
    borderBox: '#1e5538',
    accent: '#10b981',
    accentSoft: '#34d399',
    text1: '#d0fae4',
  },
  {
    id: 'slate',
    name: 'Slate',
    metaColor: '#141618',
    bgCell: '#22262e',
    bgCellHi: '#2e3540',
    borderBox: '#384858',
    accent: '#4090e0',
    accentSoft: '#60aaff',
    text1: '#d8e4f0',
  },
  {
    id: 'terra',
    name: 'Terra',
    metaColor: '#f4ede4',
    bgCell: '#faf5ee',
    bgCellHi: '#edd9c4',
    borderBox: '#a87850',
    accent: '#b03808',
    accentSoft: '#c85020',
    text1: '#281000',
  },
  {
    id: 'parchment',
    name: 'Parchment',
    metaColor: '#f5f0e8',
    bgCell: '#faf6ee',
    bgCellHi: '#e8e0d0',
    borderBox: '#a89878',
    accent: '#b05000',
    accentSoft: '#c86010',
    text1: '#2a200e',
  },
  {
    id: 'mist',
    name: 'Mist',
    metaColor: '#e8eef5',
    bgCell: '#f4f8fd',
    bgCellHi: '#d5e3ef',
    borderBox: '#6898c0',
    accent: '#1558a8',
    accentSoft: '#2270c8',
    text1: '#0c1e35',
  },
];

export const DEFAULT_THEME: ThemeId = 'ocean';
