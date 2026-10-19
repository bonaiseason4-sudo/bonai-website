import type { AttachmentRow } from '../models/attachment.model'

export function attachmentView(row: AttachmentRow) {
  return { ...row, is_active: row.is_active === 1 }
}
