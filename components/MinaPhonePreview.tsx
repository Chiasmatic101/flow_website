'use client'
// A phone-sized sketch of the Flux app screens, drawn from the current draft.
// It mirrors the app's Mina Tests layout; it is a guide, not a pixel copy.
import type { Experiment } from '@/lib/mina-experiments'
import { mediaSource } from '@/lib/mina-experiments'
import { inferTemplate } from '@/lib/mina-consumer-creator'
import { coverClass } from '@/lib/mina-dashboard'
import { PlayIcon } from './MinaIcons'

export type PreviewScreen = 'intro' | 'tonight' | 'bedtime' | 'checkin' | 'results'
export const previewScreens: { id: PreviewScreen; label: string }[] = [
  { id: 'intro', label: 'Intro' }, { id: 'tonight', label: 'Tonight' }, { id: 'bedtime', label: 'Bedtime' }, { id: 'checkin', label: 'Check-in' }, { id: 'results', label: 'Results' },
]
const defaults = {
  intro: 'A few nights, a little curiosity. Try it, then notice how you feel each morning.',
  bedtimeTip: 'Set a comfy volume and let it play while you drift off. I’ll see you in the morning.',
  morningHello: 'Morning! Quick one — your best guess is fine.',
  resultsIntro: 'Here’s what your nights showed.',
}

function Says({ text }: { text: string }) {
  return <div className="md-phone-says"><span className="md-avatar" aria-hidden="true">M</span><div className="md-phone-bubble">{text}</div></div>
}

