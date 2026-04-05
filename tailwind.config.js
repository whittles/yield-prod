/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Althoff Woodshop brand palette (extracted from althoffwoodshop.com)
        bg:       '#f5f4f0',       // warm off-white page background
        surface:  '#ffffff',       // card / panel background
        'surface-alt': '#f3f3f3', // alternate surface (matches site scheme-2)
        border:   '#e5e3de',       // warm-tinted border
        header:   '#242833',       // dark header (from site color-scheme-3)
        accent:   '#121212',       // near-black buttons / CTA (matches site buttons)
        'accent-hover': '#2d2d2d',
        success:  '#166534',
        'success-bg': '#dcfce7',
        warning:  '#92400e',
        'warning-bg': '#fef3c7',
        danger:   '#991b1b',
        'danger-bg': '#fee2e2',
        'text-primary': '#121212',
        'text-muted':   '#6b7280',
        'text-light':   '#9ca3af',
      },
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
      },
    },
  },
  plugins: [],
}
