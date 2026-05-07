# Sudoku

A React + TypeScript Sudoku game with a human-style solver, graded difficulty, and hint system.

## Features

- Six difficulty levels: Easy, Medium, Hard, Expert, Master, Legend
- Puzzles guaranteed to have a unique solution (exact-cover check via Dancing Links)
- Difficulty graded by running a human-style solver and summing technique weights
- Hint system: 15 solving techniques from Naked Single through W-Wing, with three-phase step-by-step reveal
- Notes mode, auto-fill all notes, animated auto-solve
- Penalty system: wrong guesses add time; 10 wrong attempts ends the game
- Game state persisted in `localStorage`; resume unfinished games on return; share via URL hash (`#game/<81-digit-string>`)
- Background puzzle pre-generation pool keeps puzzles ready instantly

## Tech stack

| Layer | Tool |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite + Rolldown/Babel (React Compiler) |
| Test | Vitest + happy-dom |
| Lint | ESLint + typescript-eslint + react-hooks plugin |
| Coverage | @vitest/coverage-v8 |

## Project structure

```
src/
  core/                   Pure TypeScript - no React imports
  hooks/                  React hooks consuming core logic
  components/             React components + co-located CSS
  App.tsx                 Root: routing, puzzle loading, layout
  main.tsx                Entry point
  index.css               Global styles and CSS custom properties
```

### `src/core/` - framework-free logic

All core modules are pure TypeScript with no React dependency. They are fully unit-tested.

#### `dlx.ts` - Dancing Links exact-cover solver

Implements Knuth's Algorithm X via Dancing Links (DLX). Used in two ways:

- `dlxSolve(constraints, maxSolutions)` - returns up to `maxSolutions` solutions for an exact-cover problem encoded as a list of constraint rows.
- `hasUniqueSolution(puzzle)` - encodes a 9×9 Sudoku as a 324-column exact-cover matrix (one column per cell, row, column, and box constraint) and verifies exactly one solution exists. Called during puzzle generation after each clue removal.

Internally maintains `DLXNode` / `ColumnNode` doubly-linked lists that are surgically covered and uncovered during backtracking.

#### `generator.ts` - puzzle generation

- `generatePuzzle()` - produces a `{ puzzle, solution }` pair:
  1. Fills a blank grid with a valid complete solution using randomised backtracking (`fillGrid`).
  2. Shuffles all 81 cell positions.
  3. Removes clues one at a time; after each removal calls `hasUniqueSolution` and restores the clue if uniqueness would be violated.
- `solvePuzzle(puzzle)` - thin wrapper around `dlxSolve` that returns the first solution, used by `App.tsx` when reconstructing a puzzle from a URL hash.

#### `humanSolver.ts` - human-style solver and hint engine

The most substantial module (~920 lines). Simulates how a human solves Sudoku by applying techniques in order of increasing difficulty rather than brute-forcing.

**Technique ladder** (15 techniques, in application order):

| Technique | What it does |
|---|---|
| `naked_single` | Cell with only one candidate |
| `hidden_single` | Digit with only one candidate cell in a unit |
| `naked_pair` | Two cells in a unit sharing exactly two candidates - eliminate from rest of unit |
| `naked_triple` | Same as pair but three cells/candidates |
| `hidden_pair` | Two digits confined to two cells in a unit - eliminate other candidates from those cells |
| `hidden_triple` | Same as pair but three digits/cells |
| `naked_quad` | Four cells / four candidates |
| `hidden_quad` | Four digits / four cells |
| `pointing_pair` | Candidates in a box confined to one row/col - eliminate from that row/col outside box |
| `box_line_reduction` | Candidates in a row/col confined to one box - eliminate from rest of box |
| `x_wing` | Two rows with a digit in only two columns - eliminate from those columns in other rows |
| `swordfish` | Three-row / three-column generalisation of X-Wing |
| `y_wing` | Three-cell chain: pivot + two pincers with shared candidate |
| `xyz_wing` | Y-Wing extended: pivot holds all three candidates |
| `w_wing` | Two cells with identical two candidates connected via a strong link |

