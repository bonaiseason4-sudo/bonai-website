import type { ReactNode } from 'react'

export function StatePanel({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return <div className="state-panel"><div className="state-icon" aria-hidden="true">{icon}</div><h2>{title}</h2><div>{children}</div></div>
}
