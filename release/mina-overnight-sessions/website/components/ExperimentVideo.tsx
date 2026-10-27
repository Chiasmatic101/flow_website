import { mediaSource } from '@/lib/mina-experiments'
export default function ExperimentVideo({ url, title }: { url: string; title: string }) {
  const source = mediaSource(url)
  if (!source) return <p className="muted">Explore the challenge in the text below. Mina’s video is optional.</p>
  return source.kind === 'file' ? <video className="w-full rounded-xl" src={source.url} controls preload="metadata" aria-label={title} /> : <div><iframe className="aspect-video min-h-[200px] w-full" src={source.url} title={title} loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" />{source.url.startsWith('https://www.youtube-nocookie.com/embed/') && <a className="flux-text-link" href={`https://www.youtube.com/watch?v=${source.url.split('/').pop()}`} target="_blank" rel="noopener">Video unavailable? Open in YouTube →</a>}</div>
}
