import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "#ffffff",
        lime: "#84cc16",
        blue: "#0ea5e9",
        ink: "#0f172a"
      },
      borderRadius: {
        "28": "28px"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};

export default config;
