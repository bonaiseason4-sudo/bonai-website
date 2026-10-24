import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { displayName } from '../lib/userFields'
import { Modal } from './admin/Modal'
import { FlameIcon, ShieldIcon } from './attendance/icons'
import { BrandMark } from './BrandMark'

export function Header() {
  const { user, loading, available, logout } = useAuth()
  const { progress, pulseKey } = useProgress()
  const navigate = useNavigate()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  async function handleLogout() {
    setConfirmingLogout(false)
    // Go home first so pages for logged-in users don't redirect to /login.
    navigate('/')
    await logout().catch(() => undefined)
  }

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand-link" aria-label="العودة إلى الرئيسية"><BrandMark /></Link>
        <nav aria-label="التنقل الرئيسي">
          <NavLink to="/" end className="nav-home">الرئيسية</NavLink>
          <a href="/#playlists" className="nav-playlists">السلاسل</a>
          {available && !loading && (user
            ? (
              <>
                {progress && (
                  <Link to="/achievements" className="nav-streak" aria-label={`شعلتك ${progress.run}${progress.freezes > 0 ? `، ومعاك ${progress.freezes} درع` : ''}، إنجازاتي`} title="شعلة الحضور المباشر · إنجازاتي">
                    {/* A new key on each pulse re-mounts the flame so its animation plays again. */}
                    <span key={pulseKey} className={`nav-streak__flame${pulseKey ? ' is-pulsing' : ''}`}><FlameIcon size={18} /></span>
                    <span className="nav-streak__count">{progress.run}</span>
                    {progress.freezes > 0 && <span className="nav-streak__shield"><ShieldIcon size={16} /><span className="nav-streak__count">{progress.freezes}</span></span>}
                  </Link>
                )}
                <NavLink to="/profile" className="nav-account"><span className="nav-avatar" aria-hidden="true">{displayName(user).charAt(0).toUpperCase()}</span><span className="nav-name">{displayName(user)}</span></NavLink>
                <button type="button" className="nav-logout" onClick={() => setConfirmingLogout(true)} aria-label="تسجيل الخروج" title="تسجيل الخروج">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
                </button>
              </>
            )
            : <NavLink to="/login" className="nav-account">تسجيل الدخول</NavLink>)}
        </nav>
      </div>
      {confirmingLogout && (
        <Modal title="تسجيل الخروج" onClose={() => setConfirmingLogout(false)} tone="danger">
          <div className="delete-dialog logout-dialog">
            <p>هل تريد تسجيل الخروج؟</p>
            <div className="admin-form__actions">
              <button type="button" className="danger-button" onClick={handleLogout}>نعم</button>
              <button type="button" className="ghost-button" onClick={() => setConfirmingLogout(false)} autoFocus>لا</button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  )
}
