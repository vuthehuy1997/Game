// Luồng game: menu, bản đồ thời kỳ, kết quả, HUD trận đấu (Task 7: nút thế trận/mỏ vàng/
// doanh trại nối tới API Task 2-6).
import { $ } from '../../../platform/core/util.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { G, startEra } from './state.js';
import { setStance } from './troops.js';
import { trainMiner, assignMinerToMine, unassignMinerFromMine, trainTroop } from './buildings.js';

export function showOnly(id) {
  ['menu', 'cardWrap'].forEach(k => $(k).hidden = k !== id);
  $('hud').hidden = !!id;
}
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}
export function toTitle() {
  G.phase = 'menu';
  $('menu').innerHTML = `<h1>Giữ Nước Qua Ngàn Năm</h1><p class="sub">Xây làng, giữ đất qua 6 thời kỳ lịch sử</p>
    <div class="row"><button type="button" class="btn" id="mPlay">Chọn thời kỳ</button></div>`;
  $('mPlay').onclick = showEraSelect;
  showOnly('menu');
}
export function showEraSelect() {
  showCard(`<p class="eyebrow">Bản đồ</p><h2>Chọn thời kỳ</h2>
    <div class="eras">${ERAS.map((e, i) => `<button type="button" class="eraBtn" data-era="${i}" ${unlocked(i) ? '' : 'disabled'}>${e.name}<br><small>${e.year}${unlocked(i) ? '' : ' · khoá'}</small></button>`).join('')}</div>
    <div class="actions"><button type="button" class="btn ghost" id="eBack">Về menu</button></div>`, el => {
    el.querySelectorAll('.eraBtn').forEach(b => b.onclick = () => beginEra(+b.dataset.era));
    $('eBack').onclick = toTitle;
  });
}
export function beginEra(i) { startEra(i); showOnly(null); updateHud(); }

// HUD trận đấu: nút thế trận/mỏ vàng/doanh trại. Gắn 1 lần khi trang tải (initHud, gọi từ
// main.js) — dùng .onclick (không addEventListener) nên gọi lại không bị trùng lặp handler.
export function initHud() {
  $('btnStance').onclick = () => { setStance(G.stance === 'defend' ? 'attack' : 'defend'); updateHud(); };
  $('btnMineAdd').onclick = () => { assignMinerToMine(); updateHud(); };
  $('btnMineSub').onclick = () => { unassignMinerFromMine(); updateHud(); };
  $('btnTrainHouse').onclick = () => { trainMiner(); updateHud(); };
  $('btnBarracks').onclick = showBarracks;
  updateHud();
}

// Gọi mỗi khung hình (từ main.js update()) khi đang chiến đấu: nhãn nút thế trận + bật/tắt
// nút theo điều kiện hợp lệ của Task 2/3 (assignMinerToMine/unassignMinerFromMine/trainMiner).
export function updateHud() {
  const stanceBtn = $('btnStance');
  if (stanceBtn) stanceBtn.textContent = G.stance === 'defend' ? 'Phòng thủ' : 'Tấn công';
  if (!G.era) return;
  const mineAdd = $('btnMineAdd'); if (mineAdd) mineAdd.disabled = G.miners.atMine >= G.miners.total;
  const mineSub = $('btnMineSub'); if (mineSub) mineSub.disabled = G.miners.atMine <= 0;
  const trainHouse = $('btnTrainHouse');
  if (trainHouse) trainHouse.disabled = G.phase !== 'battle' || G.gold < G.era.minerCost;
}

// Doanh trại: bảng chọn lính theo troopTypes của thời kỳ hiện tại (Task 3: trainTroop).
export function showBarracks() {
  showCard(`<p class="eyebrow">Doanh trại</p><h2>Huấn luyện lính</h2>
    <div class="eras">${G.era.troopTypes.map(t => `<button type="button" class="eraBtn" data-troop="${t.id}">${t.name}<br><small>${t.cost} vàng · ${t.trainTime.toFixed(1)}s</small></button>`).join('')}</div>
    <div class="actions"><button type="button" class="btn ghost" id="bClose">Đóng</button></div>`, el => {
    el.querySelectorAll('[data-troop]').forEach(b => b.onclick = () => { trainTroop(b.dataset.troop); updateHud(); showOnly(null); });
    $('bClose').onclick = () => showOnly(null);
  });
}

export function showResult() {
  const win = G.phase === 'win';
  const hasNext = win && G.eraIdx + 1 < ERAS.length;
  const title = win ? (hasNext ? 'Đã phá thành địch!' : 'Giữ nước trọn vẹn qua ngàn năm!') : 'Thành ta đã mất…';
  const body = win
    ? (hasNext ? `Đã phá thành ${G.era.foe}, mở thời kỳ kế tiếp.` : `Đã phá thành ${G.era.foe} — hoàn thành cả 6 thời kỳ!`)
    : `${G.era.foe} đã phá được Nhà chính của ta. Luyện thêm và thử lại.`;
  showCard(`<p class="eyebrow">${G.era.name} · ${G.era.year}</p><h2>${title}</h2>
    <p>${body}</p>
    <div class="actions">
      <button type="button" class="btn ghost" id="rMap">Về bản đồ</button>
      <button type="button" class="btn" id="rGo">${hasNext ? 'Thời kỳ kế' : win ? 'Về bản đồ' : 'Đánh lại'}</button>
    </div>`, el => {
    $('rMap').onclick = showEraSelect;
    $('rGo').onclick = hasNext ? () => beginEra(G.eraIdx + 1) : win ? showEraSelect : () => beginEra(G.eraIdx);
  });
}
