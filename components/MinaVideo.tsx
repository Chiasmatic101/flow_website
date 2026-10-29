'use client'
import { useEffect, useRef, useState } from 'react'
import { MinaPlayback } from '@/lib/mina-video-playback'
import { loadYouTube, type YouTubePlayer } from '@/lib/youtube-player'

export default function MinaVideo() {
  const container = useRef<HTMLDivElement>(null), iframe = useRef<HTMLIFrameElement>(null)
  const controller = useRef<MinaPlayback | null>(null), player = useRef<YouTubePlayer | null>(null)
  const ratio = useRef(0), reduced = useRef(true), manualRequested = useRef(false)
  const [mounted, setMounted] = useState(false), [manualMode, setManualMode] = useState(true)
  const [ready, setReady] = useState(false), [muted, setMuted] = useState(true)
  const [failed, setFailed] = useState(false), [blocked, setBlocked] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const preference = () => { reduced.current = media.matches; setManualMode(media.matches); controller.current?.setReduced(media.matches); if (!media.matches && ratio.current >= 0.5) setMounted(true) }
    // Browser callbacks own both loading and visibility; no player is loaded by SSR.
    const updateRatio = (value: number) => {
      ratio.current = value
      reduced.current = media.matches
      container.current?.setAttribute('data-visible', String(value >= 0.5))
      if (value >= 0.5 && !media.matches) setMounted(true)
      controller.current?.setVisible(value)
    }
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => updateRatio(entries[0].intersectionRatio), { threshold: [0, 0.5, 1] }) : null
    if (container.current) observer?.observe(container.current)
    // Also reconcile on scrolling/resizing: embedded browsers can defer observer delivery.
    let frame = 0
    const reconcile = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const rect = container.current?.getBoundingClientRect()
        if (!rect || !rect.width || !rect.height) return
        const width = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0))
        const height = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
        updateRatio(width * height / (rect.width * rect.height))
      })
    }
    window.addEventListener('scroll', reconcile, { passive: true, capture: true })
    window.addEventListener('resize', reconcile)
    media.addEventListener('change', preference)
    const visibility = () => controller.current?.setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    queueMicrotask(() => { if (container.current) preference() })
    return () => { observer?.disconnect(); media.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('scroll', reconcile, true); window.removeEventListener('resize', reconcile); cancelAnimationFrame(frame) }
  }, [])
  useEffect(() => {
    if (!mounted || !iframe.current) return
    let cancelled = false
    let owned: YouTubePlayer | null = null
    loadYouTube().then(api => {
      if (cancelled || !iframe.current) return
      owned = new api.Player(iframe.current, { events: {
        onReady: event => {
          if (cancelled) return
          player.current = event.target; event.target.mute(); setMuted(true); setReady(true)
          const playback = new MinaPlayback(event.target); controller.current = playback
          playback.setReduced(reduced.current); playback.setVisible(ratio.current); playback.setPageVisible(!document.hidden); playback.setReady()
          if (manualRequested.current) playback.playManually()
        },
        onStateChange: event => { if (cancelled) return; container.current?.setAttribute('data-player-state', String(event.data)); if (event.data === 1) { controller.current?.onPlaying(); setBlocked(false) }; if (event.data === 0) controller.current?.onEnded(); setMuted(event.target.isMuted()) },
        onError: () => { if (!cancelled) setFailed(true) },
        onAutoplayBlocked: () => { if (!cancelled) setBlocked(true) },
      } })
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; player.current = null; owned?.destroy() }
  }, [mounted])
  function play() { manualRequested.current = true; setMounted(true); controller.current?.playManually() }
  function toggleMute() { if (!player.current) return; if (player.current.isMuted()) { player.current.unMute(); setMuted(false) } else { player.current.mute(); setMuted(true) } }
  return <figure className="mina-video"><div ref={container}>
    {mounted && !failed ? <iframe ref={iframe} className="mina-youtube" src={`https://www.youtube-nocookie.com/embed/QGoBL06AjNU?enablejsapi=1&playsinline=1&controls=1&origin=${encodeURIComponent(window.location.origin)}`} title="Meet Mina Tests" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <div className="mina-video-placeholder"><span className="mina-orbit" aria-hidden="true">M</span><p className="eyebrow">MINA TESTS / SLEEP · SOUND · COGNITION</p><h3>A little curiosity. Your own discoveries.</h3>{!failed && <button className="flux-button" onClick={play}>Watch Mina&apos;s introduction ▶</button>}<p>{failed ? 'The embedded video is unavailable. Watch on YouTube below.' : 'Plays muted when visible. Reduced motion? Press play when you’re ready.'}</p></div>}
    </div>{mounted && !failed && <div className="mt-3 flex flex-wrap justify-center gap-3">{ready && <button className="flux-secondary" onClick={toggleMute}>{muted ? 'Unmute Mina 🔊' : 'Mute Mina'}</button>}{(manualMode || blocked) && <button className="flux-secondary" onClick={play}>Play / Resume video</button>}</div>}
    <figcaption>Meet Mina Tests · <a href="https://www.youtube.com/shorts/QGoBL06AjNU" target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline">Watch on YouTube</a></figcaption>
  </figure>
}
