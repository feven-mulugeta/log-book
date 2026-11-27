import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        useCredentials: true,
        includeAssets: [],
        manifest: {
          id: '/',
          name: 'NursLog - Nursing e-Logbook & Clinical Portfolio',
          short_name: 'NursLog',
          description:
            'Offline-ready e-Logbook and e-portfolio for nursing students with mentor digital signing, clinical rotation progress tracking, reflection journal, and certified academic exports.',
          theme_color: '#0d9488',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/__/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                (url.pathname.startsWith('/api/') ||
                  url.pathname.startsWith('/ws/') ||
                  url.pathname.startsWith('/__/')),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                !url.pathname.startsWith('/api/') &&
                !url.pathname.startsWith('/ws/') &&
                !url.pathname.startsWith('/__') &&
                !url.pathname.endsWith('/manifest.webmanifest'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'app-runtime-shell',
                networkTimeoutSeconds: 4,
                expiration: {
                  maxEntries: 250,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'classic',
          navigateFallback: 'index.html',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Disable Vite HMR WebSocket and file watching by default to prevent ~60s proxy disconnect reload loops
      hmr: process.env.ENABLE_HMR === 'true',
      watch:
        process.env.ENABLE_HMR === 'true'
          ? {
              ignored: ['**/data/**', '**/ncep_store.json', '**/.git/**'],
            }
          : null,
    },
  };
});
