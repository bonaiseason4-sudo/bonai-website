import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthProvider'
import { CelebrationProvider } from './context/CelebrationProvider'
import { ProgressProvider } from './context/ProgressProvider'
import { ToastProvider } from './context/ToastProvider'
import { AchievementsPage } from './pages/AchievementsPage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <CelebrationProvider>
        <ProgressProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/playlist/:id" element={<PlaylistPage />} />
                  <Route path="/login" element={<AuthPage mode="login" />} />
                  <Route path="/register" element={<AuthPage mode="register" />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ProgressProvider>
      </CelebrationProvider>
    </AuthProvider>
  )
}
