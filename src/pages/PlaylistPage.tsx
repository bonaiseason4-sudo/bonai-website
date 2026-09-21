import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatePanel } from '../components/StatePanel'
import { AttachmentList } from '../components/AttachmentList'
import { VideoList } from '../components/VideoList'
import { VideoPlayer } from '../components/VideoPlayer'
import { useAsync } from '../hooks/useAsync'
import { getPlaylist, getPlaylistVideos, getVideoAttachments } from '../services/contentService'
import type { Video } from '../types/content'

export function PlaylistPage() {
  const { id = '' } = useParams()
  const { data: playlist, loading: playlistLoading, error: playlistError } = useAsync(() => getPlaylist(id), [id])
  const { data: videos, loading: videosLoading, error: videosError } = useAsync(() => getPlaylistVideos(id), [id])
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => { if (videos?.length && !videos.some((v) => v.id === selectedId)) setSelectedId(videos[0].id) }, [videos, selectedId])
  const selectedVideo = useMemo(() => videos?.find((video) => video.id === selectedId) ?? videos?.[0] ?? null, [videos, selectedId])
  const { data: attachments } = useAsync(() => getVideoAttachments(selectedVideo?.id ?? ''), [selectedVideo?.id])

  if (playlistLoading || videosLoading) return <section className="section shell"><div className="playlist-page-skeleton"><div className="skeleton skeleton-line wide" /><div className="skeleton skeleton-video" /><div className="skeleton skeleton-line" /></div></section>
  if (playlistError || videosError) return <section className="section shell"><StatePanel icon="!" title="تعذّر تحميل السلسلة"><p>راجع إعداد Supabase ثم حاول مرة أخرى.</p></StatePanel></section>
  if (!playlist) return <section className="section shell"><StatePanel icon="؟" title="السلسلة غير موجودة"><p>قد تكون السلسلة غير متاحة أو تم إيقافها.</p><Link className="text-link" to="/">العودة للرئيسية</Link></StatePanel></section>
  if (!videos?.length) return <section className="section shell"><div className="breadcrumb"><Link to="/">الرئيسية</Link><span>/</span><span>{playlist.title}</span></div><StatePanel icon="✦" title="الدروس في الطريق"><p>هذه السلسلة موجودة، لكن لم تتم إضافة فيديوهات نشطة لها بعد.</p></StatePanel></section>

  return (
    <section className="playlist-page">
      <div className="shell">
        <div className="breadcrumb"><Link to="/">الرئيسية</Link><span>/</span><span>{playlist.title}</span></div>
        <header className="playlist-heading"><span className="eyebrow">سلسلة تعليمية</span><h1>{playlist.title}</h1><p>{playlist.description}</p></header>
        <div className="watch-layout">
          <div className="watch-main">
            {selectedVideo && <VideoPlayer video={selectedVideo} />}
            {selectedVideo && <div className="current-video-copy"><span>الدرس {videos.findIndex((v) => v.id === selectedVideo.id) + 1} من {videos.length}</span><h2>{selectedVideo.title}</h2><p>{selectedVideo.description || 'استمتع بالدرس، ثم انتقل للدرس التالي من القائمة.'}</p></div>}
            <AttachmentList attachments={attachments ?? []} />
          </div>
          <aside className="lessons-panel"><div className="lessons-panel__header"><div><span>دروس السلسلة</span><strong>{videos.length} درس</strong></div><span aria-hidden="true">☰</span></div><VideoList videos={videos} activeId={selectedVideo?.id ?? ''} onSelect={(video: Video) => { setSelectedId(video.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} /></aside>
        </div>
      </div>
    </section>
  )
}
