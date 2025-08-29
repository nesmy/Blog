// tailwind.config.js
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [typography],
};
