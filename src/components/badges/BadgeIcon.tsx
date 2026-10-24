import { useId, type ReactNode } from 'react'
import { badgePalette, lockedPalette } from '../../lib/badgePalette'
import type { BadgeTier } from '../../types/badges'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

// The symbols drawn in the middle of the medal, on a 24×24 grid, keyed by the API's icon names.
const glyphs: Record<string, ReactNode> = {
  flame: <path fill="currentColor" d="M12.4 1.6c.9 3.5-.8 5.6-2.6 7.6C8 11.1 6.2 13 6.2 15.9A5.95 5.95 0 0 0 12 22a5.95 5.95 0 0 0 5.8-6.1c0-2.7-1.3-4.7-2.6-6.2-.2 1.6-1 2.8-2.1 3.4.5-4.1-.7-8.2-.7-11.5Z" />,
  broadcast: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="2.3" fill="currentColor" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2" />
    </g>
  ),
  star: <path fill="currentColor" d="m12 2.4 2.96 6.02 6.64.96-4.8 4.68 1.13 6.6L12 17.55l-5.93 3.11 1.13-6.6-4.8-4.68 6.64-.96L12 2.4Z" />,
  crown: (
    <g fill="currentColor">
      <path d="m2.8 7.6 4.7 4.2L12 4.4l4.5 7.4 4.7-4.2-1.9 10.3H4.7L2.8 7.6Z" />
      <rect x="4.9" y="19.2" width="14.2" height="2.4" rx="1.2" />
    </g>
  ),
  book: (
    <g {...stroke}>
      <path d="M12 6.8C10.2 5.3 7.4 4.7 3.4 5.1v13.2c4-.4 6.8.2 8.6 1.7 1.8-1.5 4.6-2.1 8.6-1.7V5.1c-4-.4-6.8.2-8.6 1.7Z" />
      <path d="M12 6.8V20" />
    </g>
  ),
  check: <path {...stroke} strokeWidth={3} d="M5 12.5 9.5 17 19 7.5" />,
  medal: <path fill="currentColor" d="m12 2.4 2.4 7.2 7.2 2.4-7.2 2.4-2.4 7.2-2.4-7.2L2.4 12l7.2-2.4L12 2.4Z" />,
}

const sizes = { small: 84, large: 150 } as const

interface BadgeIconProps {
  icon: string
  color: string
  tier?: BadgeTier | null
  // Not earned yet: drawn in grey.
  locked?: boolean
  size?: keyof typeof sizes
}

// A ribboned medal in the badge's metal with its symbol in the middle. Decorative: the text beside it names the badge.
export function BadgeIcon({ icon, color, tier = null, locked = false, size = 'small' }: BadgeIconProps) {
  // url(#…) needs an id without the punctuation useId adds.
  const uid = `badge${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const palette = locked ? lockedPalette : badgePalette(color, tier)
  const secret = icon === 'secret'
  const glyph = glyphs[icon] ?? glyphs.medal
  const width = sizes[size]

  return (
    <svg className={`badge-icon badge-icon--${size}${locked ? ' is-locked' : ''}`} width={width} height={Math.round(width * 1.16)} viewBox="0 0 100 116" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.light} />
          <stop offset="1" stopColor={palette.base} />
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={palette.base} />
          <stop offset="1" stopColor={palette.dark} />
        </linearGradient>
      </defs>
      {/* Ribbon tails start behind the medal, so only their notched ends show. */}
      <path d="M30 70 20 112l10-6 8 8 8-38Z" fill={palette.dark} />
      <path d="M70 70l10 42-10-6-8 8-8-38Z" fill={palette.base} />
      <circle cx="50" cy="46" r="40" fill={`url(#${uid}-rim)`} />
      <circle cx="50" cy="46" r="34" fill={`url(#${uid}-face)`} />
      <circle cx="50" cy="46" r="29" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" strokeDasharray="2.2 3" />
      <path d="M25 37a27 27 0 0 1 27-24" fill="none" stroke="#fff" strokeOpacity={locked ? '.45' : '.6'} strokeWidth="4" strokeLinecap="round" />
      {secret
        ? <text className="badge-icon__secret" x="50" y="47" textAnchor="middle" dominantBaseline="central" fill={palette.glyph}>؟</text>
        : (
          <>
            {/* A soft copy just below lifts the symbol off light metals, or presses it in like an engraving when locked. */}
            <svg x="31.8" y="28.6" width="38" height="38" viewBox="0 0 24 24" color={locked ? '#fff' : palette.dark} opacity={locked ? 0.85 : 0.45}>{glyph}</svg>
            <svg x="31" y="27" width="38" height="38" viewBox="0 0 24 24" color={palette.glyph}>{glyph}</svg>
          </>
        )}
    </svg>
  )
}
