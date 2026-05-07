import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      exclude: ['src/core/techniqueHelp.ts'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 68,
        functions: 85,
        branches: 46,
      },
    },
  },
})
