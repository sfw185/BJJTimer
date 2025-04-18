import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'logo192.png',
        'logo512.png',
        'go.mp3',
        'soon.mp3',
        'ready.mp3',
        'finish.mp3'
      ],
      manifest: false, // Use existing manifest file
      workbox: {
        // Pre-cache all matching assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        // Use network-first strategy for navigation and assets, falling back to cache when offline
        runtimeCaching: [
          {
            // HTML navigation requests
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Static assets: JS, CSS, images, audio
            urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|ico|mp3)$/,  
            handler: 'NetworkFirst',
            options: {
              cacheName: 'asset-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
