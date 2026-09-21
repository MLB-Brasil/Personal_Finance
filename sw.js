/* Service worker do Personal Finance.
 * Guarda só os arquivos do próprio app (mesma origem) para abrir offline.
 * Requisições ao Supabase e a CDNs (outras origens) NÃO passam por aqui,
 * então login e dados financeiros nunca ficam no cache do service worker. */
const CACHE = "personal-finance-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (sempre a versão mais nova); se estiver offline, usa o cache.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});
