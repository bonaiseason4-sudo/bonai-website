import { BrandMark } from './BrandMark'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <BrandMark compact />
        <p>بنيّ — مساحة تعليمية هادئة وآمنة لتنمية المعرفة والإيمان.</p>
        <small>صُنِع بعناية للصغار وأسرهم.</small>
      </div>
    </footer>
  )
}
