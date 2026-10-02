// Luồng game: menu, bản đồ thời kỳ, HUD tương tác trong trận, kết quả. Task 2-3-4-6 mở rộng file này.
import { $ } from '../../../platform/core/util.js';
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
    <div class="row"><button type="button" class="btn" id="mPlay" disabled>Chọn thời kỳ (Task 2)</button></div>`;
  showOnly('menu');
}
