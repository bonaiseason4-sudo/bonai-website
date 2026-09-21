import logo from '../assets/bunay-logo.png'

interface BrandMarkProps { compact?: boolean }

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`} aria-label="بنيّ">
      <img src={logo} alt="شعار بنيّ" />
      {!compact && <div><strong>بنيّ</strong><span>نتعلّم ديننا بمحبة</span></div>}
    </div>
  )
}
