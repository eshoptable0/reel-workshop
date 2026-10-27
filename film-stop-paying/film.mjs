// language: js (ESM), target: lemo-opuscar render pipeline — custom film "STOP PAYING FOR SOFTWARE"
// swiss-motion structure: grid, precise snaps, one signal colour (green = money saved)
import { clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1920, H = 1080, DUR = 54;
export const C = {
  page: '#EAE9E5', ink: '#111111', green: '#1F7A3D',
  pgrid: '#E2E1DC', mute: '#77766F',
};
const FM = 96, FG = 24, FC = 122;
export const fx = i => FM + i * (FC + FG);

export const T = { open: 2.0, billOut: 7.4, tools0: 9.0, toolIn: 4.2, cta: 48.5 };
const TOOLS = [
  ['GOOGLE PHOTOS', 'IMMICH', 650],
  ['NOTION', 'APPFLOWY', 1504],
  ['LOOM', 'CAP', 1690],
  ['CALENDLY', 'CAL.COM', 1128],
  ['WISPR FLOW', 'OPENWHISPR', 1410],
  ['ASANA', 'OPENPROJECT', 1268],
  ['ADOBE SCAN', 'PAPERLESS', 480],
  ['1PASSWORD', 'VAULTWARDEN', 990],
  ['DROPBOX', 'SYNCTHING', 780],
  ['GOOGLE DOCS', 'CRISP', 313],
];
const TOTAL = TOOLS.reduce((s, x) => s + x[2], 0);

let WORDS = {}, LINES = [];
export function setWords(w) { WORDS = w || {}; }
export function setLines(lines, dur) { LINES = lines.map(L => ({ ...L, dur: dur[L.id] })); }
export function buildEvents() {
  const ev = [];
  for (let i = 0; i < 10; i++) ev.push({ t: T.tools0 + i * T.toolIn, type: 'thunk', gain: .5 });
  ev.push({ t: T.open, type: 'stamp', gain: .8 });
  ev.push({ t: T.billOut, type: 'whoosh', gain: .6 });
  ev.push({ t: T.cta, type: 'thunk', gain: .7 });
  return ev.map(e => ({ ...e, gain: e.gain ?? .5 }));
}
export const subs = () => LINES.map(L => ({ t0: L.t, t1: Math.min(L.t + (L.dur || 2) + 1.2, L.t + 4.6), text: L.text }));

const lineById = id => LINES.find(L => L.id === id);
function wordTimes(L, n) {
  const w = WORDS[L.id];
  if (w && w.length === n) return w.map(x => L.t + x);
  return Array.from({ length: n }, (_, i) => L.t + i * .24);
}
function revealText(g, s, x, y, size, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  const w = g.measureText(s).width + size * .1;
  g.save(); g.beginPath(); g.rect(x - 2, y - size * 1.02, w + 4, size * 1.30); g.clip();
  g.fillText(s, x, y + (1 - p) * size * 1.05 - q * size * 1.3);
  g.restore();
}
function font(g, weight, size, fam = 'Archivo') {
  g.font = `${weight} ${size}px ${fam}`;
  g.letterSpacing = size >= 90 ? `${(-size * 0.022).toFixed(1)}px` : '0px';
}

function drawOpen(g, t) {
  if (t < T.open || t > T.billOut + 1.2) return;
  const p = snap(t, T.open, E8 * 1.5);
  const q = snap(t, T.billOut, E8);
  const base = 880, size = 420;
  const L1 = lineById('l1'), L2 = lineById('l2');
  g.save(); g.beginPath(); g.rect(0, base - size - 20, W, size + 80); g.clip();
  font(g, 800, size);
  g.fillStyle = C.ink;
  const txt = '₹28,421';
  const lsb = -g.measureText(txt).actualBoundingBoxLeft;
  g.fillText(txt, fx(0) - lsb + q * 300, base + (1 - p) * (size + 60) - q * 220);
  g.restore();
  font(g, 500, 34); g.fillStyle = C.mute;
  revealText(g, 'YOUR MONTHLY SOFTWARE BILL', fx(0), base + 80, 34, snap(t, T.open + 1.2, E8), q);
  g.fillStyle = C.ink; g.fillRect(fx(0), base + 110, (fx(11) + FC - fx(0)) * snap(t, T.open + .8, E8) * (1 - q), 2);
  if (L2) { font(g, 700, 54); g.fillStyle = C.green; revealText(g, L2.text.toUpperCase(), fx(0), base - size - 60, 54, snap(t, L2.t, E8)); }
}

function drawTools(g, t) {
  if (t < T.tools0) return;
  const raw = (t - T.tools0) / T.toolIn;
  const idx = Math.min(Math.floor(raw), 9);
  const tin = T.tools0 + idx * T.toolIn;
  const p = snap(t, tin, E8);
  const [paid, free, saved] = TOOLS[idx];
  // big index numeral — left page
  font(g, 700, 300); g.fillStyle = C.pgrid;
  g.fillText(String(idx + 1).padStart(2, '0'), fx(0), 640);
  // paid, struck through
  font(g, 300, 60); g.fillStyle = C.mute;
  revealText(g, paid, fx(0), 760, 60, p);
  const w1 = g.measureText(paid).width;
  const strike = snap(t, tin + .8, E8);
  if (strike > 0) { g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(fx(0) - 8, 740); g.lineTo(fx(0) - 8 + w1 * strike, 740); g.stroke(); }
  // arrow + free name
  font(g, 400, 50); g.fillStyle = C.green;
  revealText(g, '→', fx(4) + 40, 760, 50, snap(t, tin + 1.0, E8));
  font(g, 800, 96); g.fillStyle = C.ink;
  revealText(g, free, fx(6), 770, 96, snap(t, tin + 1.2, E8));
  // savings chip
  const ps = snap(t, tin + 1.6, E8);
  if (ps > 0) {
    const label = `₹${saved}/mo`;
    font(g, 700, 54);
    const wch = g.measureText(label).width;
    g.fillStyle = C.green;
    g.fillRect(fx(0), 850, (wch + 56) * ps, 92);
    g.fillStyle = '#FFFFFF';
    revealText(g, label, fx(0) + 28, 912, 50, ps);
    font(g, 500, 22); g.fillStyle = C.mute;
    revealText(g, `SAVED / MONTH · SAVED ${idx + 1} OF 10`, fx(0) + wch + 96, 906, 22, ps);
  }
  // 10 progress cells
  for (let i = 0; i < 10; i++) {
    g.fillStyle = t >= T.tools0 + i * T.toolIn ? C.ink : C.pgrid;
    g.fillRect(fx(0) + i * 96, 980, 80, 12);
  }
  font(g, 500, 20); g.fillStyle = C.mute;
  g.fillText(`FREE REPO ${String(idx + 1).padStart(2, '0')} / 10`, fx(0), 950);
}

function drawTotal(g, t) {
  const l8 = lineById('l8'), l9 = lineById('l9'), l10 = lineById('l10');
  if (l8 && t >= l8.t) {
    const p = snap(t, l8.t + .3, E8);
    font(g, 800, 220); g.fillStyle = C.ink;
    revealText(g, `₹${TOTAL.toLocaleString('en-IN')}`, fx(0), 500, 220, p);
    font(g, 600, 46); g.fillStyle = C.green;
    revealText(g, 'SAVED EVERY MONTH. FOREVER.', fx(0), 590, 46, snap(t, l8.t + 1.0, E8));
    if (l9) { font(g, 500, 30); g.fillStyle = C.mute; revealText(g, l9.text, fx(0), 650, 30, snap(t, l9.t, E8)); }
  }
  if (l10 && t >= l10.t) {
    const p = snap(t, l10.t + .2, E8);
    g.fillStyle = C.green;
    g.fillRect(fx(0), 760, (fx(10) + FC - fx(0)) * p, 150);
    font(g, 800, 70); g.fillStyle = '#FFFFFF';
    revealText(g, 'COMMENT "REPOS"', fx(0) + 44, 855, 66, p);
    font(g, 500, 26); g.fillStyle = C.ink;
    revealText(g, 'the full list with links, sent to your dms', fx(0), 950, 26, snap(t, l10.t + .9, E8));
  }
}

function drawGrid(g, t) {
  const p = snap(t, 0.6, E8 * 2);
  if (p <= 0) return;
  g.strokeStyle = C.pgrid; g.lineWidth = 1; g.globalAlpha = p;
  for (let c = 0; c <= 11; c++) {
    const x = fx(c) - FG / 2;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  g.globalAlpha = 1;
}

export function renderFilm(g, t, opts = {}) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  drawGrid(g, t);
  g.fillStyle = C.ink; g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6);
  drawOpen(g, t);
  drawTools(g, t);
  drawTotal(g, t);
  if (t > 1 && t < T.cta + 3) {
    font(g, 500, 20); g.fillStyle = C.mute;
    const label = t < T.tools0 ? 'STOP PAYING FOR SOFTWARE' : `FREE STACK ${String(Math.min(10, Math.floor((t - T.tools0) / T.toolIn) + 1)).padStart(2, '0')} / 10`;
    g.fillText(label, fx(0), 66);
    g.fillStyle = C.ink; g.fillRect(fx(0), 40, 320, 1);
    if (t >= T.tools0) { g.fillText('INDIA · 2026', fx(9), 66); g.fillRect(fx(9), 40, 200, 1); }
  }
}
