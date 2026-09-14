# Halls website

Static site for SwiftByte LLC and Halls. No application framework, build service, analytics scripts, or runtime dependencies are required.

## Preview and validate

```sh
python3 -m http.server 4173 --bind 127.0.0.1
node --test tests/meetandeat-contract.test.mjs
```

Open http://127.0.0.1:4173. The main product page is available at both `/` and `/meetandeat/`. Shared hall, dish and transit links retain their existing paths.

The authoritative homepage is `index.html`; keep the matching `/meetandeat/index.html` copy in sync (only its canonical/OG URL differs). Presentation is shared in `styles.css`; `site.js` handles the mobile navigation and keyboard-accessible feature tabs. Supporting routes use `meetandeat/styles.css`.

## Content and assets

See [feature sources](docs/feature-sources.md) and [Rotato renders](docs/rotato-renders.md). The page describes the current iOS source tree, with the dedicated Pro promotion removed. Publish alongside the corresponding app release; the existing App Store build may not yet include every new feature. Android has its own store link and is explicitly described as having potentially different features.

Legal notice wording was preserved; only its surrounding layout was refreshed.

## Universal links

See [deep-link release notes](docs/deep-links.md). An association file alone cannot enable links: the signed iOS app must also include the `applinks` entitlement and URL routing changes.

After publishing, run:

```sh
node scripts/check-association.mjs https://swiftbyte.app
```

This checks the actual response status, MIME type, and app identifier. Do not assume a local file means Apple's CDN has fetched it.

Production assets live in `assets/`. Unused source copies, intermediate renders, videos, and superseded images have been removed; only referenced web assets remain. The extensionless `/.well-known/apple-app-site-association` adds universal links. The legacy `.html` endpoint retains webcredentials for the confirmed production setup; App Clip associations have been removed from both files. Existing `/meetandeat/` paths and `meetandeat://` URLs remain for compatibility.

“Get the app” links use `/download.html`, which automatically redirects iOS to the App Store, Android to Google Play, and desktop to the homepage.
