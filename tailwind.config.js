/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './cloudsim/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FBF4E4',
          100: '#F4E8CC',
          200: '#E9D5A8',
          300: '#D9BF86',
          400: '#C4A263',
        },
        leather: {
          500: '#8A5A2B',
          600: '#6B4423',
          700: '#4E3119',
          800: '#35210F',
          900: '#1F1208',
        },
        ink: '#2A1B0E',
        gold: {
          DEFAULT: '#B8862B',
          light: '#E3B64F',
          pale: '#F0D79A',
        },
        wax: '#7A1E1E',
        forest: '#3F5B3A',
        ember: '#C8561E',
        steel: '#5E6A73',
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'Cinzel', 'Georgia', 'serif'],
        heading: ['Cinzel', 'Georgia', 'serif'],
        body: ['"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        prose: '68ch',
        page: '1200px',
      },
      boxShadow: {
        parchment:
          '0 1px 0 rgba(251,244,228,.7) inset, 0 0 0 1px rgba(184,134,43,.25), 0 10px 30px -12px rgba(53,33,15,.45)',
        card: '0 2px 4px rgba(53,33,15,.12), 0 18px 40px -24px rgba(53,33,15,.55)',
        'inner-gold': 'inset 0 0 24px rgba(184,134,43,.18)',
      },
      transitionTimingFunction: {
        quill: 'cubic-bezier(.22,.8,.3,1)',
      },
      keyframes: {
        flicker: {
          '0%,100%': { transform: 'scaleY(1) scaleX(1) rotate(-1deg)', opacity: '0.92' },
          '30%': { transform: 'scaleY(1.08) scaleX(.94) rotate(1.5deg)', opacity: '1' },
          '55%': { transform: 'scaleY(.94) scaleX(1.04) rotate(-2deg)', opacity: '0.85' },
          '75%': { transform: 'scaleY(1.05) scaleX(.97) rotate(1deg)', opacity: '0.96' },
        },
        sway: {
          '0%,100%': { transform: 'translateX(0) rotate(0deg)' },
          '50%': { transform: 'translateX(4px) rotate(.4deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'seal-press': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(.94)' },
          '100%': { transform: 'scale(1)' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '15%': { opacity: '.8' },
          '100%': { transform: 'translateY(-90px) scale(.2)', opacity: '0' },
        },
      },
      animation: {
        flicker: 'flicker 2.4s ease-in-out infinite',
        sway: 'sway 7s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        'seal-press': 'seal-press .35s cubic-bezier(.22,.8,.3,1)',
      },
    },
  },
  plugins: [],
}