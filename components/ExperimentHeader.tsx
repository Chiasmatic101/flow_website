import Link from 'next/link'
import FluxLogo from './FluxLogo'

export default function ExperimentHeader() {
  return <header className="funnel-header"><FluxLogo /><Link href="/mina-tests#published-experiments" className="text-sm font-semibold text-cyan-200">Explore Mina Tests ↗</Link></header>
}