export default function MinaPhonePreview({ e, screen }: { e: Experiment; screen: PreviewScreen }) {
  const copy = e.copy || {}
  const kind = inferTemplate(e)
  const overnight = kind === 'comparison' || kind === 'single'
  const nights = e.durationNights || 0
  const unit = overnight ? 'nights' : 'days'
  const hasVideo = !!mediaSource(e.introVideoUrl)
  const sound = e.protocol.conditions[0]?.label || 'Your sound'
  const questions = e.protocol.questions
  const required = questions.filter(q => q.required).length
  const game = e.protocol.activities.some(a => a.type === 'cognitive.task')
  const night = screen === 'bedtime'
  return <div className={`md-phone ${night ? 'md-phone-night' : ''}`} role="img" aria-label={`Phone preview: ${previewScreens.find(s => s.id === screen)?.label} screen`}>
    <div className="md-phone-screen">
      <div className={`md-phone-bar ${night ? 'is-night' : ''}`}><span>Mina Tests</span><span>{night ? `Night 1 of ${nights || '?'}` : ''}</span></div>

      {screen === 'intro' && <>
        <div className={`md-phone-hero ${coverClass(e.id || e.title || 'mina')}`} style={e.thumbnailUrl ? { backgroundImage: `url("${e.thumbnailUrl.replace(/"/g, '')}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          {hasVideo && <span className="md-phone-play"><PlayIcon size={20} /></span>}
        </div>
        {nights > 0 && <p className="md-phone-eyebrow">{nights} {unit} · about a minute a day</p>}
        <p className="md-phone-title">{e.title || 'Your test title'}</p>
        <p className="md-phone-body" style={{ color: '#17165b', fontWeight: 600 }}>{e.description || 'Your one-line pitch appears here.'}</p>
        {!hasVideo && <Says text={copy.intro || e.explanation || defaults.intro} />}
        <div className="md-phone-card md-stack" style={{ gap: 6 }}>
          <strong style={{ fontSize: 12 }}>How it works</strong>
          {[
            ...(overnight ? ['Tap Start Night at bedtime'] : []),
            ...(required > 0 ? [`Answer ${required} quick taps ${overnight ? 'when you wake' : 'each day'}`] : []),
            ...(game ? ['Play a one-minute game'] : []),
            `See your results after day ${nights || '?'}`,
          ].map((line, i) => <span key={line} className="md-phone-body">{i + 1} · {line}</span>)}
        </div>
        <div className="md-phone-btn">Begin</div>
      </>}

      {screen === 'tonight' && <>
        <p className="md-phone-body">Good evening!</p>
        <div className="md-phone-card md-stack" style={{ gap: 8, background: 'linear-gradient(135deg,#f1ecff,#fff)' }}>
          <div className="md-between" style={{ gap: 6 }}><span className="md-phone-eyebrow">{overnight ? 'Tonight' : 'Today'}</span><span className="md-phone-body" style={{ fontSize: 10 }}>{e.title || 'Your test'}</span></div>
          <p className="md-phone-title">{overnight ? 'Night 1 is ready' : 'Day 1 is ready'}</p>
          <Says text={overnight ? copy.bedtimeTip || defaults.bedtimeTip : copy.morningHello || defaults.morningHello} />
          <div className="md-phone-dots">{Array.from({ length: Math.min(nights || 7, 21) }, (_, i) => <span key={i} className={i === 0 ? 'is-now' : ''}>{i + 1}</span>)}</div>
          <div className="md-phone-btn">{overnight ? 'Start Night 1' : game ? 'Play the morning game' : 'Start check-in'}</div>
          <span className="md-phone-body" style={{ textAlign: 'center', fontSize: 10.5 }}>Can’t tonight? Skip this night</span>
        </div>
      </>}

      {screen === 'bedtime' && <>
        {overnight ? <>
          <div className="md-phone-glow"><div><strong style={{ fontSize: 15 }}>{kind === 'comparison' ? `${sound} or quiet` : sound}</strong><br /><span className="md-phone-body">Playing</span></div></div>
          <p className="md-phone-clock">0:42</p>
          <p className="md-phone-body" style={{ textAlign: 'center' }}>since you started</p>
          <p className="md-phone-body" style={{ textAlign: 'center', margin: '8px 4px' }}>{copy.bedtimeTip || 'Turn the volume to where it fades into the background, then put your phone face down. Sleep well.'}</p>
          <div className="md-phone-btn is-night" style={{ marginTop: 'auto' }}>I’m awake — End Night</div>
        </> : <p className="md-phone-body" style={{ marginTop: 40, textAlign: 'center' }}>This test has no bedtime step.</p>}
      </>}

      {screen === 'checkin' && <>
        <div className="md-phone-dots" style={{ flexWrap: 'nowrap' }}>{(questions.length ? questions : [null]).map((_, i) => <span key={i} style={{ width: '100%', height: 5, borderRadius: 4, background: i === 0 ? '#6a4de8' : '#efeeff' }} />)}</div>
        <Says text={copy.morningHello || defaults.morningHello} />
        {questions[0] ? <>
          <p className="md-phone-title" style={{ marginTop: 6 }}>{questions[0].prompt || 'Your first question'}</p>
          {(questions[0].labels?.length ? questions[0].labels : questions[0].type === 'scale' ? [`${questions[0].min}`, '…', `${questions[0].max}`] : questions[0].options.length ? questions[0].options : ['Yes', 'No']).slice(0, 5).map((label, i) => <div key={i} className={`md-phone-option ${i === 3 ? 'is-on' : ''}`}>{label}</div>)}
          <div className="md-phone-btn" style={{ marginTop: 'auto' }}>Next</div>
        </> : game ? <p className="md-phone-body">A one-minute game opens here.</p> : <p className="md-phone-body">No questions in this plan.</p>}
      </>}

      {screen === 'results' && <>
        <p className="md-phone-eyebrow">Your {nights || ''} {unit} · example</p>
        <p className="md-phone-title">{copy.resultsIntro || defaults.resultsIntro}</p>
        {(questions.length ? questions.slice(0, 2) : [null]).map((q, i) => <div key={i} className="md-phone-card md-stack" style={{ gap: 6 }}>
          <strong style={{ fontSize: 11.5 }}>{q?.prompt || (game ? 'Game score' : 'Your answers')}</strong>
          <div className="md-phone-bars">
            {(e.protocol.conditions.length ? e.protocol.conditions : [{ id: 'all', label: 'All nights' }]).slice(0, 2).map((c, j) => <div key={c.id}><i style={{ width: `${j === 0 ? 68 : 44}%`, background: j === 0 ? '#6a4de8' : '#b7b9e3' }} /></div>)}
          </div>
          <span className="md-phone-body" style={{ fontSize: 10 }}>{(e.protocol.conditions.length ? e.protocol.conditions.map(c => c.label) : ['All nights']).slice(0, 2).join(' · ')}</span>
        </div>)}
        <p className="md-phone-body" style={{ fontSize: 10, textAlign: 'center', marginTop: 'auto' }}>A personal pattern, not a medical finding.</p>
      </>}
    </div>
  </div>
}
