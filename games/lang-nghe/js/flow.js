import { $ } from '../../../platform/core/util.js';
import { UPGRADES } from './data.js';
import { S } from './save.js';
import { buy, costOf, canBuy, fmt } from './clicker.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) { $('card').innerHTML = html; showOnly('cardWrap'); onRender && onRender($('card')); }
export function showOfflineGain(gain) {
  showCard(`<p class="eyebrow">Chào mừng trở lại</p><h2>+${fmt(gain)} của cải</h2><p>Làng đã sản xuất trong lúc bạn vắng mặt.</p>
    <div class="actions"><button type="button" class="btn" id="oOk">Nhận</button></div>`, el => { $('oOk').onclick = () => showOnly(null); });
}
export function initShop() {
  $('shop').innerHTML = UPGRADES.map(u => `<button type="button" class="upBtn" data-id="${u.id}">${u.name}<br><small data-lbl></small></button>`).join('');
  $('shop').querySelectorAll('.upBtn').forEach((btn, i) => btn.onclick = () => buy(UPGRADES[i]));
}
export function updateShop() {
  $('shop').querySelectorAll('.upBtn').forEach((btn, i) => {
    const u = UPGRADES[i];
    btn.querySelector('[data-lbl]').textContent = `Đã mua ${S.owned[u.id] || 0} · ${costOf(u)}v`;
    btn.disabled = !canBuy(u);
  });
}
