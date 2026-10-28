// language: js (ESM), target: lemo engine — "AI AGENTS: HYPE VS REALITY"
// portrait 1080x1920. Noir + acid-green. Claim -> Reality pairs, then WHAT WORKS.
import { clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1080, H = 1920, DUR = 56;
export const C = {
  page: '#0B0B0D', ink: '#F2F0EA', dim: '#7C7A76', hot: '#FF3B30', acid: '#B7FF2E',
  hype: '#FF3B30', real: '#FFFFFF', grid: '#1A1B1E', mute: '#2A2C30',
};
const FM = 72, FG = 20, FC = 74;
export const fx = i => FM + i * (FC + FG);

// section clock
export const T = {
  hook: 1.0, claim0: 10.2, pairIn: 4.8, work: 40.6, cta: 50.4,
};
const PAIRS = [
  { n: '01', claim: 'DOES YOUR WHOLE JOB', real: 'INVENTS STEP NINE', sub: 'forgets two, sounds sure' },
  { n: '02', claim: 'RUNS YOUR BUSINESS', real: 'BURNS $40 LOOPING', sub: 'six hours, zero output' },
  { n: '03', claim: 'REPLACES YOUR TEAM', real: 'STILL NEEDS A HUMAN', sub: 'to press the send button' },
];

let WORDS = {}, LINES = [];
export function setScore(s) {}
export function setWords(w) { WORDS = w || {}; }
export function setLines(lines, dur) { LINES = lines.map(L => ({ ...L, dur: dur[L.id] })); }

export function buildEvents() {
  const ev = [
    { t: T.hook, type: 'thump', gain: 1.0 },
    { t: 5.8, type: 'heartbeat', gain: .75 },
  ];
  for (let i = 0; i < 3; i++) {
    ev.push({ t: T.claim0 + i * T.pairIn, type: 'clack', gain: .8 });
    ev.push({ t: T.claim0 + i * T.pairIn + 2.1, type: 'whoosh', gain: .55 });
  }
  ev.push({ t: T.work, type: 'ding', gain: .85 });
  ev.push({ t: T.cta, type: 'thump', gain: .95 });
  return ev;
}

export const subs = () => LINES.map(L => ({ t0: L.t, t1: Math.min(L.t + (L.dur || 2) + 1.3, L.t + 5.2), text: L.text }));

const lineById = id => LINES.find(L => L.id === id);

function font(g, wt, sz, fam = 'Archivo') {
  g.font = `${wt} ${sz}px ${fam}`;
  g.letterSpacing = sz >= 90 ? `${(-sz * .025).toFixed(1)}px` : '0px';
}
// shrink size until the string fits maxW — prevents right-edge clipping
function fitFont(g, wt, sz, s, maxW, fam = 'Archivo') {
  let cur = sz;
  font(g, wt, cur, fam);
  while (g.measureText(s).width > maxW && cur > 28) {
    cur -= 2;
    font(g, wt, cur, fam);
  }
  return cur;
}
function reveal(g, s, x, y, sz, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  const w = g.measureText(s).width + sz * .14;
  g.save(); g.beginPath(); g.rect(x - 4, y - sz * 1.06, w + 8, sz * 1.34); g.clip();
  g.fillText(s, x, y + (1 - p) * sz * 1.12 - q * sz * 1.38);
  g.restore();
}

// ---------- background: slow scan grid + vignette drift ----------
function drawGrid(g, t) {
  const p = snap(t, .4, E8 * 1.5); if (p <= 0) return;
  g.strokeStyle = C.grid; g.lineWidth = 1; g.globalAlpha = .75 * p;
  for (let c = 0; c <= 12; c++) { const x = fx(c) - FG / 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  // horizontal beat lines drifting down — adds motion without noise
  const drift = (t * 26) % 120;
  g.globalAlpha = .32 * p; g.strokeStyle = C.mute;
  for (let y = -120 + drift; y < H; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.globalAlpha = 1;
}

// ---------- HOOK: giant "AGENT" wordmark, letters slam in ----------
function drawHook(g, t) {
  if (t < .6 || t > T.claim0 + .5) return;
  const out = snap(t, T.claim0, E8);
  if (out >= 1) return;
  const words = ['AI', 'AGENTS'];
  let y = 700;
  g.save(); g.globalAlpha = 1 - out;
  words.forEach((w, wi) => {
    const p = snap(t, 1.0 + wi * .35, E8 * 1.2);
    if (p <= 0) return;
    font(g, 900, 210);
    const tw = g.measureText(w).width;
    const x = (W - tw) / 2;
    g.fillStyle = wi === 0 ? C.dim : C.ink;
    // horizontal squeeze-in
    g.save();
    g.translate(W / 2, y);
    g.scale(lerp(.6, 1, p), lerp(1.25, 1, p));
    g.globalAlpha = (1 - out) * p;
    g.fillText(w, -tw / 2, 0);
    g.restore();
    y += 230;
  });
  // stamp
  const sp = snap(t, 5.8, E8 * 1.1);
  if (sp > 0) {
    g.save();
    g.translate(fx(0) + 4, 1180);
    g.rotate(lerp(-.06, 0, sp));
    g.globalAlpha = (1 - out) * sp;
    g.fillStyle = C.hot;
    const txt = 'ALMOST NONE WORK';
    font(g, 800, 56);
    const bw = g.measureText(txt).width + 60;
    g.fillRect(0, -62, bw, 96);
    g.fillStyle = '#0B0B0D';
    g.fillText(txt, 30, 6);
    g.restore();
  }
  g.restore();
}

// ---------- PAIRS: claim (red, struck) -> reality (white, slams) ----------
function drawPairs(g, t) {
  if (t < T.claim0 || t >= T.work) return;
  const idx = Math.min(2, Math.floor((t - T.claim0 - .001) / T.pairIn));
  const P = PAIRS[Math.max(0, idx)];
  const tin = T.claim0 + idx * T.pairIn;

  // giant index watermark
  font(g, 900, 320);
  g.fillStyle = C.grid;
  g.globalAlpha = .95;
  g.fillText(P.n, fx(0) - 6, 560);
  g.globalAlpha = 1;

  // section label
  font(g, 700, 26); g.fillStyle = C.dim;
  reveal(g, 'CLAIM VS REALITY', fx(0), 620, 26, snap(t, T.claim0, E8));

  // CLAIM line — red, with strike-through sweeping across
  const pc = snap(t, tin, E8);
  const MAXW = W - 2 * FM;
  font(g, 700, 46); g.fillStyle = C.hype;
  if (pc > 0) {
    reveal(g, 'CLAIM ' + P.n, fx(0), 720, 46, pc);
    const qs = '"' + P.claim + '"';
    const csz = fitFont(g, 800, 76, qs, MAXW);
    g.fillStyle = C.hype;
    const cw = g.measureText(qs).width;
    reveal(g, qs, fx(0), 830, csz, snap(t, tin + .25, E8));
    // strike sweep
    const sk = snap(t, tin + 1.5, E8 * 1.4);
    if (sk > 0) {
      g.fillStyle = C.hot;
      g.fillRect(fx(0) - 6, 830 - csz * .3, Math.min(cw + 24, MAXW + 12) * sk, 10);
    }
  }

  // REALITY block — slams down, offset card
  const pr = snap(t, tin + 2.1, E8 * 1.2);
  if (pr > 0) {
    g.save();
    g.globalAlpha = pr;
    const cy = 930 + (1 - pr) * 40;
    g.fillStyle = C.acid;
    g.fillRect(fx(0), cy, W - 2 * FM, 8);
    font(g, 800, 34); g.fillStyle = C.acid;
    g.fillText('REALITY', fx(0), cy + 62);
    const rsz = fitFont(g, 900, 88, P.real, W - 2 * FM);
    g.fillStyle = C.real;
    reveal(g, P.real, fx(0), cy + 180, rsz, snap(t, tin + 2.25, E8 * 1.1));
    font(g, 400, 34); g.fillStyle = C.dim;
    reveal(g, P.sub, fx(0), cy + 250, 34, snap(t, tin + 2.7, E8));
    g.restore();
  }

  // progress ticks
  for (let i = 0; i < 3; i++) {
    const done = i <= idx;
    const w = (W - 2 * FM - 40) / 3;
    g.fillStyle = done ? C.acid : C.mute;
    g.fillRect(fx(0) + i * (w + 20), 1330, w, 6);
  }
  font(g, 500, 20); g.fillStyle = C.dim;
  g.fillText(`${idx + 1} / 3`, fx(0), 1390);
}

// ---------- WHAT WORKS: three rules, acid ----------
function drawWorks(g, t) {
  if (t < T.work || t >= T.cta) return;
  const rules = [
    ['ONE NARROW TASK', .0],
    ['HARD BOUNDARIES', .55],
    ['HUMAN CHECK', 1.1],
  ];
  font(g, 900, 130); g.fillStyle = C.acid;
  const wsz = fitFont(g, 900, 130, 'WHAT WORKS.', W - 2 * FM);
  reveal(g, 'WHAT WORKS.', fx(0), 620, wsz, snap(t, T.work + .1, E8 * 1.2));

  rules.forEach(([txt, d], i) => {
    const p = snap(t, T.work + .9 + d, E8 * 1.1);
    if (p <= 0) return;
    const y = 800 + i * 150;
    g.save(); g.globalAlpha = p;
    font(g, 800, 34); g.fillStyle = C.acid;
    g.fillText('0' + (i + 1), fx(0), y);
    const rsz = fitFont(g, 700, 62, txt, W - 2 * FM - 100);
    g.fillStyle = C.ink;
    reveal(g, txt, fx(0) + 100, y, rsz, p);
    g.fillStyle = C.mute;
    g.fillRect(fx(0), y + 36, (W - 2 * FM) * p, 3);
    g.restore();
  });

  // bottom line
  const bsz = fitFont(g, 600, 40, 'BORING SCOPE WINS.', W - 2 * FM);
  g.fillStyle = C.acid;
  reveal(g, 'BORING SCOPE WINS.', fx(0), 1360, bsz, snap(t, T.work + 3.4, E8));
}

// ---------- CTA ----------
function drawCTA(g, t) {
  if (t < T.cta) return;
  const p = snap(t, T.cta, E8 * 1.1);
  g.save(); g.globalAlpha = p;
  g.fillStyle = C.acid;
  const h = 190 * p;
  g.fillRect(fx(0), 760, W - 2 * FM, h);
  g.restore();
  if (p > .5) {
    g.save();
    const csz = fitFont(g, 900, 84, 'COMMENT "AGENT"', W - 2 * FM - 68);
    g.fillStyle = '#0B0B0D';
    reveal(g, 'COMMENT "AGENT"', fx(0) + 34, 890, csz, p);
    g.restore();
  }
  font(g, 500, 32); g.fillStyle = C.ink;
  reveal(g, 'the checklist that actually ships', fx(0), 1030, 32, snap(t, T.cta + 1.0, E8));
}

// ---------- persistent chrome ----------
function drawCaption(g, t) {
  if (t < .8) return;
  font(g, 500, 21); g.fillStyle = C.dim;
  let left = 'AI AGENTS / HYPE VS REALITY';
  let mid = '';
  if (t >= T.claim0 && t < T.work) { const k = Math.min(2, Math.floor((t - T.claim0) / T.pairIn)); left = 'CLAIM VS REALITY'; mid = `${k + 1}/3`; }
  if (t >= T.work && t < T.cta) left = 'WHAT ACTUALLY WORKS';
  if (t >= T.cta) left = 'GET THE CHECKLIST';
  g.fillText(left, fx(0), 70);
  if (mid) { font(g, 800, 21); g.fillStyle = C.hot; g.fillText(mid, W / 2 - 18, 70); }
  const right = '2026';
  g.fillStyle = C.dim;
  font(g, 500, 21);
  g.fillText(right, W - FM - g.measureText(right).width, 70);
  g.fillStyle = C.acid; g.fillRect(fx(0), 88, 210, 2);
  const prog = clamp(t / DUR, 0, 1);
  g.fillStyle = C.mute; g.fillRect(0, H - 12, W, 5);
  g.fillStyle = C.acid; g.fillRect(0, H - 12, W * prog, 5);
}

export function renderFilm(g, t, opts = {}) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = C.page; g.fillRect(0, 0, W, H);
  drawGrid(g, t);
  g.fillStyle = C.ink;
  g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6);
  g.fillRect(0, 0, 6, H); g.fillRect(W - 6, 0, 6, H);
  drawCaption(g, t);
  drawHook(g, t);
  drawPairs(g, t);
  drawWorks(g, t);
  drawCTA(g, t);
}
