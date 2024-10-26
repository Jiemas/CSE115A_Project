const js = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tsPlugin.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      // Add your custom rules here
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];