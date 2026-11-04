import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

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

function parkingFrontendBundle() {
  return {
    name: 'parking-frontend-bundle',

    buildStart() {
      for (const file of legacySources) {
        const fullPath = path.resolve(file);
        if (fs.existsSync(fullPath)) {
          this.addWatchFile(fullPath);
        }
      }
    },

    generateBundle(_options, bundle) {
      const code = legacySources
        .map((file) => {
          const fullPath = path.resolve(file);
          if (!fs.existsSync(fullPath)) {
            return '';
          }
          return fs.readFileSync(fullPath, 'utf8').replace(/\s+$/, '');
        })
        .filter(Boolean)
        .join('\n') + '\n';

      if (!code.trim()) {
        return;
      }

      this.emitFile({
        type: 'asset',
        fileName: 'assets/js/app.bundle.js',
        source: code,
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [parkingFrontendBundle()],
  build: {
    target: 'es2020',
    sourcemap: true,
    cssCodeSplit: false,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        scanner: path.resolve(__dirname, 'scanner/index.html'),
      },
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
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
