// eslint-disable-next-line no-undef
module.exports = {
  // root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['airbnb-typescript', 'react-app', 'prettier'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // "@typescript-eslint/no-unused-expressions": ["error", { "allowTernary": true }],
    'arrow-body-style': ['error', 'as-needed'],
    'linebreak-style': [0, 'error', 'windows'],
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
    ],
    'object-curly-spacing': ['warn', 'always'],
    'object-curly-newline': 'off',
    'operator-linebreak': 'off',

    'max-len': [
      'warn',
      {
        code: 120,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
      },
    ],
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    'react/jsx-key': 'warn',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx', 'src/tests/**/*'],
      },
    ],
    'react/jsx-props-no-spreading': 'off',
    'import/prefer-default-export': 'off',
    'react/jsx-boolean-value': 'off',
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-wrap-multilines': 'off',
    'react/destructuring-assignment': 'off',
    'no-underscore-dangle': 'off',

    'brace-style': 'off',
    '@typescript-eslint/brace-style': ['error'],

    // remove below to check before prod:
    'no-console': 'off',
  },
};
