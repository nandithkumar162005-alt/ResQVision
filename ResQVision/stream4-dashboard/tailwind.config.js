/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#08090C',
          nav: '#0E1015',
          card: '#12141A',
          panel: '#12141A',
          elevated: '#1A1D24',
          border: '#272A36',
          borderSubtle: '#1C1F28',
          text: '#FFFFFF',
          muted: '#94A3B8',
          subtle: '#64748B',
          accent: '#FFFFFF',
          accentHover: '#E2E8F0',
          accentBg: 'rgba(255, 255, 255, 0.08)',
          // Severity
          destroyed: '#EF4444',
          destroyedBg: 'rgba(239, 68, 68, 0.14)',
          majorDamage: '#F59E0B',
          majorDamageBg: 'rgba(245, 158, 11, 0.14)',
          neutral: '#64748B',
          neutralBg: 'rgba(100, 116, 139, 0.14)',
          confirmed: '#10B981',
          confirmedBg: 'rgba(16, 185, 129, 0.14)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      borderRadius: {
        card: '12px',
        panel: '14px',
      },
    },
  },
  plugins: [],
};
