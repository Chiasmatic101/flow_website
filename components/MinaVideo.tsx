'use client'
import { useState } from 'react'

export default function MinaVideo() {
  const [playing, setPlaying] = useState(false)
  return <figure className="mina-video">
    {playing ? <iframe className="mina-youtube" src="https://www.youtube-nocookie.com/embed/QGoBL06AjNU?playsinline=1" title="Meet Mina Tests" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <div className="mina-video-placeholder"><span className="mina-orbit" aria-hidden="true">M</span><p className="eyebrow">MINA TESTS / SLEEP · SOUND · COGNITION</p><h3>A little curiosity. Your own discoveries.</h3><button className="flux-button" onClick={() => setPlaying(true)}>Watch Mina&apos;s introduction ▶</button><p>YouTube loads when you press play.</p></div>}
    <figcaption>Meet Mina Tests · <a href="https://www.youtube.com/shorts/QGoBL06AjNU" target="_blank" rel="noopener noreferrer" className="text-cyan-200 underline">Watch on YouTube</a></figcaption>
  </figure>
}
