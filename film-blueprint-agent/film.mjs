// language: js (ESM), target: lemo engine — "THE AUTONOMOUS AGENT / PATENT 2026-4471"
// Blueprint world: prussian blue sheet, white line-work, monospace type, FIG. plates, callouts, title block.
// Every element is drawn with canvas paths — no images. Drafting-table aesthetic.
import { clamp, lerp, seg, E, snap, lin, steps, track, E8, E16, BEAT, BAR } from './ease.js';

export const W = 1080, H = 1920, DUR = 60;
export const C = {
  sheet: '#0B2A4A',      // prussian blue paper
  sheetDeep: '#082138',  // vignette
  ink: '#E8F1FA',        // white line-work
  inkDim: '#7FA8C9',     // faded ink
  grid: '#16456F',       // drafting grid
  gridFine: '#123A5E',
  stamp: '#D8342B',      // red stamp
  yellow: '#F2C53D',     // aged-paper accent / highlight
};
const M = 64;                      // sheet margin
const CW = W - 2 * M;              // content width
const TB_H = 190;                  // title block height
const TB_Y = H - M - TB_H;
const BAR_Y = H - TB_H - M;        // divider above title block

// ---------- timeline ----------
export const T = {
  sheet: .3,       // sheet + grid appears
  title: 1.2,      // "THE AUTONOMOUS AGENT" written
  app: 6.4,        // application number stamps in
  fig1: 12.0,      // exploded view draws
  fig2: 18.4,      // plan/act/forget cycle
  fig3: 24.4,      // autonomy meter
  exam: 30.6,      // examiner's note
  rej: 42.4,       // REJECTED stamp
  fix: 48.6,       // second filing, narrow scope
  cta: 54.4,
};
const FIGS = [
  { key: 'fig1', t: T.fig1, label: 'FIG. 1', caption: 'EXPLODED VIEW — THE AGENT' },
  { key: 'fig2', t: T.fig2, label: 'FIG. 2', caption: 'PLAN / ACT / FORGET CYCLE' },
  { key: 'fig3', t: T.fig3, label: 'FIG. 3', caption: 'AUTONOMY UNDER LOAD' },
];

let WORDS = {}, LINES = [];
export function setScore(s) {}
export function setWords(w) { WORDS = w || {}; }
export function setLines(lines, dur) { LINES = lines.map(L => ({ ...L, dur: dur[L.id] })); }

export function buildEvents() {
  const ev = [
    { t: T.sheet, type: 'whoosh', gain: .5 },
    { t: T.title, type: 'clack', gain: .6 },
    { t: T.app, type: 'clack', gain: .7 },
  ];
  FIGS.forEach(f => { ev.push({ t: f.t, type: 'clack', gain: .8 }); ev.push({ t: f.t + .55, type: 'whoosh', gain: .35 }); });
  ev.push({ t: T.exam, type: 'heartbeat', gain: .8 });
  ev.push({ t: T.rej, type: 'thump', gain: 1.0 });
  ev.push({ t: T.fix, type: 'ding', gain: .8 });
  ev.push({ t: T.cta, type: 'thump', gain: .9 });
  return ev;
}
export const subs = () => LINES.map(L => ({ t0: L.t, t1: Math.min(L.t + (L.dur || 2) + 1.3, L.t + 5.4), text: L.text }));

// ---------- typography helpers ----------
const MONO = 'Courier New';
function mono(g, sz, wt = '700') {
  g.font = `${wt} ${sz}px "${MONO}", monospace`;
  g.letterSpacing = '0px';
}
function fitMono(g, sz, s, maxW, wt = '700') {
  let cur = sz; mono(g, cur, wt);
  while (g.measureText(s).width > maxW && cur > 14) { cur -= 1; mono(g, cur, wt); }
  return cur;
}
// handwriting-ish write-on reveal: clip left to right
function write(g, s, x, y, p, sz) {
  if (p <= 0) return;
  const w = g.measureText(s).width;
  g.save();
  g.beginPath(); g.rect(x - 2, y - sz * 1.2, (w + 4) * p, sz * 1.7); g.clip();
  g.fillText(s, x, y);
  g.restore();
}

