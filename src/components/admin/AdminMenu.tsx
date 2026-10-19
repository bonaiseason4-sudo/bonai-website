import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

const MENU_WIDTH = 160
const MENU_HEIGHT = 110

// The ⋮ button shown to admins next to a playlist, video or attachment.
export function AdminMenu({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  const [position, setPosition] = useState<CSSProperties | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const open = position !== null

  useEffect(() => {
    if (!open) return
    const close = () => setPosition(null)
    const onPointer = (event: Event) => {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !listRef.current?.contains(target)) close()
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    // The list is positioned against the window, so close it rather than let it drift.
    // Ignore the small scroll a tap can cause right when the menu opens.
    const openedAt = Date.now()
    const onScroll = () => Date.now() - openedAt > 300 && close()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  // Rendered at the page level with fixed positioning, so scrolling or transformed containers (like the lesson list) can't clip it.
  function toggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (open) return setPosition(null)
    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - MENU_WIDTH - 8)
    const below = rect.bottom + 6 + MENU_HEIGHT <= window.innerHeight
    setPosition(below ? { left, top: rect.bottom + 6 } : { left, bottom: window.innerHeight - rect.top + 6 })
  }

  // The menu sits on top of links and buttons; keep clicks from reaching them.
  const choose = (action: () => void) => (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setPosition(null)
    action()
  }

  return (
    <div className="admin-menu" ref={ref}>
      <button type="button" className="admin-menu__trigger" aria-label={`خيارات ${label}`} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>⋮</button>
      {position && createPortal(
        <div className="admin-menu__list" role="menu" ref={listRef} style={{ ...position, width: MENU_WIDTH }}>
          <button type="button" role="menuitem" onClick={choose(onEdit)}><span aria-hidden="true">✏️</span> تعديل</button>
          <button type="button" role="menuitem" className="admin-menu__danger" onClick={choose(onDelete)}><span aria-hidden="true">🗑️</span> حذف</button>
        </div>,
        document.body,
      )}
    </div>
  )
}
