const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

type IconProps = { size?: number }

// Two-tone flame: the outer shape follows currentColor, the core stays warm gold.
export function FlameIcon({ size = 20 }: IconProps) {
  return (
    <svg className="flame-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12.4 1.6c.9 3.5-.8 5.6-2.6 7.6C8 11.1 6.2 13 6.2 15.9A5.95 5.95 0 0 0 12 22a5.95 5.95 0 0 0 5.8-6.1c0-2.7-1.3-4.7-2.6-6.2-.2 1.6-1 2.8-2.1 3.4.5-4.1-.7-8.2-.7-11.5Z" />
      <path fill="var(--gold-soft)" d="M12.1 12.6c.3 1.6-.4 2.6-1.2 3.5-.6.7-1.2 1.4-1.2 2.5a2.3 2.3 0 0 0 4.6 0c0-1.1-.5-1.9-1-2.6-.1.6-.4 1.1-.9 1.4.2-1.7-.1-3.4-.3-4.8Z" />
    </svg>
  )
}

export function ShieldIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2.2 4.5 5v6.6c0 4.7 3.2 8.6 7.5 10.2 4.3-1.6 7.5-5.5 7.5-10.2V5L12 2.2Z" opacity=".22" />
      <path {...stroke} d="M12 2.2 4.5 5v6.6c0 4.7 3.2 8.6 7.5 10.2 4.3-1.6 7.5-5.5 7.5-10.2V5L12 2.2Z" />
      <path {...stroke} d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function BroadcastIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2" />
    </svg>
  )
}

export function HeadphonesIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M3.5 18v-6a8.5 8.5 0 0 1 17 0v6" />
      <path d="M20.5 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3.5 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-3Z" />
    </svg>
  )
}

export function CheckIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth={2.6} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function LockIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
