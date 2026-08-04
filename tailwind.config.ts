import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium British pub palette — dark wood, aged gold, deep green
        pub: {
          bg: '#1c130d',          // warm dark walnut (was near-black)
          surface: '#271b13',     // card / panel background
          surface2: '#362419',    // raised surface (hover, inputs)
          wood: '#5c3b23',        // oak wood accent
          'wood-light': '#7e5636',
          gold: '#d1a25c',        // primary accent — brass/gold, warmed up
          'gold-light': '#e8c687',
          'gold-dark': '#ab8142',
          green: '#24402f',       // deep pub green
          'green-light': '#33604a',
          cream: '#f6ead9',       // primary text on dark
          muted: '#b7a58d',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: '#d1a25c', foreground: '#1c130d' },
        secondary: { DEFAULT: '#24402f', foreground: '#f6ead9' },
        destructive: { DEFAULT: '#8c3a2b', foreground: '#f6ead9' },
        muted: { DEFAULT: '#362419', foreground: '#b7a58d' },
        accent: { DEFAULT: '#362419', foreground: '#f6ead9' },
        card: { DEFAULT: '#271b13', foreground: '#f6ead9' },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      backgroundImage: {
        'wood-texture': "url('/images/wood-texture.jpg')",
      },
    },
  },
  plugins: [],
};

export default config;
