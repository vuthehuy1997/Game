import { $ } from '../../../platform/core/util.js';
import { UPGRADES, TIERS } from './data.js';
import { S } from './save.js';
import { buy, costOf, canBuy, isUnlocked, fmt } from './clicker.js';
import { drawIcon } from './buildings.js';

const byId = id => UPGRADES.find(u => u.id === id);

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) { $('card').innerHTML = html; showOnly('cardWrap'); onRender && onRender($('card')); }
export function showOfflineGain(gain) {
  showCard(`<p class="eyebrow">Chào mừng trở lại</p><h2>+${fmt(gain)} xu</h2><p>Làng đã làm việc trong lúc bạn vắng mặt.</p>
    <div class="actions"><button type="button" class="btn" id="oOk">Nhận</button></div>`, el => { $('oOk').onclick = () => showOnly(null); });
}
function cardHtml(u) {
  return `<button type="button" class="upBtn" data-id="${u.id}">
    <canvas class="ico" width="64" height="64" data-kind="${u.building}" data-tone="${u.color}" aria-hidden="true"></canvas>
    <span class="meta"><b>${u.name}</b><small>${u.desc}</small><i data-own></i><span class="price" data-lbl></span></span></button>`;
}
export function initShop() {
  const shop = $('shop');
  shop.innerHTML = TIERS.map(t => `<h3 class="tierHd">${t.name}</h3>` + UPGRADES.filter(u => u.tier === t.id).map(cardHtml).join('')).join('');
  shop.querySelectorAll('.upBtn').forEach(btn => { btn.onclick = () => buy(byId(btn.dataset.id)); });
  shop.querySelectorAll('canvas.ico').forEach(cv => drawIcon(cv, cv.dataset.kind, cv.dataset.tone));
}
export function updateShop() {
  $('shop').querySelectorAll('.upBtn').forEach(btn => {
    const u = byId(btn.dataset.id), unlocked = isUnlocked(u);
    btn.classList.toggle('locked', !unlocked);
    btn.disabled = !canBuy(u);
    btn.querySelector('[data-own]').textContent = `Có ${S.owned[u.id] || 0} · ${u.kind === 'click' ? '+' + u.value + ' mỗi bấm' : '+' + u.value + '/giây'}`;
    btn.querySelector('[data-lbl]').textContent = unlocked ? `Giá ${fmt(costOf(u))} xu` : `Mở khi làng kiếm đủ ${fmt(u.req)} xu`;
  });
}
