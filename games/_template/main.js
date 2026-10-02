// Game mẫu: một nhân vật chạy, nhảy, nhặt tiền. Chép cả thư mục này thành games/<id-của-bạn>/ rồi sửa dần.
// Mọi thứ import từ platform/ đều dùng chung với các game khác.
import { startLoop } from '../../platform/core/loop.js';
import { held, pressed, bindKeys, bindTouch } from '../../platform/core/input.js';
import { ac, tone } from '../../platform/core/audio.js';
import { SETTINGS } from '../../platform/core/settings.js';
import { readJSON, writeJSON } from '../../platform/core/storage.js';
import { spark, dust, floatText, updateParticles, drawParticles, drawTexts } from '../../platform/core/fx.js';
import { $, rand, clamp, prune } from '../../platform/core/util.js';
import { debugOn, exposeGlobals } from '../../platform/core/debug.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { POSES } from '../../platform/art/poses.js';
import { ell, groundShadow, outlinedText } from '../../platform/art/draw.js';
import { FB, FD } from '../../platform/ui/theme.js';
import { mountHomeLink } from '../../platform/ui/bar.js';
import { STORE_KEY } from './meta.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const W = 960, H = 540, GROUND = 440, GRAV = 2300;

// Ngoại hình nhân vật: xem các trường trong platform/art/chibi.js
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'nonla', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };

// Bản lưu của game: một khoá localStorage riêng
const save = { best: 0, ...(readJSON(STORE_KEY) || {}) };
const G = { t: 0, score: 0, shake: 0 };
const P = { x: W / 2, y: GROUND, vx: 0, vy: 0, face: 1, air: false, state: 'idle', t: 0, walk: 0, st: 0 };
const coins = [];

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 40); P.t += dt; P.st += dt;
  const dir = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  P.vx = dir * 300; if (dir) P.face = dir;
  if (pressed.has('jump') && !P.air) { P.vy = -820; P.air = true; tone(330, .12, 'triangle', .05, 260); }
  P.vy += GRAV * dt; P.x = clamp(P.x + P.vx * dt, 30, W - 30); P.y += P.vy * dt;
  if (P.y >= GROUND) { if (P.air) { dust(P.x, GROUND); P.st = 0; } P.y = GROUND; P.vy = 0; P.air = false; }
  if (dir && !P.air) P.walk += dt * 12;
  P.state = P.air ? 'air' : dir ? 'run' : P.st < .12 ? 'land' : 'idle';

  if (coins.length < 4 && Math.random() < dt * 1.5) coins.push({ x: rand(60, W - 60), y: rand(GROUND - 190, GROUND - 40) });
  for (const c of coins) if (Math.abs(c.x - P.x) < 34 && Math.abs(c.y - (P.y - 55)) < 60) {
    c.got = true; G.score++; G.shake = 4;
    spark(c.x, c.y, 10, '#e9b949'); floatText(c.x, c.y - 20, '+1', '#ffe6a8'); tone(988, .06, 'square', .04);
    if (G.score > save.best) { save.best = G.score; writeJSON(STORE_KEY, save); }
  }
  prune(coins, c => !c.got);
  updateParticles(dt, G.t);
}

function render() {
  ctx.save();
  if (SETTINGS.shake && G.shake > 0) ctx.translate(rand(-G.shake, G.shake), rand(-G.shake, G.shake) * .6);
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#7ec8e3'); sky.addColorStop(1, '#e8f4d9');
  ctx.fillStyle = sky; ctx.fillRect(-10, -10, W + 20, GROUND + 10);
  ctx.fillStyle = '#5f9a4a'; ctx.fillRect(-10, GROUND, W + 20, H - GROUND + 10);
  for (const c of coins) { ell(ctx, c.x, c.y + Math.sin(G.t * 4 + c.x) * 4, 11, 11, '#e9b949'); ell(ctx, c.x, c.y + Math.sin(G.t * 4 + c.x) * 4, 4, 4, '#a07a22'); }
  groundShadow(ctx, P.x, GROUND);
  drawChibi(ctx, P.x, P.y, HERO, { face: P.face, t: P.t, ...POSES[P.state](P) });
  drawParticles(ctx, G.t);
  drawTexts(ctx, FB);
  ctx.restore();
  ctx.textAlign = 'right';
  outlinedText(ctx, `${G.score} đồng`, W - 20, 46, `34px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `Kỷ lục ${save.best}`, W - 20, 72, `18px ${FB}`, '#fff');
}

bindKeys({ KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump' }, { onPress: () => ac() });
bindTouch($('touch'));
mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{ G, P, coins, save, update, render, held, pressed }]);
startLoop(update, render);
