import logo from '../assets/bunay-logo.png'
import tarteelLogo from '../assets/jamiyat-altarteel-logo.jpg'

interface BrandMarkProps { compact?: boolean }

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`} aria-label="بنيّ">
      {!compact && <img className="brand-mark__partner-logo" src={tarteelLogo} alt="جمعية الترتيل للخدمات الثقافية والدينية" />}
      {!compact && <span className="brand-mark__divider" aria-hidden="true" />}
      <img className="brand-mark__bunai-logo" src={logo} alt="شعار بنيّ" />
      {!compact && <div><strong>بنيّ</strong><span>نتعلّم ديننا بمحبة</span></div>}
    </div>
  )
}
