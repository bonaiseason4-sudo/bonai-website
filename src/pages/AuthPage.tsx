import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { StatePanel } from '../components/StatePanel'
import { useAuth } from '../hooks/useAuth'
import { nameError, nameHint, usernameError, usernameHint } from '../lib/userFields'
import { authErrorMessage } from '../services/authService'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, available, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const isRegister = mode === 'register'
  // Where to go after logging in: the page that sent the user here (e.g. the profile), otherwise home.
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (!available) {
    return <section className="section shell"><StatePanel icon="!" title="الحسابات غير متاحة الآن"><p>الموقع يعمل ببيانات تجريبية، لذلك لا يمكن إنشاء حساب أو تسجيل الدخول.</p></StatePanel></section>
  }
  if (user) return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const invalid = isRegister ? nameError(name) ?? usernameError(username) : null
    if (invalid) return setError(invalid)
    setSubmitting(true)
    try {
      if (isRegister) await register({ username, name, password, phone })
      else await login(username, password)
      navigate(from, { replace: true })
    } catch (submitError) {
      setError(authErrorMessage(submitError))
      setSubmitting(false)
    }
  }

  return (
    <section className="section shell auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">{isRegister ? '🌱 حساب جديد' : '👋 أهلًا بعودتك'}</span>
        <h1>{isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}</h1>
        <p className="auth-card__lead">{isRegister ? 'أنشئ حسابك لتتابع حضورك وإنجازاتك في الدروس.' : 'ادخل إلى حسابك لتكمل رحلتك.'}</p>

        {isRegister && (
          <label className="field">
            <span>الاسم</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={50} autoFocus />
            <small className="field__hint">{nameHint}</small>
          </label>
        )}

        <label className="field">
          <span>اسم المستخدم</span>
          <input dir="ltr" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={50} autoFocus={!isRegister} />
          {isRegister && <small className="field__hint">{usernameHint}</small>}
        </label>

        <label className="field">
          <span>كلمة المرور</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} required />
        </label>

        {isRegister && (
          <label className="field">
            <span>رقم الهاتف <small>(اختياري)</small></span>
            <input type="tel" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" maxLength={30} />
          </label>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="primary-button auth-card__submit" type="submit" disabled={submitting}>
          {submitting ? 'لحظة...' : isRegister ? 'إنشاء الحساب' : 'دخول'}
        </button>

        <p className="auth-card__switch">
          {isRegister ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
          <Link className="text-link" to={isRegister ? '/login' : '/register'} state={location.state}>{isRegister ? 'سجّل الدخول' : 'أنشئ حسابًا'}</Link>
        </p>
      </form>
    </section>
  )
}
