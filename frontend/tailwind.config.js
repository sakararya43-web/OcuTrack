/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
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
        },
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        tealclinical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      keyframes: {
        'pupil-constrict': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '35%': { transform: 'scale(0.55)', opacity: '1' },
          '65%': { transform: 'scale(0.75)', opacity: '0.92' },
        },
        'telemetry-draw': {
          '0%': { strokeDashoffset: '400' },
          '100%': { strokeDashoffset: '0' },
        },
        'calm-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'pupil-constrict': 'pupil-constrict 2.4s ease-in-out infinite',
        'telemetry-draw': 'telemetry-draw 3s ease-out infinite',
        'calm-pulse': 'calm-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
