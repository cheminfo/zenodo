import cheminfo from 'eslint-config-cheminfo-typescript';

export default [
  ...cheminfo,
  {
    languageOptions: {
      globals: {},
    },
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      camelcase: 'off',
    },
  },
];
