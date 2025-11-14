/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ CRITICAL: Content paths for purging unused CSS
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  
  // ✅ Safelist classes used dynamically
  safelist: [
    'animate-spin',
    'animate-pulse',
    'animate-slide-in',
    'animate-scale-in',
    'animate-fade-in',
    // Thêm các class động khác nếu cần
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.3em',
      },
      // ✅ Animations optimized
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(-50px)' 
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0)' 
          },
        },
        zoomIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.95)' 
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)' 
          },
        },
        // ✅ Thêm shimmer cho skeleton
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideIn: 'slideIn 0.5s ease-out',
        zoomIn: 'zoomIn 0.5s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  
  plugins: [],

  // ✅ OPTIMIZATION: Reduce CSS size
  corePlugins: {
    // Disable các plugins không dùng (uncomment nếu chắc chắn không dùng)
    // preflight: true, // Keep this for base styles
    // container: false,
    // accessibility: false,
  },
}