// @ts-check
/**
 * Lint configuration.
 *
 * Deliberately small. The rules that matter most in this project are enforced by
 * tests instead — the token lint, the architecture boundaries, the accessibility
 * scan — because those check things a linter cannot see. What is left here is the
 * set that catches genuine mistakes rather than style opinions.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Wrangler's local runtime scratch directory. Generated, not authored.
      '.wrangler/**',
      // Generated from the token module; editing it directly is the mistake, and
      // the CI job that regenerates and diffs it is what catches that.
      'src/platform/tokens/*.generated.css',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // The engine must be free of unseeded randomness and wall-clock reads
      // (engine/pkpd-core → Fixed-Step Deterministic Integration). The tests
      // check this properly; this catches it where it is written.
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'Use the seeded generator in @platform/kernel/rng, or replay stops being bit-identical.' },
        { object: 'Date', property: 'now', message: 'The engine reads no wall clock. Pass the time in, or use the tick counter.' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // The service worker runs in a service-worker global scope, which the
    // browser globals do not describe.
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly', caches: 'readonly', fetch: 'readonly', clients: 'readonly',
        URL: 'readonly', Promise: 'readonly',
      },
    },
    rules: { '@typescript-eslint/no-unused-vars': 'off' },
  },
  {
    // Scripts and tests print to standard output by design.
    files: ['scripts/**/*.ts', 'tests/**/*.{ts,tsx}'],
    rules: { 'no-console': 'off' },
  },
);
