import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AddTile } from '../components/admin/AddTile'
import { AdminEditor, type EditorResult, type EditorState } from '../components/admin/AdminEditor'
import { AdminMenu } from '../components/admin/AdminMenu'
import { attachmentValues, nextSortOrder, playlistValues, videoValues } from '../components/admin/entityForms'
import { StatePanel } from '../components/StatePanel'
import { AttachmentList } from '../components/AttachmentList'
import { VideoList } from '../components/VideoList'
import { VideoPlayer } from '../components/VideoPlayer'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { getPlaylist, getPlaylistVideos, getVideoAttachments } from '../services/contentService'
import type { Attachment, Video } from '../types/content'

export function PlaylistPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data: playlist, loading: playlistLoading, error: playlistError, reload: reloadPlaylist } = useAsync(() => getPlaylist(id, isAdmin), [id, isAdmin])
  const { data: videos, loading: videosLoading, error: videosError, reload: reloadVideos } = useAsync(() => getPlaylistVideos(id, isAdmin), [id, isAdmin])
  const [selectedId, setSelectedId] = useState<string>('')
  const [editor, setEditor] = useState<EditorState>(null)

  useEffect(() => { if (videos?.length && !videos.some((v) => v.id === selectedId)) setSelectedId(videos[0].id) }, [videos, selectedId])
  const selectedVideo = useMemo(() => videos?.find((video) => video.id === selectedId) ?? videos?.[0] ?? null, [videos, selectedId])
  const lessonVideos = useMemo(() => videos?.filter((video) => !video.isQuiz) ?? [], [videos])
  const selectedIsQuiz = selectedVideo?.isQuiz === true || selectedVideo?.isQuiz === 1
  const { data: attachments, reload: reloadAttachments } = useAsync(() => getVideoAttachments(selectedVideo?.id ?? '', isAdmin), [selectedVideo?.id, isAdmin])

  function handleAdminDone(result: EditorResult) {
    setEditor(null)
    if (result.kind === 'playlist') {
      if (result.mode === 'delete') navigate('/', { replace: true })
      else if (result.id !== id) navigate(`/playlist/${encodeURIComponent(result.id)}`, { replace: true })
      else reloadPlaylist()
    } else if (result.kind === 'video') {
      if (result.mode === 'create' || (result.mode === 'edit' && result.previousId === selectedId)) setSelectedId(result.id)
      reloadVideos()
      reloadPlaylist()
    } else reloadAttachments()
  }

  const editorDialog = <AdminEditor state={editor} onClose={() => setEditor(null)} onDone={handleAdminDone} />
  const addVideoTile = isAdmin && <AddTile label="إضافة درس" onClick={() => setEditor({ mode: 'create', kind: 'video', values: videoValues(undefined, id, nextSortOrder(videos)) })} />
  const videoMenu = isAdmin ? (video: Video) => <AdminMenu label={video.title} onEdit={() => setEditor({ mode: 'edit', kind: 'video', values: videoValues(video, id), originalId: video.id })} onDelete={() => setEditor({ mode: 'delete', kind: 'video', id: video.id, title: video.title })} /> : undefined
  const attachmentMenu = isAdmin ? (attachment: Attachment) => <AdminMenu label={attachment.title} onEdit={() => setEditor({ mode: 'edit', kind: 'attachment', values: attachmentValues(attachment, attachment.video_id), originalId: attachment.id })} onDelete={() => setEditor({ mode: 'delete', kind: 'attachment', id: attachment.id, title: attachment.title })} /> : undefined
  const addAttachmentTile = isAdmin && selectedVideo && <AddTile label="إضافة مرفق" onClick={() => setEditor({ mode: 'create', kind: 'attachment', values: attachmentValues(undefined, selectedVideo.id, nextSortOrder(attachments)) })} />

  if (playlistLoading || videosLoading) return <section className="section shell"><div className="playlist-page-skeleton"><div className="skeleton skeleton-line wide" /><div className="skeleton skeleton-video" /><div className="skeleton skeleton-line" /></div></section>
  if (playlistError || videosError) return <section className="section shell"><StatePanel icon="!" title="تعذّر تحميل السلسلة"><p>تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.</p></StatePanel></section>
  if (!playlist) return <section className="section shell"><StatePanel icon="؟" title="السلسلة غير موجودة"><p>قد تكون السلسلة غير متاحة أو تم إيقافها.</p><Link className="text-link" to="/">العودة للرئيسية</Link></StatePanel></section>

  const heading = (
    <>
      <div className="breadcrumb"><Link to="/">الرئيسية</Link><span>/</span><span>{playlist.title}</span></div>
      <header className="playlist-heading">
        <span className="eyebrow">سلسلة تعليمية</span>
        <div className="playlist-heading__title">
          <h1>{playlist.title}</h1>
          {isAdmin && <AdminMenu label={playlist.title} onEdit={() => setEditor({ mode: 'edit', kind: 'playlist', values: playlistValues(playlist), originalId: playlist.id })} onDelete={() => setEditor({ mode: 'delete', kind: 'playlist', id: playlist.id, title: playlist.title })} />}
        </div>
        <p>{playlist.description}</p>
      </header>
    </>
  )

  if (!videos?.length) {
    return (
      <section className="section shell">
        {heading}
        <StatePanel icon="✦" title="الدروس في الطريق"><p>هذه السلسلة موجودة، لكن لم تتم إضافة فيديوهات نشطة لها بعد.</p></StatePanel>
        {addVideoTile && <div className="admin-empty-add">{addVideoTile}</div>}
        {editorDialog}
      </section>
    )
  }

  return (
    <section className="playlist-page">
      <div className="shell">
        {heading}
        <div className={`watch-layout ${selectedIsQuiz ? 'watch-layout--quiz' : ''}`}>
          <div className="watch-main">
            {selectedVideo && !selectedIsQuiz && <VideoPlayer video={selectedVideo} />}
            {selectedVideo && !selectedIsQuiz && <div className="current-video-copy"><span>الدرس {lessonVideos.findIndex((v) => v.id === selectedVideo.id) + 1} من {lessonVideos.length}</span><h2>{selectedVideo.title}</h2><p>{selectedVideo.description || 'استمتع بالدرس، ثم انتقل للدرس التالي من القائمة.'}</p></div>}
            {selectedVideo && selectedIsQuiz
              ? <section className="quiz-stage"><span className="quiz-stage__eyebrow">اختبار تفاعلي</span><h2>{selectedVideo.title}</h2><p>{selectedVideo.description || 'اختبر ما تعلمته في هذه السلسلة، وارجع إلى الدروس متى احتجت إلى مراجعة أي جزء.'}</p><AttachmentList attachments={attachments ?? []} quizOnly renderMenu={attachmentMenu} footer={addAttachmentTile} /></section>
              : <AttachmentList attachments={attachments ?? []} renderMenu={attachmentMenu} footer={addAttachmentTile} />}
          </div>
          <aside className="lessons-panel"><div className="lessons-panel__header"><div><span>دروس السلسلة</span><strong>{lessonVideos.length} {lessonVideos.length === 1 ? 'درس' : 'دروس'}</strong></div><span aria-hidden="true">☰</span></div><VideoList videos={videos} activeId={selectedVideo?.id ?? ''} onSelect={(video: Video) => { setSelectedId(video.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} renderMenu={videoMenu} footer={addVideoTile} /></aside>
        </div>
      </div>
      {editorDialog}
    </section>
  )
}
