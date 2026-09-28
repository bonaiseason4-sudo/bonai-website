import { BrandMark } from './BrandMark'
import tarteelLogo from '../assets/jamiyat-altarteel-logo.jpg'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <BrandMark compact />
        <div className="footer-partner"><img src={tarteelLogo} alt="جمعية الترتيل للخدمات الثقافية والدينية" /></div>
        <p>بنيّ — مساحة تعليمية هادئة وآمنة لتنمية المعرفة والإيمان.</p>
        <small>صُنِع بعناية للصغار وأسرهم.</small>
      </div>
    </footer>
  )
}
