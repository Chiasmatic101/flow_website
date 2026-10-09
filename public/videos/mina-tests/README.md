# Mina's latest video

Supply the owned/licensed MP4 at `public/videos/mina-tests/latest.mp4`.
Optionally supply a poster at `public/images/mina-tests/latest-poster.jpg`.
Portrait 9:16 is preferred; the player contains other ratios without cropping.
Update `activeMinaTest.media` in `lib/minaTestsConfig.ts` to change either local path.
The server checks asset existence. Missing files show a styled placeholder, not a broken video.
Available videos have controls, inline playback, metadata-only preload and no forced autoplay.
