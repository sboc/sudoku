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
  {
    id: 'slate',
    name: 'Slate',
    metaColor: '#3a4858',
    bgCell: '#4c5e6e',
    bgCellHi: '#587080',
    borderBox: '#607888',
    accent: '#3a80cc',
    accentSoft: '#58a0e4',
    text1: '#d0e2f0',
  },
  {
    id: 'terra',
    name: 'Terra',
    metaColor: '#5a4030',
    bgCell: '#785640',
    bgCellHi: '#88624c',
    borderBox: '#a07858',
    accent: '#c06828',
    accentSoft: '#d88040',
    text1: '#f8e0c8',
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
    metaColor: '#eef2f6',
    bgCell: '#f4f7fa',
    bgCellHi: '#dde5ef',
    borderBox: '#8aaac8',
    accent: '#1a6abf',
    accentSoft: '#2880d8',
    text1: '#0e2040',
  },
];

export const DEFAULT_THEME: ThemeId = 'ocean';
