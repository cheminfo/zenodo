import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false, // Disable file parallelism to avoid issues with shared resources
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, 'examples/**'],
    },
  },
});