// ---------- sheet furniture ----------
function drawSheet(g, t) {
  const p = snap(t, T.sheet, E8 * 1.5);
  if (p <= 0) return;
  g.fillStyle = C.sheet; g.fillRect(0, 0, W, H);
  // vignette — sheet edges darker, like photographed paper
  const vg = g.createRadialGradient(W / 2, H / 2, H * .18, W / 2, H / 2, H * .72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);

  // drafting grid grows out of centre
  g.save();
  g.globalAlpha = .9 * p;
  const gp = clamp((t - T.sheet) / .9, 0, 1);
  const step = 60;
  g.strokeStyle = C.gridFine; g.lineWidth = 1;
  const reach = gp * (H / 2 + 200);
  for (let x = M; x <= W - M; x += step) {
    const y0 = H / 2 - reach, y1 = H / 2 + reach;
    g.beginPath(); g.moveTo(x, Math.max(0, y0)); g.lineTo(x, Math.min(H, y1)); g.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    const x0 = W / 2 - reach, x1 = W / 2 + reach;
    g.beginPath(); g.moveTo(Math.max(0, x0), y); g.lineTo(Math.min(W, x1), y); g.stroke();
  }
  g.restore();

  // draw-on border, four sides sweeping in
  const bp = snap(t, T.sheet + .2, E8 * 2.2);
  g.save();
  g.strokeStyle = C.ink; g.lineWidth = 3; g.globalAlpha = .95;
  const seg4 = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const bx0 = M, by0 = M, bx1 = W - M, by1 = H - M;
  seg4(bx0, by0, lerp(bx0, bx1, bp), by0);
  seg4(bx1, by0, bx1, lerp(by0, by1, bp));
  seg4(bx1, by1, lerp(bx1, bx0, bp), by1);
  seg4(bx0, by1, bx0, lerp(by1, by0, bp));
  // inner hairline offset border
  g.lineWidth = 1; g.strokeStyle = C.inkDim; g.globalAlpha = .55 * bp;
  g.strokeRect(M + 14, M + 14, CW - 28, H - 2 * M - 28);
  // corner registration ticks
  g.globalAlpha = .8 * bp; g.strokeStyle = C.ink; g.lineWidth = 2;
  [[M, M, 1, 1], [W - M, M, -1, 1], [M, H - M, 1, -1], [W - M, H - M, -1, -1]].forEach(([x, y, dx, dy]) => {
    g.beginPath(); g.moveTo(x + dx * 26, y); g.lineTo(x, y); g.lineTo(x, y + dy * 26); g.stroke();
  });
  g.restore();
}

