// Luồng 1 trận: round kết thúc khi 1 bên hết máu hoặc hết giờ; hoà giờ thì đấu lại round, không cộng điểm.
// Thắng round: +1 điểm cho bên thắng; ai đạt 2 điểm trước thắng trận (mode chuyển 'matchEnd').
import { resetRound } from './state.js';

function banner(G, text, dur = 1.8) { G.banner = { text, t: 0, dur }; }

export function updateFlow(G, dt) {
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }
  if (G.mode !== 'fight') return;
  G.timer = Math.max(0, G.timer - dt);
  const dead1 = G.f1.hp <= 0, dead2 = G.f2.hp <= 0;
  let winner = null;
  if (dead1 && dead2) winner = 'draw';
  else if (dead1) winner = 'p2';
  else if (dead2) winner = 'p1';
  else if (G.timer <= 0) winner = G.f1.hp === G.f2.hp ? 'draw' : (G.f1.hp > G.f2.hp ? 'p1' : 'p2');
  if (!winner) return;

  if (winner === 'draw') { banner(G, 'Hoà! Đấu lại round'); resetRound(G); return; }
  const idx = winner === 'p1' ? 0 : 1;
  G.wins[idx]++;
  if (G.wins[idx] >= 2) { G.mode = 'matchEnd'; banner(G, (winner === 'p1' ? 'P1' : 'P2') + ' thắng trận!', 4); return; }
  G.round++; banner(G, 'Round ' + G.round); resetRound(G);
}
