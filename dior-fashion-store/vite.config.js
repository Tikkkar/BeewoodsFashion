import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    
    // ✅ GZIP Compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false,
    }),

    // ✅ Brotli Compression (better than gzip, ~20% smaller)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),

    // ✅ Bundle analyzer (uncomment when needed)
    // visualizer({
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    //   filename: 'dist/stats.html',
    // }),
  ],

  // ✅ Build optimizations
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for smaller bundle
    
    // ✅ Target modern browsers for smaller output
    target: 'es2015',
    
    // ✅ Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10 bugs
      },
    },

    // ✅ Code splitting strategy - FIXED
    rollupOptions: {
      output: {
        // ⚡ IMPROVED: Dynamic chunking instead of hardcoded paths
        manualChunks: (id) => {
          // Node modules chunking
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') && !id.includes('router')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // UI libraries
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Other node_modules
            return 'vendor-other';
          }
          
          // ⚡ Admin pages (heavy - separate chunk)
          if (id.includes('/pages/admin/')) {
            return 'chunk-admin';
          }
          
          // ⚡ Auth pages
          if (id.includes('/pages/auth/')) {
            return 'chunk-auth';
          }
          
          // ⚡ User profile pages
          if (id.includes('/pages/user/')) {
            return 'chunk-user';
          }
          
          // ⚡ Chatbot (lazy load)
          if (id.includes('/components/chatbot/') || id.includes('ChatWidget')) {
            return 'chunk-chatbot';
          }
        },
        
        // ✅ Organized file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          
          // CSS files
          if (name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          
          // Images
          if (/\.(png|jpe?g|svg|gif|webp|avif|ico)$/i.test(name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          
          // Fonts
          if (/\.(woff2?|eot|ttf|otf)$/i.test(name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          // Other assets
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // ✅ Performance settings
    chunkSizeWarningLimit: 800, // More strict warning (800KB instead of 1000KB)
    cssCodeSplit: true, // Split CSS per route
    assetsInlineLimit: 4096, // 4KB - inline small assets
    
    // ✅ Improve build performance
    reportCompressedSize: false, // Faster builds (skip gzip reporting)
    
    // ✅ Modern browser target for smaller output
    cssTarget: 'chrome80',
  },

  // ✅ Dev server optimizations
  server: {
    port: 3000,
    open: true,
    strictPort: false, // Try next port if 3000 is busy
    
    // ✅ CORS for development
    cors: true,
    
    // ✅ HMR optimization
    hmr: {
      overlay: true,
    },
    
    // ✅ Faster warmup
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/main.jsx',
        './src/pages/HomePage.jsx',
      ],
    },
  },

  // ✅ Preview server (production testing)
  preview: {
    port: 4173,
    open: true,
  },

  // ✅ Dependencies pre-bundling (IMPROVED)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
    
    // ✅ Exclude large deps that benefit from lazy loading
    exclude: [
      '@supabase/supabase-js', // Load on-demand
    ],
    
    // ✅ Force optimization on these
    force: false, // Only re-optimize when dependencies change
  },

  // ✅ CSS optimizations
  css: {
    devSourcemap: false,
    
    // ✅ PostCSS optimization (if you use Tailwind)
    postcss: {
      plugins: [
        // Add autoprefixer if needed
        // require('autoprefixer'),
      ],
    },
  },

  // ✅ Resolve aliases (optional but useful)
  resolve: {
    alias: {
      // Add path aliases if needed
      // '@': '/src',
      // '@components': '/src/components',
      // '@pages': '/src/pages',
    },
  },

  // ✅ Performance optimizations
  esbuild: {
    // ✅ Remove console in production via esbuild (faster than terser)
    drop: ['console', 'debugger'],
    
    // ✅ Legal comments handling
    legalComments: 'none',
  },
})