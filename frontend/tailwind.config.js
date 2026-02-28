/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-root": "var(--bg-root)",
        "bg-surface": "var(--bg-surface)",
        "bg-elevated": "var(--bg-elevated)",
        "border-subtle": "var(--border-subtle)",
        "border-muted": "var(--border-muted)",
        "border-accent": "var(--border-accent)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "modality-semantic": "var(--modality-semantic)",
        "modality-vocal": "var(--modality-vocal)",
        "modality-visual": "var(--modality-visual)",
        "score-low": "var(--score-low)",
        "score-mid": "var(--score-mid)",
        "score-high": "var(--score-high)",
      },
      fontFamily: {
        sans: ["Geist", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["Geist Mono", "SF Mono", "Fira Code", "monospace"],
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse_glow: {
          "0%, 100%": { boxShadow: "0 0 0px rgba(239,68,68,0)" },
          "50%": { boxShadow: "0 0 16px rgba(239,68,68,0.4)" },
        },
        bounce_dot: {
          "0%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
        pulse_glow: "pulse_glow 2s ease-in-out infinite",
        bounce_dot: "bounce_dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
