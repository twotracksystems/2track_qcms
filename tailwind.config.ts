import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#fc9444", // Saffron for CTA (buttons, etc.)
          secondary: "#f0ebe4", // Jet for text
          accent: "#B0B5BE", // French gray for other elements
          neutral: "#2F2F2E", // Jet for neutral element
          "text-primary-content": "#7b8089",
        },
      },
    ],
  },
} satisfies Config;