Exported functions:
- `humanSolve(puzzle)` → `HumanSolveResult` - runs the full solve, returning all steps taken, the set of techniques used, and the final grid state. Used by the grader.
- `findNextHint(grid, notes)` → `Hint | null` - finds the single next applicable technique given the current user grid and candidate notes. The hint carries evidence cells, action cells, elimination targets, and human-readable description strings used by `useHint`.

#### `grader.ts` - difficulty classification

Maps a solved puzzle's technique set to a difficulty band by summing `TECHNIQUE_WEIGHT` values:

| Band | Score range | Weight examples |
|---|---|---|
| Easy | ≤ 4 | naked_single = 1, hidden_single = 2 |
| Medium | 5–10 | naked_pair = 3, pointing_pair = 3 |
| Hard | 11–17 | hidden_pair = 4, naked_triple = 5 |
| Expert | 18–24 | hidden_triple = 6, naked_quad = 6 |
| Master | 25–32 | x_wing = 7, hidden_quad = 7 |
| Legend | > 32 | swordfish = 8, y_wing = 8, w_wing = 8, xyz_wing = 9 |

`gradePuzzle(techniques, solved)` → `Grade { difficulty, score, techniques[] }`.

#### `persistence.ts` - localStorage I/O

Thin, error-safe wrappers (`localGet`, `localSet`, `localRemove`, `localKeys`) that swallow `SecurityError` exceptions (private browsing, storage full).

Game save format: key `sudoku:<81-digit-puzzle-string>`, value is JSON-encoded `PersistedGame`:
```
PersistedGame {
  sudoku: SavedSudokuState   // userGrid, notes, notesMode, penaltyCount, failed, solved
  elapsed: number            // seconds
  difficulty: string
}
```

Pool storage keys: `sudoku:pool:<difficulty>` - arrays of serialised `GeneratedPuzzle`.

`loadSave` validates the stored shape before returning, returning `null` on any schema mismatch.

#### `techniqueHelp.ts` - technique explanations

Static lookup tables: `TECHNIQUE_LABEL` (short display name) and `TECHNIQUE_HELP` (multi-step explanation object used by `TechniqueHelpModal`). No logic.

#### `utils.ts` - shared constants and formatters

- `HINT_PEEK_COST = 15` - seconds added for viewing a hint description
- `HINT_REVEAL_COST = 60` - seconds added for revealing which cells are involved
- `HINT_APPLY_COST = 120` - seconds added for auto-applying the hint
- `penaltyLabel(s)` - formats a penalty duration as `+Xs`, `+Xm`, or `+XmYs`
- `formatTime(s)` - formats elapsed time as `MM:SS` or `H:MM:SS`

### `src/hooks/` - React state and side-effects

#### `useSudoku.ts` - core game state

Owns the primary game state: `puzzle`, `solution`, `userGrid`, `selected` cell, per-cell `notes` (81 `Set<number>`), `notesMode`, `penaltyCount`, `failed`, `solved`.

Key actions:
- `placeDigit(cell, digit)` - validates against solution, increments penalty on mismatch, eliminates candidate from peer notes, checks for solved state
- `placeDigitDirect(cell, digit)` - bypasses validation, used by hint application and auto-solve
- `applyEliminations(elims)` - removes candidates from notes, used by hint engine for elimination-only techniques
- `fillAllNotes()` - populates all empty cells with all valid candidates
- `toggleNote(cell, digit)` / `clearCell(cell)` / `setSelected(cell)`

#### `usePuzzlePool.ts` - background pre-generation

Maintains a pool of pre-generated puzzles per difficulty so that starting a new game is instant. Target pool sizes: 3 per difficulty for Easy/Medium/Hard, 2 for Expert, 1 for Master/Legend (harder puzzles take longer to generate).

On mount, loads any persisted pools from `localStorage`. Runs a background `setInterval` loop that calls `generatePuzzle()` + `humanSolve()` + `gradePuzzle()` and sorts results into the correct difficulty bucket. Pool state is flushed to `localStorage` after each addition (capped at 10 per difficulty).

`takePuzzle(difficulty)` - removes and returns one puzzle from the pool (or generates synchronously if pool is empty).

#### `useHint.ts` - hint reveal flow

