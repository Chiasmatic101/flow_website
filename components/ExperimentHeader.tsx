import Link from 'next/link'
import FluxLogo from './FluxLogo'

export default function ExperimentHeader() {
  return <header className="funnel-header"><FluxLogo /><Link href="/mina-tests#signup" className="text-sm font-semibold text-cyan-200">Join Mina Tests ↗</Link></header>
}
