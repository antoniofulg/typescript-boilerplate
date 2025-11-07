# Theme Customization Guide

This project uses ShadCN UI with a fully customizable theme system. All theme variables are centralized and easy to modify.

## Quick Start

1. Open `lib/theme.config.ts`
2. Modify the color values you want to change
3. The changes will automatically apply to all components

## File Structure

- `lib/theme.config.ts` - Main theme configuration file
- `lib/theme.example.ts` - Examples of custom themes
- `app/globals.css` - CSS variables (auto-generated from theme.config.ts)

## Customizing Colors

### Primary Colors (Brand Colors)

The primary color is used for buttons, links, and other interactive elements:

```typescript
// In lib/theme.config.ts
light: {
  primary: 'oklch(0.5 0.2 250)', // Your brand color
  primaryForeground: 'oklch(0.98 0 0)', // Text color on primary
}
```

### Color Format (OKLCH)

Colors use the OKLCH format: `oklch(lightness chroma hue)`

- **Lightness**: 0-1 (0 = black, 1 = white)
- **Chroma**: 0-0.4 (0 = grayscale, higher = more saturated)
- **Hue**: 0-360 (color wheel position)

### Common Color Values

| Color  | Lightness | Chroma | Hue |
| ------ | --------- | ------ | --- |
| Blue   | 0.5       | 0.2    | 250 |
| Green  | 0.5       | 0.2    | 150 |
| Red    | 0.5       | 0.2    | 20  |
| Purple | 0.5       | 0.2    | 300 |
| Orange | 0.6       | 0.2    | 60  |
| Yellow | 0.8       | 0.15   | 90  |

### Example: Blue Theme

```typescript
export const themeConfig = {
  light: {
    primary: 'oklch(0.5 0.2 250)', // Blue
    primaryForeground: 'oklch(0.98 0 0)', // White
    accent: 'oklch(0.95 0.05 250)', // Light blue
    // ... other colors
  },
  dark: {
    primary: 'oklch(0.7 0.2 250)', // Lighter blue for dark mode
    primaryForeground: 'oklch(0.1 0 0)', // Dark text
    // ... other colors
  },
};
```

## Customizing Border Radius

Change the `radius` value to make components more or less rounded:

```typescript
export const themeConfig = {
  radius: '0.5rem', // 8px - less rounded
  // or
  radius: '1rem', // 16px - more rounded
};
```

## Available Theme Variables

### Base Colors

- `background` - Main background color
- `foreground` - Main text color

### Component Colors

- `card` / `cardForeground` - Card backgrounds and text
- `popover` / `popoverForeground` - Popover backgrounds and text
- `primary` / `primaryForeground` - Primary brand color
- `secondary` / `secondaryForeground` - Secondary color
- `muted` / `mutedForeground` - Subtle backgrounds
- `accent` / `accentForeground` - Highlight colors
- `destructive` - Error/warning colors

### UI Elements

- `border` - Border color
- `input` - Input field background
- `ring` - Focus ring color

### Charts

- `chart1` through `chart5` - Data visualization colors

### Sidebar

- `sidebar*` - All sidebar-related colors

## Converting from HEX/RGB to OKLCH

If you have a color in HEX or RGB, you can convert it using online tools:

- https://oklch.com/
- https://colorjs.io/apps/convert/

Or use this CSS function:

```css
/* Browser will convert automatically */
--my-color: oklch(from #3b82f6 l c h);
```

## Dark Mode

Dark mode colors are defined separately in the `dark` object. Make sure to provide good contrast for both light and dark themes.

## Best Practices

1. **Contrast**: Ensure text is readable on backgrounds (WCAG AA minimum)
2. **Consistency**: Use the same color palette across light and dark modes
3. **Accessibility**: Test with color blindness simulators
4. **Branding**: Use your brand colors for primary and accent

## Testing Your Theme

After making changes:

1. Run `npm run dev` to see changes in development
2. Test both light and dark modes
3. Check all components to ensure colors work well together
4. Verify accessibility with browser dev tools

## Need Help?

- [ShadCN UI Documentation](https://ui.shadcn.com)
- [OKLCH Color Guide](https://oklch.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
