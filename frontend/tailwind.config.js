/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ide-bg': '#1a1b26',
        'ide-sidebar': '#16171f',
        'ide-panel': '#1e1f2e',
        'ide-border': '#2a2b3d',
        'ide-accent': '#7c6af7',
        'ide-accent-hover': '#9580ff',
        'ide-text': '#a9b1d6',
        'ide-text-bright': '#c0caf5',
        'ide-green': '#9ece6a',
        'ide-red': '#f7768e',
        'ide-blue': '#7aa2f7',
        'ide-yellow': '#e0af68',
        'ide-purple': '#bb9af7',
        'ide-cyan': '#7dcfff',
        'diff-add': '#1a2f1a',
        'diff-remove': '#2f1a1a',
        'diff-add-highlight': '#2d4a2d',
        'diff-remove-highlight': '#4a2d2d',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
