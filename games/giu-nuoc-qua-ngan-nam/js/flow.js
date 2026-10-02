// Luồng game: menu, bản đồ thời kỳ, HUD tương tác trong trận, kết quả. Task 2-3-4-6 mở rộng file này.
import { $ } from '../../../platform/core/util.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { startEra } from './waves.js';
import { G } from './state.js';

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
