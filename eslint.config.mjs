import { defineConfig, globalIgnores } from 'eslint/config';
import cheminfo from 'eslint-config-cheminfo-typescript';

export default defineConfig(globalIgnores(['coverage', 'lib']), cheminfo, {
  rules: {
    '@typescript-eslint/naming-convention': 'off',
    camelcase: 'off',
  },
});
