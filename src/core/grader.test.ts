import { describe, it, expect } from 'vitest';
import { gradePuzzle } from './grader';
import type { Technique } from './humanSolver';

describe('gradePuzzle', () => {
  it('returns unsolvable when not solved', () => {
    const result = gradePuzzle(new Set<Technique>(['naked_single']), false);
    expect(result.difficulty).toBe('unsolvable');
    expect(result.score).toBe(999);
    expect(result.techniques).toContain('naked_single');
  });

  it('grades easy (score <= 4)', () => {
    // naked_single = 1, hidden_single = 2 → total 3
    const result = gradePuzzle(new Set<Technique>(['naked_single', 'hidden_single']), true);
    expect(result.difficulty).toBe('easy');
    expect(result.score).toBe(3);
  });

  it('grades medium (score 5-10)', () => {
    // naked_pair = 3, hidden_single = 2, naked_single = 1 → 6
    const result = gradePuzzle(new Set<Technique>(['naked_pair', 'hidden_single', 'naked_single']), true);
    expect(result.difficulty).toBe('medium');
    expect(result.score).toBe(6);
  });

  it('grades hard (score 11-17)', () => {
    // pointing_pair=3, naked_pair=3, hidden_pair=4, naked_single=1 → 11
    const result = gradePuzzle(
      new Set<Technique>(['pointing_pair', 'naked_pair', 'hidden_pair', 'naked_single']),
      true,
    );
    expect(result.difficulty).toBe('hard');
    expect(result.score).toBe(11);
  });

  it('grades expert (score 18-24)', () => {
    // x_wing=7, swordfish=8, hidden_single=2, naked_single=1 → 18
    const result = gradePuzzle(
      new Set<Technique>(['x_wing', 'swordfish', 'hidden_single', 'naked_single']),
      true,
    );
    expect(result.difficulty).toBe('expert');
    expect(result.score).toBe(18);
  });

  it('grades master (score 25-32)', () => {
    // y_wing=8, swordfish=8, x_wing=7, hidden_single=2, naked_single=1 → 26
    const result = gradePuzzle(
      new Set<Technique>(['y_wing', 'swordfish', 'x_wing', 'hidden_single', 'naked_single']),
      true,
    );
    expect(result.difficulty).toBe('master');
    expect(result.score).toBe(26);
  });

  it('grades legend (score > 32)', () => {
    // xyz_wing=9, w_wing=8, swordfish=8, x_wing=7, y_wing=8, naked_single=1 → 41
    const result = gradePuzzle(
      new Set<Technique>(['xyz_wing', 'w_wing', 'swordfish', 'x_wing', 'y_wing', 'naked_single']),
      true,
    );
    expect(result.difficulty).toBe('legend');
    expect(result.score).toBe(41);
  });

  it('returns techniques list matching input set', () => {
    const input = new Set<Technique>(['naked_single', 'hidden_single', 'naked_pair']);
    const result = gradePuzzle(input, true);
    expect(result.techniques).toHaveLength(3);
    expect(result.techniques).toContain('naked_single');
    expect(result.techniques).toContain('hidden_single');
    expect(result.techniques).toContain('naked_pair');
  });

  it('handles empty technique set when solved', () => {
    const result = gradePuzzle(new Set<Technique>(), true);
    expect(result.difficulty).toBe('easy');
    expect(result.score).toBe(0);
    expect(result.techniques).toHaveLength(0);
  });
});
