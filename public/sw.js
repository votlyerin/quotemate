/**
 * QuoteMate service worker — minimal cache-first PWA shell.
 *
 * Strategy:
 *  - App-shell pages and static assets: stale-while-revalidate
 *    (serve cached instantly, update in background)
 *  - API routes, auth, and Stripe: always network (no caching)
 *  - Offline fallback: serve cached version if network fails
 */

const CACHE = "quotemate-v1";

// Pages to pre-cache on install so the app shell loads instantly
const PRECACHE_URLS = ["/", "/dashboard", "/login", "/signup"];

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).catch(() => {
          // Silently ignore pre-cache failures (e.g. auth-redirected pages)
        })
      )
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache: API routes, auth callbacks, Stripe redirects
  const noCache = ["/api/", "/auth/", "/_next/webpack-hmr"];
  if (noCache.some((p) => url.pathname.startsWith(p))) return;

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            // Only cache successful responses from our own origin
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached ?? new Response("Offline", { status: 503 }));

        // Return cached immediately if available; network update happens in background
        return cached ?? networkFetch;
      })
    )
  );
});
