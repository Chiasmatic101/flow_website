import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/server/mina-admin'
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  try { await requireAdmin() } catch { redirect('/admin') }
  return <>{children}</>
}
