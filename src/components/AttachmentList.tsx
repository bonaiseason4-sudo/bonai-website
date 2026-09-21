import type { Attachment, AttachmentType } from '../types/content'

const attachmentMeta: Record<AttachmentType, { icon: string; label: string; className: string }> = {
  PDF: { icon: 'PDF', label: 'ملف PDF', className: 'attachment-card--pdf' },
  POWERPOINT: { icon: 'PPT', label: 'عرض تقديمي', className: 'attachment-card--powerpoint' },
  WORD: { icon: 'DOC', label: 'مستند Word', className: 'attachment-card--word' },
  SPREADSHEET: { icon: 'XLS', label: 'جدول بيانات', className: 'attachment-card--spreadsheet' },
  GOOGLE_FORM: { icon: '✓', label: 'اختبر فهمك', className: 'attachment-card--form' },
  GEMINI_QUIZ: { icon: '✦', label: 'تحدّي ذكي', className: 'attachment-card--quiz' },
  LINK: { icon: '↗', label: 'رابط مفيد', className: 'attachment-card--link' },
  OTHER: { icon: '✦', label: 'مرفق', className: 'attachment-card--other' },
}

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (!attachments.length) return null

  return (
    <section className="attachments" aria-label="مرفقات الدرس">
      <div className="attachments__heading"><span>مرفقات الدرس</span><small>{attachments.length} {attachments.length === 1 ? 'مرفق' : 'مرفقات'}</small></div>
      <div className="attachment-grid">
        {attachments.map((attachment) => {
          const meta = attachmentMeta[attachment.file_type] ?? attachmentMeta.OTHER
          return <a key={attachment.id} className={`attachment-card ${meta.className}`} href={attachment.url} target="_blank" rel="noreferrer"><span className="attachment-icon" aria-hidden="true">{meta.icon}</span><span className="attachment-copy"><strong>{attachment.title}</strong><small>{attachment.description || meta.label}</small></span><span className="attachment-open" aria-hidden="true">↗</span></a>
        })}
      </div>
    </section>
  )
}
