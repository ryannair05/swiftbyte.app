import { parseDispatcherRequest } from "./open/dispatcher.mjs";

export function resolveHallLink(pathname, search) {
  const match = /^\/meetandeat\/hall\/(north|east|south|west|pollock)\/?$/.exec(
    pathname,
  );
  if (!match) return { valid: false };
  // Preserve raw percent encoding and duplicates so the shared validator can reject them.
  const suffix = search.startsWith("?") ? search.slice(1) : search;
  return parseDispatcherRequest(
    `?kind=hall&id=psu%3A${match[1]}${suffix ? "&" + suffix : ""}`,
  );
}

if (typeof document !== "undefined") {
  const action = document.querySelector('a[href^="meetandeat://view-hall"]');
  const result = resolveHallLink(location.pathname, location.search);
  if (action && result.valid) action.href = result.targetURL;
  else if (action) {
    action.removeAttribute("href");
    action.setAttribute("aria-disabled", "true");
    const note = document.querySelector(".request-card p");
    if (note)
      note.textContent =
        "This link contains an invalid menu selection. Open the hall without those parameters, or use the official dining link.";
  }
}
