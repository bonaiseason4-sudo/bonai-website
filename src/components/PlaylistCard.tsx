import { Link } from 'react-router-dom'
import type { Playlist } from '../types/content'
import type { PlaylistProgress } from '../types/progress'
import { CheckIcon } from './attendance/icons'

const art = ['✦', '☘', '☾', '❋', '✧']

// attended: the logged-in student's marked lessons in this playlist (left out for guests).
export function PlaylistCard({ playlist, index, attended }: { playlist: Playlist; index: number; attended?: PlaylistProgress }) {
  const lessonCount = playlist.video_count ?? 0
  const showProgress = attended !== undefined && attended.total > 0
  return (
    <Link to={`/playlist/${playlist.id}`} className="playlist-card">
      <div className={`playlist-art playlist-art--${(index % 4) + 1}${playlist.image_url ? ' playlist-art--with-image' : ''}`}>
        {playlist.image_url ? <img src={playlist.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">{art[index % art.length]}</span>}
      </div>
      <div className="playlist-card__body">
        <div className="playlist-card__meta"><span>{lessonCount} {lessonCount === 1 ? 'درس' : 'دروس'}</span><span aria-hidden="true">←</span></div>
        <h3>{playlist.title}</h3>
        <p>{playlist.description || 'سلسلة تعليمية مبسطة وممتعة.'}</p>
        {showProgress && (
          <div className="playlist-card__progress" title="الدروس التي سجّلت حضورها">
            <span className="playlist-card__progress-text"><CheckIcon size={13} /><span>{attended.marked} من {attended.total}</span><span className="sr-only"> دروس سجّلت حضورها</span></span>
            <span className="playlist-card__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (attended.marked / attended.total) * 100)}%` }} /></span>
          </div>
        )}
      </div>
    </Link>
  )
}
