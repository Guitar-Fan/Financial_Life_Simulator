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
      }
    }
  },
  plugins: []
};
