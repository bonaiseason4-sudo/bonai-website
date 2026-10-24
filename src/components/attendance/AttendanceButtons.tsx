import { useId, type ComponentType } from 'react'
import { attendanceView } from '../../lib/attendance'
import type { Video } from '../../types/content'
import type { Attendance, AttendanceKind } from '../../types/progress'
import { BroadcastIcon, CheckIcon, HeadphonesIcon, LockIcon } from './icons'

const options: { kind: AttendanceKind; label: string; hint: string; Icon: ComponentType<{ size?: number }> }[] = [
  { kind: 'LIVE', label: 'حضور مباشر', hint: 'سجّل إنك حضرت الدرس مباشر', Icon: BroadcastIcon },
  { kind: 'RECORDED', label: 'مسجّل', hint: 'سجّل إنك سمعت الدرس مسجّل', Icon: HeadphonesIcon },
]

interface AttendanceButtonsProps {
  video: Video
  attendance: Attendance | undefined
  now: number
  onChoose: (kind: AttendanceKind) => void
  busy?: boolean
  size?: 'compact' | 'large'
}

export function AttendanceButtons({ video, attendance, now, onChoose, busy = false, size = 'compact' }: AttendanceButtonsProps) {
  const statusId = useId()
  const view = attendanceView(video, attendance, now)
  const iconSize = size === 'large' ? 20 : 15

  return (
    <div className={`attendance attendance--${size}${busy ? ' is-busy' : ''}`}>
      <div className="attendance__buttons" role="group" aria-label={`الحضور في درس ${video.title}`} aria-describedby={view.status ? statusId : undefined}>
        {options.map(({ kind, label, hint, Icon }) => {
          const selected = attendance?.kind === kind
          const reason = view.disabled[kind]
          const title = reason
            ?? (selected ? 'اضغط مرة ثانية للإلغاء' : kind === 'RECORDED' && view.phase === 'ended' ? 'استدراك متأخر' : hint)
          return (
            <button
              key={kind}
              type="button"
              className={`attendance-btn attendance-btn--${kind.toLowerCase()}${selected ? ' is-selected' : ''}`}
              aria-pressed={selected}
              // The name starts with the visible label so voice control can say it; aria-pressed carries the state.
              aria-label={reason ? `${label} (${reason})` : undefined}
              aria-busy={busy || undefined}
              title={title}
              disabled={reason !== null}
              onClick={() => { if (!busy) onChoose(kind) }}
            >
              <span className="attendance-btn__icon" aria-hidden="true">{selected ? <CheckIcon size={iconSize} /> : <Icon size={iconSize} />}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
      {view.status && (
        <p className={`attendance__status attendance__status--${view.tone}`} id={statusId}>
          {view.locked && <LockIcon />}
          {view.status}
        </p>
      )}
    </div>
  )
}