// ---------- title block (always present, values fill in) ----------
function drawTitleBlock(g, t) {
  if (t < T.sheet + .4) return;
  const p = snap(t, T.sheet + .4, E8 * 1.6);
  g.save(); g.globalAlpha = p;
  // frame
  g.strokeStyle = C.ink; g.lineWidth = 2;
  g.beginPath(); g.rect(M + 14, TB_Y, CW - 28, TB_H); g.stroke();
  // internal divisions
  g.beginPath();
  g.moveTo(M + 14, TB_Y + 96); g.lineTo(W - M - 14, TB_Y + 96);
  g.moveTo(M + 14 + (CW - 28) * .56, TB_Y + 96); g.lineTo(M + 14 + (CW - 28) * .56, TB_Y + TB_H);
  g.moveTo(M + 14 + (CW - 28) * .78, TB_Y + 96); g.lineTo(M + 14 + (CW - 28) * .78, TB_Y + TB_H);
  g.lineWidth = 1; g.strokeStyle = C.inkDim; g.stroke();

  // TITLE cell
  const tw = fitMono(g, 34, 'THE AUTONOMOUS AGENT', CW - 60);
  mono(g, tw); g.fillStyle = C.ink;
  write(g, 'THE AUTONOMOUS AGENT', M + 32, TB_Y + 60, snap(t, T.title, E8 * 2), tw);
  mono(g, 17); g.fillStyle = C.inkDim;
  g.fillText('A MACHINE FOR DOING THE WHOLE JOB', M + 32, TB_Y + 82);

  // bottom row cells
  mono(g, 15); g.fillStyle = C.inkDim;
  g.fillText('INVENTOR', M + 32, TB_Y + 122);
  mono(g, 20); g.fillStyle = C.ink;
  g.fillText('C. WRENFIELD', M + 32, TB_Y + 150);

  const c2 = M + 14 + (CW - 28) * .56 + 14;
  mono(g, 15); g.fillStyle = C.inkDim;
  g.fillText('APPLICATION', c2, TB_Y + 122);
  mono(g, 17); g.fillStyle = C.ink;
  write(g, '2026/4471', c2, TB_Y + 150, snap(t, T.app, E8 * 1.4), 17);

  const c3 = M + 14 + (CW - 28) * .78 + 14;
  mono(g, 15); g.fillStyle = C.inkDim;
  g.fillText('SHEET', c3, TB_Y + 122);
  mono(g, 17); g.fillStyle = C.ink;
  g.fillText('1 OF 1', c3, TB_Y + 150);

  // status strip on the very bottom-right
  const st = t >= T.rej ? 'REJECTED' : (t >= T.fix ? 'REJECTED' : 'PENDING');
  mono(g, 14); g.fillStyle = C.inkDim;
  g.fillText('STATUS', c3, TB_Y + 176);
  mono(g, 16, '700');
  g.fillStyle = st === 'REJECTED' && t >= T.rej ? C.stamp : C.ink;
  g.fillText(st, c3, TB_Y + 176 + 0); // drawn together to keep cell tight
  g.restore();
}

// ---------- header row above drawing area ----------
function drawHead(g, t) {
  if (t < T.app) return;
  const p = snap(t, T.app, E8);
  g.save(); g.globalAlpha = p;
  mono(g, 16); g.fillStyle = C.inkDim;
  g.fillText('U.S. PATENT APPLICATION — INTELLIGENT AGENT CLASS', M + 16, M + 46);
  mono(g, 16); g.fillStyle = C.yellow;
  g.fillText('DRAFT', W - M - 16 - g.measureText('DRAFT').width, M + 46);
  g.strokeStyle = C.inkDim; g.lineWidth = 1;
  g.beginPath(); g.moveTo(M + 16, M + 62); g.lineTo(W - M - 16, M + 62); g.stroke();
  g.restore();
}

