# Halls website

Static site for SwiftByte LLC and Halls. No application framework, build service, analytics scripts, or runtime dependencies are required.

## Preview and validate

```sh
python3 scripts/preview.py
node --test tests/meetandeat-contract.test.mjs
```

Open http://127.0.0.1:4173. `scripts/preview.py` serves the repo root from any working directory, disables caching, and supports byte-range requests. Plain `python3 -m http.server` doesn't support ranges, so Safari won't play the promo video with it. The main product page is available at both `/` and `/meetandeat/`. Shared hall, dish and transit links retain their existing paths.

The authoritative homepage is `index.html`; keep the matching `/meetandeat/index.html` copy in sync (only its canonical/OG URL differs). Presentation is shared in `styles.css`; `site.js` handles the mobile navigation, the keyboard-accessible feature tabs, scroll reveals, the promo video, and the scan-to-download panel shown on desktops without an app store (Windows, Linux, ChromeOS). `/download.html` sends iPhone, iPad and Mac to the App Store and Android to Google Play. Supporting routes use `meetandeat/styles.css`.

## Content and assets

See [feature sources](docs/feature-sources.md) and [Rotato renders](docs/rotato-renders.md). The page describes the current iOS source tree, with the dedicated Pro promotion removed. Publish alongside the corresponding app release; the existing App Store build may not yet include every new feature. Android has its own store link and is explicitly described as having potentially different features.

The privacy policy (effective September 30, 2026) reflects the app as audited that day: no accounts, Google Analytics for Firebase as the only automatic collection (screen views and `Analytics.logTransaction` purchase events), and on-device-only HealthKit writes, location, meal history and BTChat. Update it, and the App Store privacy label and Google Play Data safety form, whenever the app starts collecting something new.

## Universal links

See [deep-link release notes](docs/deep-links.md). An association file alone cannot enable links: the signed iOS app must also include the `applinks` entitlement and URL routing changes.

After publishing, run:

```sh
node scripts/check-association.mjs https://swiftbyte.app
```

This checks Apple's documented requirements (HTTPS, status 200, no redirects, valid JSON with the app ID) on the site, then checks that Apple's associated-domains CDN, which is what devices read, serves the same file. Apple refreshes the CDN within about 24 hours of a change. Apple doesn't require a specific Content-Type, so GitHub Pages serving the file as `application/octet-stream` is fine.

Production assets live in `assets/`. Unused source copies, intermediate renders, videos, and superseded images have been removed; only referenced web assets remain. `/.well-known/apple-app-site-association` (no extension, as Apple requires) declares universal links and shared web credentials; it has no App Clip entries. Existing `/meetandeat/` paths and `meetandeat://` URLs remain for compatibility.

“Get the app” links use `/download.html`, which automatically redirects iOS to the App Store, Android to Google Play, and desktop to the homepage.
