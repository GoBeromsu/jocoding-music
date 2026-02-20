import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            sourcemap: true,
            rollupOptions: {
              external: ['music-metadata', 'electron', 'openai', 'yt-dlp-wrap', 'dotenv', 'ffmpeg-static'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.cts',
        vite: {
          esbuild: {
            include: /\.(ts|cts|mts)$/,
          },
          build: {
            sourcemap: true,
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs',
              },
              external: ['electron'],
            },
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
