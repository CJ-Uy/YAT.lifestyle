# Element tutorial footage

These clips use the owner's footage in `videos/Additional Stock Footage/`.

| Public asset | Source | Start | Duration |
| --- | --- | --- | --- |
| `demo-tutorial-blot.mp4` | `IMG_7247.MOV` | 11 seconds | 14 seconds |
| `demo-tutorial-ph.mp4` | `IMG_7275.MOV` | 96 seconds | 48 seconds |
| `demo-tutorial-scent.mp4` | `IMG_7242.MOV` | 7 seconds | 15 seconds |

The clips illustrate technique. Their kit prototype predates the current printed board; placement follows the written instructions and the final board displayed in the demo.

Export with `python scripts/prepare-demo-tutorials.py`. FFmpeg selects the first video stream, drops source audio and metadata streams, scales to 960 pixels wide, converts to YUV420P, and writes H.264 with the medium preset, CRF 25, and faststart. Posters are WebP frames at one second, quality 85. The three MP4s total approximately 3.5 MiB.

English, Traditional Chinese, and Simplified Chinese WebVTT captions explain the demonstrated task. Native controls, `playsInline`, and `preload="none"` leave playback to the visitor; watching a clip is optional. Completion gates depend on task confirmations or entered responses rather than video playback.

The light palette is scoped to `demo-shell` in `lab-theme.css`. The kit path requires preparation, readable photos or an explicit skip, the completed pH timer (unless explicitly skipped before starting), all four vial responses, both ratings for each blind base, two distinct favorites, and one final choice. The sample path bypasses physical waiting and labels its readings and result as examples.
