import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaylistPage } from './pages/PlaylistPage'

export default function App() {
  return <BrowserRouter><Routes><Route element={<Layout />}><Route path="/" element={<HomePage />} /><Route path="/playlist/:id" element={<PlaylistPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes></BrowserRouter>
}
