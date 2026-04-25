import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@ctbm/storage': resolve(__dirname, 'packages/storage/src/index.ts'),
      '@ctbm/core': resolve(__dirname, 'packages/core/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['packages/*/src/**/*.ts'],
    },
  },
})

