/**
 * Color utility functions for dynamic theming
 */

/**
 * Lightens a hex color by a specified percentage
 * @param color - Hex color string (e.g., "#000000")
 * @param percent - Percentage to lighten (0-100)
 * @returns Lightened hex color string
 */
export function lightenColor(color: string, percent: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB components
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  
  // Calculate lightened values
  const amount = Math.round(2.55 * percent);
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);
  
  // Convert back to hex
  const newHex = ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0');
  return `#${newHex}`;
}

/**
 * Darkens a hex color by a specified percentage
 * @param color - Hex color string (e.g., "#ffffff")
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened hex color string
 */
export function darkenColor(color: string, percent: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse RGB components
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  
  // Calculate darkened values
  const amount = Math.round(2.55 * percent);
  const newR = Math.max(0, r - amount);
  const newG = Math.max(0, g - amount);
  const newB = Math.max(0, b - amount);
  
  // Convert back to hex
  const newHex = ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0');
  return `#${newHex}`;
}

/**
 * Validates if a string is a valid hex color
 * @param color - Color string to validate
 * @returns True if valid hex color
 */
export function validateHexColor(color: string): boolean {
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Ensures a color string has a # prefix
 * @param color - Color string
 * @returns Color string with # prefix
 */
export function ensureHashPrefix(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Converts hex color to RGB values
 * @param color - Hex color string
 * @returns Object with r, g, b values
 */
export function hexToRgb(color: string): { r: number; g: number; b: number } | null {
  const hex = color.replace('#', '');
  
  if (hex.length === 3) {
    // Convert 3-digit hex to 6-digit
    const expandedHex = hex.split('').map(char => char + char).join('');
    const num = parseInt(expandedHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  } else if (hex.length === 6) {
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }
  
  return null;
}

/**
 * Gets the contrast ratio between two colors (simplified)
 * @param color1 - First hex color
 * @param color2 - Second hex color  
 * @returns A rough contrast indicator (higher = better contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  // Simplified luminance calculation
  const lum1 = 0.299 * rgb1.r + 0.587 * rgb1.g + 0.114 * rgb1.b;
  const lum2 = 0.299 * rgb2.r + 0.587 * rgb2.g + 0.114 * rgb2.b;
  
  return Math.abs(lum1 - lum2);
}

/**
 * Creates color variants for theming
 * @param primaryColor - Primary hex color
 * @param secondaryColor - Secondary hex color
 * @returns Object with color variants
 */
export function createColorVariants(primaryColor: string, secondaryColor: string) {
  return {
    primary: ensureHashPrefix(primaryColor),
    secondary: ensureHashPrefix(secondaryColor),
    primaryLight: lightenColor(primaryColor, 60),    // For lighter text elements
    primaryVeryLight: lightenColor(primaryColor, 80), // For very subtle elements
    primaryDark: darkenColor(primaryColor, 10),       // For hover states
    secondaryLight: lightenColor(secondaryColor, 40),
    secondaryDark: darkenColor(secondaryColor, 20)
  };
}