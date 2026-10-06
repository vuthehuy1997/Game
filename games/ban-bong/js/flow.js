import { $ } from '../../../platform/core/util.js';
import { LEVELS, S, unlocked } from './data.js';
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
  showCard(`<p class="eyebrow">Bắn Bóng · Cung thủ dưới đền cổ</p><h2>Chọn màn</h2>
    <p class="lore">Kỷ lục: ${S.best || 0} điểm · đã qua ${S.maxLevel}/${LEVELS.length} màn</p>
    <div class="levels">${LEVELS.map((l, i) => `<button type="button" class="lvBtn" data-lv="${i}" ${unlocked(i) ? '' : 'disabled'}>
      <b>Màn ${i + 1}</b><span>${l.name}</span></button>`).join('')}</div>`, el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => { startLevel(+b.dataset.lv); showOnly(null); });
  });
}
export function showResult() {
  const lv = LEVELS[G.level];
  showCard(`<p class="eyebrow">Màn ${G.level + 1} · ${lv.name}</p><h2>${G.won ? 'Sạch lưới!' : 'Bóng tràn xuống…'}</h2>
    <p class="lore">${G.won ? 'Đền cổ đã được giữ vững. Quân giặc lui về bờ bên kia.' : 'Giặc đã vượt tuyến. Hãy ngắm lại và thử lần nữa.'}</p>
    <dl class="stats">
      <div><dt>Điểm</dt><dd>${G.score}</dd></div>
      <div><dt>Combo cao nhất</dt><dd>x${Math.max(1, G.maxCombo)}</dd></div>
      <div><dt>Bóng đã nổ</dt><dd>${G.popped}</dd></div>
      <div><dt>Kỷ lục</dt><dd>${S.best}</dd></div>
    </dl>
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
    <button type="button" class="btn" id="rGo">${G.won ? (G.level + 1 < LEVELS.length ? 'Màn kế' : 'Chơi lại') : 'Thử lại'}</button></div>`, el => {
    $('rMenu').onclick = toMenu;
    $('rGo').onclick = G.won
      ? () => { startLevel(Math.min(G.level + 1, LEVELS.length - 1)); showOnly(null); }
      : () => { startLevel(G.level); showOnly(null); };
  });
}
