// Vẽ sân, 2 tướng, HUD (thanh máu/nội lực, round, đồng hồ) và banner giữa màn hình.
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, groundShadow, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FIGHTERS, STAGES } from './data.js';
import { W, H, GROUND } from './state.js';
import { FB, FD } from '../../../platform/ui/theme.js';
import { FIGHTER_IDS, STAGE_IDS, PORTRAIT_R, portraitX, ROW1_Y, ROW2_Y } from './menu.js';

const ATK_POSE = { light: () => ({ armF: -.3, armB: -1.8, legF: .3, legB: -.1, lean: .25 }),
                    heavy: () => ({ armF: -.6, armB: -2.4, legF: .4, legB: -.2, lean: .4 }) };

function fighterPose(f) {
  if (f.atk) return ATK_POSE[f.atk.kind]();
  if (f.counterT > 0) return POSES.guard(f);
  return (POSES[f.state] || POSES.idle)(f);
}

const DIFF_VI = { easy: 'Dễ', normal: 'Thường', hard: 'Khó' };

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
  outlinedText(ctx, `Hiệp ${G.round} · ${G.wins[0]} - ${G.wins[1]}`, W / 2, 64, `16px ${FB}`, '#ffe6a8');
  if (G.banner) { ctx.globalAlpha = Math.min(1, G.banner.dur - G.banner.t); outlinedText(ctx, G.banner.text, W / 2, H / 2, `44px ${FD}`, '#ffe6a8'); ctx.globalAlpha = 1; }
  if (G.mode === 'matchEnd') outlinedText(ctx, 'Đánh (F//) để đấu lại · Chiêu (H) để về menu', W / 2, H - 30, `16px ${FB}`, '#a3a8b8');
}

// Ảnh chân dung tròn của một tướng, phỏng theo drawBust (platform/art/chibi.js) nhưng vẽ thẳng lên ctx
// dùng chung của màn chọn (không cần canvas riêng), để đặt được nhiều ảnh cùng lúc trên một màn hình.
function drawHeroPortrait(ctx, cx, cy, r, look) {
  const REF = 66, k = r / 64, s = 1.7 / (look.scale || 1);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#20232c'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.translate(cx - REF * k, cy - REF * k); ctx.scale(k, k);
  drawChibi(ctx, 60, 66 + 80 * 1.7 + 8, look, { scale: s, t: 0, armF: .2, noWeapon: true });
  ctx.restore();
}
function drawPortraitRow(ctx, y, selIdx, ringColor, dim) {
  ctx.globalAlpha = dim ? .55 : 1;
  FIGHTER_IDS.forEach((id, i) => {
    const x = portraitX(i), picked = i === selIdx;
    drawHeroPortrait(ctx, x, y, PORTRAIT_R, FIGHTERS[id].look);
    ctx.lineWidth = picked ? 4 : 1.5; ctx.strokeStyle = picked ? ringColor : 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.arc(x, y, PORTRAIT_R + (picked ? 3 : 0), 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = 'center';
    outlinedText(ctx, FIGHTERS[id].name, x, y + PORTRAIT_R + 18, `13px ${FB}`, picked ? ringColor : '#cfd3dc');
  });
  ctx.globalAlpha = 1;
}
export function renderSelect(ctx, sel) {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  outlinedText(ctx, 'Đối Kháng Anh Hùng', W / 2, 36, `28px ${FD}`, '#ffe6a8');

  outlinedText(ctx, 'Người chơi 1 — bấm chọn hoặc A/D', W / 2, ROW1_Y - PORTRAIT_R - 14, `14px ${FB}`, '#fff');
  drawPortraitRow(ctx, ROW1_Y, sel.cursor1, '#e9b949', false);

  outlinedText(ctx, sel.p2cpu
    ? `Máy điều khiển (${DIFF_VI[sel.diff]}) — đổi khó: , · đổi Người/Máy: H`
    : 'Người chơi 2 — bấm chọn hoặc ←/→', W / 2, ROW2_Y - PORTRAIT_R - 14, `14px ${FB}`, '#fff');
  drawPortraitRow(ctx, ROW2_Y, sel.cursor2, sel.p2cpu ? '#ff8f6b' : '#6fd6ff', sel.p2cpu);

  outlinedText(ctx, `Sân: ${STAGES[STAGE_IDS[sel.stageCursor]].name} — đổi: W`, W / 2, ROW2_Y + PORTRAIT_R + 46, `18px ${FB}`, '#ffe6a8');
  outlinedText(ctx, 'F hoặc / để bắt đầu', W / 2, ROW2_Y + PORTRAIT_R + 72, `16px ${FB}`, '#a3a8b8');
}
