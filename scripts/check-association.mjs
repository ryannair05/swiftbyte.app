// Run after publishing: node scripts/check-association.mjs [https://swiftbyte.app]
// Checks what Apple documents in "Supporting associated domains": the extensionless file at
// /.well-known/apple-app-site-association, served over HTTPS with a valid certificate and no
// redirects. Since iOS 14 / macOS 11, devices read the file from Apple's associated-domains CDN,
// so the CDN copy is checked too. Apple doesn't require a particular Content-Type.
import assert from "node:assert/strict";

const APP_ID = "S5BAL69932.com.ryannair05.pennstatemeals";
const origin = new URL(process.argv[2] || "https://swiftbyte.app");
assert.equal(origin.protocol, "https:", "The association file must be served over HTTPS.");

async function load(url, label) {
  // fetch() rejects invalid certificates, so a successful response also means a valid one.
  const response = await fetch(url, { redirect: "manual" });
  assert.equal(response.status, 200, `${label} returned ${response.status}; it must return 200 with no redirects.`);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} isn't valid JSON.`);
  }
}

function checkApp(association, label) {
  assert.ok(
    association.applinks?.details?.some((detail) => detail.appIDs?.includes(APP_ID)),
    `${label} is missing ${APP_ID} in applinks.details[].appIDs.`,
  );
  assert.ok(
    association.webcredentials?.apps?.includes(APP_ID),
    `${label} is missing ${APP_ID} in webcredentials.apps.`,
  );
}

const site = await load(new URL("/.well-known/apple-app-site-association", origin), "Site");
checkApp(site, "Site");
console.log("Site: HTTPS 200, no redirect, valid JSON, expected app ID.");

const cdn = await load(`https://app-site-association.cdn-apple.com/a/v1/${origin.hostname}`, "Apple CDN");
checkApp(cdn, "Apple CDN");
try {
  assert.deepEqual(cdn, site);
  console.log("Apple CDN: matches the published file.");
} catch {
  // Apple's CDN fetches new versions within about 24 hours, so a recent publish can lag.
  console.warn("Apple CDN: still serving an older version. It refreshes within about 24 hours.");
  process.exitCode = 1;
}
