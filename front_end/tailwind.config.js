// tailwind.config.js

module.exports = {
  mode: 'jit', // Enable JIT (Just-In-Time) mode for faster build times (optional)
  purge: [
    './src/**/*.{js,jsx,ts,tsx}', // Purge CSS within these files
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('tailwindcss'), // Include Tailwind CSS
    require('autoprefixer'), // Include autoprefixer for vendor prefixing
    // You can add other PostCSS plugins here if needed
  ],
};
