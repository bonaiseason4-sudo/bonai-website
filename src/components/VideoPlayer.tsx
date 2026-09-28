import { getVideoEmbed } from '../lib/videoSource'
import type { Video } from '../types/content'

export function VideoPlayer({ video }: { video: Video }) {
  const source = video.video_source === 'GOOGLE_DRIVE' ? video.drive_file_id : video.video_url
  const embed = getVideoEmbed(source, video.video_source)

  if (!embed) {
    return <div className="video-placeholder"><div className="play-orb" aria-hidden="true">▶</div><strong>{video.title}</strong><p>أضف رابط فيديو صالحًا في Supabase ليظهر المشغّل هنا.</p></div>
  }

  if (embed.kind === 'native') {
    return <div className="video-frame"><video key={video.id} title={video.title} controls preload="metadata" playsInline>{embed.urls.map((url) => <source key={url} src={url} type={url.endsWith('.m4v') || url.endsWith('.mp4') ? 'video/mp4' : undefined} />)}</video></div>
  }

  return (
    <div className="video-frame">
      <iframe key={video.id} src={embed.url} title={video.title} allow="autoplay; encrypted-media" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  )
}
