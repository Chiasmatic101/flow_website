import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Mina Tests Admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="funnel-shell"><main className="admin-shell">{children}</main></div> }
