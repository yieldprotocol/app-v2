
// eslint-disable-next-line no-undef
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'airbnb-typescript'
      // 'eslint:recommended',
      // 'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
        project: './tsconfig.json',
    }
};