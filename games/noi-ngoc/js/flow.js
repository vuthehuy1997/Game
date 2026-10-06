import { $ } from '../../../platform/core/util.js';
import { CHAPTERS, LEVELS, S, unlocked, chapterOf } from './data.js';
import { startLevel } from './match3.js';
import { G } from './state.js';

const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}
export function toMenu() {
  G.mode = 'menu';
  showCard(`<p class="eyebrow">Ngọc đá thời Lý</p><h2>Chọn màn</h2>` + CHAPTERS.map(ch => `
    <p class="chapter">${ch.name}</p>
    <div class="levels">${ch.levels.map(i => `<button type="button" class="lvBtn" data-lv="${i}" ${unlocked(i) ? '' : 'disabled'}>
      <b>Màn ${i + 1} · ${LEVELS[i].title}</b><span class="stars">${stars(S.stars[i] || 0)}</span></button>`).join('')}</div>`).join(''), el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => showIntro(+b.dataset.lv));
  });
}
export function showIntro(i) {
  const L = LEVELS[i], ch = chapterOf(i);
  showCard(`<p class="eyebrow">${ch.name} · Màn ${i + 1}</p><h2>${L.title}</h2>
    <p class="intro">${L.intro}</p>
    <p class="meta">Mục tiêu ${L.target} điểm · ${L.moves} lượt</p>
    <div class="actions"><button type="button" class="btn ghost" id="iBack">Quay lại</button><button type="button" class="btn" id="iGo">Bắt đầu</button></div>`, () => {
    $('iBack').onclick = toMenu;
    $('iGo').onclick = () => { startLevel(i); showOnly(null); };
  });
}
export function showResult() {
  const L = LEVELS[G.level], last = G.level === LEVELS.length - 1;
  const head = G.won ? `Đạt mục tiêu! <span class="stars">${stars(G.stars)}</span>` : 'Hết lượt…';
  const body = G.won ? `<p class="outro">${L.outro}</p>` : `<p class="meta">Còn thiếu ${L.target - G.score} điểm.</p>`;
  showCard(`<p class="eyebrow">Màn ${G.level + 1} · ${L.title}</p><h2>${head}</h2>
    <p class="meta">Điểm: ${G.score} / ${L.target}</p>${body}
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
    <button type="button" class="btn" id="rGo">${G.won ? (last ? 'Kết thúc' : 'Màn kế') : 'Thử lại'}</button></div>`, () => {
    $('rMenu').onclick = toMenu;
    $('rGo').onclick = G.won
      ? (last ? showEnding : () => showIntro(G.level + 1))
      : () => { startLevel(G.level); showOnly(null); };
  });
}
export function showEnding() {
  const total = S.stars.reduce((a, b) => a + (b || 0), 0), max = LEVELS.length * 3;
  showCard(`<p class="eyebrow">Ngọc đá thời Lý</p><h2>Sông núi đã khắc</h2>
    <p class="intro">Bia đá đã khắc xong. Tổng cộng ${total}/${max} ★ qua ${LEVELS.length} màn.</p>
    <div class="actions"><button type="button" class="btn" id="eMenu">Chọn màn</button></div>`, () => { $('eMenu').onclick = toMenu; });
}
