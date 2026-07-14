/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      colors: {
        space: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#030712',
        },
      },
      boxShadow: {
        'glow-green': '0 0 15px rgba(40, 167, 69, 0.4)',
        'glow-red': '0 0 15px rgba(220, 53, 69, 0.4)',
        'glow-blue': '0 0 15px rgba(0, 0, 255, 0.4)',
        'glow-purple': '0 0 15px rgba(111, 66, 193, 0.4)',
      }
    },
  },
  plugins: [],
}
