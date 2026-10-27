import type { ReactNode } from 'react'

export default function CompetitionCard({ icon, name, headline, description, details, children, number }: { icon: string; name: string; headline: string; description: string; details: string; children?: ReactNode; number?: number }) {
  return <article className="glass-card competition-card">
    <div className="competition-mark"><span aria-hidden="true">{icon}</span><b>{number ? `0${number}` : '001'}</b></div>
    <p className="eyebrow mt-5">{name}</p>
    <h2 className="mt-5 text-3xl font-black tracking-tight">{headline}</h2>
    <p className="muted mt-4">{description}</p>
    <p className="mt-6 text-sm font-semibold text-cyan-200">Prize to be announced</p>
    <details className="mt-6 border-t border-white/10 pt-5"><summary className="min-h-11 cursor-pointer font-bold text-white">View Competition</summary><p className="muted mt-3 text-sm">{details}</p></details>
    {children}
  </article>
}
