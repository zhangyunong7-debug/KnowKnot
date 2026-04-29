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
        // KnowKnot 品牌色
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(14, 165, 233, 0)' },
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
          'primary': '#0ea5e9',
          'primary-content': '#ffffff',
          'secondary': '#6366f1',
          'secondary-content': '#ffffff',
          'accent': '#f59e0b',
          'accent-content': '#ffffff',
          'neutral': '#1e293b',
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',
          'base-200': '#f8fafc',
          'base-300': '#e2e8f0',
          'base-content': '#1e293b',
          'info': '#38bdf8',
          'success': '#22c55e',
          'warning': '#f59e0b',
          'error': '#ef4444',
        },
        dark: {
          'primary': '#38bdf8',
          'primary-content': '#0c4a6e',
          'secondary': '#818cf8',
          'secondary-content': '#1e1b4b',
          'accent': '#fbbf24',
          'accent-content': '#451a03',
          'neutral': '#e2e8f0',
          'neutral-content': '#1e293b',
          'base-100': '#1e293b',
          'base-200': '#0f172a',
          'base-300': '#020617',
          'base-content': '#f8fafc',
          'info': '#38bdf8',
          'success': '#22c55e',
          'warning': '#f59e0b',
          'error': '#ef4444',
        },
      },
    ],
  },
};

export default config;
