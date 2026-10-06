import { $ } from '../../../platform/core/util.js';
import { G, ZONES } from './state.js';
import { S } from './save.js';
import { startRun, metres } from './game.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}
export function toMenu() {
  G.mode = 'menu';
  showCard(`<p class="eyebrow">Chạy Làng · Thư khẩn</p><h2>Tiểu Tuấn đưa thư</h2>
    <p>Giặc đã vượt biên. Chạy qua cánh đồng lúa, rừng tre và bến sông để tới tiền đồn.</p>
    <p class="hint">Né hàng rào, xe bò, cổng tre. Nhặt khiên, giày gió, nam châm.</p>
    <dl class="stats"><dt>Kỷ lục</dt><dd>${S.best} điểm</dd><dt>Xa nhất</dt><dd>${S.bestDist || 0} m</dd><dt>Số lần chạy</dt><dd>${S.runs || 0}</dd></dl>
    <div class="actions"><button type="button" class="btn" id="mGo">Bắt đầu</button></div>`, () => {
    $('mGo').onclick = () => { startRun(); showOnly(null); };
  });
}
export function showResult() {
  const title = G.newBest ? 'Kỷ lục mới!' : 'Kết thúc';
  showCard(`<p class="eyebrow">${title}</p><h2>${G.score} điểm</h2>
    <dl class="stats"><dt>Quãng đường</dt><dd>${Math.floor(metres())} m</dd><dt>Xu</dt><dd>${G.coins}</dd><dt>Chặng cuối</dt><dd>${ZONES[G.zone].name}</dd><dt>Kỷ lục</dt><dd>${S.best} điểm</dd></dl>
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Menu</button><button type="button" class="btn" id="rGo">Chạy lại</button></div>`, () => {
    $('rMenu').onclick = toMenu; $('rGo').onclick = () => { startRun(); showOnly(null); };
  });
}
