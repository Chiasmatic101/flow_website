import Image from 'next/image'
import { activeChampionship, type ChampionshipPrize } from '@/lib/championshipConfig'

export default function ChampionshipPrizes() {
  const prizes: ChampionshipPrize[] = activeChampionship.prizes
  return (
    <section id="prizes" className="arena-section prize-section" aria-labelledby="prizes-title">
      <div className="section-heading"><div><p className="eyebrow">{activeChampionship.month.toUpperCase()} / THE PRIZE POOL</p><h2 id="prizes-title">This month&apos;s prizes</h2></div><span className="demo-badge">{activeChampionship.prize}</span></div>
      <p className="muted mt-4">New prizes every month. Pick your challenge. Give it your best.</p>
      <div className="prize-grid">{prizes.map((prize, i) => <article className={`glass-card prize-card ${i === 0 ? 'grand-prize' : ''}`} key={prize.id}>
        <div className="prize-image-slot">{prize.imageSrc ? <Image src={prize.imageSrc} alt={prize.imageAlt ?? prize.name} fill sizes="(max-width: 640px) 45vw, 25vw" /> : <span aria-hidden="true">{i === 0 ? '🏆' : '✦'}</span>}</div>
        <p className="eyebrow">{prize.category}</p><h3>{prize.name}</h3>
        {prize.valueLabel && <p className="prize-value">{prize.valueLabel}</p>}
        {prize.sponsor && <p className="prize-sponsor">Presented by {prize.sponsor}</p>}
      </article>)}</div>
    </section>
  )
}
