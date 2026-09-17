import type { Config } from "tailwindcss";
import { designTokens } from "@2blog/config";

/**
 * Bridges packages/config's design tokens into Tailwind (master prompt
 * madde 24: "Renkler, spacing, typography ve radius merkezi olarak
 * yönetilsin") instead of hard-coding a second copy of the palette here.
 * Light-only by design — see packages/config/src/tokens.ts.
 */
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
