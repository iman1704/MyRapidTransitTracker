/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1e293b', // Slate-800 equivalent
        'dark-card': '#334155', // Slate-700 equivalent
        'primary-accent': '#06b6d4', // Cyan-500
      },
    },
  },
  plugins: [],
}
