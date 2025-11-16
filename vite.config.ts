import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          // Assets in `public` are automatically included. We only need to list assets from other locations.
          includeAssets: ['logo.svg'],
          manifest: {
            name: 'Benvis Life OS',
            short_name: 'Benvis',
            description: 'A smart life management system to help you organize your goals, habits, and daily life, based on the Benvis Life OS concept. This is a React web application implementation.',
            theme_color: '#0F0B1A',
            background_color: '#0F0B1A',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            orientation: 'portrait-primary',
            icons: [
              {
                src: '/logo.svg',
                sizes: '192x192 256x256',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: '/logo-maskable.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.'),
        }
      }
    };
});
