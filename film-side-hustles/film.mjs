// language: js (ESM), target: lemo engine — "WHY 90% OF SIDE HUSTLES FAIL"
// portrait 1080x1920, dark noir + amber signal. Sane structure, beat-locked.
import { clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1080, H = 1920, DUR = 50;
export const C = {
  page: '#101014', ink: '#F4F2EC', dim: '#8E8C86', red: '#E23B2E', amber: '#F5A623', green: '#2FBF71', pgrid: '#212227',
};
const FM = 72, FG = 20, FC = 74;
export const fx = i => FM + i * (FC + FG);

export const T = { hook: 1.0, ninety: 2.6, kill0: 9.2, killIn: 4.7, fix: 36.6, cta: 45.0 };
const KILLS = [
  ['01', 'BUILT BEFORE SOLD', '6 months of code. 0 customers asked.'],
  ['02', 'NO DISTRIBUTION', 'A product nobody sees is a hobby.'],
  ['03', 'SHINY OBJECT', 'New idea monthly. None finished.'],
];

let WORDS = {}, LINES = [];
export function setScore(s) {}
export function setWords(w) { WORDS = w || {}; }
export function setLines(lines, dur) { LINES = lines.map(L => ({ ...L, dur: dur[L.id] })); }
export function buildEvents() {
  const ev = [{ t: T.hook, type: 'thump', gain: 1.0 }, { t: T.ninety, type: 'heartbeat', gain: .8 }];
  for (let i = 0; i < 3; i++) {
    ev.push({ t: T.kill0 + i * T.killIn, type: 'clack', gain: .7 });
    ev.push({ t: T.kill0 + i * T.killIn + 2.2, type: 'whoosh', gain: .5 });
  }
  ev.push({ t: T.fix, type: 'ding', gain: .8 });
  ev.push({ t: T.cta, type: 'thump', gain: .9 });
  return ev;
}
export const subs = () => LINES.map(L => ({ t0: L.t, t1: Math.min(L.t + (L.dur || 2) + 1.3, L.t + 4.8), text: L.text }));

const lineById = id => LINES.find(L => L.id === id);
function font(g, wt, sz, fam = 'Archivo') {
  g.font = `${wt} ${sz}px ${fam}`;
  g.letterSpacing = sz >= 90 ? `${(-sz * .02).toFixed(1)}px` : '0px';
}
function reveal(g, s, x, y, sz, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  const w = g.measureText(s).width + sz * .12;
  g.save(); g.beginPath(); g.rect(x - 4, y - sz * 1.05, w + 8, sz * 1.32); g.clip();
  g.fillText(s, x, y + (1 - p) * sz * 1.1 - q * sz * 1.35);
  g.restore();
}

function drawGrid(g, t) {
  const p = snap(t, .5, E8); if (p <= 0) return;
  g.strokeStyle = C.pgrid; g.lineWidth = 1; g.globalAlpha = .7 * p;
  for (let c = 0; c <= 12; c++) { const x = fx(c) - FG / 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.globalAlpha = 1;
}

// giant 90% numeral
function drawNinety(g, t) {
  if (t < T.hook || t > T.kill0 + .8) return;
  const p = snap(t, T.ninety, E8 * 1.5);
  const out = snap(t, T.kill0, E8);
  if (p <= .02) return;
  g.save(); g.globalAlpha = 1 - out;
  font(g, 800, 430); g.fillStyle = C.red;
  g.fillText('90%', fx(0), 900);
  font(g, 600, 44); g.fillStyle = C.ink;
  reveal(g, 'DIE IN 3 MONTHS', fx(0), 1010, 44, snap(t, T.ninety + .8, E8));
  font(g, 500, 26); g.fillStyle = C.dim;
  reveal(g, 'NOT THE IDEA — THE EXECUTION', fx(0), 1080, 26, snap(t, T.ninety + 1.4, E8));
  g.restore();
}

// 3 killers
function drawKills(g, t) {
  if (t < T.kill0 || t >= T.fix) return;
  const k = Math.min(Math.floor((t - T.kill0) / T.killIn), 2);
  const tin = T.kill0 + k * T.killIn;
  const [num, title, sub] = KILLS[k];
  const p = snap(t, tin, E8);
  // giant index
  font(g, 700, 280); g.fillStyle = C.pgrid;
  g.fillText(num, fx(0), 700);
  // red "KILLER" tag + title
  font(g, 700, 40); g.fillStyle = C.red;
  reveal(g, 'KILLER ' + num, fx(0), 850, 40, p);
  font(g, 800, 68); g.fillStyle = C.ink;
  reveal(g, title, fx(0), 950, 68, snap(t, tin + .4, E8));
  font(g, 400, 36); g.fillStyle = C.dim;
  reveal(g, sub, fx(0), 1040, 36, snap(t, tin + .8, E8));
  // bar drains: red segment shrinks as fix approaches
  const barP = 1 - ((t - T.kill0) / ((T.fix - T.kill0) * 1.05));
  g.fillStyle = C.pgrid; g.fillRect(fx(0), 1140, W - 2 * FM, 18);
  g.fillStyle = C.red; g.fillRect(fx(0), 1140, (W - 2 * FM) * clamp(barP, 0, 1), 18);
  font(g, 500, 20); g.fillStyle = C.dim;
  g.fillText(`KILLER ${k + 1} / 3`, fx(0), 1220);
}

// fix scene
function drawFix(g, t) {
  if (t < T.fix || t >= T.cta) return;
  const L9 = lineById('l9'), L10 = lineById('l10');
  if (L9) {
    font(g, 800, 90); g.fillStyle = C.green;
    reveal(g, 'SELL FIRST.', fx(0), 800, 90, snap(t, T.fix + .2, E8));
    reveal(g, 'BUILD SECOND.', fx(0), 910, 90, snap(t, T.fix + .7, E8));
  }
  if (L10) {
    font(g, 500, 40); g.fillStyle = C.ink;
    reveal(g, L10.text.toUpperCase(), fx(0), 1040, 40, snap(t, L10.t, E8));
    // green bar
    g.fillStyle = C.green; g.fillRect(fx(0), 1080, (W - 2 * FM) * snap(t, T.fix + 1.5, E8), 12);
  }
}

// CTA
function drawCTA(g, t) {
  if (t < T.cta) return;
  const p = snap(t, T.cta, E8);
  g.fillStyle = C.amber;
  g.fillRect(fx(0), 800, (W - 2 * FM) * p, 170);
  font(g, 800, 80); g.fillStyle = '#101014';
  reveal(g, 'COMMENT "GRIND"', fx(0) + 30, 900, 72, p);
  font(g, 500, 28); g.fillStyle = C.ink;
  reveal(g, 'full framework, free, in your dms', fx(0), 1030, 28, snap(t, T.cta + .8, E8));
}

function drawCaption(g, t) {
  if (t < .8) return;
  font(g, 500, 22); g.fillStyle = C.dim;
  let left = 'SIDE HUSTLES / WHY THEY DIE';
  let right = '2026';
  let mid = '';
  if (t >= T.kill0 && t < T.fix) { const k = Math.min(2, Math.floor((t - T.kill0) / T.killIn)); left = 'THE 3 KILLERS'; mid = `${k + 1}/3`; }
  if (t >= T.fix && t < T.cta) left = 'THE FIX';
  if (t >= T.cta) left = 'GET THE FRAMEWORK';
  g.fillText(left, fx(0), 70);
  if (mid) { font(g, 700, 22); g.fillStyle = C.red; g.fillText(mid, W / 2 - 20, 70); }
  g.fillText(right, W - FM - g.measureText(right).width, 70);
  g.fillStyle = C.ink; g.fillRect(fx(0), 90, 240, 2);
  const prog = clamp(t / DUR, 0, 1);
  g.fillStyle = C.amber; g.fillRect(0, H - 14, W * prog, 6);
}

export function renderFilm(g, t, opts = {}) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  drawGrid(g, t);
  g.fillStyle = C.ink; g.fillRect(0, 0, W, 8); g.fillRect(0, H - 8, W, 8);
  g.fillRect(0, 0, 8, H); g.fillRect(W - 8, 0, 8, H);
  drawCaption(g, t);
  drawNinety(g, t);
  drawKills(g, t);
  drawFix(g, t);
  drawCTA(g, t);
}
