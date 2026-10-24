import type { CSSProperties } from 'react'
import { Navigate } from 'react-router-dom'
import { FlameIcon } from '../components/attendance/icons'
import { BadgeIcon } from '../components/badges/BadgeIcon'
import { StatePanel } from '../components/StatePanel'
import { useAuth } from '../hooks/useAuth'
import { useBadges } from '../hooks/useBadges'
import { useProgress } from '../hooks/useProgress'
import { badgePalette } from '../lib/badgePalette'
import { formatDate } from '../lib/dates'
import type { BadgeView } from '../types/badges'
import type { Progress } from '../types/progress'

// Shown for a secret badge until it is earned, whatever the API sends, so the surprise never leaks.
const SECRET_TITLE = 'وسام سري'
const SECRET_DESCRIPTION = 'مفاجأة! كمّل وهتعرفه'

export function AchievementsPage() {
  const { user, loading } = useAuth()

  if (loading) return <section className="section shell achievements-page"><AlbumSkeleton /></section>
  if (!user) return <Navigate to="/login" state={{ from: '/achievements' }} replace />
  return <AchievementsView />
}

function AchievementsView() {
  const { progress } = useProgress()
  const { data, failed, reload } = useBadges()
  // The API sends them in album order; earned ones lead.
  const earned = data?.badges.filter((badge) => badge.earned_at !== null) ?? []
  const locked = data?.badges.filter((badge) => badge.earned_at === null) ?? []

  return (
    <section className="section shell achievements-page">
      <header className="achievements-heading">
        <span className="eyebrow">🏅 رحلتك في بنيّ</span>
        <h1>إنجازاتي</h1>
        <p>كل درس بتحضره بيقرّبك من وسام جديد. كمّل يا بطل ✨</p>
      </header>

      <StatTiles progress={progress} />

      {data
        ? (
          <>
            <AlbumBar earned={data.summary.earned} total={data.summary.total} />
            <section className="badge-section" aria-labelledby="earned-badges-title">
              <h2 id="earned-badges-title">أوسمتك</h2>
              {earned.length
                ? <ul className="badge-grid">{earned.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}</ul>
                : <p className="badge-empty"><span aria-hidden="true"><FlameIcon size={26} /></span>احضر أول درس مباشر وخد أول وسام 🔥</p>}
            </section>
            {locked.length > 0
              ? (
                <section className="badge-section" aria-labelledby="locked-badges-title">
                  <h2 id="locked-badges-title">باقيلك شوية</h2>
                  <ul className="badge-grid">{locked.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}</ul>
                </section>
              )
              : earned.length > 0 && <p className="badge-complete">جمعت كل الأوسمة! ما شاء الله عليك 🌟</p>}
          </>
        )
        : failed
          ? <StatePanel icon="!" title="تعذّر تحميل الأوسمة"><p>تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.</p><button type="button" className="primary-button inline" onClick={reload}>حاول مرة أخرى</button></StatePanel>
          : <AlbumSkeleton />}
    </section>
  )
}

// The streak numbers come from the shared progress, already loaded for the nav flame.
function StatTiles({ progress }: { progress: Progress | null }) {
  const value = (text: string | number) => (progress ? text : '—')
  return (
    <ul className="achievement-stats">
      <li className="achievement-stat achievement-stat--flame">
        <span className="achievement-stat__icon" aria-hidden="true"><FlameIcon size={26} /></span>
        <span className="achievement-stat__label">الشعلة</span>
        <strong className="achievement-stat__value">{value(progress?.run ?? 0)}</strong>
      </li>
      <li className="achievement-stat achievement-stat--multiplier">
        <span className="achievement-stat__icon" aria-hidden="true"><TimesIcon /></span>
        <span className="achievement-stat__label">المضاعِف</span>
        <strong className="achievement-stat__value" dir="ltr">{value(`×${(progress?.multiplier ?? 1).toFixed(1)}`)}</strong>
      </li>
      <li className="achievement-stat achievement-stat--points">
        <span className="achievement-stat__icon" aria-hidden="true"><StarIcon /></span>
        <span className="achievement-stat__label">النقاط</span>
        <strong className="achievement-stat__value">{value(progress?.points ?? 0)}</strong>
      </li>
    </ul>
  )
}

function AlbumBar({ earned, total }: { earned: number; total: number }) {
  const percent = total > 0 ? Math.min(100, (earned / total) * 100) : 0
  return (
    <div className="album-bar">
      <div className="album-bar__head">
        <h2><BadgeIcon icon="medal" color="gold" />ألبوم الأوسمة</h2>
        <span className="album-bar__count">{earned} من {total}</span>
      </div>
      <div className="album-bar__track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
    </div>
  )
}

function BadgeCard({ badge }: { badge: BadgeView }) {
  const earnedAt = badge.earned_at
  const secret = badge.is_secret && earnedAt === null
  const title = secret ? SECRET_TITLE : badge.title
  const progress = earnedAt === null && !secret && badge.progress && badge.progress.target > 0 ? badge.progress : null
  const glow = earnedAt !== null ? ({ '--badge-glow': badgePalette(badge.color, badge.tier).glow } as CSSProperties) : undefined

  return (
    <li className={`badge-card ${earnedAt !== null ? 'is-earned' : 'is-locked'}${secret ? ' is-secret' : ''}`} style={glow}>
      <span className="badge-card__medal"><BadgeIcon icon={secret ? 'secret' : badge.icon} color={badge.color} tier={badge.tier} locked={earnedAt === null} /></span>
      {earnedAt !== null && !badge.seen && <span className="badge-card__new">جديد</span>}
      <h3 className="badge-card__title">{earnedAt === null && <span className="sr-only">لسه مقفول: </span>}{title}</h3>
      {earnedAt !== null && <p className="badge-card__date">أخدته في {formatDate(earnedAt)}</p>}
      <p className="badge-card__description">{secret ? SECRET_DESCRIPTION : badge.description}</p>
      {progress && (
        <div className="badge-card__progress">
          <span className="badge-card__bar" aria-hidden="true"><span style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }} /></span>
          <span className="badge-card__count">{progress.current} من {progress.target}</span>
        </div>
      )}
    </li>
  )
}

function AlbumSkeleton() {
  return (
    <div className="album-skeleton" role="status">
      <span className="sr-only">جارٍ تحميل الأوسمة</span>
      <div className="skeleton album-skeleton__bar" />
      <div className="badge-grid">{Array.from({ length: 8 }, (_, index) => <div className="skeleton album-skeleton__card" key={index} />)}</div>
    </div>
  )
}

const iconProps = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

function TimesIcon() {
  return <svg {...iconProps}><path d="M7 7l10 10M17 7 7 17" /></svg>
}

function StarIcon() {
  return <svg {...iconProps} strokeWidth={2}><path fill="currentColor" fillOpacity=".25" d="m12 3 2.7 5.5 6 .9-4.35 4.25 1.03 6L12 16.8l-5.38 2.85 1.03-6L3.3 9.4l6-.9L12 3Z" /></svg>
}
