import 'server-only'
import { redirect } from 'next/navigation'
import { requireAdmin } from './mina-admin'
export async function requireAdminPage() {
  try { return await requireAdmin() } catch { redirect('/admin') }
}
