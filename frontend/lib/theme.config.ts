/**
 * Theme Configuration
 *
 * This file contains all theme variables that can be easily customized.
 * Modify the values below to change the appearance of your application.
 *
 * Colors use the OKLCH color space for better perceptual uniformity.
 * Format: oklch(lightness chroma hue)
 * - Lightness: 0-1 (0 = black, 1 = white)
 * - Chroma: 0-0.4 (0 = grayscale, higher = more saturated)
 * - Hue: 0-360 (color wheel position)
 */

export const themeConfig = {
  // Border radius (affects all rounded corners)
  radius: '0.625rem', // 10px - adjust for more/less rounded corners

  // Light theme colors
  light: {
    // Base colors
    background: 'oklch(1 0 0)', // Pure white
    foreground: 'oklch(0.145 0 0)', // Almost black

    // Card colors
    card: 'oklch(1 0 0)', // White
    cardForeground: 'oklch(0.145 0 0)', // Dark text

    // Popover colors
    popover: 'oklch(1 0 0)', // White
    popoverForeground: 'oklch(0.145 0 0)', // Dark text

    // Primary colors (main brand color)
    primary: 'oklch(0.205 0 0)', // Dark gray/black
    primaryForeground: 'oklch(0.985 0 0)', // Almost white

    // Secondary colors
    secondary: 'oklch(0.97 0 0)', // Light gray
    secondaryForeground: 'oklch(0.205 0 0)', // Dark text

    // Muted colors (subtle backgrounds)
    muted: 'oklch(0.97 0 0)', // Light gray
    mutedForeground: 'oklch(0.556 0 0)', // Medium gray

    // Accent colors (highlights)
    accent: 'oklch(0.97 0 0)', // Light gray
    accentForeground: 'oklch(0.205 0 0)', // Dark text

    // Destructive colors (errors, warnings)
    destructive: 'oklch(0.577 0.245 27.325)', // Red

    // Border and input colors
    border: 'oklch(0.922 0 0)', // Light gray border
    input: 'oklch(0.922 0 0)', // Light gray input
    ring: 'oklch(0.708 0 0)', // Medium gray focus ring

    // Chart colors (for data visualization)
    chart1: 'oklch(0.646 0.222 41.116)', // Orange
    chart2: 'oklch(0.6 0.118 184.704)', // Blue
    chart3: 'oklch(0.398 0.07 227.392)', // Purple
    chart4: 'oklch(0.828 0.189 84.429)', // Yellow
    chart5: 'oklch(0.769 0.188 70.08)', // Green

    // Sidebar colors
    sidebar: 'oklch(0.985 0 0)', // Almost white
    sidebarForeground: 'oklch(0.145 0 0)', // Dark text
    sidebarPrimary: 'oklch(0.205 0 0)', // Dark
    sidebarPrimaryForeground: 'oklch(0.985 0 0)', // Light text
    sidebarAccent: 'oklch(0.97 0 0)', // Light gray
    sidebarAccentForeground: 'oklch(0.205 0 0)', // Dark text
    sidebarBorder: 'oklch(0.922 0 0)', // Light border
    sidebarRing: 'oklch(0.708 0 0)', // Medium gray ring
  },

  // Dark theme colors
  dark: {
    // Base colors
    background: 'oklch(0.145 0 0)', // Almost black
    foreground: 'oklch(0.985 0 0)', // Almost white

    // Card colors
    card: 'oklch(0.205 0 0)', // Dark gray
    cardForeground: 'oklch(0.985 0 0)', // Light text

    // Popover colors
    popover: 'oklch(0.205 0 0)', // Dark gray
    popoverForeground: 'oklch(0.985 0 0)', // Light text

    // Primary colors
    primary: 'oklch(0.922 0 0)', // Light gray
    primaryForeground: 'oklch(0.205 0 0)', // Dark text

    // Secondary colors
    secondary: 'oklch(0.269 0 0)', // Dark gray
    secondaryForeground: 'oklch(0.985 0 0)', // Light text

    // Muted colors
    muted: 'oklch(0.269 0 0)', // Dark gray
    mutedForeground: 'oklch(0.708 0 0)', // Medium gray

    // Accent colors
    accent: 'oklch(0.269 0 0)', // Dark gray
    accentForeground: 'oklch(0.985 0 0)', // Light text

    // Destructive colors
    destructive: 'oklch(0.704 0.191 22.216)', // Red

    // Border and input colors
    border: 'oklch(1 0 0 / 10%)', // White with 10% opacity
    input: 'oklch(1 0 0 / 15%)', // White with 15% opacity
    ring: 'oklch(0.556 0 0)', // Medium gray

    // Chart colors
    chart1: 'oklch(0.488 0.243 264.376)', // Purple
    chart2: 'oklch(0.696 0.17 162.48)', // Cyan
    chart3: 'oklch(0.769 0.188 70.08)', // Green
    chart4: 'oklch(0.627 0.265 303.9)', // Pink
    chart5: 'oklch(0.645 0.246 16.439)', // Orange

    // Sidebar colors
    sidebar: 'oklch(0.205 0 0)', // Dark gray
    sidebarForeground: 'oklch(0.985 0 0)', // Light text
    sidebarPrimary: 'oklch(0.488 0.243 264.376)', // Purple
    sidebarPrimaryForeground: 'oklch(0.985 0 0)', // Light text
    sidebarAccent: 'oklch(0.269 0 0)', // Dark gray
    sidebarAccentForeground: 'oklch(0.985 0 0)', // Light text
    sidebarBorder: 'oklch(1 0 0 / 10%)', // White with 10% opacity
    sidebarRing: 'oklch(0.556 0 0)', // Medium gray
  },
} as const;

/**
 * Helper function to convert theme config to CSS variables
 * This is used internally by the theme system
 */
export function generateThemeCSS(theme: typeof themeConfig) {
  const lightVars = Object.entries(theme.light).map(
    ([key, value]) =>
      `  --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`,
  );

  const darkVars = Object.entries(theme.dark).map(
    ([key, value]) =>
      `  --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`,
  );

  return {
    light: lightVars.join('\n'),
    dark: darkVars.join('\n'),
  };
}
