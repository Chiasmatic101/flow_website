'use client'
import { useState } from 'react'
import { activeMinaTest } from '@/lib/minaTestsConfig'

export default function MinaVideo({ videoPath, posterPath }: { videoPath: string | null; posterPath: string | null }) {
  const [failed, setFailed] = useState(false)
  return <figure className="mina-video">
    {videoPath && !failed ? <video controls playsInline preload="metadata" poster={posterPath || '/images/mina-tests/video-placeholder.svg'} onError={() => setFailed(true)} aria-label={activeMinaTest.media.title}>
      <source src={videoPath} type="video/mp4" onError={() => setFailed(true)} />Your browser cannot play this video. <a href={videoPath}>Open Mina&apos;s video</a>.
    </video> : <div className="mina-video-placeholder"><span className="mina-orbit" aria-hidden="true">M</span><p className="eyebrow">MINA TESTS / SLEEP · SOUND · COGNITION</p><h3>{activeMinaTest.media.fallback}</h3><p>Meet the questions. Follow the experiment.</p><span className="mina-media-note">Video coming soon</span></div>}
    <figcaption>{activeMinaTest.media.title}</figcaption>
  </figure>
}
