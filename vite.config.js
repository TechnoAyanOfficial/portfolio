import path from 'path';
import { defineConfig } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: path.resolve(__dirname, './src'),
  publicDir: path.resolve(__dirname, './public'),
  build: {
    outDir: path.resolve(__dirname, './build'),
  },
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, './src') }],
  },
  assetsInclude: ['**/*.glb', '**/*.hdr'],
  plugins: [
    react(),
    svgrPlugin({
      svgrOptions: {
        icon: false,
      },
    }),
  ],
});
