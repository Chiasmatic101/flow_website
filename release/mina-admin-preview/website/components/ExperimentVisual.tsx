import Image from 'next/image'
import { demoSleepStreak } from '@/lib/demoLeaderboardData'
import { activeChampionship, competitions } from '@/lib/championshipConfig'

type Props = { imageSrc?: string; imageAlt?: string }

// Local photo slot: supply imageSrc="/images/experiment/hero-students.jpg" once owned imagery is available.
// This SVG student scene is a designed placeholder, not a photo of Flux participants.
export default function ExperimentVisual({ imageSrc, imageAlt = 'College friends using a laptop and phone together' }: Props) {
  return (
    <div className="experiment-visual">
      <div className="visual-grid" aria-hidden="true" />
      <div className="visual-topline"><span className="pulse-label"><i />{activeChampionship.month.toUpperCase()} CHAMPIONSHIP</span><span>{competitions.length} CHALLENGES / MONTHLY</span></div>
      {imageSrc ? <Image src={imageSrc} alt={imageAlt} fill sizes="(max-width: 900px) 100vw, 50vw" className="student-photo" /> : (
        <svg className="student-scene" viewBox="0 0 680 470" role="img" aria-label="Illustrated placeholder: college friends comparing Championship scores on a phone">
          <defs><linearGradient id="scene-glow" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8d82ff" /><stop offset="1" stopColor="#45d7ff" /></linearGradient><linearGradient id="scene-desk"><stop stopColor="#252944" /><stop offset="1" stopColor="#131628" /></linearGradient></defs>
          <circle cx="365" cy="215" r="175" fill="#6c63ff" opacity=".07" /><circle cx="365" cy="215" r="130" fill="none" stroke="#7a72ff" strokeOpacity=".25" strokeDasharray="4 10" />
          <path d="M88 325h508v35H88z" fill="url(#scene-desk)" /><path d="M105 325h476" stroke="#45d7ff" strokeOpacity=".45" /><path d="M119 325v82m444-82v82" stroke="#292d4b" strokeWidth="12" />
          {/* Faceless silhouettes keep the placeholder distinct from real participant photography. */}
          <path d="M113 313q-1-107 82-107 66 0 84 106" fill="#343059" /><circle cx="187" cy="151" r="46" fill="#b8a9d2" /><path d="M145 142q-6-62 48-59 52 1 44 68l-23-18-45-5-22 25" fill="#202039" /><path d="M181 204l22 20-23 22" fill="none" stroke="#8d82ff" strokeWidth="4" />
          <path d="M300 314q-14-114 70-119 78-5 96 119" fill="#223f51" /><circle cx="370" cy="139" r="44" fill="#d5b6ac" /><path d="M329 136q-6-67 46-59 45 8 40 68l-17-32-40 9-26 27" fill="#1b1c32" /><path d="M343 221l30 19 29-19" fill="none" stroke="#45d7ff" strokeWidth="4" />
          <path d="M441 314q-2-104 72-106 66-1 84 106" fill="#34345c" /><circle cx="510" cy="157" r="39" fill="#bfa9c1" /><path d="M472 156q-6-60 39-58 49 0 38 79l-14-42-49-1" fill="#24223e" /><path d="M447 277l49 18 29-43" fill="none" stroke="#bfa9c1" strokeWidth="18" strokeLinecap="round" />
          <rect x="506" y="218" width="34" height="60" rx="7" fill="#0a101e" stroke="#45d7ff" strokeWidth="2" transform="rotate(12 523 248)" /><path d="M512 247h5l4-9 4 17 4-11h5" fill="none" stroke="#45d7ff" strokeWidth="2" />
          <path d="M217 249h143l-13 78H230z" fill="#101527" stroke="#65668d" strokeWidth="2" /><path d="M218 328h146" stroke="#9891dc" strokeWidth="4" strokeLinecap="round" /><circle cx="291" cy="287" r="13" fill="none" stroke="url(#scene-glow)" strokeWidth="3" /><path d="M288 279v16m7-14v12" stroke="#45d7ff" strokeWidth="2" />
          <rect x="133" y="292" width="34" height="31" rx="5" fill="#76649d" /><path d="M165 297q22 0 13 16h-12" fill="none" stroke="#76649d" strokeWidth="5" />
          <path d="M124 378h82m288 8h57" stroke="#45d7ff" strokeOpacity=".25" strokeWidth="2" /><path d="M84 185h36l9-14 10 28 10-14h20M523 88h30l8-10 9 20 8-10h30" stroke="url(#scene-glow)" fill="none" strokeWidth="2" />
        </svg>
      )}
      <div className="visual-podium" aria-hidden="true">{[demoSleepStreak[1], demoSleepStreak[0], demoSleepStreak[2]].map(row => <span key={row.rank} className={row.rank === 1 ? 'podium-winner' : ''}>{row.rank === 1 && '🏆 '}#{row.rank}<small>{row.nights} NIGHTS</small></span>)}</div>
      <div className="visual-caption"><strong>Competitive sleep.</strong><span>{imageSrc ? 'Your crew. Your Championship.' : 'Student scene placeholder · Demo standings'}</span></div>
    </div>
  )
}
