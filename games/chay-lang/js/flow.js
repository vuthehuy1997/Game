import { $ } from '../../../platform/core/util.js';
import { G } from './state.js';
import { S } from './save.js';
import { startRun } from './game.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}
export function toMenu() {
  G.mode = 'menu';
  showCard(`<p class="eyebrow">Chạy Làng</p><h2>Sẵn sàng chạy?</h2><p>Kỷ lục: ${S.best}</p>
    <div class="actions"><button type="button" class="btn" id="mGo">Bắt đầu</button></div>`, el => {
    $('mGo').onclick = () => { startRun(); showOnly(null); };
  });
}
export function showResult() {
  showCard(`<p class="eyebrow">Kết thúc</p><h2>Điểm: ${G.score}</h2><p>Kỷ lục: ${S.best}</p>
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Menu</button><button type="button" class="btn" id="rGo">Chạy lại</button></div>`, el => {
    $('rMenu').onclick = toMenu; $('rGo').onclick = () => { startRun(); showOnly(null); };
  });
}
