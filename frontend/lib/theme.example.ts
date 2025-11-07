/**
 * Theme Customization Example
 *
 * This file shows how to customize your theme colors.
 * Copy the values you want to change to lib/theme.config.ts
 *
 * Example: Custom brand colors
 */

export const customThemeExample = {
  // Example: Blue brand theme
  light: {
    // Change primary to a blue color
    primary: 'oklch(0.5 0.2 250)', // Blue
    primaryForeground: 'oklch(0.98 0 0)', // White text

    // Change accent to a lighter blue
    accent: 'oklch(0.95 0.05 250)', // Light blue
    accentForeground: 'oklch(0.3 0.15 250)', // Dark blue text
  },

  dark: {
    // Dark mode blue theme
    primary: 'oklch(0.7 0.2 250)', // Lighter blue for dark mode
    primaryForeground: 'oklch(0.1 0 0)', // Dark text

    accent: 'oklch(0.3 0.1 250)', // Dark blue
    accentForeground: 'oklch(0.9 0 0)', // Light text
  },
};

/**
 * Color Palette Examples:
 *
 * Blue: oklch(0.5 0.2 250)
 * Green: oklch(0.5 0.2 150)
 * Red: oklch(0.5 0.2 20)
 * Purple: oklch(0.5 0.2 300)
 * Orange: oklch(0.6 0.2 60)
 *
 * To use these colors, replace the values in theme.config.ts
 */
