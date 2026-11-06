import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
export default [
  { ignores: ['node_modules/**', 'dist/**', 'build/**', 'output/**', 'tests/**', '.playwright-cli/**'] },
  js.configs.recommended,
  { files: ['**/*.{js,jsx,mjs}'], languageOptions: { ecmaVersion: 'latest', globals: globals.node, parserOptions: { ecmaFeatures: { jsx: true } } }, rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }] } },
  { files: ['src/**/*.{js,jsx}'], languageOptions: { globals: globals.browser }, plugins: { 'react-hooks': hooks, 'react-refresh': refresh }, rules: { ...hooks.configs.recommended.rules, 'react-refresh/only-export-components': 'warn' } },
];
