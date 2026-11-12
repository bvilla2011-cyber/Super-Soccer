export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const lerp = (a, b, t) => a + (b - a) * t;
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const round = (n, places = 0) => Math.round(n * 10 ** places) / 10 ** places;
export const clone = value => JSON.parse(JSON.stringify(value));
export const money = value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(value);
export const number = value => new Intl.NumberFormat('es-ES').format(value);
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export function hash(text) {
  let n = 2166136261;
  for (let i = 0; i < text.length; i++) { n ^= text.charCodeAt(i); n = Math.imul(n, 16777619); }
  return (n >>> 0).toString(16);
}
export function random(seed = Date.now()) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  next.int = (a, b) => Math.floor(next() * (b - a + 1)) + a;
  next.pick = list => list[Math.floor(next() * list.length)];
  next.state = () => state;
  return next;
}
export function shuffle(items, rng) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = rng.int(0, i); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
export function poisson(mean, rng) {
  const limit = Math.exp(-mean); let product = 1, k = 0;
  do { k++; product *= rng(); } while (product > limit && k < 15);
  return k - 1;
}
export function weighted(items, weight, rng) {
  let n = rng() * items.reduce((sum, item) => sum + Math.max(0.01, weight(item)), 0);
  for (const item of items) { n -= Math.max(0.01, weight(item)); if (n <= 0) return item; }
  return items.at(-1);
}
export function download(filename, data, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
