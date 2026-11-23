/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,html}",
    "./client/index.html",
    "./client/src/**/*.{ts,tsx,html}",
    "../client/index.html",
    "../client/src/**/*.{ts,tsx,html}"
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#1F2937",
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#0B0F17",
        },
        gold: {
          DEFAULT: "#D4A017",
          light: "#FDE047",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D4A017",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', '"Playfair Display"', 'Georgia', 'serif'],
        gujarati: ['"Noto Sans Gujarati"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        card: "1.25rem",
        '2xl': "1.25rem",
        '3xl': "1.75rem",
      },
      boxShadow: {
        'gold-sm': "0 2px 10px -2px rgba(212, 160, 23, 0.2)",
        'gold': "0 10px 25px -5px rgba(212, 160, 23, 0.3)",
        'gold-lg': "0 20px 35px -10px rgba(212, 160, 23, 0.4)",
        'inner-gold': "inset 0 1px 1px 0 rgba(254, 240, 138, 0.4)",
        'luxury': "0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)",
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.35s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
