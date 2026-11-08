export interface ColorPreset {
  hex: string;
  name: string;
}

export const CLASS_COLOR_PRESETS: ColorPreset[] = [
  { hex: '#C66F80', name: 'Rose Berry' },
  { hex: '#F4C7D0', name: 'Strawberry Milk' },
  { hex: '#FCEBF1', name: 'Strawberry Cream' },
  { hex: '#4A6644', name: 'Forest Matcha' },
  { hex: '#9FAA74', name: 'Sage Olive' },
  { hex: '#D7DAB3', name: 'Matcha Latte' },
  { hex: '#ECE3D2', name: 'Vanilla Almond' },
];

export const DEFAULT_CLASS_COLOR = '#C66F80';

/**
 * Determines if a hex color is light or pastel to ensure high contrast text
 */
export const isLightColor = (hex?: string): boolean => {
  if (!hex) return false;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 175;
};

/**
 * Returns '#1e293b' (dark slate) for light pastel backgrounds or '#ffffff' for dark backgrounds
 */
export const getAccessibleTextColor = (bgHex?: string): string => {
  return isLightColor(bgHex) ? '#1e293b' : '#ffffff';
};