Manages a three-phase hint reveal:
1. **Peek** (`hintPhase = 'evidence'`, `hintRevealed = false`) - shows technique name and description, charges `HINT_PEEK_COST`
2. **Reveal** (`hintPhase = 'evidence'`, `hintRevealed = true`) - highlights evidence cells on the board, charges `HINT_REVEAL_COST`
3. **Apply** (`hintPhase = 'action'`) - executes the hint action (place digit or eliminate candidates), charges `HINT_APPLY_COST`

The hint auto-dismisses when `userGrid` changes (i.e., user makes a move) unless auto-solve is running.

#### `useAutoSolve.ts` - animated auto-solve

Drives an automated replay of `findNextHint` steps with configurable delays, filling notes first if needed, then applying hints one at a time. Sets `autoSolveRef` to prevent the hint system from interfering during the animation.

#### `useTimer.ts` - elapsed time and penalty flash

Runs a `setInterval` tick every second when the game is active (not solved, not failed). Exposes `showTimerFlash(msg)` for displaying penalty notifications (e.g. `+2m`) as a transient overlay on the timer. `addPenalty(seconds)` increments elapsed time and triggers the flash.

#### `useCelebration.ts` - solve animation

Triggers a CSS-class-based celebration animation when `solved` transitions to `true`. Returns `celebrating` boolean consumed by `SudokuBoard`.

### `src/components/` - UI

#### `SudokuBoard.tsx` + `SudokuBoard.css`

The main game view (~330 lines). Renders:
- 9×9 grid with 3×3 box borders
- Per-cell digit display, candidate notes (3×3 mini-grid), selection highlight, error highlight, hint highlights (evidence cells vs action cells)
- Control bar: digit buttons 1–9, Erase, Notes toggle, Auto-fill notes, Hint button, Auto-solve button
- Timer display with penalty flash
- Wrong-guess counter (pip display up to 10)
- Celebration overlay

Keyboard handling: arrow keys move selection, digits 1–9 enter values or notes, Delete/Backspace erases, Escape dismisses hints/modals.

#### `StartPage.tsx` + `StartPage.css`

Difficulty selection screen. Shows six difficulty cards (colour-coded by `DIFFICULTY_COLOR`), pool availability counts (ready puzzles per difficulty), and a "Resume" button if an unfinished game is found in `localStorage`.

#### `HelpModal.tsx` + `HelpModal.css`

How-to-play modal with two tabs: game rules and a technique reference table listing all 15 techniques with difficulty weights.

#### `TechniqueHelpModal.tsx`

Modal showing the step-by-step explanation for a single technique (sourced from `techniqueHelp.ts`). Opened from the hint panel when the user wants to learn more about the technique being suggested.

#### `Icons.tsx`

Self-contained SVG icon components: `PencilIcon`, `EraserIcon`, `BulbIcon`, `PlayIcon`, `QuestionIcon`. No external icon library dependency.

### `src/App.tsx` - root component

Handles three startup paths:
1. **URL hash** (`#game/<81 digits>`) - reconstructs puzzle from string, grades it, starts game immediately
2. **Unfinished save** - detects a non-solved, non-failed game in `localStorage` and offers resume
3. **New game** - delegates to `usePuzzlePool.takePuzzle(difficulty)`

Manages `activePuzzle` state (switches between `StartPage` and `SudokuBoard`).

### Tests

Each `core/` module has a co-located `*.test.ts` file:

| Test file | Coverage focus |
|---|---|
| `dlx.test.ts` | Exact-cover correctness, uniqueness detection |
| `generator.test.ts` | Puzzle validity, uniqueness, clue count |
| `grader.test.ts` | Score calculation, difficulty band assignment |
| `humanSolver.test.ts` | All 15 technique detection cases (~700 lines) |
| `persistence.test.ts` | Serialisation round-trips, schema validation |
| `utils.test.ts` | Time/penalty formatters |

Run with:
```sh
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # coverage report (output: coverage/)
```

## Dev setup

```sh
npm install
npm run dev      # Vite dev server with HMR
```

## Build

```sh
npm run build    # tsc + Vite bundle → dist/
npm run preview  # serve dist/ locally
```

## Lint

```sh
npm run lint
```
