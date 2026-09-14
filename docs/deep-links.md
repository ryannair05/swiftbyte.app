# Deep links: implementation and release

Implemented together with the iOS app in `/Users/ryannair/Developer/Penn-State-Meals`.

## Fixed

- Added `applinks:swiftbyte.app` alongside the existing webcredentials entitlement.
- Added `applinks` rules for the correct team/bundle ID to the extensionless AASA endpoint; retained webcredentials.
- Added app-root handling of HTTPS universal links and `meetandeat://` URLs, including links received during onboarding.
- Queue a validated request until the corresponding UIKit controller exists; select PSU and the appropriate tab before consuming it.
- Open the selected hall, date and meal. Require canonical lowercase hall IDs and meal slugs.
- Resolve shared PSU dishes through the existing search index/repository, with an unavailable state if the date/dish is absent.
- Open the CATA map, a selected route, or a stop's departure sheet. CATA changes remain Objective-C.
- Generate shared/Handoff URLs for the real `/meetandeat/open/` dispatcher, rather than the previously missing `/meetandeat/hall?id=…` endpoint.
- Include a menu URL with shared menu images; add a Share Dish action; preserve the displayed PSU widget date and meal in its URL.
- Preserve date/meal query parameters in static hall-page app buttons. Legacy `psu=` links and `/hall?id=…` or `/dish?id=…` pages are intentionally removed.

## Examples

```
https://swiftbyte.app/meetandeat/hall/south/
https://swiftbyte.app/meetandeat/hall/west/?date=2026-09-07&meal=dinner
https://swiftbyte.app/meetandeat/open/?kind=hall&id=psu%3Apollock&date=2026-09-07&meal=lunch
https://swiftbyte.app/meetandeat/open/?kind=dish&id=psu%3Amid%3A12345&date=2026-09-07
https://swiftbyte.app/meetandeat/open/?kind=cata-route&id=51
https://swiftbyte.app/meetandeat/open/?kind=cata-stop&id=123
meetandeat://view-hall?provider=psu&hall=south&date=2026-09-07&meal=dinner
```

The example dish and stop IDs are illustrative, not assertions that those records are currently available. Historical menus remain subject to the app's supported date window and published data.

Universal-link rules intentionally cover the PSU implementation and CATA. They do not claim that Barnard/UGA use the modern repository; existing legacy provider handling is separate.

## Production requirements

The local implementation is complete, but production linking requires both deployments:

1. Publish this website, including `/.well-known/apple-app-site-association` with **no file extension**, HTTPS 200, no redirect, and `Content-Type: application/json`. The old `.html` endpoint alone is insufficient. At inspection, the existing GitHub Pages response returned `text/html` and had no `applinks` section. Verify the extensionless MIME response after publishing; if the host cannot set it, configure an edge response/header override or a host that can. Do not assume a filename changes hosting headers.
2. Ensure Associated Domains is enabled for the app's Apple Developer App ID and the release provisioning profile, then install a signed build containing the new entitlement and routing code.
3. Run `node scripts/check-association.mjs https://swiftbyte.app`. Check Apple's cached response at `https://app-site-association.cdn-apple.com/a/v1/swiftbyte.app` as well.
4. Test on a device from Notes or Messages, with the app terminated and running, and with another university or tab selected. Verify all five halls and selected dates/meals. Also test a valid shared dish and valid CATA route/stop.

Safari may keep same-domain navigation in the browser; the site's explicit “Open in Halls” buttons use the custom scheme to provide a direct action. Apple's CDN can cache association files, and reinstalling the updated app requests a newer association. Production universal-link delivery was not claimed as verified before deployment.

## Validation

- iOS app builds for the generic iOS Simulator destination with signing disabled.
- `bash scripts/test-deep-links.sh` in the iOS repository compiles the actual parser and queue with Swift 6 and runs 68 contract checks without requiring a simulator.
- `node --test tests/meetandeat-contract.test.mjs` checks the dispatcher, malformed input, association files, static fallback pages, and selected date/meal preservation.
- Browser verification checks that a dated South hall URL produces the corresponding custom-scheme action.

References:
- [Apple: Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- [Apple: Debugging universal links](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links)
- [Apple: Universal link file format and MIME type](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html)

## Canonical value contract

Both sides accept PSU halls (`north`, `east`, `south`, `west`, `pollock`), Gregorian `YYYY-MM-DD` dates and 1–32 character lowercase ASCII meal slugs (`a-z`, `0-9`, `-`). Query values are validated, not repaired. URL schemes and hosts remain case-insensitive as required by URL semantics. PSU `mid:` and CATA IDs must be positive decimal integers fitting signed 64-bit storage. The dispatcher no longer generates unsupported Barnard/UGA app routes. Canonical custom hall links require `provider=psu&hall=<id>`.

## Simplified association rules

The extensionless file uses two rules: `/meetandeat` and `/meetandeat/*`. This covers the product root and all paths inside the app namespace. Unrelated website routes, including `/download.html` and privacy/support pages, stay in the browser. Unsupported paths within `/meetandeat/` can open the app, which remains responsible for validating routes and query parameters.

Webcredentials remain in both the extensionless file and the legacy `.html` endpoint used by the confirmed production setup. App Clip associations have been removed because the App Clip was retired. The unused legacy `applinks.apps` array was also removed. Recheck the live extensionless endpoint after publishing to validate universal-link delivery.
