import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Vite/sirv labels every `.gz` file with `Content-Encoding: gzip`, which
 * makes the browser auto-decompress the response. Kuromoji's dictionary
 * loader expects to receive the raw gzipped bytes and gunzip them itself,
 * so the auto-decompression breaks initialization. Suppress the header for
 * the kuromoji dict path only — applies to both `dev` and `preview`.
 * GitHub Pages does not auto-encode pre-gzipped assets, so production is
 * unaffected.
 */
function preserveDictGzip(): Plugin {
  return {
    name: 'preserve-dict-gzip',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.includes('/dict/') && req.url.endsWith('.dat.gz')) {
          const orig = res.setHeader.bind(res)
          res.setHeader = function (name: string, value: string | number | readonly string[]) {
            if (typeof name === 'string' && name.toLowerCase() === 'content-encoding') return res
            return orig(name, value)
          }
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.includes('/dict/') && req.url.endsWith('.dat.gz')) {
          const orig = res.setHeader.bind(res)
          res.setHeader = function (name: string, value: string | number | readonly string[]) {
            if (typeof name === 'string' && name.toLowerCase() === 'content-encoding') return res
            return orig(name, value)
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/japanese-learner/',
  plugins: [
    preserveDictGzip(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon-180.png',
      ],
      manifest: {
        name: '日語學習卡',
        short_name: '日語卡',
        description: '針對中文使用者的日語單字與文法翻卡學習 App',
        lang: 'zh-Hant',
        start_url: '/japanese-learner/',
        scope: '/japanese-learner/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#2563eb',
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
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2}'],
        navigateFallback: '/japanese-learner/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
