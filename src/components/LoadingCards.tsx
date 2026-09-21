export function LoadingCards() {
  return <div className="playlist-grid" aria-label="جارٍ تحميل السلاسل">{Array.from({ length: 4 }, (_, i) => <div className="skeleton-card" key={i}><div className="skeleton skeleton-art" /><div className="skeleton skeleton-line wide" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>)}</div>
}
