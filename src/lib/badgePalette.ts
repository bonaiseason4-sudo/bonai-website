import type { BadgeTier } from '../types/badges'

export interface BadgePalette {
  // Medal face, top to bottom, and its rim.
  light: string
  base: string
  dark: string
  // The symbol in the middle; dark on silver, where white would fade.
  glyph: string
  // Soft halo behind an earned medal.
  glow: string
}

// Bright metals on the cream page: earned medals should pop, so these are livelier than the site's calm tokens.
const palettes: Record<string, BadgePalette> = {
  coral: { light: '#ffb896', base: '#ee7a4d', dark: '#b84d28', glyph: '#fff', glow: 'rgba(238,122,77,.30)' },
  green: { light: '#86d6b2', base: '#2f9273', dark: '#155b4a', glyph: '#fff', glow: 'rgba(47,146,115,.26)' },
  purple: { light: '#cdb0f3', base: '#8d60d1', dark: '#5a3594', glyph: '#fff', glow: 'rgba(141,96,209,.26)' },
  gold: { light: '#ffe28f', base: '#e7aa3a', dark: '#a56b14', glyph: '#fff', glow: 'rgba(231,170,58,.34)' },
  blue: { light: '#a6d4f6', base: '#3f92d6', dark: '#205d97', glyph: '#fff', glow: 'rgba(63,146,214,.26)' },
  bronze: { light: '#f2bf93', base: '#c47b45', dark: '#844a22', glyph: '#fff', glow: 'rgba(196,123,69,.28)' },
  silver: { light: '#f6f8fb', base: '#b8c1cb', dark: '#76818e', glyph: '#4e5965', glow: 'rgba(140,152,166,.30)' },
}

const tierColors: Record<BadgeTier, string> = { BRONZE: 'bronze', SILVER: 'silver', GOLD: 'gold' }

// Not earned yet: warm greys that sit quietly on the cream page, with the symbol engraved rather than shining.
export const lockedPalette: BadgePalette = { light: '#f3eee4', base: '#ddd5c5', dark: '#bdb39f', glyph: '#a59a84', glow: 'transparent' }

// A tier's own metal wins over the badge's color; unknown keys fall back to gold.
export function badgePalette(color: string, tier: BadgeTier | null = null): BadgePalette {
  return palettes[tier ? tierColors[tier] : color] ?? palettes.gold
}
