// NOTE: This file creates a service worker that cross-origin-isolates the page (read more here: https://web.dev/coop-coep/) which allows us to use wasm threads.
// Normally you would set the COOP and COEP headers on the server to do this, but Github Pages doesn't allow this, so this is a hack to do that.

/* Edited version of: coi-serviceworker v0.1.6 - Guido Zuidhof, licensed under MIT */
// From here: https://github.com/gzuidhof/coi-serviceworker
if(typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));


  self.addEventListener("fetch", async function (e) {
    if(e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") {
      return;
    }
    
    let r = await fetch(e.request).catch((e) => console.error(e));
    
    if(r.status === 0) {
      return r;
    }

    const headers = new Headers(r.headers);
    headers.set("Cross-Origin-Embedder-Policy", "credentialless"); // better than `require-corp` because it lets us embed cross-domain images
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    
    e.respondWith(new Response(r.body, { status: r.status, statusText: r.statusText, headers }));
  });
} else {
  (async function() {
    if(window.crossOriginIsolated !== false) return;

    let registration = await navigator.serviceWorker.register(window.document.currentScript.src).catch(e => console.error("COOP/COEP Service Worker failed to register:", e));
    if(registration) {
      console.log("COOP/COEP Service Worker registered", registration.scope);

      registration.addEventListener("updatefound", () => {
        console.log("Reloading page to make use of updated COOP/COEP Service Worker.");
        window.location.reload();
      });

      // If the registration is active, but it's not controlling the page
      if(registration.active && !navigator.serviceWorker.controller) {
        console.log("Reloading page to make use of COOP/COEP Service Worker.");
        window.location.reload();
      }
    }
  })();
}
