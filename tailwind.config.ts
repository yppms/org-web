import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        // The mobile app frame width. Use `max-w-app` instead of `max-w-[425px]`.
        app: "425px",
      },
      // fontFamily: {
      //   sans: ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
      // },
      // animation: {
      //   gradient: "gradient 4s ease infinite",
      // },
      // keyframes: {
      //   gradient: {
      //     "0%": {
      //       "background-position": "0% 50%",
      //     },
      //     "50%": {
      //       "background-position": "100% 50%",
      //     },
      //     "100%": {
      //       "background-position": "0% 50%",
      //     },
      //   },
      // },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        miftahussalam: {
          // Strict semantic palette: exactly one green and one blue.
          // primary = brand / positive / paid / money. success is rethemed to
          // equal primary so there is a single green token (see ui/README.md).
          primary: "#22c55e",
          "primary-focus": "#16a34a",
          "primary-content": "#ffffff",
          secondary: "#6b7280",
          "secondary-focus": "#4b5563",
          "secondary-content": "#ffffff",
          // accent is rethemed to equal info so there is a single blue token.
          accent: "#0ea5e9",
          "accent-focus": "#0284c7",
          "accent-content": "#ffffff",
          neutral: "#374151",
          "neutral-focus": "#1f2937",
          "neutral-content": "#f9fafb",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
          "base-content": "#0f172a",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
      "light",
      "dark",
    ],
  },
} as any;

export default config;
