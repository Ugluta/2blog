/**
 * Central design tokens (madde 24, master prompt). packages/ui and both Next.js
 * apps consume these instead of hard-coding colors/spacing/typography/radius —
 * this is the single source of truth referenced by the future Tailwind config.
 */

export const colorTokens = {
  background: { light: "#ffffff", dark: "#0a0a0a" },
  foreground: { light: "#0a0a0a", dark: "#f5f5f5" },
  primary: { light: "#2563eb", dark: "#3b82f6" },
  muted: { light: "#f4f4f5", dark: "#18181b" },
  border: { light: "#e4e4e7", dark: "#27272a" },
  danger: { light: "#dc2626", dark: "#f87171" },
  success: { light: "#16a34a", dark: "#4ade80" },
} as const;

export const spacingTokens = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const radiusTokens = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  full: "9999px",
} as const;

export const typographyTokens = {
  fontFamily: {
    sans: "var(--font-sans, system-ui, sans-serif)",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
  },
} as const;

export const designTokens = {
  color: colorTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  typography: typographyTokens,
} as const;
