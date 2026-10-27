'use client'

import { useState } from 'react'
import LeaderboardRows from './LeaderboardRows'
import { activeChampionship, competitions, type CompetitionId } from '@/lib/championshipConfig'

export default function LeaderboardPreview({ pitch = false }: { pitch?: boolean }) {
  const [selected, setSelected] = useState<CompetitionId>('sleep-streak')
  const competition = competitions.find(item => item.id === selected)!

  if (pitch) {
    return (
      <section className="arena-section" aria-labelledby="pitch-boards-title">
        <div className="section-heading"><div><p className="eyebrow">{activeChampionship.name.toUpperCase()}</p><h2 id="pitch-boards-title">Where would you rank?</h2></div><span className="live-badge"><i aria-hidden="true" />{activeChampionship.status} <small>PREVIEW</small></span></div>
        <p className="muted mt-4">Four boards. A new chance every month. Find the challenge that fits you.</p>
        <p className="demo-disclosure">Demo data only · Synthetic usernames and scores, not live Flux participants.</p>
        <div className="pitch-boards championship-boards">{competitions.map(item => <article className="glass-card mini-board" key={item.id}>
          <p className="eyebrow"><span aria-hidden="true">{item.icon}</span> {item.name}</p><LeaderboardRows category={item.id} limit={3} /><p className="mt-4 text-xs leading-5 text-white/60">{item.previewCaption}</p>
        </article>)}</div>
        <div className="mt-7 flex flex-wrap items-center gap-4"><a href="#signup" className="flux-button">ENTER THE CHAMPIONSHIP →</a><span className="text-sm text-white/60">Your first check-in is your starting line.</span></div>
      </section>
    )
  }

  return (
    <section id="leaderboards" className="arena-section" aria-labelledby="leaderboards-title">
      <div className="section-heading"><div><p className="eyebrow">{activeChampionship.name.toUpperCase()} / THE ARENA</p><h2 id="leaderboards-title">Live leaderboards</h2></div><span className="live-badge"><i aria-hidden="true" />{activeChampionship.status} <small>PREVIEW</small></span></div>
      <p className="demo-disclosure">Demo data only · Synthetic standings. No live Flux users, telemetry or personal results are connected.</p>
      <div className="leaderboard-controls" aria-label="Leaderboard category">{competitions.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={`leaderboard-tab ${selected === item.id ? 'is-selected' : ''}`}>{item.tabLabel}</button>)}</div>
      <div className="glass-card main-board mt-5" aria-live="polite">
        <div className="board-heading"><h3>{selected === 'brain-games' ? "Today's High Scores" : competition.name}</h3><span className="demo-badge">Demo</span></div>
        {selected === 'brain-games' && <div className="score-periods" aria-label="Score period"><button aria-pressed="true">Today</button><button disabled>This month <span>soon</span></button><button disabled>All time <span>soon</span></button></div>}
        <LeaderboardRows category={selected} />
        <p className="board-explainer">{selected === 'brain-games' ? 'Each row is a different game. Scores are only comparable within the same game.' : selected === 'sleep-streak' ? 'Qualifying nights toward your personal sleep-duration goal in the current Championship. The backend will determine whether each night qualifies.' : selected === 'consistency' ? 'Improvement against your own sleep-schedule baseline. Already-perfect schedules do not automatically win. Scoring will be defined later.' : 'Game performance improvement against your own starting baseline. Normalization and scoring will be defined later; no combined score is calculated here.'}</p>
        <div className="your-position"><div><p className="eyebrow">YOUR POSITION</p><strong>—</strong></div><p>Complete your first Flux check-in to get ranked.<span>Personal positions and baseline calculations are not connected yet.</span></p></div>
      </div>
    </section>
  )
}
