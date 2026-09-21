export interface Playlist {
  id: string
  title: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  video_count?: number
}

export interface Video {
  id: string
  playlist_id: string
  title: string
  description: string | null
  drive_file_id: string | null
  video_url: string | null
  video_source: 'GOOGLE_DRIVE' | 'DIRECT'
  sort_order: number
  is_active: boolean
  created_at: string
}

export type AttachmentType = 'PDF' | 'POWERPOINT' | 'WORD' | 'SPREADSHEET' | 'GOOGLE_FORM' | 'GEMINI_QUIZ' | 'LINK' | 'OTHER'

export interface Attachment {
  id: string
  video_id: string
  title: string
  description: string | null
  url: string
  file_type: AttachmentType
  sort_order: number
  is_active: boolean
  created_at: string
}
