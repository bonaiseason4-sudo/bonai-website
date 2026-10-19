import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage, changePassword, updateProfile } from '../services/authService'
import type { User } from '../types/auth'

const roleLabels = { user: 'طالب', admin: 'مشرف' } as const

export function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) return <section className="section shell auth-page"><div className="auth-card skeleton" style={{ height: 360 }} /></section>
  if (!user) return <Navigate to="/login" state={{ from: '/profile' }} replace />
  return <ProfileCard user={user} />
}

function ProfileCard({ user }: { user: User }) {
  const { logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState(user.phone ?? '')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const updated = await updateProfile({ phone })
      setUser(updated)
      setPhone(updated.phone ?? '')
      setMessage({ type: 'success', text: 'تم حفظ التعديلات.' })
    } catch (error) {
      setMessage({ type: 'error', text: authErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    // Leave the page first; otherwise the logged-out profile page redirects to /login.
    navigate('/')
    await logout().catch(() => undefined)
  }

  const joined = new Date(user.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <section className="section shell auth-page">
      <div className="auth-card profile-card">
        <div className="profile-card__header">
          <div className="profile-avatar" aria-hidden="true">{user.username.charAt(0).toUpperCase()}</div>
          <div>
            <h1>{user.username}</h1>
            <p><span className={`role-badge role-badge--${user.role}`}>{roleLabels[user.role]}</span> · انضم في {joined}</p>
          </div>
        </div>

        <div className="profile-soon">
          <strong>قريبًا في ملفك ✨</strong>
          <p>تسجيل الحضور في الدروس، سلسلة الأيام المتتالية، وأسئلة يومية.</p>
        </div>

        <form onSubmit={handleSave}>
          <label className="field">
            <span>رقم الهاتف <small>(اختياري)</small></span>
            <input type="tel" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" maxLength={30} />
          </label>
          {message && <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">{message.text}</p>}
          <div className="profile-actions">
            <button className="primary-button" type="submit" disabled={saving || phone === (user.phone ?? '')}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
          </div>
        </form>

        <ChangePasswordForm />

        <button className="secondary-button profile-logout" type="button" onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </section>
  )
}

function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    if (password !== confirm) {
      setMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين.' })
      return
    }
    setSaving(true)
    try {
      await changePassword(password)
      setPassword('')
      setConfirm('')
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور. تم تسجيل خروجك من الأجهزة الأخرى.' })
    } catch (error) {
      setMessage({ type: 'error', text: authErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="profile-section" onSubmit={handleSubmit}>
      <h2>تغيير كلمة المرور</h2>
      <label className="field">
        <span>كلمة المرور الجديدة</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
      </label>
      <label className="field">
        <span>تأكيد كلمة المرور</span>
        <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required />
      </label>
      {message && <p className={message.type === 'error' ? 'form-error' : 'form-success'} role="status">{message.text}</p>}
      <div className="profile-actions">
        <button className="primary-button" type="submit" disabled={saving || !password || !confirm}>{saving ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}</button>
      </div>
    </form>
  )
}
