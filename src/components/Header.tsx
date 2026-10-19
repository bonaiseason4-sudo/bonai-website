import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BrandMark } from './BrandMark'

export function Header() {
  const { user, loading, available } = useAuth()

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand-link" aria-label="العودة إلى الرئيسية"><BrandMark /></Link>
        <nav aria-label="التنقل الرئيسي">
          <NavLink to="/" end className="nav-home">الرئيسية</NavLink>
          <a href="/#playlists">السلاسل</a>
          {available && !loading && (user
            ? <NavLink to="/profile" className="nav-account"><span className="nav-avatar" aria-hidden="true">{user.username.charAt(0).toUpperCase()}</span><span className="nav-name">{user.username}</span></NavLink>
            : <NavLink to="/login" className="nav-account">تسجيل الدخول</NavLink>)}
        </nav>
      </div>
    </header>
  )
}
