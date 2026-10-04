import { $ } from '../../../platform/core/util.js';
import { LEVELS, unlocked } from './data.js';
import { startLevel } from './physics.js';
import { G } from './state.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}
export function toMenu() {
  G.mode = 'menu';
  showCard(`<p class="eyebrow">Bắn Bóng</p><h2>Chọn màn</h2>
    <div class="levels">${LEVELS.map((_, i) => `<button type="button" class="lvBtn" data-lv="${i}" ${unlocked(i) ? '' : 'disabled'}>Màn ${i + 1}</button>`).join('')}</div>`, el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => { startLevel(+b.dataset.lv); showOnly(null); });
  });
}
export function showResult() {
  showCard(`<p class="eyebrow">Màn ${G.level + 1}</p><h2>${G.won ? 'Sạch lưới!' : 'Bóng tràn xuống…'}</h2>
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
    <button type="button" class="btn" id="rGo">${G.won ? 'Màn kế' : 'Thử lại'}</button></div>`, el => {
    $('rMenu').onclick = toMenu;
    $('rGo').onclick = G.won
      ? () => { startLevel(Math.min(G.level + 1, LEVELS.length - 1)); showOnly(null); }
      : () => { startLevel(G.level); showOnly(null); };
  });
}
