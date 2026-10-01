# Rotato artwork and video

## Device renders (`assets/renders/`)

Full-device WebP stills (760 × 1296, transparent, Rotato shadow included). Every placement has its own camera angle, kept gentle (|yaw| ≤ 12°, pitch 2–9°) with varied roll. Steeper angles looked distorted, and some angles catch Rotato's studio light as a glare band that washes out the screen, so it's worth rendering a couple of variants per placement. `~/Movies/Halls Rotato/web/makeplan_web4.py` renders two variants per placement and `makeplan_hero6.py` three for each hero phone and Discover (positive roll leans clockwise, positive yaw turns the screen toward the right, and negative pitch is a low camera that makes the phones read taller); the table lists the glare-free pick:

| File | Screen (time in `Penn-State-Meals/Assets/Halls Video.mov`) | Yaw, pitch, roll | Used on |
| --- | --- | --- | --- |
| `hero-pollock.webp` | Pollock dinner (6.0 s) | −10, −6, −6 | Hero, right phone, low angle, leaning in |
| `hero-halls.webp` | PSU Dining list (0.1 s) | 10, −6, 6 | Hero, left phone, low angle, leaning in |
| `tab-halls.webp` | PSU Dining list (0.1 s) | −9, 4, 2 | Dining tab 1 |
| `tab-menu.webp` | Pollock dinner (6.0 s) | 11, 5, −2 | Dining tab 2 |
| `tab-nutrition.webp` | Herb Roasted Salmon (9.4 s) | −3, 9, −3 | Dining tab 3 |
| `discover-feed.webp` | Discover (16.6 s) | −10, −5, −4 | Discover banner, low angle, screen toward the copy |
| `cata-map.webp` | CATA map (34.0 s) | 11, 7, −3 | CATA section, CATA share page |
| `cata-stop.webp` | E College Ave departures (36.6 s) | −7, 6, 5 | CATA section, CATA share page diagram |
| `pollock.webp` | Pollock dinner (6.0 s) | 5, 7, −5 | Pollock share page |
| `cata-bus.webp` | Bus popup on the CATA map (33.2 s) | −8, 5, −6 | CATA share page diagram |
| `cata-routes.webp` | Available Routes list (39.2 s) | 6, 4, 4 | CATA share page diagram |

Pipeline (project files live in `~/Movies/Halls Rotato/web/`):

1. Extract the frames above at full resolution (1320 × 2868) and concatenate them into a screen video, one second per shot in plan order (`web_screen_v4.mp4`).
2. `python3 makeplan_web4.py` writes one camera cut per second on the 1080 × 1920 transparent `base916.rotato`.
3. `rotato compose ../base916.rotato --plan plan_web4.json --save-project web_v4.rotato`, then `rotato render web_v4.rotato --screen-media web_screen_v4.mp4 --preset prores-alpha --fps 30`. Compare the variants for glare before encoding.
4. Grab frame `30·i + 15` of each shot, feather the alpha over the last 70 px on the right and 85 px at the bottom (Rotato's shadow reaches the canvas edge), crop `1050:1790:30:130` (the same for every shot, so equal CSS widths mean equal phone sizes), scale to 760 wide, and encode with `cwebp -q 84 -alpha_q 90 -m 6`.

## Promo video (`assets/video/`)

`halls-promo.mp4` is the 30 s Remotion + Rotato promo (`~/Developer/Assets/Halls Promo/out/Halls-Promo-30s.mp4`), re-encoded for the web:

```
ffmpeg -i Halls-Promo-30s.mp4 -an -vf scale=720:1280:flags=lanczos -c:v libx264 -profile:v high -crf 25 -preset slower -pix_fmt yuv420p -movflags +faststart halls-promo.mp4
```

`halls-promo-poster.webp` is the frame at 3.5 s. The page loads the video with `preload="none"` and plays it only while it's on screen.

## CATA share page diagram

`meetandeat/cata/` shows the bus popup, route list and stop departures as stations on a transit-map bundle of CATA routes, drawn as inline SVG in each route's own color (sampled from the app's route list: BL `#0071CA`, RL `#FD0006`, CC `#00009A`, N `#01AFF1`, UP `#2ACACC`, V `#FF6500`, W `#FDCC0A`, H `#9A65FF`). The lines draw on when the diagram scrolls into view, and route chips ride them with SMIL `animateMotion`. Their stagger is a negative `begin` in the markup, because browsers ignore `beginElementAt()` offsets that land before the SVG timeline started. `meetandeat/route-diagram.mjs` starts the reveal and pauses the SVG animations under reduced motion; the page's CSP blocks inline scripts and styles. It's deliberately different from the promo video's radial route burst.
