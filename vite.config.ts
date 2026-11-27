import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'privacy-policy.html',
          'download.html',
          'robots.txt',
          'sitemap.xml',
          'screenshots/mobile-home.png',
          'screenshots/mobile-form6.png',
          'screenshots/desktop-home.png',
          'screenshots/feature-graphic-1024x500.png',
        ],
        manifest: {
          id: '/',
          name: 'blo form fill pdf',
          short_name: 'BLO Form PDF',
          description:
            'Offline-ready Election Commission of India Form 6, Form 7, and Form 8 PDF filler with live passport photo capture, Devanagari rendering, and instant PDF preview.',
          lang: 'en',
          dir: 'ltr',
          theme_color: '#1E3A5F',
          background_color: '#F8FAFC',
          display: 'standalone',
          display_override: ['standalone', 'window-controls-overlay'],
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          prefer_related_applications: false,
          launch_handler: {
            client_mode: 'navigate-existing',
          },
          categories: ['government', 'productivity', 'utilities'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshots/mobile-home.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'blo form fill pdf home screen with Form 6, Form 7, and Form 8 launcher buttons',
            },
            {
              src: '/screenshots/mobile-form6.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Form 6 voter registration with live camera photo capture and offline PDF generation',
            },
            {
              src: '/screenshots/desktop-home.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Desktop view of blo form fill pdf for offline ECI Form 6, 7, and 8 PDF stamping',
            },
          ],
          shortcuts: [
            {
              name: 'Form-6 (New Inclusion)',
              short_name: 'Form-6',
              description: 'Fill ECI Form-6 for new voter registration',
              url: '/?form=form6',
              icons: [{src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png'}],
            },
            {
              name: 'Form-7 (Deletion)',
              short_name: 'Form-7',
              description: 'Fill ECI Form-7 for voter deletion or objection',
              url: '/?form=form7',
              icons: [{src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png'}],
            },
            {
              name: 'Form-8 (Correction / PwD)',
              short_name: 'Form-8',
              description: 'Fill ECI Form-8 for correction, shifting, or replacement EPIC',
              url: '/?form=form8',
              icons: [{src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png'}],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,woff,woff2,pdf}'],
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/privacy-policy\.html$/,
            /^\/download\.html$/,
            /^\/robots\.txt$/,
            /^\/sitemap\.xml$/,
            /^\/\.well-known\//,
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
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
            {
              urlPattern: /\/assets\/aistudio\/.*\.pdf$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'eci-pdf-templates-cache',
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
          enabled: false,
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
