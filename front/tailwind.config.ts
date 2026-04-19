import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "main-dark": "#0f172a",
        font_color: "#f8fafc",
        brown: "#a16207",
      },
      fontFamily: {
        Laila: ["Laila", "sans-serif"],
      },
    },
  },
} satisfies Config;
