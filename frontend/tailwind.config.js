/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#050B10',
        deepteal: '#071A20',
        neongreen: '#00F5A0',
        cyan: '#00D9FF',
        icewhite: '#EAF4F4',
        subtext: '#9CA3AF',
        aroraborder: '#18333A',
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 15px rgba(0, 245, 160, 0.25)',
        cyan: '0 0 15px rgba(0, 217, 255, 0.25)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.7)',
      },
    },
  },
  plugins: [],
};
