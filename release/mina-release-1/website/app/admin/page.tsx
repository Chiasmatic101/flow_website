import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/server/mina-admin'
import MinaAdminLogin from '@/components/MinaAdminLogin'
export default async function AdminPage() {
  let authorized = false
  try { await requireAdmin(); authorized = true } catch { /* Render login without exposing private data. */ }
  if (authorized) redirect('/admin/experiments')
  return <MinaAdminLogin />
}
