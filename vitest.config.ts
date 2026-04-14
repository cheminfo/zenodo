import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    snapshotFormat: {
      maxOutputLength: 1e8,
    },
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, 'examples/**'],
    },
  },
});
