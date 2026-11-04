import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(rootDir, 'dist');

const legacySources = [
  'assets/js/core.js',
  'assets/js/records-shared.js',
  'assets/js/auth-navigation.js',
  'assets/js/admin/dashboard.js',
  'assets/js/admin/management.js',
  'assets/js/admin/advanced.js',
  'assets/js/control/control.js',
  'assets/js/admin/requests.js',
  'assets/js/admin/incidents.js',
  'assets/js/admin/audit.js',
  'assets/js/owner/owner.js',
];

function copyStaticAssets() {
  const sourceAssets = path.join(rootDir, 'assets');
  const outputAssets = path.join(outputDir, 'assets');

  fs.cpSync(sourceAssets, outputAssets, {
    recursive: true,
    filter(source) {
      const relativePath = path.relative(sourceAssets, source).split(path.sep).join('/');
      // Keep Vite's compiled entry and the legacy bundle emitted by this config.
      return relativePath !== 'js/supabase/entry.js' && relativePath !== 'js/app.bundle.js';
    },
  });

  for (const entry of ['index.html', 'scanner']) {
    const source = path.join(rootDir, entry);
    if (fs.existsSync(source)) {
      fs.cpSync(source, path.join(outputDir, entry), { recursive: true });
    }
  }
}

function parkingFrontendBundle() {
  return {
    name: 'parking-frontend-bundle',

    buildStart() {
      for (const file of legacySources) {
        this.addWatchFile(path.resolve(rootDir, file));
      }
    },

    generateBundle() {
      const code = legacySources
        .map((file) => fs.readFileSync(path.resolve(rootDir, file), 'utf8').replace(/\s+$/, ''))
        .join('\n') + '\n';

      this.emitFile({
        type: 'asset',
        fileName: 'assets/js/app.bundle.js',
        source: code,
      });
    },

    writeBundle() {
      // The app intentionally keeps its existing HTML and classic-script ordering.
      // Vite bundles the ESM composition root while static assets are copied verbatim.
      copyStaticAssets();
    },
  };
}

export default defineConfig({
  root: rootDir,
  base: './',
  plugins: [parkingFrontendBundle()],
  build: {
    target: 'es2020',
    sourcemap: true,
    outDir: outputDir,
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(rootDir, 'assets/js/supabase/entry.js'),
      output: {
        entryFileNames: 'assets/js/supabase/entry.js',
        chunkFileNames: 'assets/js/supabase/[name]-[hash].js',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
