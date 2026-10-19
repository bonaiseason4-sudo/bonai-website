import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { displayName, nameError, nameHint } from '../lib/userFields'
import { authErrorMessage, changePassword, updateProfile } from '../services/authService'
import type { User } from '../types/auth'

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
            <p>تسجيل الحضور في الدروس، سلسلة الأيام المتتالية، وأسئلة يومية.</p>
          </div>
        </div>

        <div className="settings-list">
          <SettingRow icon={<UserIcon />} label="الاسم" value={user.name ?? 'لم يُضف بعد'} open={open === 'name'} onToggle={() => toggle('name')}>
            <NameForm user={user} />
          </SettingRow>
          <SettingRow icon={<PhoneIcon />} label="رقم الهاتف" value={user.phone ? <span dir="ltr">{user.phone}</span> : 'لم يُضف بعد'} open={open === 'phone'} onToggle={() => toggle('phone')}>
            <PhoneForm user={user} />
          </SettingRow>
          <SettingRow icon={<LockIcon />} label="كلمة المرور" value="••••••" open={open === 'password'} onToggle={() => toggle('password')}>
            <PasswordForm />
          </SettingRow>
        </div>

        <button className="secondary-button profile-logout" type="button" onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </section>
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
