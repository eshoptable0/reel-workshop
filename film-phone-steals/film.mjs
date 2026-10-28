// language: js (ESM), target: lemo-opuscar engine — "YOUR PHONE STEALS 4 YEARS" film
// portrait 1080x1920, swiss-motion grammar: grid, precise snaps, one signal colour (red = stolen time)
// scenes: hook (4 years counter) -> per-app steals -> twist (what 4 years buys) -> fix (routine) -> CTA
import { clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1080, H = 1920, DUR = 50;
export const C = {
  page: '#0E0F12', ink: '#F2F1EC', dim: '#8A8880', red: '#FF3B30', green: '#2FD06B', pgrid: '#1B1D22', amber: '#FFB020',
};
const FM = 72, FG = 20, FC = 74;
export const fx = i => FM + i * (FC + FG);

export const T = {
  hook: 1.2,        // "your phone steals 4 years"
  years: 3.0,       // giant 4 YEARS counter climbs
  apps0: 10.0,      // per-app steal blocks (6 apps x 4.6s)
  appIn: 4.6,
  twist: 37.6,      // what 4 years buys
  fix: 43.0,        // the fix
  cta: 47.2,        // comment PHONE
};
const APPS = [
  ['SHORT VIDEOS', '2 H 41 M / DAY', 1.1],
  ['SOCIAL FEEDS', '1 H 55 M / DAY', 0.8],
  ['MESSAGING', '58 M / DAY', 0.4],
  ['GAMES', '45 M / DAY', 0.3],
  ['NEWS + DOOM', '31 M / DAY', 0.2],
  ['PRICE CHECKING', '12 M / DAY', 0.1],
];
const TOTAL_YEARS = 4;

let WORDS = {}, LINES = [], SCORE = {};
export function setScore(s) { SCORE = s || {}; }
export function setWords(w) { WORDS = w || {}; }
export function setLines(lines, dur) { LINES = lines.map(L => ({ ...L, dur: dur[L.id] })); }
export function buildEvents() {
  const ev = [];
  ev.push({ t: T.hook, type: 'heartbeat', gain: .9 });
  ev.push({ t: T.years, type: 'thump', gain: 1.0 });
  for (let i = 0; i < 6; i++) ev.push({ t: T.apps0 + i * T.appIn, type: 'clack', gain: .65 });
  ev.push({ t: T.twist, type: 'whoosh', gain: .8 });
  ev.push({ t: T.fix, type: 'ding', gain: .7 });
  ev.push({ t: T.cta, type: 'thump', gain: .9 });
  return ev;
}
export const subs = () => LINES.map(L => ({ t0: L.t, t1: Math.min(L.t + (L.dur || 2) + 1.4, L.t + 5), text: L.text }));

const lineById = id => LINES.find(L => L.id === id);
function font(g, weight, size, fam = 'Archivo') {
  g.font = `${weight} ${size}px ${fam}`;
  g.letterSpacing = size >= 90 ? `${(-size * 0.02).toFixed(1)}px` : '0px';
}
function reveal(g, s, x, y, size, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  const w = g.measureText(s).width + size * .12;
  g.save(); g.beginPath(); g.rect(x - 4, y - size * 1.05, w + 8, size * 1.32); g.clip();
  g.fillText(s, x, y + (1 - p) * size * 1.1 - q * size * 1.35);
  g.restore();
}

// ---------- grid ----------
function drawGrid(g, t) {
  const p = snap(t, .5, E8);
  if (p <= 0) return;
  g.strokeStyle = C.pgrid; g.lineWidth = 1; g.globalAlpha = .8 * p;
  for (let c = 0; c <= 12; c++) {
    const x = fx(c) - FG / 2;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  g.globalAlpha = 1;
}

// ---------- SCENE 1: hook + giant years counter ----------
function drawHook(g, t) {
  if (t < T.hook - .1) return;
  const L1 = lineById('l1');
  // red line grows, then the numeral
  if (t < T.years) {
    const p = snap(t, T.hook, E8);
    g.fillStyle = C.red;
    g.fillRect(fx(0), 700, (W - 2 * FM) * lin(t, T.hook, T.years - .4), 8);
    if (L1) { font(g, 600, 46); g.fillStyle = C.ink; reveal(g, L1.text.toUpperCase(), fx(0), 640, 46, p); }
  } else {
    // giant scroll counter 0 -> 4
    const p = snap(t, T.years, E8 * 1.4);
    const val = Math.min(4, 4 * snap(t, T.years, E8 * 2.5));
    font(g, 800, 520); g.fillStyle = C.red;
    const label = val.toFixed(1);
    if (p > 0.02) {
      g.fillText(label, fx(0), 980);
      font(g, 700, 88); g.fillStyle = C.ink;
      reveal(g, 'YEARS', fx(0), 1120, 88, snap(t, T.years + 1.4, E8));
      font(g, 500, 30); g.fillStyle = C.dim;
      reveal(g, 'OF YOUR LIFE, ON A SCREEN', fx(0), 1190, 30, snap(t, T.years + 1.9, E8));
      g.fillStyle = C.ink; g.fillRect(fx(0), 1240, (W - 2 * FM) * snap(t, T.years + 2.3, E8), 2);
    }
  }
}
// top caption
function drawCaption(g, t) {
  if (t < 1) return;
  font(g, 500, 22); g.fillStyle = C.dim;
  let left, right = '2026';
  if (t < T.apps0) left = 'SCREEN TIME / THE MATH';
  else if (t < T.twist) { const i = Math.min(5, Math.floor((t - T.apps0) / T.appIn)); left = `THEFT ${i + 1} / 6`; right = 'DAILY AVG'; }
  else if (t < T.fix) left = 'WHAT 4 YEARS BUYS';
  else left = 'THE FIX';
  g.fillText(left, fx(0), 70);
  g.fillText(right, W - FM - g.measureText(right).width, 70);
  g.fillStyle = C.ink; g.fillRect(fx(0), 88, 260, 2); g.fillRect(W - FM - 140, 88, 140, 2);
}
// ---------- SCENE 2: per-app steals ----------
function drawApps(g, t) {
  if (t < T.apps0 || t >= T.twist) return;
  const i = Math.min(Math.floor((t - T.apps0) / T.appIn), 5);
  const tin = T.apps0 + i * T.appIn;
  const p = snap(t, tin, E8);
  const [name, perday, years] = APPS[i];
  // giant app index
  font(g, 700, 260); g.fillStyle = C.pgrid;
  g.fillText(String(i + 1).padStart(2, '0'), fx(0), 640);
  // app name
  font(g, 800, 74); g.fillStyle = C.ink;
  reveal(g, name, fx(0), 830, 74, p);
  // red time bar + perday label
  font(g, 600, 56); g.fillStyle = C.red;
  reveal(g, perday, fx(0), 960, 56, snap(t, tin + .6, E8));
  const barFull = W - 2 * FM, barP = snap(t, tin + 1.0, E8 * 1.5);
  g.fillStyle = C.pgrid; g.fillRect(fx(0), 1030, barFull, 26);
  g.fillStyle = C.red; g.fillRect(fx(0), 1030, barFull * (.15 + .85 * barP / 6), 26);
  // years stolen per year of use
  font(g, 700, 44); g.fillStyle = C.amber;
  reveal(g, `= ${(years).toFixed(1)} YEARS / DECADE`, fx(0), 1160, 44, snap(t, tin + 1.5, E8));
  // progress cells
  for (let k = 0; k < 6; k++) {
    g.fillStyle = t >= T.apps0 + k * T.appIn ? C.red : C.pgrid;
    g.fillRect(fx(0) + k * 156, 1300, 136, 10);
  }
  font(g, 500, 20); g.fillStyle = C.dim;
  g.fillText(`APP ${i + 1} / 6`, fx(0), 1360);
}
// ---------- SCENE 3: twist — what 4 years buys ----------
function drawTwist(g, t) {
  if (t < T.twist || t >= T.fix) return;
  const items = [
    ['2,190', 'DAYS — GONE'],
    ['17,500', 'HOURS — GONE'],
    ['A DEGREE', 'PART-TIME, EARNED'],
    ['A SKILL', 'MASTERED TWICE OVER'],
  ];
  items.forEach((it, k) => {
    const tin = T.twist + .4 + k * 1.1;
    const p = snap(t, tin, E8);
    if (p <= 0) return;
    const y = 700 + (k % 2) * 300, x = k < 2 ? fx(0) : fx(7);
    const red = k < 2;
    font(g, 800, red ? 110 : 84); g.fillStyle = red ? C.red : C.green;
    g.fillText(it[0], x, y + 0);
    font(g, 600, 34); g.fillStyle = C.dim;
    reveal(g, it[1], x, y + 60, 34, snap(t, tin + .3, E8));
  });
}
// ---------- SCENE 4: fix ----------
function drawFix(g, t) {
  if (t < T.fix || t >= T.cta) return;
  const L = lineById('l8');
  const rows = ['01  GRAYSCALE AFTER 9 PM', '02  NO PHONE BEFORE COFFEE', '03  APPS ON A SECOND PAGE', '04  45 MIN RECLAIMED / DAY'];
  rows.forEach((r, k) => {
    const p = snap(t, T.fix + .4 + k * .8, E8);
    if (p <= 0) return;
    font(g, 600, 52); g.fillStyle = C.ink;
    reveal(g, r, fx(0), 760 + k * 130, 52, p);
    g.fillStyle = C.green; g.fillRect(fx(0), 760 + k * 130 + 26, 64 * p, 6);
  });
}
// ---------- SCENE 5: CTA ----------
function drawCTA(g, t) {
  if (t < T.cta) return;
  const p = snap(t, T.cta, E8);
  g.fillStyle = C.green;
  g.fillRect(fx(0), 800, (W - 2 * FM) * p, 170);
  font(g, 800, 84); g.fillStyle = '#0E0F12';
  reveal(g, 'COMMENT "PHONE"', fx(0) + 30, 908, 76, p);
  font(g, 500, 30); g.fillStyle = C.ink;
  reveal(g, 'the 10-app list + blocker guides, in your dms', fx(0), 1040, 30, snap(t, T.cta + .9, E8));
}

export function renderFilm(g, t, opts = {}) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  drawGrid(g, t);
  g.fillStyle = C.ink; g.fillRect(0, 0, W, 8); g.fillRect(0, H - 8, W, 8);
  g.fillRect(0, 0, 8, H); g.fillRect(W - 8, 0, 8, H);
  drawCaption(g, t);
  drawHook(g, t);
  drawApps(g, t);
  drawTwist(g, t);
  drawFix(g, t);
  drawCTA(g, t);
  // subtle progress rule at bottom
  const prog = clamp(t / DUR, 0, 1);
  g.fillStyle = C.red; g.fillRect(0, H - 14, W * prog, 6);
}
