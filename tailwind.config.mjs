import sfoodPreset from "@sfood/ui/tailwind.config.js";

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [sfoodPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@sfood/ui/dist/**/*.js",
  ],
};

export default config;
