import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePWA({
      injectRegister: 'script',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,zip,txt,json}'],
        maximumFileSizeToCacheInBytes: 5000000,
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        "name": "Snowcapped",
        "icons": [
          {
            "src": "icons/icon_192.png",
            "type": "image/png",
            "purpose": "any",
            "sizes": "192x192"
          },
          {
            "src": "icons/icon_512.png",
            "type": "image/png",
            "purpose": "any maskable",
            "sizes": "512x512"
          },
          {
            "src": "icons/icon.svg",
            "type": "image/svg+xml",
            "purpose": "any maskable"
          }
        ],
        "start_url": "/",
        "background_color": "#264653",
        "display": "standalone",
        "scope": "/",
        "theme_color": "#264653",
        "description": "A Minecraft: Java Edition 1.18+ dimension editor. Exports a multi-noise dimension file and a spline configuration."
      }
    })
  ],
  build: {
    sourcemap: true,
    outDir: "dist-web"
  },
})
