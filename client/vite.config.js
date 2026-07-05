import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ProgressBook',
        short_name: 'ProgressBook',
        description: 'Track your day. Own your progress. To-dos, time tracking, and finances in one place.',
        theme_color: '#C8964E',
        background_color: '#F7F7F5',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache app shell (JS, CSS, HTML) with cache-first strategy
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // API calls use network-first (try server, fall back to cache)
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/auth\/.*/,
            handler: 'NetworkOnly', // Never cache auth requests
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
