import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FlameIcon, ShieldIcon } from '../components/attendance/icons'
import { BadgeIcon } from '../components/badges/BadgeIcon'
import { useAuth } from '../hooks/useAuth'
import { useBadges } from '../hooks/useBadges'
import { useProgress } from '../hooks/useProgress'
import { freezeHint, multiplierHint } from '../lib/progressText'
import { displayName, nameError, nameHint } from '../lib/userFields'
import { authErrorMessage, changePassword, updateProfile } from '../services/authService'
import type { User } from '../types/auth'
import type { Progress } from '../types/progress'

const roleLabels = { user: 'طالب', admin: 'مشرف' } as const

type Section = 'name' | 'phone' | 'password'
type Message = { type: 'success' | 'error'; text: string } | null

export function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) return <section className="section shell auth-page"><div className="auth-card skeleton" style={{ height: 360 }} /></section>
  if (!user) return <Navigate to="/login" state={{ from: '/profile' }} replace />
  return <ProfileView user={user} />
}

function ProfileView({ user }: { user: User }) {
  const { logout } = useAuth()
  const { progress } = useProgress()
  const navigate = useNavigate()
  // Accounts from before names existed open on the name section.
  const [open, setOpen] = useState<Section | null>(user.name ? null : 'name')
  const toggle = (section: Section) => setOpen((current) => (current === section ? null : section))

  async function handleLogout() {
    // Leave the page first; otherwise the logged-out profile page redirects to /login.
    navigate('/')
    await logout().catch(() => undefined)
  }

  const joined = new Date(user.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <section className="section shell auth-page">
      <div className="profile-page">
        <div className="auth-card profile-card">
          <div className="profile-card__header">
            <div className="profile-avatar" aria-hidden="true">{displayName(user).charAt(0).toUpperCase()}</div>
            <div>
              <h1>{displayName(user)}</h1>
              <p className="profile-username" dir="ltr">@{user.username}</p>
              <p><span className={`role-badge role-badge--${user.role}`}>{roleLabels[user.role]}</span> · انضم في {joined}</p>
            </div>
          </div>
          <div className="profile-soon">
            <strong>قريبًا في ملفك إن شاء الله ✨</strong>
            <p>أسئلة يومية تراجع بها ما تعلمته.</p>
          </div>
        </div>

        {progress && <StatsCard progress={progress} />}
        <AchievementsLink />

        <div className="settings-list">
          <SettingRow icon={<UserIcon />} label="الاسم" value={user.name ?? 'لم يُضف بعد'} open={open === 'name'} onToggle={() => toggle('name')}>
            <NameForm user={user} />
          </SettingRow>
          <SettingRow icon={<PhoneIcon />} label="رقم الهاتف" value={user.phone ? <span dir="ltr">{user.phone}</span> : 'لم يُضف بعد'} open={open === 'phone'} onToggle={() => toggle('phone')}>
            <PhoneForm user={user} />
          </SettingRow>
          <SettingRow icon={<LockIcon />} label="تغيير كلمة المرور" value="••••••" open={open === 'password'} onToggle={() => toggle('password')}>
            <PasswordForm />
          </SettingRow>
        </div>

        <button className="secondary-button profile-logout" type="button" onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </section>
  )
}

// The attendance streak at a glance; every number comes from the API.
function StatsCard({ progress }: { progress: Progress }) {
  return (
    <section className="stats-card" aria-labelledby="stats-card-title">
      <div className="stats-card__hero">
        <span className="stats-card__flame" aria-hidden="true"><FlameIcon size={34} /></span>
        <div>
          <h2 id="stats-card-title">الشعلة الحالية</h2>
          <p><strong>{progress.run}</strong> حضور مباشر ورا بعض</p>
        </div>
      </div>
      <dl className="stats-grid">
        <div><dt>أطول شعلة</dt><dd>{progress.best_run}</dd></div>
        <div><dt>المضاعِف</dt><dd dir="ltr">×{progress.multiplier.toFixed(1)}</dd></div>
        <div><dt>الدروع</dt><dd><ShieldIcon size={18} />{progress.freezes}</dd></div>
        <div><dt>النقاط</dt><dd>{progress.points}</dd></div>
      </dl>
      <ul className="stats-card__hints">
        <li>{multiplierHint(progress)}</li>
        <li>{freezeHint(progress)}</li>
        <li>الدرع يحمي شعلتك لو فاتك درس.</li>
      </ul>
    </section>
  )
}

