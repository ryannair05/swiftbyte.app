const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
function closeMenu() {
  menuButton?.setAttribute("aria-expanded", "false");
  navigation?.classList.remove("is-open");
}
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
});
navigation
  ?.querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton?.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    menuButton.focus();
  }
});
const tabs = [...document.querySelectorAll(".feature-option")];
function selectTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    item.classList.toggle("active", selected);
    document.getElementById(item.getAttribute("aria-controls")).hidden =
      !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowDown" || event.key === "ArrowRight")
      next = (index + 1) % tabs.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    }
  });
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealItems = document.querySelectorAll(".reveal");
if (revealItems.length && !reduceMotion.matches && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

const promo = document.getElementById("promo");
const promoToggle = document.querySelector(".film-toggle");
if (promo && promoToggle) {
  // Autoplay only while on screen; a manual pause sticks until the viewer presses play.
  let pausedByViewer = reduceMotion.matches;
  const syncToggle = () => {
    const playing = !promo.paused;
    promoToggle.setAttribute("aria-pressed", String(playing));
    promoToggle.setAttribute("aria-label", playing ? "Pause video" : "Play video");
  };
  promo.addEventListener("play", syncToggle);
  promo.addEventListener("pause", syncToggle);
  promoToggle.addEventListener("click", () => {
    pausedByViewer = !promo.paused;
    if (pausedByViewer) promo.pause();
    else promo.play().catch(() => {});
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pausedByViewer) promo.play().catch(() => {});
        else if (!entry.isIntersecting) promo.pause();
      },
      { threshold: 0.4 },
    ).observe(promo);
  }
}

// CSS can't stop SMIL, so the CATA bus dot is paused here when motion is reduced.
const syncRouteMotion = () =>
  document.querySelectorAll(".route-art").forEach((svg) => {
    if (reduceMotion.matches) svg.pauseAnimations();
    else svg.unpauseAnimations();
  });
syncRouteMotion();
reduceMotion.addEventListener("change", syncRouteMotion);

// "Get the app": iPhone, iPad, Mac and Android go through /download.html to their store.
// Everywhere else there's no store to open, so show a scan-to-download panel instead.
const isStorePlatform = /iPad|iPhone|iPod|Macintosh|Android/i.test(navigator.userAgent);
let getPanel;
function openGetPanel() {
  if (!getPanel) {
    getPanel = document.createElement("aside");
    getPanel.className = "get-panel";
    getPanel.setAttribute("role", "dialog");
    getPanel.setAttribute("aria-labelledby", "get-panel-title");
    getPanel.tabIndex = -1;
    getPanel.innerHTML = `
      <img class="get-qr" src="/assets/brand/qr-download.svg" width="112" height="112" alt="QR code linking to the Halls download page" />
      <div>
        <p class="get-title" id="get-panel-title">Get Halls on your phone</p>
        <p>Scan with your camera. Halls is on iPhone, iPad, Mac and Android.</p>
        <div class="get-badges">
          <a href="https://apps.apple.com/us/app/halls-campus-dining/id6446225508"><img src="/assets/brand/app-store.svg" width="120" height="40" alt="Download on the App Store" /></a>
          <a href="https://play.google.com/store/apps/details?id=com.ryannair05.meetandeat"><img src="/GetItOnGooglePlay.svg" width="155" height="60" alt="Get it on Google Play" /></a>
        </div>
      </div>
      <button class="get-close" type="button" aria-label="Close">×</button>`;
    getPanel.querySelector(".get-close").addEventListener("click", closeGetPanel);
    document.body.append(getPanel);
  }
  getPanel.hidden = false;
  getPanel.focus({ preventScroll: true });
}
function closeGetPanel() {
  if (!getPanel || getPanel.hidden) return;
  getPanel.hidden = true;
  if (location.hash === "#get") history.replaceState(null, "", location.pathname + location.search);
}
if (!isStorePlatform) {
  document.querySelectorAll('a[href="/download.html"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openGetPanel();
    }),
  );
  if (location.hash === "#get") openGetPanel();
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGetPanel();
});
