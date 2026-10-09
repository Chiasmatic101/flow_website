import 'server-only'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { activeMinaTest } from '../minaTestsConfig'

// Only serve a configured local public asset. No missing src is sent to a browser.
async function publicAsset(asset: string) {
  const root = path.resolve(process.cwd(), 'public')
  const resolved = path.resolve(root, asset.replace(/^\/+/, ''))
  if (!resolved.startsWith(root + path.sep)) return null
  try { await access(resolved); return asset } catch { return null }
}
export async function minaMedia() {
  const [videoPath, posterPath] = await Promise.all([publicAsset(activeMinaTest.media.videoPath), publicAsset(activeMinaTest.media.posterPath)])
  return { videoPath, posterPath }
}
