import type { ReactNode } from 'react'
import { formatDateTime } from '../lib/dates'
import type { Video } from '../types/content'

interface VideoListProps {
  videos: Video[]
  activeId: string
  onSelect: (video: Video) => void
  // Attendance buttons for a lesson; kept outside the row's button, since buttons can't nest.
  renderAttendance?: (video: Video) => ReactNode
  // Admin only: the ⋮ menu for each video, the attendance window under each title, and the add tile after the list.
  renderMenu?: (video: Video) => ReactNode
  showWindow?: boolean
  footer?: ReactNode
}

export function VideoList({ videos, activeId, onSelect, renderAttendance, renderMenu, showWindow = false, footer }: VideoListProps) {
  return (
    <div className="lesson-list" role="list" aria-label="دروس السلسلة">
      {videos.map((video, index) => {
        const active = video.id === activeId
        const isQuiz = video.isQuiz === true || video.isQuiz === 1
        const menu = renderMenu?.(video)
        // Quizzes and hidden lessons are outside attendance.
        const attendance = !isQuiz && video.is_active ? renderAttendance?.(video) : null
        const windowText = showWindow && !isQuiz && video.attend_from && video.attend_until ? `الحضور: من ${formatDateTime(video.attend_from)} إلى ${formatDateTime(video.attend_until)}` : null
        return (
          <div key={video.id} className={`lesson-row${menu ? ' lesson-row--admin' : ''}${attendance ? ' lesson-row--attend' : ''}${active ? ' is-current' : ''}${video.is_active ? '' : ' is-hidden'}`} role="listitem">
            <button type="button" className={`lesson-item ${active ? 'active' : ''} ${isQuiz ? 'lesson-item--quiz' : ''}`} onClick={() => onSelect(video)} aria-pressed={active}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-copy"><strong>{video.title}</strong><small>{!video.is_active && <span className="hidden-badge">مخفي</span>}{isQuiz ? 'ابدأ الاختبار' : active ? 'يُعرض الآن' : 'شاهد الدرس'}</small>{windowText && <small className="lesson-window">{windowText}</small>}</span><span className="lesson-play" aria-hidden="true">{isQuiz ? '؟' : active ? '●' : '▶'}</span></button>
            {attendance && <div className="lesson-row__attend">{attendance}</div>}
            {menu && <div className="lesson-row__menu">{menu}</div>}
          </div>
        )
      })}
      {footer}
    </div>
  )
}
