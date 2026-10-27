import type { Metadata } from 'next'
import './mina-dashboard.css'
export const metadata: Metadata = { title: 'Mina Tests Admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="md-root"><main className="md-shell">{children}</main></div> }
