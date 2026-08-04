import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium British pub palette — dark wood, aged gold, deep green
        pub: {
          bg: '#14100d',          // near-black walnut
          surface: '#1f1812',     // card / panel background
          surface2: '#2a2019',    // raised surface (hover, inputs)
          wood: '#4a3222',        // oak wood accent
          'wood-light': '#6b4a30',
          gold: '#c9a15a',        // primary accent — brass/gold
          'gold-light': '#e0c284',
          'gold-dark': '#a17f3d',
          green: '#1f3d2e',       // deep pub green
          'green-light': '#2f5a44',
          cream: '#f2e8d8',       // primary text on dark
          muted: '#a89a86',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: '#c9a15a', foreground: '#14100d' },
        secondary: { DEFAULT: '#1f3d2e', foreground: '#f2e8d8' },
        destructive: { DEFAULT: '#8c3a2b', foreground: '#f2e8d8' },
        muted: { DEFAULT: '#2a2019', foreground: '#a89a86' },
        accent: { DEFAULT: '#2a2019', foreground: '#f2e8d8' },
        card: { DEFAULT: '#1f1812', foreground: '#f2e8d8' },
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
