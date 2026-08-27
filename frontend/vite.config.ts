import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const buildTime = Date.now().toString();

const versionTrackerPlugin = () => ({
  name: 'version-tracker-plugin',
  writeBundle(options: any) {
    const outDir = options.dir || path.resolve(__dirname, 'dist');
    const versionFile = path.resolve(outDir, 'version.json');
    try {
      fs.writeFileSync(versionFile, JSON.stringify({ buildTime, version: '1.0.0' }, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write version.json', e);
    }
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionTrackerPlugin()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/assets-backend': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack')) return 'tanstack';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('exceljs') || id.includes('jspdf')) return 'export-tools';
          }
        },
      },
    },
  },
})
