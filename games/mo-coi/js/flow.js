import { $ } from '../../../platform/core/util.js';
import { S } from './save.js';
import { canAttack, attack, hasWon } from './conquest.js';
import { G } from './state.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) { $('card').innerHTML = html; showOnly('cardWrap'); onRender && onRender($('card')); }
export function showWin() {
  showCard(`<p class="eyebrow">Mở Cõi</p><h2>Đã chiếm trọn bản đồ!</h2>
    <div class="actions"><button type="button" class="btn" id="wOk">Tiếp tục</button></div>`, el => { $('wOk').onclick = () => showOnly(null); });
}
export function initRegions(n) {
  $('regions').innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" class="region" data-r="${i}"></button>`).join('');
  $('regions').querySelectorAll('.region').forEach(btn => btn.onclick = () => onRegionClick(+btn.dataset.r));
}
function onRegionClick(i) {
  if (G.selected === null) { if (S.owner[i]) G.selected = i; return; }
  if (G.selected === i) { G.selected = null; return; }
  if (S.owner[i]) { G.selected = i; return; }
  if (canAttack(G.selected, i)) { attack(G.selected, i); G.selected = null; if (hasWon() && !G.won) { G.won = true; showWin(); } }
}
export function updateRegions() {
  $('regions').querySelectorAll('.region').forEach(btn => {
    const i = +btn.dataset.r;
    btn.classList.toggle('mine', !!S.owner[i]);
    btn.classList.toggle('selected', G.selected === i);
    btn.textContent = Math.floor(S.troops[i]);
  });
}
