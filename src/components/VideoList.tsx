import type { ReactNode } from 'react'
import type { Video } from '../types/content'

interface VideoListProps {
  videos: Video[]
  activeId: string
  onSelect: (video: Video) => void
  // Admin only: the ⋮ menu for each video, and the add tile after the list.
  renderMenu?: (video: Video) => ReactNode
  footer?: ReactNode
}

export function VideoList({ videos, activeId, onSelect, renderMenu, footer }: VideoListProps) {
  return (
    <div className="lesson-list" role="list" aria-label="دروس السلسلة">
      {videos.map((video, index) => {
        const active = video.id === activeId
        const isQuiz = video.isQuiz === true || video.isQuiz === 1
        const menu = renderMenu?.(video)
        return (
          <div key={video.id} className={`lesson-row${menu ? ' lesson-row--admin' : ''}${video.is_active ? '' : ' is-hidden'}`} role="listitem">
            <button type="button" className={`lesson-item ${active ? 'active' : ''} ${isQuiz ? 'lesson-item--quiz' : ''}`} onClick={() => onSelect(video)} aria-pressed={active}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-copy"><strong>{video.title}</strong><small>{!video.is_active && <span className="hidden-badge">مخفي</span>}{isQuiz ? 'ابدأ الاختبار' : active ? 'يُعرض الآن' : 'شاهد الدرس'}</small></span><span className="lesson-play" aria-hidden="true">{isQuiz ? '؟' : active ? '●' : '▶'}</span></button>
            {menu && <div className="lesson-row__menu">{menu}</div>}
          </div>
        )
      })}
      {footer}
    </div>
  )
}
