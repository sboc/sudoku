# Sudoku

A React + TypeScript Sudoku game with a human-style solver, graded difficulty, and hint system.

## Features

- Six difficulty levels: Easy, Medium, Hard, Expert, Master, Legend
- Puzzles are guaranteed to have a unique solution (exact-cover check via Dancing Links)
- Difficulty is graded by running a human-style solver and summing technique weights
- Hint system: 15 solving techniques from Naked Single through W-Wing, with step-by-step reveal
- Notes mode, auto-fill all notes, auto-solve animation
- Penalty system: wrong guesses add time; 10 wrong attempts ends the game
- Game state persisted in `localStorage`; share a puzzle via URL hash

## Project structure

```
src/
  core/           Pure TypeScript logic (no React)
    dlx.ts          Dancing Links exact-cover solver
    generator.ts    Puzzle generation (randomised backtracking + uniqueness check)
    humanSolver.ts  Human-style solver: 15 techniques, hint descriptions
    grader.ts       Difficulty grading by technique weights
    persistence.ts  localStorage helpers and serialisation types
    techniqueHelp.ts Technique labels and step-by-step explanations
    utils.ts        Time formatting and hint cost constants

  hooks/          React hooks
    useSudoku.ts    Core game state (grid, notes, penalties)
    usePuzzlePool.ts Background puzzle generation pool
    useHint.ts      Hint reveal flow and cost tracking
    useAutoSolve.ts Animated auto-solve sequence
    useTimer.ts     Elapsed time and penalty flash
    useCelebration.ts Solve celebration animation

  components/     React components + CSS
    SudokuBoard.tsx  Main game board
    StartPage.tsx    Difficulty selection screen
    HelpModal.tsx    How-to-play and technique reference
    TechniqueHelpModal.tsx  Per-technique explanation popup
    Icons.tsx        SVG icon components

  App.tsx         Root component, routing, puzzle loading
  main.tsx        Entry point
  index.css       Global styles
```

## Dev setup

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```
