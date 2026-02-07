import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'html', 'cobertura'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/filesystem.ts'],
    },
  },
})
