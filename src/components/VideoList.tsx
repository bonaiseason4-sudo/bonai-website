import type { Video } from '../types/content'

export function VideoList({ videos, activeId, onSelect }: { videos: Video[]; activeId: string; onSelect: (video: Video) => void }) {
  return (
    <div className="lesson-list" role="list" aria-label="دروس السلسلة">
      {videos.map((video, index) => {
        const active = video.id === activeId
        const isQuiz = video.isQuiz === true
        return <button key={video.id} type="button" className={`lesson-item ${active ? 'active' : ''} ${isQuiz ? 'lesson-item--quiz' : ''}`} onClick={() => onSelect(video)} aria-pressed={active}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-copy"><strong>{video.title}</strong><small>{isQuiz ? 'ابدأ الاختبار' : active ? 'يُعرض الآن' : 'شاهد الدرس'}</small></span><span className="lesson-play" aria-hidden="true">{isQuiz ? '؟' : active ? '●' : '▶'}</span></button>
      })}
    </div>
  )
}
