import type { Request, Response } from 'express'
import { attendanceWindow, flag, oneOf, optionalText, requiredId, requiredText, sortOrder, ValidationError } from '../lib/validate'
import { ATTACHMENT_TYPES, AttachmentModel, type AttachmentInput } from '../models/attachment.model'
import { PlaylistModel, type PlaylistInput } from '../models/playlist.model'
import { VideoModel, type VideoInput } from '../models/video.model'
import { attachmentView } from '../views/attachment.view'
import { playlistView } from '../views/playlist.view'
import { videoView } from '../views/video.view'

type IdParams = { id: string }

const VIDEO_SOURCES = ['GOOGLE_DRIVE', 'DIRECT'] as const

// Request bodies use the same field names the API returns (including `isQuiz`).
function readPlaylist(body: Record<string, unknown>): PlaylistInput {
  return {
    id: requiredId(body.id, 'ID'),
    title: requiredText(body.title, 'Title', 120),
    description: optionalText(body.description),
    image_url: optionalText(body.image_url),
    sort_order: sortOrder(body.sort_order),
  }
}

function readVideo(body: Record<string, unknown>): VideoInput {
  const video: VideoInput = {
    id: requiredId(body.id, 'ID'),
    playlist_id: requiredId(body.playlist_id, 'Playlist ID'),
    title: requiredText(body.title, 'Title', 160),
    description: optionalText(body.description),
    drive_file_id: optionalText(body.drive_file_id),
    video_url: optionalText(body.video_url),
    video_source: oneOf(body.video_source, VIDEO_SOURCES, 'Video source', null),
    sort_order: sortOrder(body.sort_order),
    is_active: flag(body.is_active, true),
    is_quiz: flag(body.isQuiz, false),
    ...attendanceWindow(body.attend_from, body.attend_until),
  }
  if (video.video_source === 'GOOGLE_DRIVE' && !video.drive_file_id) throw new ValidationError('Google Drive file ID is required')
  if (video.video_source === 'DIRECT' && !video.video_url) throw new ValidationError('Video URL is required')
  return video
}

function readAttachment(body: Record<string, unknown>): AttachmentInput {
  const url = requiredText(body.url, 'URL', 2000)
  if (url.length < 10) throw new ValidationError('URL must be at least 10 characters')
  return {
    id: requiredId(body.id, 'ID'),
    video_id: requiredId(body.video_id, 'Video ID'),
    title: requiredText(body.title, 'Title', 160),
    description: optionalText(body.description),
    url,
    file_type: oneOf(body.file_type, ATTACHMENT_TYPES, 'File type', 'OTHER')!,
    sort_order: sortOrder(body.sort_order),
    is_active: flag(body.is_active, true),
  }
}

function notFound(res: Response, what: string) {
  res.status(404).json({ error: `${what} not found` })
}

export const AdminPlaylistController = {
  async index(_req: Request, res: Response) {
    res.json((await PlaylistModel.findAll()).map(playlistView))
  },
  async show(req: Request<IdParams>, res: Response) {
    const playlist = await PlaylistModel.findActiveById(req.params.id)
    return playlist ? void res.json(playlistView(playlist)) : notFound(res, 'Playlist')
  },
  async videos(req: Request<IdParams>, res: Response) {
    res.json((await VideoModel.findAllByPlaylist(req.params.id)).map(videoView))
  },
  async create(req: Request, res: Response) {
    res.status(201).json(playlistView(await PlaylistModel.create(readPlaylist(req.body ?? {}))))
  },
  async update(req: Request<IdParams>, res: Response) {
    const playlist = await PlaylistModel.update(req.params.id, readPlaylist(req.body ?? {}))
    return playlist ? void res.json(playlistView(playlist)) : notFound(res, 'Playlist')
  },
  async destroy(req: Request<IdParams>, res: Response) {
    return (await PlaylistModel.delete(req.params.id)) ? void res.status(204).end() : notFound(res, 'Playlist')
  },
}

export const AdminVideoController = {
  async attachments(req: Request<IdParams>, res: Response) {
    res.json((await AttachmentModel.findAllByVideo(req.params.id)).map(attachmentView))
  },
  async create(req: Request, res: Response) {
    res.status(201).json(videoView(await VideoModel.create(readVideo(req.body ?? {}))))
  },
  async update(req: Request<IdParams>, res: Response) {
    const video = await VideoModel.update(req.params.id, readVideo(req.body ?? {}))
    return video ? void res.json(videoView(video)) : notFound(res, 'Video')
  },
  async destroy(req: Request<IdParams>, res: Response) {
    return (await VideoModel.delete(req.params.id)) ? void res.status(204).end() : notFound(res, 'Video')
  },
}

export const AdminAttachmentController = {
  async create(req: Request, res: Response) {
    res.status(201).json(attachmentView(await AttachmentModel.create(readAttachment(req.body ?? {}))))
  },
  async update(req: Request<IdParams>, res: Response) {
    const attachment = await AttachmentModel.update(req.params.id, readAttachment(req.body ?? {}))
    return attachment ? void res.json(attachmentView(attachment)) : notFound(res, 'Attachment')
  },
  async destroy(req: Request<IdParams>, res: Response) {
    return (await AttachmentModel.delete(req.params.id)) ? void res.status(204).end() : notFound(res, 'Attachment')
  },
}
