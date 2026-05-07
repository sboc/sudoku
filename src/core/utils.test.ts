import { describe, it, expect } from 'vitest';
import { penaltyLabel, formatTime, formatSolveTime } from './utils';

describe('penaltyLabel', () => {
  it('returns seconds only when < 60s', () => {
    expect(penaltyLabel(15)).toBe('+15s');
    expect(penaltyLabel(1)).toBe('+1s');
    expect(penaltyLabel(59)).toBe('+59s');
  });

  it('returns minutes only when divisible by 60', () => {
    expect(penaltyLabel(60)).toBe('+1m');
    expect(penaltyLabel(120)).toBe('+2m');
    expect(penaltyLabel(600)).toBe('+10m');
  });

  it('returns combined format when minutes and seconds', () => {
    expect(penaltyLabel(90)).toBe('+1m30s');
    expect(penaltyLabel(125)).toBe('+2m5s');
    expect(penaltyLabel(3661)).toBe('+61m1s');
  });
});

describe('formatSolveTime', () => {
  it('returns seconds-only for values under one minute', () => {
    expect(formatSolveTime(0)).toBe('0 secs');
    expect(formatSolveTime(1)).toBe('1 sec');
    expect(formatSolveTime(2)).toBe('2 secs');
  });

  it('returns minutes-only when no seconds remain', () => {
    expect(formatSolveTime(60)).toBe('1 min');
    expect(formatSolveTime(120)).toBe('2 mins');
  });

  it('returns hours-only when no minutes or seconds remain', () => {
    expect(formatSolveTime(3600)).toBe('1 hr');
    expect(formatSolveTime(7200)).toBe('2 hrs');
  });

  it('joins two parts with "and"', () => {
    expect(formatSolveTime(90)).toBe('1 min and 30 secs');
    expect(formatSolveTime(3660)).toBe('1 hr and 1 min');
    expect(formatSolveTime(3601)).toBe('1 hr and 1 sec');
  });

  it('joins three parts with comma and "and"', () => {
    expect(formatSolveTime(3661)).toBe('1 hr, 1 min and 1 sec');
    expect(formatSolveTime(7382)).toBe('2 hrs, 3 mins and 2 secs');
  });
});

describe('formatTime', () => {
  it('formats seconds under one minute', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(59)).toBe('00:59');
  });

  it('formats minutes and seconds without hours', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats hours when >= 3600s', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(7322)).toBe('2:02:02');
  });
});
