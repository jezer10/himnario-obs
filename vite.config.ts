import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/*.png', 'fonts/*', 'obs/*.lua'],
      manifest: {
        id: './',
        name: 'Himnario Adventista Broadcast',
        short_name: 'Himnario',
        description:
          'Himnos, letras y música para acompañar tus reuniones y controlar OBS.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#284cb8',
        background_color: '#0c0d0f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,ttf,svg,png}'],
      },
    }),
  ],
})