// The way into the badge album, with the newest medals earned so far.
function AchievementsLink() {
  const { data } = useBadges()
  const latest = (data?.badges ?? [])
    .filter((badge) => badge.earned_at !== null)
    .sort((a, b) => (b.earned_at ?? '').localeCompare(a.earned_at ?? ''))
    .slice(0, 3)

  return (
    <Link to="/achievements" className="achievements-link">
      <span className="achievements-link__medals" aria-hidden="true">
        {latest.length
          ? latest.map((badge) => <BadgeIcon key={badge.id} icon={badge.icon} color={badge.color} tier={badge.tier} />)
          : <BadgeIcon icon="medal" color="gold" locked />}
      </span>
      <span className="achievements-link__text">
        <strong>إنجازاتي</strong>
        <small>{data ? `${data.summary.earned} من ${data.summary.total} وسام` : 'ألبوم أوسمتك'}</small>
      </span>
      <span className="achievements-link__arrow" aria-hidden="true">←</span>
    </Link>
  )
}

// One setting: a row with its icon on the left; pressing it shows the related form.
function SettingRow({ icon, label, value, open, onToggle, children }: { icon: ReactNode; label: string; value: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  const id = `setting-${label}`
  return (
    <div className={`setting-row${open ? ' is-open' : ''}`}>
      <button type="button" className="setting-row__head" onClick={onToggle} aria-expanded={open} aria-controls={id}>
        <span className="setting-row__text">
          <strong>{label}</strong>
          <small>{value}</small>
        </span>
        <span className="setting-row__icon" aria-hidden="true">{icon}</span>
      </button>
      {open && <div className="setting-row__body" id={id}>{children}</div>}
    </div>
  )
}

function useSave() {
  const [message, setMessage] = useState<Message>(null)
  const [saving, setSaving] = useState(false)

  async function run(action: () => Promise<string>) {
    setSaving(true)
    setMessage(null)
    try {
      setMessage({ type: 'success', text: await action() })
    } catch (error) {
      setMessage({ type: 'error', text: authErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  return { message, setMessage, saving, run }
}

function FormMessage({ message }: { message: Message }) {
  return message && <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">{message.text}</p>
}

function NameForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const [name, setName] = useState(user.name ?? '')
  const { message, setMessage, saving, run } = useSave()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const invalid = nameError(name)
    if (invalid) return setMessage({ type: 'error', text: invalid })
    run(async () => {
      setUser(await updateProfile({ name }))
      return 'تم حفظ الاسم.'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>الاسم</span>
        <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={50} autoFocus />
        <small className="field__hint">{nameHint}</small>
      </label>
      <FormMessage message={message} />
      <button className="primary-button setting-row__submit" type="submit" disabled={saving || name.trim() === (user.name ?? '')}>{saving ? 'جارٍ الحفظ...' : 'حفظ الاسم'}</button>
    </form>
  )
}

function PhoneForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const [phone, setPhone] = useState(user.phone ?? '')
  const { message, saving, run } = useSave()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    run(async () => {
      setUser(await updateProfile({ phone }))
      return phone.trim() ? 'تم حفظ رقم الهاتف.' : 'تم حذف رقم الهاتف.'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>رقم الهاتف <small>(اختياري)</small></span>
        <input type="tel" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" maxLength={30} autoFocus />
      </label>
      <FormMessage message={message} />
      <button className="primary-button setting-row__submit" type="submit" disabled={saving || phone.trim() === (user.phone ?? '')}>{saving ? 'جارٍ الحفظ...' : 'حفظ رقم الهاتف'}</button>
    </form>
  )
}

function PasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const { message, setMessage, saving, run } = useSave()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirm) return setMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين.' })
    run(async () => {
      await changePassword(password)
      setPassword('')
      setConfirm('')
      return 'تم تغيير كلمة المرور. تم تسجيل خروجك من الأجهزة الأخرى.'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>كلمة المرور الجديدة</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required autoFocus />
      </label>
      <label className="field">
        <span>تأكيد كلمة المرور</span>
        <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required />
      </label>
      <FormMessage message={message} />
      <button className="primary-button setting-row__submit" type="submit" disabled={saving || !password || !confirm}>{saving ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}</button>
    </form>
  )
}

const iconProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function UserIcon() {
  return <svg {...iconProps}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
}

function PhoneIcon() {
  return <svg {...iconProps}><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
}

function LockIcon() {
  return <svg {...iconProps}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.75" r="1.25" /></svg>
}
