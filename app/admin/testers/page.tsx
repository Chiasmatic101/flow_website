import { requireAdminPage } from '@/lib/server/mina-admin-page'
import TesterAdmin from '@/components/TesterAdmin'
export default async function TestersPage() { await requireAdminPage(); return <TesterAdmin /> }
