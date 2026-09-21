const DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/

export function isValidDriveFileId(fileId: string): boolean {
  return DRIVE_ID_PATTERN.test(fileId.trim())
}

export function buildDrivePreviewUrl(fileId: string): string | null {
  const normalized = fileId.trim()
  if (!isValidDriveFileId(normalized)) return null
  return `https://drive.google.com/file/d/${encodeURIComponent(normalized)}/preview`
}
