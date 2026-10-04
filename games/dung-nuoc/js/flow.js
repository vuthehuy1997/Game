import { $ } from '../../../platform/core/util.js';
import { BUILDING_DEFS } from './data.js';
import { S } from './save.js';
import { build, canBuild, canAfford, unlockedKinds } from './buildings.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}
function onPlotClick(plot) {
  const kind = S.grid[plot];
  if (!kind) {
    const kinds = unlockedKinds();
    showCard(`<p class="eyebrow">Ô đất trống</p><h2>Xây công trình</h2>
      <div class="kinds">${kinds.map(k => `<button type="button" class="kindBtn" data-k="${k}" ${canAfford(k) ? '' : 'disabled'}>${BUILDING_DEFS[k].name}</button>`).join('')}</div>
      <div class="actions"><button type="button" class="btn ghost" id="pCancel">Huỷ</button></div>`, el => {
      el.querySelectorAll('[data-k]').forEach(btn => btn.onclick = () => { build(plot, btn.dataset.k); showOnly(null); });
      $('pCancel').onclick = () => showOnly(null);
    });
  } else {
    showCard(`<p class="eyebrow">Ô đất</p><h2>${BUILDING_DEFS[kind].name}</h2>
      <div class="actions"><button type="button" class="btn ghost" id="pCancel">Đóng</button></div>`, el => { $('pCancel').onclick = () => showOnly(null); });
  }
}
export function initPlots(n) {
  $('plots').innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" class="plot" data-plot="${i}"></button>`).join('');
  $('plots').querySelectorAll('.plot').forEach(btn => btn.onclick = () => onPlotClick(+btn.dataset.plot));
}
export function updatePlots() {
  $('plots').querySelectorAll('.plot').forEach(btn => {
    const kind = S.grid[btn.dataset.plot];
    btn.textContent = kind ? BUILDING_DEFS[kind].name : '';
    btn.classList.toggle('filled', !!kind);
  });
}
