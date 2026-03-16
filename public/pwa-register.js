/*
 * Service Worker registration (CSP-friendly)
 *
 * Why this exists:
 * - Admin pages use a strict Content-Security-Policy that blocks inline scripts.
 * - Some PWA plugins register the service worker using an inline snippet.
 * - If SW registration is blocked, Chrome won't show the "Install" prompt.
 *
 * This file is a first-party, same-origin external script, allowed by
 * `script-src 'self'`.
 */

(function () {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // In dev, next-pwa can be disabled. Avoid noisy errors.
  var isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  function register() {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(function (err) {
        if (isLocalhost) {
          console.debug("[pwa-register] SW register failed (dev):", err);
        } else {
          console.warn("[pwa-register] SW register failed:", err);
        }
      });
  }

  // Register as soon as possible, but after page is interactive.
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register);
  }
})();
