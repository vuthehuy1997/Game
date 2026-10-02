// Vẽ sân, 2 tướng, HUD (thanh máu/nội lực, round, đồng hồ) và banner giữa màn hình.
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, groundShadow, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FIGHTERS, STAGES } from './data.js';
import { W, H, GROUND } from './state.js';
import { FB, FD } from '../../../platform/ui/theme.js';
import { FIGHTER_IDS, STAGE_IDS } from './menu.js';

const ATK_POSE = { light: () => ({ armF: -.3, armB: -1.8, legF: .3, legB: -.1, lean: .25 }),
                    heavy: () => ({ armF: -.6, armB: -2.4, legF: .4, legB: -.2, lean: .4 }) };

function fighterPose(f) {
  if (f.atk) return ATK_POSE[f.atk.kind]();
  if (f.counterT > 0) return POSES.guard(f);
  return (POSES[f.state] || POSES.idle)(f);
}

function healthBar(ctx, x, align, f) {
  const w = 300, pct = Math.max(0, f.hp / FIGHTERS[f.fid].hp);
  ctx.save(); if (align === 'r') { ctx.translate(x, 0); ctx.scale(-1, 1); x = 0; } else ctx.translate(x, 0);
  rr(ctx, 0, 18, w, 16, 6); ctx.fillStyle = '#1b1d24a0'; ctx.fill();
  rr(ctx, 2, 20, (w - 4) * pct, 12, 5); ctx.fillStyle = pct > .3 ? '#5fae4a' : '#b3261e'; ctx.fill();
  rr(ctx, 0, 36, w * (f.meter / 100), 6, 3); ctx.fillStyle = '#e9b949'; ctx.fill();
  ctx.restore();
}

export function renderMatch(ctx, G) {
  const st = STAGES[G.stageId];
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, st.sky[0]); sky.addColorStop(1, st.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = st.ground; ctx.fillRect(0, GROUND, W, H - GROUND);

  for (const f of [G.f1, G.f2]) {
    groundShadow(ctx, f.x, GROUND);
    drawChibi(ctx, f.x, f.y, FIGHTERS[f.fid].look, { face: f.face, t: f.t, ...fighterPose(f) });
  }
  drawParticles(ctx, G.t); drawTexts(ctx, FB);

  healthBar(ctx, 20, 'l', G.f1); healthBar(ctx, W - 20, 'r', G.f2);
  ctx.textAlign = 'center';
  outlinedText(ctx, String(Math.ceil(G.timer)), W / 2, 40, `30px ${FD}`, '#fff');
  outlinedText(ctx, `Round ${G.round} · ${G.wins[0]} - ${G.wins[1]}`, W / 2, 64, `16px ${FB}`, '#ffe6a8');
  if (G.banner) { ctx.globalAlpha = Math.min(1, G.banner.dur - G.banner.t); outlinedText(ctx, G.banner.text, W / 2, H / 2, `44px ${FD}`, '#ffe6a8'); ctx.globalAlpha = 1; }
}

export function renderSelect(ctx, sel) {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  outlinedText(ctx, 'Đối Kháng Anh Hùng', W / 2, 70, `40px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `P1: ${FIGHTERS[FIGHTER_IDS[sel.cursor1]].name}  ◀ A/D ▶`, W / 2, 160, `22px ${FB}`, '#fff');
  outlinedText(ctx, sel.p2cpu ? `Máy (${sel.diff}) — đổi: H` : `P2: ${FIGHTERS[FIGHTER_IDS[sel.cursor2]].name}  ◀ ←/→ ▶`, W / 2, 200, `22px ${FB}`, '#fff');
  outlinedText(ctx, `Sân: ${STAGES[STAGE_IDS[sel.stageCursor]].name} — đổi: W`, W / 2, 240, `20px ${FB}`, '#ffe6a8');
  outlinedText(ctx, 'F hoặc / để bắt đầu', W / 2, 300, `18px ${FB}`, '#a3a8b8');
}
