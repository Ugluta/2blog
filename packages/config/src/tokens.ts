/**
 * Central design tokens (madde 24, master prompt). packages/ui and both Next.js
 * apps consume these instead of hard-coding colors/spacing/typography/radius —
 * this is the single source of truth referenced by the future Tailwind config.
 *
 * Light-only, deliberately — a corporate/tech-product look (crisp white
 * surfaces, a single confident accent, restrained neutrals), not a
 * light+dark system with a switcher. No `dark` variants are defined; adding
 * dark mode later means adding them back here, not overriding utilities
 * per-component.
 */

export const colorTokens = {
  background: "#ffffff",
  foreground: "#0f172a",
  primary: "#4338ca",
  muted: "#f8fafc",
  border: "#e2e8f0",
  danger: "#dc2626",
  success: "#16a34a",
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
    sans: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif)",
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
