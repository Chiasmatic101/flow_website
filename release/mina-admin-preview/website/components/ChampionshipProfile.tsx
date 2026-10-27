import { activeChampionship } from '@/lib/championshipConfig'

export default function ChampionshipProfile() {
  // No personal username, streak, score, percentage or rank is fabricated here.
  const stats = ['Sleep Streak', 'Consistency Improvement', 'Best Brain Game', 'Brain Improvement']
  return (
    <section className="glass-card championship-profile" aria-label="Your Championship profile preview">
      <div className="profile-heading">
        <div className="profile-identity"><span className="profile-avatar" aria-hidden="true">You</span><div><p className="eyebrow">YOUR CHAMPIONSHIP PROFILE</p><h2>Your place on the board starts here.</h2><p>Username connects when your Flux account is linked.</p></div></div>
        <div className="month-badge"><strong>{activeChampionship.month} Championship</strong><span className="live-badge"><i aria-hidden="true" />{activeChampionship.status} <small>PREVIEW</small></span></div>
      </div>
      <dl className="personal-stats">{stats.map(stat => <div key={stat}><dt>{stat}</dt><dd>—</dd></div>)}</dl>
      <p className="profile-next">Complete your first Flux check-in to get ranked.<span>Personal results are not connected yet.</span></p>
    </section>
  )
}
