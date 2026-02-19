/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Terminal color palette
        terminal: {
          bg: '#0a0a0a',
          surface: '#141414',
          border: '#2a2a2a',
          text: '#e5e5e5',
          muted: '#737373',
          accent: '#3b82f6'
        },
        gain: {
          DEFAULT: '#22c55e',
          muted: '#166534'
        },
        loss: {
          DEFAULT: '#ef4444',
          muted: '#991b1b'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'xxs': '0.625rem'
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        bounceIn: 'bounceIn 0.5s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
        pulse: 'pulse 2s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    }
  },
  plugins: []
};
