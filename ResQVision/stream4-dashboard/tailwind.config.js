/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        charcoal: {
          950: '#0E1013',
          900: '#14171C',
          850: '#1A1E24',
          800: '#20242C',
          700: '#2D323C',
          600: '#3D4451'
        },
        signal: {
          orange: '#F97316',
          orangeHover: '#EA580C',
          red: '#EF4444',
          amber: '#F59E0B'
        }
      }
    }
  },
  plugins: []
};
