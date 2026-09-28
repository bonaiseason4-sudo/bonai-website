const DRIVE_FILE_URL_PATTERN = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/
const DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/

export type VideoEmbed =
  | { kind: 'iframe'; url: string }
  | { kind: 'native'; urls: string[] }

export function getVideoEmbed(source: string | null, sourceType?: 'GOOGLE_DRIVE' | 'DIRECT'): VideoEmbed | null {
  const value = source?.trim() ?? ''
  if (!value || value.startsWith('DEMO_')) return null

  if (sourceType === 'DIRECT') {
    try {
      const url = new URL(value)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
      const vconnctMatch = url.hostname === 'classroom.vconnct.com' && url.pathname.match(/\/(?:playback\/)?video\/([^/]+)\/?$/)
      if (vconnctMatch) {
        const baseUrl = `https://classroom.vconnct.com/video/${vconnctMatch[1]}/video-0`
        return { kind: 'native', urls: [`${baseUrl}.mp4`, `${baseUrl}.m4v`] }
      }
      const isVideoFile = /\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(url.pathname + url.search)
      return isVideoFile ? { kind: 'native', urls: [url.toString()] } : { kind: 'iframe', url: url.toString() }
    } catch {
      return null
    }
  }

  const driveMatch = value.match(DRIVE_FILE_URL_PATTERN)
  const driveId = driveMatch?.[1] ?? (DRIVE_ID_PATTERN.test(value) ? value : null)
  if (driveId) return { kind: 'iframe', url: `https://drive.google.com/file/d/${encodeURIComponent(driveId)}/preview` }

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    const isVideoFile = /\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(url.pathname + url.search)
    return isVideoFile ? { kind: 'native', urls: [url.toString()] } : { kind: 'iframe', url: url.toString() }
  } catch {
    return null
  }
}
