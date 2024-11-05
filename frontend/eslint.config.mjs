import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';

//const compat = new FlatCompat();

export default [
  js.configs.recommended,
  // ...compat.config({
  //   extends: [
  //     'plugin:react/recommended',
  //     'plugin:@typescript-eslint/recommended',
  //     'plugin:prettier/recommended',
  //   ],
  // }),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    plugins: {
      react: reactPlugin,
      reactHooks: reactHooksPlugin,
      jsxA11y: jsxA11yPlugin,
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    rules: {
      //'prettier/prettier': 'error',
      // Add your custom rules here
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
