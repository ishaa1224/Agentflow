/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Defining custom brand colors for a clean, modern, premium developer-tool aesthetic
        brand: {
          primary: '#6366f1',      // Indigo 500
          primaryHover: '#4f46e5', // Indigo 600
          success: '#10b981',      // Emerald 500
          danger: '#ef4444',       // Red 500
          darkBg: '#0b0f19',       // Deep navy/slate background
          cardBg: '#151c2c',       // High-contrast slate card bg
          border: '#222f46',       // Subtle border color
          textMuted: '#94a3b8',    // Slate 400 for subtext
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
}
