/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': {
          900: '#0a0e1a',
          800: '#0f1528',
          700: '#141c36',
          600: '#1a2444',
          500: '#1f2d52',
        },
        'cyber': {
          blue: '#00b4d8',
          cyan: '#00f5d4',
          red: '#ef4444',
          amber: '#f59e0b',
          green: '#10b981',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'packet-flow': 'packetFlow 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 180, 216, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 180, 216, 0.6)' },
        },
        packetFlow: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
