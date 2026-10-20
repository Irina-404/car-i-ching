import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Copy the shared content at build time; keep data/ and assets/ as the only sources.
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-catalog-resources',
      apply: 'build',
      closeBundle() {
        mkdirSync(resolve('dist/data'), { recursive: true });
        for (const file of readdirSync(resolve('data')).filter(file => file.endsWith('.json'))) {
          cpSync(resolve('data', file), resolve('dist/data', file));
        }
        cpSync(resolve('assets/images/cars'), resolve('dist/assets/images/cars'), { recursive: true });
        cpSync(resolve('node_modules/@fontsource-variable/manrope/LICENSE'), resolve('dist/assets/Manrope-LICENSE'));
      },
    },
  ],
  base: './',
  publicDir: false,
  server: { port: 5173, strictPort: true, host: 'localhost' },
  preview: { port: 4173, strictPort: true, host: 'localhost' },
});
