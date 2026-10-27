import { demoCognition, demoConsistency, demoMostImproved, demoSleepStreak, type LeaderboardCategory } from '@/lib/demoLeaderboardData'
import { competitions } from '@/lib/championshipConfig'

function Avatar({ username }: { username: string }) {
  return <span className="leaderboard-avatar" aria-hidden="true">{username.slice(0, 2).toUpperCase()}</span>
}

export default function LeaderboardRows({ category, limit }: { category: LeaderboardCategory; limit?: number }) {
  if (category === 'brain-games') {
    return (
      <div>
        <div className="board-column-labels game-columns"><span>Game / User</span><span>High score</span></div>
        <ul className="board-rows" aria-label="Demo daily high scores by game">
          {demoCognition.slice(0, limit).map(row => <li className="board-row game-row" key={row.game}>
            <Avatar username={row.username} /><div className="board-user"><strong>{row.game}</strong><span>{row.username}</span></div><strong className="board-metric">{row.score.toLocaleString('en-US')}</strong>
          </li>)}
        </ul>
      </div>
    )
  }

  const rows = category === 'sleep-streak'
    ? demoSleepStreak.map(row => ({ ...row, value: String(row.nights), unit: 'nights' }))
    : (category === 'consistency' ? demoConsistency : demoMostImproved).map(row => ({ ...row, value: `+${row.improvement}%`, unit: 'improvement' }))
  const competition = competitions.find(item => item.id === category)!

  return (
    <div>
      <div className="board-column-labels"><span>Rank / User</span><span>{competition.metric}</span></div>
      <ol className="board-rows" aria-label={`Demo ${competition.name} rankings`}>
        {rows.slice(0, limit).map(row => <li className={`board-row podium-row-${row.rank}`} key={row.username}>
          <span className={`rank-marker rank-${row.rank}`} aria-label={`Rank ${row.rank}`}>#{row.rank}</span><Avatar username={row.username} />
          <strong className="board-user">{row.username}</strong><span className="board-metric"><strong>{row.value}</strong><small>{row.unit}</small></span>
        </li>)}
      </ol>
    </div>
  )
}
