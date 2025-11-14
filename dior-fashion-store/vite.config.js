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

    // ✅ Brotli Compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),

    // ✅ Bundle analyzer (chỉ chạy khi cần)
    // Uncomment để xem bundle size analysis
    // visualizer({
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],

  // ✅ Build optimizations
  build: {
    // Output directory
    outDir: 'dist',
    
    // ✅ Source maps (disable in production)
    sourcemap: false,
    
    // ✅ Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },

    // ✅ Code splitting strategy
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          
          // Admin routes (heavy)
          'admin': [
            './src/pages/admin/AdminLayout.jsx',
            './src/pages/admin/AdminDashboard.jsx',
            './src/pages/admin/AdminProducts.jsx',
            './src/pages/admin/AdminOrders.jsx',
          ],
          
          // Chatbot (load separately)
          'chatbot': [
            './src/components/chatbot/ChatWidget.jsx',
          ],
        },
        
        // ✅ Chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Organize assets by type
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|svg|gif|webp|avif)$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // ✅ Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1000KB warning threshold
    
    // ✅ CSS code splitting
    cssCodeSplit: true,
    
    // ✅ Asset inline limit
    assetsInlineLimit: 4096, // 4KB - inline small assets as base64
  },

  // ✅ Dev server optimizations
  server: {
    port: 3000,
    open: true,
    // ✅ HMR optimization
    hmr: {
      overlay: true,
    },
  },

  // ✅ Dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
    // Exclude heavy libs that should be lazy loaded
    exclude: [],
  },

  // ✅ CSS preprocessing
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      // Add preprocessor options if needed
    },
  },
})