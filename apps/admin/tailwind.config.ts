import type { Config } from "tailwindcss";
import { designTokens } from "@2blog/config";

/** Same token bridge as apps/web (madde 24) — one palette, not a second copy. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: designTokens.color.background,
        foreground: designTokens.color.foreground,
        primary: designTokens.color.primary,
        muted: designTokens.color.muted,
        border: designTokens.color.border,
        danger: designTokens.color.danger,
        success: designTokens.color.success,
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
      },
      borderRadius: designTokens.radius,
    },
  },
  plugins: [],
};

export default config;
