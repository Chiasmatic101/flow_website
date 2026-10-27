import Link from 'next/link'

export default function FluxLogo() {
  return <Link href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tight" aria-label="Flux home">
    <span aria-hidden="true" className="flex h-10 w-10 items-end justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-3">
      {[10, 16, 20, 13, 17].map((height, i) => <span key={i} className="w-1 shrink-0 rounded-full bg-gradient-to-b from-cyan-300 to-indigo-500" style={{ height }} />)}
    </span>Flux
  </Link>
}
