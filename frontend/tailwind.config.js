/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090e',
          900: '#0b0f17',
          850: '#101622',
          800: '#161e2e',
          700: '#222d42',
        },
        verified: {
          500: '#10b981',
          400: '#34d399',
          900: '#064e3b',
        },
        tampered: {
          500: '#ef4444',
          400: '#f87171',
          900: '#7f1d1d',
        },
        cyber: {
          cyan: '#06b6d4',
          amber: '#f59e0b',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
