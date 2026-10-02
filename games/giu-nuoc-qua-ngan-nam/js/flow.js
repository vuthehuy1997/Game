// Luồng game: menu, bản đồ thời kỳ, HUD tương tác trong trận, kết quả. Task 2-3-4-6 mở rộng file này.
import { $ } from '../../../platform/core/util.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { startEra } from './waves.js';
import { BUILD_KINDS, buildLabel, costOf, build, campUpgradeCost, upgrade, canUpgradeHQ, upgradeHQ } from './buildings.js';
import { G, buildingOn } from './state.js';

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

function onPlotClick(id) {
  if (G.phase !== 'prep') return;
  const b = buildingOn(id);
  if (!b) {
    showCard(`<p class="eyebrow">Lô ${id + 1}</p><h2>Xây công trình</h2>
      <div class="actions">${BUILD_KINDS.map(k => `<button type="button" class="btn" data-k="${k}" ${costOf(k) > G.gold ? 'disabled' : ''}>${buildLabel(k)} (${costOf(k)}v)</button>`).join('')}
      <button type="button" class="btn ghost" id="pCancel">Huỷ</button></div>`, el => {
      el.querySelectorAll('[data-k]').forEach(btn => btn.onclick = () => { build(id, btn.dataset.k); showOnly(null); });
      $('pCancel').onclick = () => showOnly(null);
    });
  } else if (b.kind === 'camp' && b.lvl < 3) {
    showCard(`<p class="eyebrow">Lô ${id + 1} · Trại lính cấp ${b.lvl}</p><h2>Nâng cấp trại</h2>
      <div class="actions"><button type="button" class="btn" id="pUp" ${campUpgradeCost(b) > G.gold ? 'disabled' : ''}>Nâng lên cấp ${b.lvl + 1} (${campUpgradeCost(b)}v)</button>
      <button type="button" class="btn ghost" id="pCancel">Đóng</button></div>`, el => {
      $('pUp').onclick = () => { upgrade(b); showOnly(null); }; $('pCancel').onclick = () => showOnly(null);
    });
  } else {
    showCard(`<p class="eyebrow">Lô ${id + 1}</p><h2>${buildLabel(b.kind)}${b.kind === 'camp' ? ' (cấp tối đa)' : ''}</h2>
      <div class="actions"><button type="button" class="btn ghost" id="pCancel">Đóng</button></div>`, el => { $('pCancel').onclick = () => showOnly(null); });
  }
}
export function initHud() {
  $('plots').querySelectorAll('.plot').forEach(btn => btn.onclick = () => onPlotClick(+btn.dataset.plot));
  $('btnHqUp').onclick = () => upgradeHQ();
}
export function updateHud() {
  $('plots').querySelectorAll('.plot').forEach(btn => {
    const id = +btn.dataset.plot, b = buildingOn(id);
    btn.querySelector('small').textContent = b ? `${buildLabel(b.kind)}${b.kind === 'camp' ? ' c' + b.lvl : ''}` : 'Trống';
    btn.classList.toggle('filled', !!b);
  });
  $('btnHqUp').disabled = !canUpgradeHQ();
}

export function showResult() {
  const win = G.phase === 'win';
  showCard(`<p class="eyebrow">${G.era.name} · ${G.era.year}</p><h2>${win ? 'Giữ vững giang sơn!' : 'Thành đã mất…'}</h2>
    <p>${win ? `Đã đánh bại ${G.era.foe}, mở thời kỳ kế tiếp.` : `${G.era.foe} đã hạ được Nhà chính. Luyện thêm và thử lại.`}</p>
    <div class="actions">
      <button type="button" class="btn ghost" id="rMap">Về bản đồ</button>
      <button type="button" class="btn" id="rGo">${win && unlocked(G.eraIdx + 1) ? 'Thời kỳ kế' : win ? 'Về bản đồ' : 'Đánh lại'}</button>
    </div>`, el => {
    $('rMap').onclick = showEraSelect;
    $('rGo').onclick = win ? (unlocked(G.eraIdx + 1) ? () => beginEra(G.eraIdx + 1) : showEraSelect) : () => beginEra(G.eraIdx);
  });
}
