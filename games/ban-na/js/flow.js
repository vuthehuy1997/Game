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
const stars = n => [0, 1, 2].map(i => `<span class="star${i < n ? ' on' : ''}">★</span>`).join('');

export function toMenu() {
  G.mode = 'menu';
  showCard(`<p class="eyebrow">Ải Chi Lăng · 1427</p><h2>Chọn màn</h2>
    <div class="levels">${LEVELS.map((L, i) => `<button type="button" class="lvBtn" data-lv="${i}" ${unlocked(i) ? '' : 'disabled'}>
      <span class="lvNo">Màn ${i + 1}</span><span class="lvName">${L.title}</span>
      <span class="lvStars">${stars(S.best?.[i] || 0)}</span></button>`).join('')}</div>`, el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => showIntro(+b.dataset.lv));
  });
}

// Lời dẫn trước màn: có thể bỏ qua bằng nút quay lại.
export function showIntro(i) {
  const L = LEVELS[i];
  showCard(`<p class="eyebrow">Ải Chi Lăng · Màn ${i + 1}/${LEVELS.length}</p><h2>${L.title}</h2>
    ${L.story.map(p => `<p class="story">${p}</p>`).join('')}
    <div class="actions">
      <button type="button" class="btn ghost" id="iBack">Chọn màn khác</button>
      <button type="button" class="btn" id="iGo">Xuất quân</button>
    </div>`, el => {
    $('iBack').onclick = toMenu;
    $('iGo').onclick = () => { startLevel(i); showOnly(null); };
  });
}

export function showResult() {
  const L = LEVELS[G.level], last = G.level >= LEVELS.length - 1;
  const title = G.won ? (last ? 'Chi Lăng đại thắng!' : 'Phá xong!') : 'Hết đạn…';
  const next = G.won && !last;
  showCard(`<p class="eyebrow">Màn ${G.level + 1} · ${L.title}</p><h2>${title}</h2>
    ${G.won ? `<div class="stars">${stars(G.stars)}</div><p class="story">${L.outro}</p>` : '<p class="story">Giặc vẫn còn đứng vững. Đổi góc bắn rồi thử lại.</p>'}
    <div class="actions">
      <button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
      <button type="button" class="btn" id="rGo">${next ? 'Màn kế' : G.won ? 'Chơi lại' : 'Thử lại'}</button>
    </div>`, el => {
    $('rMenu').onclick = toMenu;
    $('rGo').onclick = next
      ? () => showIntro(G.level + 1)
      : G.won ? () => showIntro(G.level) : () => { startLevel(G.level); showOnly(null); };
  });
}
