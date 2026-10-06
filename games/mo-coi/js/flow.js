import { $ } from '../../../platform/core/util.js';
import { MAPS, G } from './state.js';
import { S, save, curMap } from './save.js';
import { canAttack, attack, advanceIfCleared, isVisible } from './conquest.js';
import { tileRect } from './layout.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) { $('card').innerHTML = html; showOnly('cardWrap'); onRender && onRender($('card')); }

export function showIntro() {
  const m = curMap();
  G.intro = true;
  showCard(`<p class="eyebrow">Ải ${S.stage + 1}/${MAPS.length}</p><h2>${m.name}</h2>
    <p class="lore">${m.lore}</p>
    <div class="actions"><button type="button" class="btn" id="iOk">Xuất quân</button></div>`, () => {
    $('iOk').onclick = () => { G.intro = false; S.introStage = S.stage; save(); showOnly(null); };
  });
}
export function showWin() {
  showCard(`<p class="eyebrow">Mở Cõi</p><h2>Đã mở trọn cõi bờ!</h2>
    <p class="lore">Giặc đã bị đẩy lùi khỏi cả ${MAPS.length} ải. Bờ cõi Đại Việt vững vàng.</p>
    <div class="actions"><button type="button" class="btn" id="wOk">Tiếp tục</button></div>`, el => { $('wOk').onclick = () => showOnly(null); });
}

export function initRegions() {
  const map = curMap();
  $('regions').innerHTML = Array.from({ length: S.owner.length }, (_, i) => {
    const r = tileRect(i, map);
    return `<button type="button" class="hit" data-r="${i}" style="left:${(r.x / 960 * 100).toFixed(3)}%;top:${(r.y / 540 * 100).toFixed(3)}%;width:${(r.w / 960 * 100).toFixed(3)}%;height:${(r.h / 540 * 100).toFixed(3)}%"></button>`;
  }).join('');
  $('regions').querySelectorAll('.hit').forEach(btn => btn.onclick = () => onRegionClick(+btn.dataset.r));
}

function onRegionClick(i) {
  if (G.intro || G.won) return;
  if (curMap().terrain[i] === 'r') return;
  if (G.selected === null) { if (S.owner[i]) G.selected = i; return; }
  if (G.selected === i) { G.selected = null; return; }
  if (S.owner[i]) { G.selected = i; return; }
  if (!isVisible(i) || !canAttack(G.selected, i)) return;
  attack(G.selected, i);
  G.selected = null;
  afterChange();
}

// Sau mỗi thay đổi về đất: nếu xong ải thì mở ải kế tiếp hoặc báo thắng cuộc
export function afterChange() {
  const r = advanceIfCleared();
  if (r === 'won') { initRegions(); showWin(); }
  else if (r === 'next') { initRegions(); showIntro(); }
}

export function updateRegions() {
  $('regions').querySelectorAll('.hit').forEach(btn => {
    const i = +btn.dataset.r, owned = !!S.owner[i], seen = isVisible(i);
    btn.disabled = curMap().terrain[i] === 'r';
    btn.classList.toggle('selected', G.selected === i);
    btn.setAttribute('aria-label', `Ô ${i + 1}: ${owned ? 'quân ta' : seen ? 'giặc' : 'chưa thám thính'}, ${Math.floor(S.troops[i])} quân`);
  });
}
