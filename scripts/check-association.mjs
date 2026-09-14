// Run after publishing: node scripts/check-association.mjs [https://swiftbyte.app]
const origin = process.argv[2] || "https://swiftbyte.app";
const response = await fetch(
  `${origin}/.well-known/apple-app-site-association`,
  { redirect: "manual" },
);
if (response.status !== 200)
  throw new Error(
    `Association endpoint returned ${response.status}; it must return 200 without redirects.`,
  );
const contentType = response.headers.get("content-type") || "";
if (!contentType.includes("application/json"))
  throw new Error(
    `Association Content-Type is ${contentType}; configure hosting to return application/json.`,
  );
const body = await response.json();
if (
  !body.applinks?.details?.some((detail) =>
    detail.appIDs?.includes("S5BAL69932.com.ryannair05.pennstatemeals"),
  )
)
  throw new Error("Missing app identifier in applinks.");
console.log(
  "Association endpoint: HTTPS 200, application/json, expected app identifier.",
);
