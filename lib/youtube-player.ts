import type { MinaPlayer } from './mina-video-playback'
export interface YouTubePlayer extends MinaPlayer { mute(): void; unMute(): void; isMuted(): boolean; destroy(): void }
type PlayerEvent = { target: YouTubePlayer; data: number }
interface YouTubeAPI { Player: new (element: HTMLIFrameElement, options: { events: { onReady(event: PlayerEvent): void; onStateChange(event: PlayerEvent): void; onError(): void; onAutoplayBlocked(): void } }) => YouTubePlayer }
declare global { interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void } }
let loading: Promise<YouTubeAPI> | null = null
export function loadYouTube(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    const timer = window.setTimeout(() => reject(new Error('YouTube unavailable')), 15000)
    window.onYouTubeIframeAPIReady = () => { window.clearTimeout(timer); previous?.(); if (window.YT?.Player) resolve(window.YT); else reject(new Error('YouTube unavailable')) }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'; script.async = true
    script.onerror = () => { window.clearTimeout(timer); reject(new Error('YouTube unavailable')) }
    document.head.appendChild(script)
  })
  return loading
}
