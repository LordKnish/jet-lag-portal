/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      width: {
        '1/5': '20%',
        '4/5': '80%',
      },
      colors: {
        'jl': {
          yellow: '#F4D03F',
          salmon: '#E9967A',
          sage: '#9BC4AA',
          teal: '#5F9EA0',
          cream: '#FAF5E9',
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'curved': '2.5rem',
      }
    },
  },
  plugins: [],
}