import { $ } from '../../../platform/core/util.js';
import { startLoop } from '../../../platform/core/loop.js';
import { bindKeys } from '../../../platform/core/input.js';
import { ac, tone } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { G } from './state.js';
import * as state from './state.js';
import * as data from './data.js';
import * as logic from './logic.js';
import * as save from './save.js';
import * as art from './art.js';
import { render } from './render.js';
import { PALETTE, CARD_BTN, EXPAND_BTN, hit, paletteAt, slotAtPoint, tileAtPoint } from './ui.js';

const cv = $('cv');
let saveT = 0;
if (!save.loadProgress()) logic.startRun();

function toLogical(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * 960 / r.width, y: (e.clientY - r.top) * 540 / r.height };
}

function onPointer(x, y) {
  if (G.mode === 'intro' && hit(CARD_BTN, x, y)) return logic.beginChapter();
  if (G.mode === 'done' && hit(CARD_BTN, x, y)) return logic.nextChapter();
  if (G.mode === 'lost' && hit(CARD_BTN, x, y)) return logic.restartChapter();
  if (G.mode === 'final' && hit(CARD_BTN, x, y)) return logic.startRun();
  if (G.mode === 'play') onPlay(x, y);
}

function onPlay(x, y) {
  const kind = paletteAt(x, y);
  if (kind) {
    G.sel.kind = G.sel.kind === kind ? null : kind;
    tone(523, .05, 'triangle', .04);
    return;
  }
  if (G.sel.tile >= 0 && hit(EXPAND_BTN, x, y)) {
    if (logic.expand(G.sel.tile)) tone(659, .08, 'triangle', .05);
    else logic.notify('Chưa đủ điều kiện để khai phá', '#e0604e');
    return;
  }
  const sp = slotAtPoint(x, y, G.owned);
  if (sp && G.sel.kind) {
    const ok = G.sel.kind === 'remove' ? logic.removeBuild(sp.tile, sp.s) : logic.placeBuild(sp.tile, sp.s, G.sel.kind);
    if (ok) tone(G.sel.kind === 'remove' ? 392 : 523, .08, 'triangle', .05);
    else logic.notify('Không thể làm ở ô này: thiếu tài nguyên hoặc ô đã có công trình', '#e0604e');
    G.sel.tile = sp.tile;
    return;
  }
  const t = tileAtPoint(x, y);
  if (t >= 0) G.sel.tile = t;
}

cv.addEventListener('pointerdown', e => {
  ac();
  const p = toLogical(e);
  onPointer(p.x, p.y);
});

function onKey(k) {
  if (k === 'esc') { G.sel.kind = null; return; }
  const idx = +k.slice(1) - 1;
  if (G.mode === 'play' && idx >= 0 && idx < PALETTE.length) G.sel.kind = G.sel.kind === PALETTE[idx] ? null : PALETTE[idx];
}

bindKeys({
  Digit1: 'k1', Digit2: 'k2', Digit3: 'k3', Digit4: 'k4', Digit5: 'k5', Digit6: 'k6', Digit7: 'k7', Digit8: 'k8', Escape: 'esc',
}, { onPress: k => { ac(); onKey(k); } });
mountHomeLink($('stage'));

function update(dt) {
  if (G.paused) return;
  if (G.mode === 'play') logic.tick(dt);
  else G.t += dt;
  saveT += dt;
  if (saveT > 5) { saveT = 0; if (G.mode === 'play') save.saveProgress(); }
}

if (debugOn()) exposeGlobals([state, data, logic, save, art]);
startLoop(update, render);
