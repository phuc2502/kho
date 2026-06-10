/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Font — Inter (Atlas Grotesk + Sharp Grotesk substitute) ──
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },

      // ── Dropbox color system ──────────────────────────────────────
      colors: {
        // Primary action accent — Dropbox Blue
        primary: {
          50:  '#eff5ff',
          100: '#dbeafe',
          500: '#0061fe',
          600: '#0052d9',
          700: '#003eb8',
        },
        // Surface tokens
        cream:   '#f7f5f2',   // Page canvas — warm off-white
        sand:    '#eee9e2',   // Alt card / border / hover bg
        // Text tokens
        'warm-ink': '#1e1919', // Primary text — warm near-black
        stone:      '#716b61', // Secondary text — warm desaturated gray
        // Accent
        magenta:    '#cd2f7b', // Decorative accent, low frequency
        // Pure white kept as Tailwind's default 'white'
      },

      // ── Border radius ─────────────────────────────────────────────
      borderRadius: {
        'btn':  '16px',  // Dropbox button radius
        'card': '8px',   // Card/image radius
        'nav':  '12px',  // Nav item radius
      },

      // ── Shadows — flat hairline style, no elevation ───────────────
      boxShadow: {
        card:   'none',
        subtle: 'none',
      },

      // ── Letter spacing ────────────────────────────────────────────
      letterSpacing: {
        'editorial': '-0.01em',
        'eyebrow':   '0.06em',
        'tight':     '-0.02em',
      },
    },
  },
  plugins: [],
}
