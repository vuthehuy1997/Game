import { $ } from '../../../platform/core/util.js';
import { BUILDING_DEFS, MILESTONES, milestoneIndex } from './data.js';
import { S, save } from './save.js';
import { build, canAfford, unlockedKinds } from './buildings.js';
import { plotBox } from './state.js';

const W = 960, H = 540;

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}

const costText = cost => [cost.gold && `${cost.gold} vàng`, cost.food && `${cost.food} lương thực`].filter(Boolean).join(' + ');
export function outputText(kind) {
  const d = BUILDING_DEFS[kind], out = [];
  if (d.pop) out.push(`+${d.pop} dân`);
  if (d.gold) out.push(`+${d.gold} vàng/giây`);
  if (d.food) out.push(`+${d.food} lương thực/giây`);
  return out.join(', ');
}
export function tipText(kind) {
  const d = BUILDING_DEFS[kind];
  return [d.name, d.desc, `Giá: ${costText(d.cost)}`, `Sản lượng: ${outputText(kind)}`].join('\n');
}

function plotLabel(kind) { return kind ? BUILDING_DEFS[kind].name : 'Ô đất trống'; }

function onPlotClick(plot) {
  const kind = S.grid[plot];
  if (!kind) {
    const kinds = unlockedKinds();
    showCard(`<p class="eyebrow">Ô đất trống</p><h2>Xây công trình</h2>
      <div class="kinds">${kinds.map(k => {
        const d = BUILDING_DEFS[k], ok = canAfford(k);
        return `<button type="button" class="kindBtn" data-k="${k}" ${ok ? '' : 'disabled'}>
          <b>${d.name}</b><span>${costText(d.cost)}</span><small>${outputText(k)}</small>${ok ? '' : '<em>Chưa đủ tài nguyên</em>'}</button>`;
      }).join('')}</div>
      <div class="actions"><button type="button" class="btn ghost" id="pCancel">Huỷ</button></div>`, el => {
      el.querySelectorAll('[data-k]').forEach(btn => btn.onclick = () => { build(plot, btn.dataset.k); hideTip(); showOnly(null); });
      $('pCancel').onclick = () => showOnly(null);
    });
  } else {
    const d = BUILDING_DEFS[kind];
    showCard(`<p class="eyebrow">Công trình</p><h2>${d.name}</h2><p class="desc">${d.desc}</p>
      <p class="stat">${outputText(kind)}</p>
      <div class="actions"><button type="button" class="btn ghost" id="pCancel">Đóng</button></div>`, el => { $('pCancel').onclick = () => showOnly(null); });
  }
}

const tip = () => $('tip');
function showTip(i) {
  const b = plotBox(i), t = tip();
  t.textContent = S.grid[i] ? tipText(S.grid[i]) : emptyTip();
  const below = b.y < 260;
  t.classList.toggle('below', below);
  t.style.left = `${((b.x + b.w / 2) / W) * 100}%`;
  t.style.top = `${((below ? b.y + b.h : b.y) / H) * 100}%`;
  t.hidden = false;
}
function emptyTip() {
  const k = unlockedKinds();
  return ['Ô đất trống', `Có thể xây: ${k.map(x => BUILDING_DEFS[x].name).join(', ')}`].join('\n');
}
function hideTip() { tip().hidden = true; }

export function initPlots(n) {
  $('plots').innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" class="plot" data-plot="${i}"></button>`).join('');
  $('plots').querySelectorAll('.plot').forEach(btn => {
    const i = +btn.dataset.plot, b = plotBox(i);
    Object.assign(btn.style, {
      left: `${(b.x / W) * 100}%`, top: `${(b.y / H) * 100}%`, width: `${(b.w / W) * 100}%`, height: `${(b.h / H) * 100}%`,
    });
    btn.onclick = () => onPlotClick(i);
    btn.onpointerenter = () => showTip(i);
    btn.onfocus = () => showTip(i);
    btn.onpointerleave = hideTip;
    btn.onblur = hideTip;
  });
}
export function updatePlots() {
  $('plots').querySelectorAll('.plot').forEach(btn => {
    const kind = S.grid[btn.dataset.plot];
    btn.setAttribute('aria-label', plotLabel(kind));
    btn.classList.toggle('filled', !!kind);
  });
}

// Lời dẫn: hiện một lần khi đạt mốc dân số mới. Save cũ chưa có seenMs thì coi như đã xem mốc hiện tại.
export function checkMilestone() {
  const idx = milestoneIndex(S.pop);
  if (S.seenMs === undefined) { S.seenMs = idx; save(); return; }
  if (idx <= S.seenMs) return;
  S.seenMs = idx; save();
  const m = MILESTONES[idx];
  showCard(`<p class="eyebrow">${m.reign}</p><h2>${m.title}</h2><p class="lore">${m.text}</p>
    <div class="actions"><button type="button" class="btn" id="pCancel">Tiếp tục</button></div>`, () => { $('pCancel').onclick = () => showOnly(null); });
}
