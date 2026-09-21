import { Link, NavLink } from 'react-router-dom'
import { BrandMark } from './BrandMark'

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand-link" aria-label="العودة إلى الرئيسية"><BrandMark /></Link>
        <nav aria-label="التنقل الرئيسي">
          <NavLink to="/" end>الرئيسية</NavLink>
          <a href="/#playlists">السلاسل</a>
        </nav>
      </div>
    </header>
  )
}
