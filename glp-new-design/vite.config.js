import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'hero-bg.png'],
      manifest: {
        name: 'uGlowMD - Personalized Medical Care',
        short_name: 'uGlowMD',
        description: 'Personalized telehealth care — weight loss, sexual health, hair restoration, longevity & more.',
        theme_color: '#0A0A0A',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['health', 'medical', 'lifestyle'],
        screenshots: [],
      },
      workbox: {
        // Cache all pages + assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp,woff,woff2}'],
        // mp4 video files excluded from precache (too large, stream instead)
        // Network-first for API/Supabase calls, cache-first for static assets
        runtimeCaching: [
          {
            // Supabase API — network first, fall back to cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
            },
          },
          {
            // Images from external CDNs (e.g. Google Photos, Stripe)
            urlPattern: /^https:\/\/lh3\.googleusercontent\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
          {
            // Stripe.js — always network
            urlPattern: /^https:\/\/js\.stripe\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
        // Don't cache admin dashboard routes by default
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/admin/, /^\/api/],
        // Raise the max size for precached files (images in public folder)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      devOptions: {
        // Enable PWA in dev for testing
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    // Raise the warning limit — the project has large image/video assets
    chunkSizeWarningLimit: 3500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split large vendor libs into separate chunks
          if (id.includes('node_modules/recharts')) return 'recharts';
          if (id.includes('node_modules/@stripe')) return 'stripe';
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/react-quill')) return 'quill';
        }
      }
    }
  }
})
