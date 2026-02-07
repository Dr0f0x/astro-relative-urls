import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import markdown from '@eslint/markdown'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

const prettierOptions = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  endOfLine: 'auto',
  printWidth: 100,
}


export default defineConfig([
  {
    ignores: ['dist', 'node_modules', 'coverage', '.worktrees', 'docs'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      sourceType: 'module',
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      'prettier/prettier': ['error', prettierOptions],
    },
  },
  tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.md'],
    plugins: {
      markdown,
    },
    extends: ['markdown/recommended'],
    rules: {
      'prettier/prettier': [
        'error',
        {
          ...prettierOptions,
          printWidth: 80,
          proseWrap: 'always',
        },
      ],
    },
  },
])
