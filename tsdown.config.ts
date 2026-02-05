import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['astro'],
  inlineOnly: ['chalk', 'color-convert', 'color-name', 'ansi-styles', 'has-flag', 'supports-color'],
})
