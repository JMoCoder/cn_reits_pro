import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: mode === 'production' ? '/cn_reits_pro/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/tushare_api': {
            target: 'https://api.tushare.pro',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/tushare_api/, '')
          }
        }
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/tushare_api': {
            target: 'https://api.tushare.pro',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/tushare_api/, '')
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
