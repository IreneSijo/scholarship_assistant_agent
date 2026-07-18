/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#132A3A",
          50: "#EEF2F4",
          100: "#D6DFE4",
          200: "#AEC0C9",
          400: "#4A6577",
          600: "#26404F",
          700: "#1B3242",
          800: "#132A3A",
          900: "#0C1D28",
        },
        paper: "#F8F5EC",
        seal: {
          DEFAULT: "#B98A2E",
          light: "#E4C489",
          dark: "#8A6620",
        },
        moss: "#3A6B4A",
        rust: "#B0472C",
      },
      fontFamily: {
        display: ["\"Fraunces\"", "serif"],
        body: ["\"Inter\"", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(19,42,58,0.06), 0 4px 16px rgba(19,42,58,0.06)",
      },
      borderRadius: {
        seal: "999px",
      },
    },
  },
  plugins: [],
};
