import { defineConfig } from 'eslint/config';

import esmConfig from '@ljharb/eslint-config/flat/esm';
import nodeConfig from '@ljharb/eslint-config/flat/node/0.4';

export default defineConfig([
  {
    ignores: [
      'test/**/_prelude.js',
      'example/*',

      // deliberately malformed, to exercise browserify's syntax-error
      // reporting; no `ecmaVersion` can parse these.
      'test/error_code/src.js',
      'test/syntax_cache/invalid.js',
    ],
  },
  {
    // `ignores`, not `files`, so the entries in `nodeConfig` that aren't
    // extension-scoped keep applying to every non-ESM file.
    ignores: ['**/*.mjs'],
    extends: [nodeConfig],
  },
  {
    files: ['**/*.mjs'],
    extends: [esmConfig],
  },
  {
    rules: { // all "warn"s need fixing eventually
      'array-bracket-newline': 'warn',
      'array-bracket-spacing': 'warn',
      'array-element-newline': 'warn',
      'arrow-parens': 'warn',
      'block-spacing': 'warn',
      'brace-style': 'warn',
      'comma-dangle': 'warn',
      'comma-spacing': 'warn',
      'comma-style': 'warn',
      'computed-property-spacing': 'warn',
      'consistent-return': 'warn',
      'dot-notation': 'warn',
      'eol-last': 'warn',
      'function-call-argument-newline': 'warn',
      'function-paren-newline': 'warn',
      'generator-star-spacing': 'warn',
      'global-require': 'warn',
      'key-spacing': 'warn',
      'keyword-spacing': 'warn',
      'linebreak-style': 'warn',
      'max-lines-per-function': 'warn',
      'max-lines': 'warn',
      'max-nested-callbacks': 'warn',
      'max-params': 'warn',
      'max-statements-per-line': 'warn',
      'max-statements': 'warn',
      'multiline-comment-style': 'warn',
      'new-cap': 'warn',
      'new-parens': 'warn',
      'no-debugger': 'warn',
      'no-else-return': 'warn',
      'no-extra-parens': 'warn',
      'no-extra-semi': 'warn',
      'no-implicit-globals': 'warn',
      'no-lonely-if': 'warn',
      'no-mixed-operators': 'warn',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-multi-assign': 'warn',
      'no-multiple-empty-lines': 'warn',
      'no-negated-condition': 'warn',
      'no-new-func': 'warn',
      'no-param-reassign': 'warn',
      'no-plusplus': 'warn',
      'no-redeclare': 'warn',
      'no-sequences': 'warn',
      'no-shadow': 'warn',
      'no-trailing-spaces': 'warn',
      'no-undef': 'warn',
      'no-underscore-dangle': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-unused-expressions': 'warn',
      'no-unused-vars': 'warn',
      'no-use-before-define': 'warn',
      'no-useless-escape': 'warn',
      'object-curly-newline': 'warn',
      'object-curly-spacing': 'warn',
      'object-shorthand': 'warn',
      'one-var-declaration-per-line': 'warn',
      'operator-linebreak': 'warn',
      'quote-props': 'warn',
      'semi-spacing': 'warn',
      'semi-style': 'warn',
      'sort-keys': 'warn',
      'space-before-blocks': 'warn',
      'space-before-function-paren': 'warn',
      'space-in-parens': 'warn',
      'space-infix-ops': 'warn',
      'space-unary-ops': 'warn',
      'spaced-comment': 'warn',
      'wrap-iife': 'warn',
      'wrap-regex': 'warn',
      camelcase: 'warn',
      complexity: 'warn',
      curly: 'warn',
      eqeqeq: 'warn',
      indent: ['warn', 4],
      quotes: ['warn', 'single', 'avoid-escape'],
      semi: 'warn',
      strict: 'warn',

      'func-style': 'off',
    },
  },
  {
    files: [
      'test/yield/**/*.js', // generators
      'test/quotes/backtick.js', // template literals
    ],
    languageOptions: {
      ecmaVersion: 2015,
    },
  },
  {
    files: ['test/async/src.js'], // async functions
    languageOptions: {
      ecmaVersion: 2017,
    },
  },
  {
    files: ['test/spread/main.js'], // object spread
    languageOptions: {
      ecmaVersion: 2018,
    },
  },
  {
    files: ['test/bom/hello.js'],
    rules: {
      'unicode-bom': 'off',
    },
  },
  {
    files: [
      'index.js',
      'test/tr_order.js',
    ],
    rules: {
      'no-restricted-syntax': 'warn',
    }
  }
]);
