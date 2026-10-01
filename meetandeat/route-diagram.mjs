// Starts the CATA route diagram when it scrolls into view: lines draw on, then the route
// chips (already running along the lines from page load) fade in. With reduced motion the
// diagram stays static and the SVG animations are paused.
const diagram = document.querySelector(".diagram");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (diagram && reduceMotion.matches) {
  diagram.querySelectorAll("svg").forEach((svg) => svg.pauseAnimations());
} else if (diagram && "IntersectionObserver" in window) {
  diagram.classList.add("is-ready");
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      diagram.classList.add("is-live");
      setTimeout(() => diagram.classList.add("is-running"), 1400);
    },
    { threshold: 0.25 },
  );
  observer.observe(diagram);
}
