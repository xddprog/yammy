import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    plugins: [
      tailwindcss(),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      svgr({
        svgrOptions: {
          exportType: 'default',
          ref: true,
          icon: true,
          svgo: true,
          titleProp: true,
        },
        include: ['**/*.svg'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@app': path.resolve(__dirname, 'src/app'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@widgets': path.resolve(__dirname, 'src/widgets'),
        '@features': path.resolve(__dirname, 'src/features'),
        '@entities': path.resolve(__dirname, 'src/entities'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@lib': path.resolve(__dirname, 'src/lib'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __DEV__: JSON.stringify(!isProd),
    },
    optimizeDeps: {
      include: ['@tanstack/react-query', 'react-router-dom', 'framer-motion', 'ky'],
    },
    build: {
      target: 'es2018',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id): string | undefined {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react'
              }
              if (id.includes('react-router-dom')) {
                return 'router'
              }
              if (id.includes('@tanstack/react-query')) {
                return 'query'
              }
              if (id.includes('framer-motion') || id.includes('lucide-react')) {
                return 'ui'
              }
            }
            return undefined
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
