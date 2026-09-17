// Network-first for the app shell so everyone always gets the latest version,
// with cache as offline fallback. API + storage calls always hit the network.
const CACHE = "wg-v4";
const SHELL = ["./index.html", "./app.js", "./config.js", "./manifest.json", "./icon.png", "./beit.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (url.includes("/rest/v1/") || url.includes("/storage/v1/") || e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
