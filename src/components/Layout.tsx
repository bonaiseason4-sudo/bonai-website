import { Outlet } from 'react-router-dom'
import { CelebrationHost } from './CelebrationHost'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  return <div className="app"><Header /><main><Outlet /></main><Footer /><CelebrationHost /></div>
}
