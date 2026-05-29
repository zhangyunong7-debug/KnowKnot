import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // KnowKnot 品牌色 (OneNote 紫)
        brand: {
          50: '#faf5fc',
          100: '#f0e3f5',
          200: '#e1c7eb',
          300: '#c99fdb',
          400: '#a86fc5',
          500: '#8e4dae',
          600: '#7b3993',
          700: '#6a2d7f',
          800: '#5a2769',
          900: '#4a2156',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(128, 57, 123, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(128, 57, 123, 0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cornell-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 40h60v20H0z' fill='%23f0f9ff' opacity='0.3'/%3E%3Cpath d='M0 0h60v35H0z' fill='%23ffffff' opacity='0.5'/%3E%3C/svg%3E")`,
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          'primary': '#7b3993',
          'primary-content': '#ffffff',
          'secondary': '#a86fc5',
          'secondary-content': '#ffffff',
          'accent': '#e5a50b',
          'accent-content': '#ffffff',
          'neutral': '#3d2e45',
          'neutral-content': '#ffffff',
          'base-100': '#faf8f5',
          'base-200': '#f3f0eb',
          'base-300': '#e8e3da',
          'base-content': '#3d2e45',
          'info': '#7b3993',
          'success': '#22c55e',
          'warning': '#e5a50b',
          'error': '#ef4444',
        },
        dark: {
          'primary': '#a86fc5',
          'primary-content': '#1a0d24',
          'secondary': '#8e4dae',
          'secondary-content': '#ffffff',
          'accent': '#e5a50b',
          'accent-content': '#1a0d24',
          'neutral': '#e8e3da',
          'neutral-content': '#3d2e45',
          'base-100': '#1a1420',
          'base-200': '#120d16',
          'base-300': '#0a070c',
          'base-content': '#f3f0eb',
          'info': '#a86fc5',
          'success': '#22c55e',
          'warning': '#e5a50b',
          'error': '#ef4444',
        },
      },
    ],
  },
};

export default config;
