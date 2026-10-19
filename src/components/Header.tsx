import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { displayName } from '../lib/userFields'
import { BrandMark } from './BrandMark'

export function Header() {
  const { user, loading, available, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
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
          <a href="/#playlists">السلاسل</a>
          {available && !loading && (user
            ? (
              <>
                <NavLink to="/profile" className="nav-account"><span className="nav-avatar" aria-hidden="true">{displayName(user).charAt(0).toUpperCase()}</span><span className="nav-name">{displayName(user)}</span></NavLink>
                <button type="button" className="nav-logout" onClick={handleLogout} aria-label="تسجيل الخروج" title="تسجيل الخروج">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
                </button>
              </>
            )
            : <NavLink to="/login" className="nav-account">تسجيل الدخول</NavLink>)}
        </nav>
      </div>
    </header>
  )
}
