// Luồng game: menu, bản đồ thời kỳ, kết quả. Task 1 đã xoá hệ 6-lô-đất/waves.js — HUD trận
// đấu (nút thế trận/mỏ vàng/doanh trại) sẽ được Task 7 nối lại hoàn toàn, nên các hàm
// onPlotClick/initHud/updateHud kiểu cũ (dựa vào buildingOn/BUILD_KINDS/canUpgradeHQ đã xoá)
// bị bỏ khỏi file này ở Task 6 để tránh import vỡ (enemy.js→flow.js nay nằm trong chuỗi
// import của main.js qua checkEnd/showResult).
import { $ } from '../../../platform/core/util.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { G, startEra } from './state.js';

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
export function beginEra(i) { startEra(i); showOnly(null); }

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
