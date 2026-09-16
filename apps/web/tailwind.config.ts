import type { Config } from "tailwindcss";
import { designTokens } from "@2blog/config";

/**
 * Bridges packages/config's design tokens into Tailwind (master prompt
 * madde 24: "Renkler, spacing, typography ve radius merkezi olarak
 * yönetilsin") instead of hard-coding a second copy of the palette here.
 * Dark-mode token values exist in packages/config but aren't wired in yet —
 * light-only for this phase, same honest-scope-cut as everywhere else.
 */
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
