/* Service worker do Personal Finance.
 * Guarda só os arquivos do próprio app (mesma origem) para abrir offline.
 * Requisições ao Supabase e a CDNs (outras origens) NÃO passam por aqui,
 * então login e dados financeiros nunca ficam no cache do service worker.
 * Também mostra os lembretes de vencimento: a página grava em "pf-data" só a lista
 * de despesas a pagar (nome, valor, data) do usuário conectado; nada disso vai para a rede. */
const CACHE = "personal-finance-v3";
const DATA = "pf-data";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg"];
const DUE_URL = new URL("__pf/due.json", self.registration.scope).href;
const SENT_URL = new URL("__pf/sent.json", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (sempre a versão mais nova); se estiver offline, usa o cache.
// Abrir o app revalida o HTML no servidor (no-cache), em vez de aceitar a cópia do cache HTTP
// do navegador, que no GitHub Pages pode ficar até 10 min desatualizada.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req.mode === "navigate" ? new Request(req.url, { cache: "no-cache", credentials: "same-origin" }) : req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});

// ---------- lembretes de vencimento ----------
// Cada despesa gera no máximo dois avisos: um quando entra na janela de antecedência
// e outro no dia do vencimento. O que já foi avisado fica em sent.json.
async function checkDue() {
  if (!self.Notification || Notification.permission !== "granted") return;
  const c = await caches.open(DATA);
  const r = await c.match(DUE_URL);
  if (!r) return;
  const d = await r.json();
  if (!d.on) return;
  const s = await c.match(SENT_URL);
  const sent = s ? await s.json() : {};
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  for (const it of d.items) {
    const n = Math.round((new Date(it.due + "T00:00:00") - hoje) / 864e5);
    if (n < 0 || n > d.dias) continue;
    const tipo = n === 0 ? "hoje" : "antes";
    const k = `${it.id}|${it.due}|${tipo}`;
    if (sent[k]) continue;
    sent[k] = it.due;
    await self.registration.showNotification(
      n === 0 ? `Vence hoje: ${it.nome}` : `Vence em ${n} dia${n > 1 ? "s" : ""}: ${it.nome}`,
      { body: `${it.valor} · vencimento ${it.dataBR}`, tag: k, icon: "icon.svg", badge: "icon.svg" }
    );
  }
  const limite = new Date(hoje - 40 * 864e5).toISOString().slice(0, 10);
  for (const k of Object.keys(sent)) if (sent[k] < limite) delete sent[k];
  await c.put(SENT_URL, new Response(JSON.stringify(sent), { headers: { "content-type": "application/json" } }));
}

// Uma verificação por vez, para duas chamadas seguidas não avisarem a mesma despesa duas vezes.
let fila = Promise.resolve();
const verificar = () => (fila = fila.then(checkDue).catch(() => {}));
self.addEventListener("message", (event) => { if (event.data === "pf-check-due") event.waitUntil(verificar()); });
self.addEventListener("periodicsync", (event) => { if (event.tag === "pf-due") event.waitUntil(verificar()); });
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
      const w = ws.find((c) => "focus" in c);
      return w ? w.focus() : self.clients.openWindow(self.registration.scope);
    })
  );
});
