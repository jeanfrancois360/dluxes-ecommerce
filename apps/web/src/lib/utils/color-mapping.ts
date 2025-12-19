/**
 * Color name to hex mapping for product variants
 * Maps common color names to their hex values
 */

export const COLOR_MAP: Record<string, string> = {
  // Basic colors
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  grey: '#808080',
  silver: '#C0C0C0',

  // Reds
  red: '#FF0000',
  crimson: '#DC143C',
  maroon: '#800000',
  burgundy: '#800020',
  rose: '#FF007F',
  pink: '#FFC0CB',
  coral: '#FF7F50',
  salmon: '#FA8072',

  // Blues
  blue: '#0000FF',
  navy: '#000080',
  royal: '#4169E1',
  'royal blue': '#4169E1',
  sky: '#87CEEB',
  'sky blue': '#87CEEB',
  teal: '#008080',
  turquoise: '#40E0D0',
  cyan: '#00FFFF',
  aqua: '#00FFFF',
  midnight: '#191970',
  'midnight blue': '#191970',
  indigo: '#4B0082',
  cobalt: '#0047AB',

  // Greens
  green: '#008000',
  lime: '#00FF00',
  olive: '#808000',
  emerald: '#50C878',
  mint: '#98FF98',
  forest: '#228B22',
  'forest green': '#228B22',
  sage: '#9DC183',

  // Yellows/Golds
  yellow: '#FFFF00',
  gold: '#FFD700',
  golden: '#FFD700',
  beige: '#F5F5DC',
  cream: '#FFFDD0',
  khaki: '#F0E68C',
  mustard: '#FFDB58',

  // Oranges
  orange: '#FFA500',
  tangerine: '#F28500',
  peach: '#FFE5B4',
  apricot: '#FBCEB1',
  bronze: '#CD7F32',
  copper: '#B87333',

  // Purples
  purple: '#800080',
  violet: '#EE82EE',
  lavender: '#E6E6FA',
  lilac: '#C8A2C8',
  plum: '#DDA0DD',
  magenta: '#FF00FF',
  fuchsia: '#FF00FF',
  mauve: '#E0B0FF',

  // Browns
  brown: '#A52A2A',
  tan: '#D2B48C',
  taupe: '#483C32',
  chocolate: '#D2691E',
  coffee: '#6F4E37',
  mocha: '#967969',
  camel: '#C19A6B',
  chestnut: '#954535',
  cognac: '#9A463D',
  mahogany: '#C04000',
  walnut: '#5C4033',

  // Neutrals & Others
  ivory: '#FFFFF0',
  charcoal: '#36454F',
  slate: '#708090',
  ash: '#B2BEB5',
  pearl: '#EAE0C8',
  champagne: '#F7E7CE',
  nude: '#E3BC9A',
  blush: '#DE5D83',

  // Metallics
  rose_gold: '#B76E79',
  'rose gold': '#B76E79',
  yellow_gold: '#FFD700',
  'yellow gold': '#FFD700',
  white_gold: '#FFFFF0',
  'white gold': '#FFFFF0',
  platinum: '#E5E4E2',
  steel: '#4682B4',

  // Denim/Wash
  denim: '#1560BD',
  'light wash': '#A4C8E1',
  'dark wash': '#1C3F6E',

  // Multi/Special
  multicolor: '#FF6B9D',
  'multi-color': '#FF6B9D',
  pepsi: '#004B93',
};

/**
 * Convert a color name to its hex value
 * @param colorName - The color name (case-insensitive)
 * @returns Hex color code or a default fallback
 */
export function getColorHex(colorName: string): string {
  if (!colorName) return '#808080'; // Default gray

  // Check if already a hex color
  if (colorName.startsWith('#')) {
    return colorName;
  }

  // Normalize the color name
  const normalized = colorName.toLowerCase().trim();

  // Check direct match
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }

  // Check for partial matches (e.g., "dark blue" -> "blue")
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Default fallback based on common patterns
  if (normalized.includes('light')) return '#D3D3D3';
  if (normalized.includes('dark')) return '#2F4F4F';

  // Ultimate fallback - generate a color from the name
  return generateColorFromString(colorName);
}

/**
 * Generate a consistent color from a string
 * Uses a simple hash to create a color
 */
function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

/**
 * Get a color name's display-friendly version
 */
export function formatColorName(colorName: string): string {
  if (!colorName) return 'Unknown';

  // Capitalize first letter of each word
  return colorName
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
