export interface MinaPlayer { playVideo(): void; pauseVideo(): void }
const players = new Set<MinaPlayback>()
/** One coordinator for all Mina embeds, including native YouTube Play controls. */
export class MinaPlayback {
  private ratio = 0
  private ready = false
  private pageVisible = true
  private reduced = true
  private manual = false
  private ended = false
  constructor(private player: MinaPlayer) { players.add(this) }
  setReady() { this.ready = true; this.sync() }
  setReduced(value: boolean) { this.reduced = value; if (value) this.manual = false; this.sync() }
  setVisible(ratio: number) { this.ratio = ratio; if (ratio < 0.5) this.manual = false; this.sync() }
  setPageVisible(value: boolean) { this.pageVisible = value; this.sync() }
  playManually() { this.manual = true; this.ended = false; this.sync() }
  onPlaying() { this.ended = false; if (!this.pageVisible || this.ratio === 0) { this.pause(); return }; this.claim() }
  onEnded() { this.ended = true }
  private claim() { for (const other of players) if (other !== this) other.pause() }
  private pause() { if (this.ready) this.player.pauseVideo() }
  private sync() {
    if (!this.ready) return
    if (this.pageVisible && this.ratio >= 0.5 && !this.ended && (!this.reduced || this.manual)) { this.claim(); this.player.playVideo() }
    else this.pause()
  }
  dispose() { this.pause(); players.delete(this) }
}
