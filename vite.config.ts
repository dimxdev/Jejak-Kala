import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { yamlContent } from './tools/vite/yaml-content.ts';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss(), yamlContent()],
  resolve: {
    alias: {
      '@content': fromRoot('./content'),
      '@': fromRoot('./src'),
    },
  },
  build: { target: 'es2022' },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
