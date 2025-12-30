/**
 * Text Formatting Utilities
 */

/**
 * Capitalize first letter of each word in a string
 */
export const capitalizeItemName = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

