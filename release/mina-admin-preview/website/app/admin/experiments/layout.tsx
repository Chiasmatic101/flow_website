import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/server/mina-admin'
import { AdminLogout } from '@/components/MinaAdmin'
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  try { await requireAdmin() } catch { redirect('/admin') }
  return <><div className="flex justify-end"><AdminLogout /></div>{children}</>
}
