import { Link } from 'react-router-dom'
import { StatePanel } from '../components/StatePanel'

export function NotFoundPage() {
  return <section className="section shell"><StatePanel icon="404" title="الصفحة غير موجودة"><p>يبدو أن الرابط غير صحيح أو أن الصفحة انتقلت إلى مكان آخر.</p><Link className="primary-button inline" to="/">العودة للرئيسية</Link></StatePanel></section>
}
