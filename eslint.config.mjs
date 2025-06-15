// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  { linterOptions: { reportUnusedDisableDirectives: 'warn' } },
  // global ignores. also ignore temporarily bundled rollup config
  { ignores: ['lib', 'tmp', 'rollup.config-*.mjs'] },
  {
    files: ['.mocharc.cjs', 'examples/*', 'test/fixtures/*'],
    languageOptions: { globals: globals.node }
  },
  {
    // for *.ts files only
    files: ['**/*.ts'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'warn' }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-expressions': [
        'warn',
        { allowShortCircuit: true, allowTernary: true }
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }
      ],
      curly: ['warn', 'multi-line'],
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'no-constant-condition': 'warn',
      'no-empty': 'warn',
      'no-lonely-if': 'warn',
      'no-throw-literal': 'warn',
      'no-unused-expressions': 'off', // use typescript-eslint
      'no-unused-private-class-members': 'warn',
      'no-unused-vars': 'off', // use typescript-eslint
      'no-useless-assignment': 'warn',
      'no-useless-rename': 'warn',
      'no-var': 'warn',
      'object-shorthand': 'warn',
      'prefer-const': 'warn',
      quotes: ['warn', 'single', 'avoid-escape'],
      semi: 'warn'
    }
  }
);
