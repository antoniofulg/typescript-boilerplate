// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintPluginPrettierRecommended,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'eslint.config.mjs',
  ]),
  {
    rules: {
      // Prettier integration
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // Compatible rules with backend
      '@typescript-eslint/no-explicit-any': 'off',
      // Disabled because it requires type-aware linting that needs additional configuration
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
]);

export default eslintConfig;