// ---------- FIG 1: exploded machine ----------
function drawFig1(g, t) {
  if (t < T.fig1 || t >= T.fig2) return;
  const p = snap(t, T.fig1, E8 * 1.6);
  const out = snap(t, T.fig2 - .1, E8);
  g.save(); g.globalAlpha = (1 - out) * p;
  const cx = W / 2, baseY = BAR_Y - 60;   // sit just above the FIG label strip

  // ---- main tower (draw-on, line by line) ----
  const L = (x0, y0, x1, y1, w = 2) => { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  g.strokeStyle = C.ink;
  const dp = snap(t, T.fig1 + .1, E8 * 2.0);

  // base plate
  L(cx - 150, baseY, cx + 150, baseY, 3);
  L(cx - 150, baseY, cx - 150, baseY - 60, 2);
  L(cx + 150, baseY, cx + 150, baseY - 60, 2);
  L(cx - 150, baseY - 60, cx + 150, baseY - 60, 2);
  // wheels
  [-100, 0, 100].forEach(wx => {
    g.beginPath(); g.arc(cx + wx, baseY + 26, 24, 0, Math.PI * 2 * dp); g.stroke();
  });
  // lattice tower
  const tw = 54;
  const topY = baseY - 700;               // stretch the mast to fill the sheet
  L(cx - tw, baseY - 60, cx - tw, topY, 2.5);
  L(cx + tw, baseY - 60, cx + tw, topY, 2.5);
  for (let y = baseY - 100; y > topY; y -= 70) {
    const adv = (baseY - 100 - y) / (baseY - 100 - topY);
    const lx = cx - tw + adv * 6, rx = cx + tw - adv * 6;
    if (adv < dp * 1.05) { L(lx, y, rx, y - 40, 1.2); L(rx, y, lx, y - 40, 1.2); }
  }
  // boom arm
  const boomEnd = { x: cx + 330, y: topY - 70 };
  if (dp > .5) {
    L(cx, topY, boomEnd.x, boomEnd.y, 3);
    L(cx, topY, cx + 120, topY + 40, 1.5);
    // funnel net
    g.lineWidth = 2; g.strokeStyle = C.ink;
    g.beginPath();
    g.moveTo(boomEnd.x - 54, boomEnd.y); g.lineTo(boomEnd.x - 24, boomEnd.y + 108);
    g.lineTo(boomEnd.x + 24, boomEnd.y + 108); g.lineTo(boomEnd.x + 54, boomEnd.y);
    g.stroke();
    // net cross-hatch
    g.lineWidth = 1; g.strokeStyle = C.inkDim;
    for (let i = -4; i <= 4; i++) {
      g.beginPath(); g.moveTo(boomEnd.x + i * 13, boomEnd.y + 6); g.lineTo(boomEnd.x + i * 6, boomEnd.y + 104); g.stroke();
    }
    // a small cloud drifting into the net
    const cp = snap(t, T.fig1 + 1.5, E8 * 1.6);
    if (cp > 0) {
      g.save(); g.globalAlpha = (1 - out) * cp; g.strokeStyle = C.yellow; g.lineWidth = 2.5;
      // drifts right, settling into the mouth of the net
      const clx = boomEnd.x - 210 + 92 * cp, cly = boomEnd.y + 34;
      g.beginPath();
      g.arc(clx, cly, 26, Math.PI * .12, Math.PI * 1.62, true);
      g.arc(clx + 32, cly - 13, 22, Math.PI * 1.12, Math.PI * .30, true);
      g.arc(clx + 66, cly + 1, 24, Math.PI * 1.18, Math.PI * .34, true);
      g.stroke();
      // puffs
      g.lineWidth = 1.4;
      g.beginPath(); g.arc(clx + 18, cly + 16, 9, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(clx + 48, cly + 18, 11, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    // flag
    L(cx, topY, cx, topY - 46, 1.5);
    g.beginPath(); g.moveTo(cx, topY - 46); g.lineTo(cx + 34, topY - 34); g.lineTo(cx, topY - 22); g.stroke();
  }
  // gear on base
  const gx = cx - 190, gy = baseY - 30;
  if (dp > .35) {
    g.beginPath(); g.arc(gx, gy, 30, 0, Math.PI * 2 * dp); g.stroke();
    g.beginPath(); g.arc(gx, gy, 10, 0, Math.PI * 2 * dp); g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + (1 - dp) * 2;
      g.beginPath();
      g.moveTo(gx + Math.cos(a) * 30, gy + Math.sin(a) * 30);
      g.lineTo(gx + Math.cos(a) * 40, gy + Math.sin(a) * 40);
      g.stroke();
    }
  }
  // exploded parts floating right
  const partP = snap(t, T.fig1 + .8, E8 * 1.4);
  if (partP > 0) {
    g.save(); g.globalAlpha = (1 - out) * partP;
    const px = cx + 190;
    g.strokeStyle = C.ink; g.lineWidth = 2;
    // bellows
    g.beginPath(); g.rect(px, baseY - 300, 70, 54); g.stroke();
    for (let i = 1; i < 5; i++) L(px, baseY - 300 + i * 11, px + 70, baseY - 300 + i * 11, 1);
    // crank
    g.beginPath(); g.arc(px + 36, baseY - 200, 22, 0, Math.PI * 2); g.stroke();
    L(px + 36, baseY - 200, px + 36, baseY - 250, 2);
    // dashed leader lines to the parts
    g.setLineDash([6, 6]); g.lineWidth = 1; g.strokeStyle = C.inkDim;
    L(cx + 60, baseY - 270, px - 14, baseY - 272, 1);
    L(cx + 150, baseY - 60, px - 14, baseY - 172, 1);
    g.setLineDash([]);
    // callout letters
    mono(g, 20); g.fillStyle = C.yellow;
    g.fillText('A', px + 82, baseY - 268);
    g.fillStyle = C.ink;
    g.fillText('B', px + 82, baseY - 194);
    g.restore();
  }
  // FIG label + caption
  mono(g, 22); g.fillStyle = C.ink;
  g.fillText('FIG. 1', M + 40, BAR_Y - 250);
  mono(g, 14); g.fillStyle = C.inkDim;
  g.fillText('EXPLODED VIEW', M + 40, BAR_Y - 226);
  g.restore();
}

// ---------- FIG 2: plan / act / forget cycle ----------
function drawFig2(g, t) {
  if (t < T.fig2 || t >= T.fig3) return;
  const p = snap(t, T.fig2, E8 * 1.4);
  const out = snap(t, T.fig3 - .1, E8);
  g.save(); g.globalAlpha = (1 - out) * p;
  const cx = W / 2, cy = BAR_Y - 330;
  const R = 200;

  g.strokeStyle = C.ink; g.lineWidth = 2;
  // circle with arrowhead — the loop
  const arcP = snap(t, T.fig2 + .1, E8 * 2.2);
  g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * arcP); g.stroke();
  // arrowhead
  if (arcP > .97) {
    g.beginPath();
    g.moveTo(cx + R - 4, cy - 26); g.lineTo(cx + R + 16, cy - 6); g.lineTo(cx + R - 22, cy + 6);
    g.closePath(); g.fillStyle = C.ink; g.fill();
  }
  // three nodes
  const nodes = [
    { a: -Math.PI / 2, label: 'PLAN', sub: 'THINKS', out: -1 },
    { a: -Math.PI / 2 + (2 * Math.PI / 3), label: 'ACT', sub: 'ACTS', out: 1 },
    { a: -Math.PI / 2 + (4 * Math.PI / 3), label: 'FORGET', sub: 'LOSES IT', out: 1 },
  ];
  nodes.forEach((n, i) => {
    const np = snap(t, T.fig2 + .9 + i * .55, E8 * 1.1);
    if (np <= 0) return;
    const x = cx + Math.cos(n.a) * R, y = cy + Math.sin(n.a) * R;
    g.save(); g.globalAlpha = (1 - out) * np;
    g.fillStyle = C.sheet; g.beginPath(); g.arc(x, y, 62, 0, Math.PI * 2); g.fill();
    g.strokeStyle = i === 2 ? C.stamp : C.ink; g.lineWidth = 2.5;
    g.beginPath(); g.arc(x, y, 62, 0, Math.PI * 2); g.stroke();
    mono(g, 18); g.fillStyle = i === 2 ? C.stamp : C.ink;
    const tw = g.measureText(n.label).width;
    g.fillText(n.label, x - tw / 2, y + 6);
    // sub caption pushed OUTWARD, away from the loop, so it never sits on an arrow
    mono(g, 12); g.fillStyle = C.inkDim;
    const sw = g.measureText(n.sub).width;
    g.fillText(n.sub, x - sw / 2, y + n.out * 92);
    g.restore();
  });
  // centre annotation
  const cp = snap(t, T.fig2 + 2.4, E8);
  if (cp > 0) {
    mono(g, 14); g.fillStyle = C.inkDim;
    const a = 'LOOPS UNTIL CONTEXT ENDS';
    const aw = g.measureText(a).width;
    g.fillText(a, cx - aw / 2, cy - 6);
    mono(g, 13); g.fillStyle = C.stamp;
    const b = 'NEVER REACHES STEP NINE';
    const bw = g.measureText(b).width;
    g.fillText(b, cx - bw / 2, cy + 18);
  }

  mono(g, 22); g.fillStyle = C.ink;
  g.fillText('FIG. 2', M + 40, BAR_Y - 250);
  mono(g, 14); g.fillStyle = C.inkDim;
  g.fillText('PLAN / ACT / FORGET CYCLE', M + 40, BAR_Y - 226);
  g.restore();
}

// ---------- FIG 3: autonomy under load (chart) ----------
function drawFig3(g, t) {
  if (t < T.fig3 || t >= T.exam) return;
  const p = snap(t, T.fig3, E8 * 1.4);
  const out = snap(t, T.exam - .1, E8);
  g.save(); g.globalAlpha = (1 - out) * p;

  const x0 = M + 110, y0 = BAR_Y - 140, x1 = W - M - 90, y1 = BAR_Y - 560;
  // axes
  g.strokeStyle = C.ink; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x1, y1); g.stroke();
  // axis labels
  mono(g, 14); g.fillStyle = C.inkDim;
  g.fillText('OUTPUT', M + 20, y1 + 6);
  g.save(); g.translate(x0 - 22, y0); g.rotate(-Math.PI / 2);
  mono(g, 14); g.fillStyle = C.inkDim;
  g.fillText('HOURS OF AUTONOMY', 0, 0);
  g.restore();

  // ticks
  mono(g, 12); g.fillStyle = C.inkDim;
  for (let i = 0; i <= 6; i++) {
    const y = y0 - (y0 - y1) * (i / 6);
    g.strokeStyle = C.grid; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.fillStyle = C.inkDim;
    g.fillText(String(i), x0 - 22, y + 4);
  }

  // the flat line: cost rises, output stays at zero
  const lp = snap(t, T.fig3 + .5, E8 * 2.6);
  g.strokeStyle = C.yellow; g.lineWidth = 3;
  g.beginPath();
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const f = (i / N) * lp;
    const x = x0 + (x1 - x0) * f;
    const jitter = Math.sin(i * 1.9) * 5 + Math.sin(i * .7) * 3;
    const y = y1 + 8 + jitter;   // hugging the axis, flat
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  // label on the flat line
  if (lp > .55) {
    mono(g, 15); g.fillStyle = C.yellow;
    g.fillText('OUTPUT: 0', x0 + 30, y1 + 40);
  }
  // the cost line climbing
  const cp2 = snap(t, T.fig3 + 1.4, E8 * 2.2);
  if (cp2 > 0) {
    g.strokeStyle = C.stamp; g.lineWidth = 3; g.setLineDash([9, 7]);
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const f = (i / N) * cp2;
      const x = x0 + (x1 - x0) * f;
      const y = y0 - (y0 - y1) * (f * .92);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke(); g.setLineDash([]);
    mono(g, 15); g.fillStyle = C.stamp;
    g.fillText('COST: $40', x1 - 130, y1 + 34);
  }
  // annotation box
  const ap = snap(t, T.fig3 + 2.2, E8);
  if (ap > 0) {
    g.save(); g.globalAlpha = (1 - out) * ap;
    g.strokeStyle = C.inkDim; g.lineWidth = 1;
    g.strokeRect(x1 - 300, y1 + 60, 290, 62);
    mono(g, 13); g.fillStyle = C.inkDim;
    g.fillText('SIX HOURS. NO TASK COMPLETED.', x1 - 288, y1 + 84);
    g.fillText('OPERATOR INTERVENTION REQUIRED.', x1 - 288, y1 + 106);
    g.restore();
  }

  mono(g, 22); g.fillStyle = C.ink;
  g.fillText('FIG. 3', M + 40, BAR_Y - 250);
  mono(g, 14); g.fillStyle = C.inkDim;
  g.fillText('AUTONOMY UNDER LOAD', M + 40, BAR_Y - 226);
  g.restore();
}

// ---------- examiner's note ----------
function drawExam(g, t) {
  if (t < T.exam || t >= T.rej) return;
  const p = snap(t, T.exam, E8 * 1.2);
  const out = snap(t, T.rej - .1, E8);
  g.save(); g.globalAlpha = (1 - out) * p;
  const bx = M + 56, by = BAR_Y - 700, bw = CW - 112, bh = 560;
  // note card
  g.fillStyle = 'rgba(232,241,250,0.045)';
  g.fillRect(bx, by, bw, bh);
  g.strokeStyle = C.ink; g.lineWidth = 2;
  g.strokeRect(bx, by, bw, bh);
  // header strip
  g.fillStyle = C.ink; g.fillRect(bx, by, bw, 46);
  mono(g, 19); g.fillStyle = C.sheet;
  g.fillText("EXAMINER'S NOTE", bx + 22, by + 31);

  const rows = [
    ['CLAIM 1', 'DOES THE WHOLE JOB', 'UNTRIED'],
    ['CLAIM 2', 'REPLACES THE OPERATOR', 'NEEDS OPERATOR'],
    ['CLAIM 3', 'THINKS WITHOUT SUPERVISION', 'NO EVIDENCE'],
  ];
  rows.forEach(([c, txt, verdict], i) => {
    const rp = snap(t, T.exam + .5 + i * .85, E8);
    if (rp <= 0) return;
    const y = by + 110 + i * 130;
    g.save(); g.globalAlpha = (1 - out) * rp;
    mono(g, 15); g.fillStyle = C.inkDim;
    g.fillText(c, bx + 24, y);
    const tsz = fitMono(g, 27, txt, bw - 60);
    mono(g, tsz); g.fillStyle = C.ink;
    write(g, txt, bx + 24, y + 40, rp, tsz);
    // verdict tag
    mono(g, 15); g.fillStyle = C.stamp;
    const vw = g.measureText(verdict).width;
    g.strokeStyle = C.stamp; g.lineWidth = 1.5;
    g.strokeRect(bx + bw - vw - 54, y + 10, vw + 30, 34);
    g.fillText(verdict, bx + bw - vw - 40, y + 32);
    // rule
    g.strokeStyle = C.grid; g.lineWidth = 1;
    g.beginPath(); g.moveTo(bx + 24, y + 62); g.lineTo(bx + bw - 24, y + 62); g.stroke();
    g.restore();
  });
  // signed line
  const sp = snap(t, T.exam + 3.2, E8);
  if (sp > 0) {
    g.save(); g.globalAlpha = (1 - out) * sp;
    mono(g, 13); g.fillStyle = C.inkDim;
    g.fillText('EXAMINED BY: R. HOLT, ART UNIT 2600', bx + 24, by + bh - 26);
    g.restore();
  }
  g.restore();
}

// ---------- REJECTED stamp ----------
function drawStamp(g, t) {
  if (t < T.rej) return;
  const p = snap(t, T.rej, E8 * 1.1);
  const fade = 1 - snap(t, T.fix, E8 * 1.5) * .68;
  if (p <= 0) return;
  const sc = lerp(1.9, 1, p);
  g.save();
  g.translate(W / 2, BY_CENTER());
  g.rotate(-.13);
  g.scale(sc, sc);
  g.globalAlpha = p * fade * .95;
  g.strokeStyle = C.stamp; g.lineWidth = 9;
  const bw = 640, bh = 190;
  g.strokeRect(-bw / 2, -bh / 2, bw, bh);
  g.lineWidth = 3;
  g.strokeRect(-bw / 2 + 14, -bh / 2 + 14, bw - 28, bh - 28);
  mono(g, 108);
  g.fillStyle = C.stamp;
  g.textAlign = 'center';
  g.fillText('REJECTED', 0, 26);
  mono(g, 22);
  g.fillText('SCOPE NOT NARROW ENOUGH', 0, 66);
  g.textAlign = 'left';
  g.restore();
}
const BY_CENTER = () => (M + BAR_Y) / 2 + 40;  // centre of the drawing field

// ---------- fix: second filing, narrow scope ----------
function drawFix(g, t) {
  if (t < T.fix || t >= T.cta) return;
  const p = snap(t, T.fix, E8 * 1.2);
  const out = snap(t, T.cta - .1, E8);
  g.save(); g.globalAlpha = (1 - out) * p;
  const bx = M + 56, by = BAR_Y - 620, bw = CW - 112, bh = 470;
  g.fillStyle = 'rgba(242,197,61,0.06)';
  g.fillRect(bx, by, bw, bh);
  g.strokeStyle = C.yellow; g.lineWidth = 2.5;
  g.strokeRect(bx, by, bw, bh);

  mono(g, 17); g.fillStyle = C.yellow;
  g.fillText('SECOND FILING — 2026/4472', bx + 26, by + 44);
  mono(g, 13); g.fillStyle = C.inkDim;
  g.fillText('STATUS: APPROVED', bx + 26, by + 68);

  const rows = [
    ['CLAIM 1', 'ONE NARROW TASK', true],
    ['CLAIM 2', 'HARD BOUNDARIES', true],
    ['CLAIM 3', 'HUMAN CHECK', true],
  ];
  rows.forEach(([c, txt, ok], i) => {
    const rp = snap(t, T.fix + .6 + i * .7, E8);
    if (rp <= 0) return;
    const y = by + 150 + i * 96;
    g.save(); g.globalAlpha = (1 - out) * rp;
    mono(g, 14); g.fillStyle = C.inkDim;
    g.fillText(c, bx + 26, y);
    const tsz = fitMono(g, 40, txt, bw - 150, '700');
    mono(g, tsz); g.fillStyle = C.ink;
    write(g, txt, bx + 26, y + 48, rp, tsz);
    // check mark
    g.strokeStyle = C.yellow; g.lineWidth = 4;
    const cxm = bx + bw - 70;
    g.beginPath(); g.moveTo(cxm - 16, y + 24); g.lineTo(cxm - 4, y + 38); g.lineTo(cxm + 20, y + 4); g.stroke();
    g.restore();
  });
  mono(g, 16); g.fillStyle = C.yellow;
  const l2 = 'BORING SCOPE, APPROVED SCOPE.';
  g.fillText(l2, bx + 26, by + bh - 30);
  g.restore();
}

// ---------- CTA ----------
function drawCTA(g, t) {
  if (t < T.cta) return;
  const p = snap(t, T.cta, E8 * 1.2);
  g.save(); g.globalAlpha = p;
  const bx = M + 56, by = BY_CENTER() - 150, bw = CW - 112, bh = 300;
  g.fillStyle = C.yellow;
  g.fillRect(bx, by, bw, bh * p);
  g.restore();
  if (p > .55) {
    g.save();
    mono(g, 14); g.fillStyle = 'rgba(11,42,74,0.75)';
    g.fillText('APPROVED APPLICATION 2026/4472', M + 96, by + 46);
    const s = 'COMMENT "AGENT"';
    const sz = fitMono(g, 84, s, bw - 80, '700');
    mono(g, sz); g.fillStyle = C.sheet;
    write(g, s, M + 96, by + 150, p, sz);
    mono(g, 20); g.fillStyle = 'rgba(11,42,74,0.85)';
    g.fillText('for the claims that actually get approved', M + 96, by + 220);
    g.restore();
  }
}

// ---------- persistent page furniture ----------
function drawField(g, t) {
  // sheet number, page ticks, progress
  const prog = clamp(t / DUR, 0, 1);
  mono(g, 13); g.fillStyle = C.inkDim;
  g.fillText('SHEET 1 OF 1', W - M - 16 - g.measureText('SHEET 1 OF 1').width, H - M - 10);
  // progress as a drafting scale along the bottom margin
  g.fillStyle = C.grid;
  g.fillRect(M, H - M / 2 - 2, CW, 3);
  g.fillStyle = C.yellow;
  g.fillRect(M, H - M / 2 - 2, CW * prog, 3);
  // tick marks
  g.strokeStyle = C.inkDim; g.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = M + (CW / 10) * i;
    g.beginPath(); g.moveTo(x, H - M / 2 - 8); g.lineTo(x, H - M / 2 + 4); g.stroke();
  }
}

export function renderFilm(g, t, opts = {}) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = C.sheetDeep; g.fillRect(0, 0, W, H);
  drawSheet(g, t);
  drawHead(g, t);
  drawFig1(g, t);
  drawFig2(g, t);
  drawFig3(g, t);
  drawExam(g, t);
  drawFix(g, t);
  drawStamp(g, t);
  drawCTA(g, t);
  drawTitleBlock(g, t);
  drawField(g, t);
}
