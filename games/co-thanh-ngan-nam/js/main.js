import { $ } from '../../../platform/core/util.js';
import { startLoop } from '../../../platform/core/loop.js';
import { bindKeys } from '../../../platform/core/input.js';
import { ac, tone } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { ERAS } from './data.js';
import { G, slots } from './state.js';
import * as state from './state.js';
import * as logic from './logic.js';
import * as save from './save.js';
import * as data from './data.js';
import { render } from './render.js';
import { card, BACK, pal, START, LORE_BTN, OVER_MENU, OVER_NEXT, SLOT_R, hit } from './ui.js';

const cv = $('cv');
const { isUnlocked } = save;
const KIND = ['wall', 'tower', 'pit', 'fire'];

function toLogical(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * 960 / r.width, y: (e.clientY - r.top) * 540 / r.height };
}

function toMenu() { G.mode = 'menu'; }

function slotAt(x, y) {
  let best = null, bd = SLOT_R * SLOT_R;
  for (const s of slots) {
    const d = (s.x - x) ** 2 + (s.y - y) ** 2;
    if (d <= bd) { bd = d; best = s; }
  }
  return best;
}

function onPointer(x, y) {
  if (G.mode === 'menu') {
    ERAS.forEach((_, i) => { if (hit(card(i), x, y) && isUnlocked(i)) logic.startEra(i); });
  } else if (G.mode === 'intro') {
    if (hit(LORE_BTN, x, y)) logic.beginPrep();
    else if (hit(BACK, x, y)) toMenu();
  } else if (G.mode === 'prep') {
    if (hit(BACK, x, y)) return toMenu();
    if (hit(START, x, y)) return logic.startWave();
    for (let k = 0; k < KIND.length; k++) if (hit(pal(k), x, y)) { G.pick = KIND[k]; return; }
    const s = slotAt(x, y);
    if (!s) return;
    if (s.b) { if (logic.removeBuild(s.i)) tone(392, .06, 'triangle', .05); }
    else if (logic.placeBuild(s.i, G.pick)) tone(523, .08, 'triangle', .05);
  } else if (G.mode === 'battle') {
    if (hit(BACK, x, y)) toMenu();
  } else if (G.mode === 'over') {
    if (hit(OVER_MENU, x, y)) toMenu();
    else if (hit(OVER_NEXT, x, y) && G.result === 'won' && G.era + 1 < ERAS.length && isUnlocked(G.era + 1)) logic.startEra(G.era + 1);
  }
}

cv.addEventListener('pointerdown', e => {
  ac();
  const p = toLogical(e);
  onPointer(p.x, p.y);
});

function onKey(k) {
  if (k === 'esc') return toMenu();
  if (G.mode !== 'prep') return;
  if (k === 'start') return logic.startWave();
  const idx = ['pick1', 'pick2', 'pick3', 'pick4'].indexOf(k);
  if (idx >= 0) G.pick = KIND[idx];
}

bindKeys({ Digit1: 'pick1', Digit2: 'pick2', Digit3: 'pick3', Digit4: 'pick4', Space: 'start', Escape: 'esc' }, { onPress: k => { ac(); onKey(k); } });
mountHomeLink($('stage'));

function update(dt) {
  logic.tick(dt);
}

if (debugOn()) exposeGlobals([state, logic, save, data]);
startLoop(update, render);
