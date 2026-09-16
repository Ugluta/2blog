import type { Config } from "tailwindcss";
import { designTokens } from "@2blog/config";

/** Same token bridge as apps/web (madde 24) — one palette, not a second copy. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: designTokens.color.background.light,
        foreground: designTokens.color.foreground.light,
        primary: designTokens.color.primary.light,
        muted: designTokens.color.muted.light,
        border: designTokens.color.border.light,
        danger: designTokens.color.danger.light,
        success: designTokens.color.success.light,
      },
      borderRadius: designTokens.radius,
    },
  },
  plugins: [],
};

export default config;
