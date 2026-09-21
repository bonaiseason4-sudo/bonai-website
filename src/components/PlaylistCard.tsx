import { Link } from 'react-router-dom'
import type { Playlist } from '../types/content'

const art = ['✦', '☘', '☾', '❋', '✧']

export function PlaylistCard({ playlist, index }: { playlist: Playlist; index: number }) {
  return (
    <Link to={`/playlist/${playlist.id}`} className="playlist-card">
      <div className={`playlist-art playlist-art--${(index % 4) + 1}`}>
        {playlist.image_url ? <img src={playlist.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">{art[index % art.length]}</span>}
      </div>
      <div className="playlist-card__body">
        <div className="playlist-card__meta"><span>{playlist.video_count ?? 0} درس</span><span aria-hidden="true">←</span></div>
        <h3>{playlist.title}</h3>
        <p>{playlist.description || 'سلسلة تعليمية مبسطة وممتعة.'}</p>
      </div>
    </Link>
  )
}
