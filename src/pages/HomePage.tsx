import { useState } from 'react'
import { AddTile } from '../components/admin/AddTile'
import { AdminEditor, type EditorState } from '../components/admin/AdminEditor'
import { AdminMenu } from '../components/admin/AdminMenu'
import { nextSortOrder, playlistValues } from '../components/admin/entityForms'
import { PlaylistCard } from '../components/PlaylistCard'
import { LoadingCards } from '../components/LoadingCards'
import { StatePanel } from '../components/StatePanel'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { getPlaylists, usingDemoData } from '../services/contentService'
import logo from '../assets/bunay-logo.png'
import tarteelLogo from '../assets/jamiyat-altarteel-logo.jpg'

export function HomePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data: playlists, loading, error, reload } = useAsync(() => getPlaylists(isAdmin), [isAdmin])
  const [editor, setEditor] = useState<EditorState>(null)
  const showGrid = !loading && !error && playlists && (playlists.length > 0 || isAdmin)

  return (
    <>
      <section className="hero">
        <div className="hero-blob hero-blob--one" /><div className="hero-blob hero-blob--two" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">🌱 نتعلّم • نفهم • نحب الخير</span>
            <h1>رحلة صغيرة اليوم،<br /><em>وأثر جميل يدوم.</em></h1>
            <p>سلاسل تعليمية عربية مبسطة تساعد أبناءنا على التعرّف إلى دينهم بطريقة هادئة، ممتعة، وقريبة منهم.</p>
            <div className="hero-actions"><a className="primary-button" href="#playlists">ابدأ التعلّم</a><span className="gentle-note">محتوى مرتب في سلاسل سهلة المتابعة</span></div>
          </div>
          <div className="hero-visual" aria-hidden="true"><div className="sun-dot" /><div className="logo-stage"><img src={logo} alt="" /></div><span className="float-card float-card--1">السيرة</span><span className="float-card float-card--2">العقيدة</span><span className="float-card float-card--3">الآداب</span></div>
        </div>
      </section>

      <section className="association-section" aria-label="الجهة الشريكة">
        <div className="shell association-section__inner">
          <img src={tarteelLogo} alt="جمعية الترتيل للخدمات الثقافية والدينية" />
        </div>
      </section>

      <section className="section shell" id="playlists">
        <div className="section-heading"><div><span className="eyebrow">اختر رحلتك</span><h2>السلاسل التعليمية</h2></div><p>كل سلسلة مقسمة إلى دروس قصيرة ومنظمة لتكون المتابعة أبسط وأمتع.</p></div>
        {usingDemoData && <div className="demo-banner">أنت تشاهد بيانات تجريبية الآن. عند ضبط رابط الـAPI سيظهر المحتوى الحقيقي تلقائيًا.</div>}
        {loading && <LoadingCards />}
        {error && <StatePanel icon="!" title="لم نستطع تحميل السلاسل"><p>تأكد من اتصالك بالإنترنت ثم أعد تحميل الصفحة.</p></StatePanel>}
        {!loading && !error && playlists?.length === 0 && !isAdmin && <StatePanel icon="✦" title="لا توجد سلاسل بعد"><p>ستظهر السلاسل هنا فور إضافتها.</p></StatePanel>}
        {showGrid && (
          <div className="playlist-grid">
            {playlists.map((playlist, index) => (
              <div className="playlist-card-wrap" key={playlist.id}>
                <PlaylistCard playlist={playlist} index={index} />
                {isAdmin && <div className="playlist-card-wrap__menu"><AdminMenu label={playlist.title} onEdit={() => setEditor({ mode: 'edit', kind: 'playlist', values: playlistValues(playlist), originalId: playlist.id })} onDelete={() => setEditor({ mode: 'delete', kind: 'playlist', id: playlist.id, title: playlist.title })} /></div>}
              </div>
            ))}
            {isAdmin && <AddTile variant="card" label="إضافة سلسلة" onClick={() => setEditor({ mode: 'create', kind: 'playlist', values: playlistValues(undefined, nextSortOrder(playlists)) })} />}
          </div>
        )}
        <AdminEditor state={editor} onClose={() => setEditor(null)} onDone={() => { setEditor(null); reload() }} />
      </section>

      <section className="values-section"><div className="shell values-grid"><article><span>01</span><h3>محتوى مرتب</h3><p>كل موضوع في سلسلة واضحة حتى يعرف الطفل ماذا يشاهد بعد ذلك.</p></article><article><span>02</span><h3>تجربة هادئة</h3><p>واجهة بسيطة بدون تشتيت، ومناسبة للموبايل والتابلت والكمبيوتر.</p></article><article><span>03</span><h3>سهل التحديث</h3><p>أضف السلاسل والفيديوهات من قاعدة البيانات بدون تعديل كود الموقع.</p></article></div></section>
    </>
  )
}
