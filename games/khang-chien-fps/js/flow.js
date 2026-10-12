// Màn hình thẻ (chọn chiến dịch, chọn màn, lời dẫn, kết quả, tạm dừng) — cùng khuôn .cardWrap/.card
// dùng ở các game khác trong Game Hub.
import { $ } from '../../../platform/core/util.js';
import { CAMPAIGNS } from './data.js';
import { G, S, loadLevel, curCampaign } from './state.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}

function campaignUnlocked(ci) { return ci === 0 || (S.progress[ci - 1] || 0) >= CAMPAIGNS[ci - 1].levels.length; }
function levelUnlocked(ci, li) { return campaignUnlocked(ci) && li <= (S.progress[ci] || 0); }

export function toCampaignMenu() {
  G.mode = 'menu';
  showCard(`<p class="eyebrow">Kháng Chiến Cứu Quốc</p><h2>Chọn chiến dịch</h2>
    <div class="levels">${CAMPAIGNS.map((c, i) => `<button type="button" class="lvBtn" data-ci="${i}" ${campaignUnlocked(i) ? '' : 'disabled'}>
      <span class="lvNo">${c.year}</span><span class="lvName">${c.name}</span>
      <span class="lvStars">${S.progress[i] || 0}/${c.levels.length} màn</span></button>`).join('')}</div>`, el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => toLevelMenu(+b.dataset.ci));
  });
}

export function toLevelMenu(ci) {
  const c = CAMPAIGNS[ci];
  showCard(`<p class="eyebrow">${c.name} · ${c.year}</p><h2>Chọn màn</h2>
    <p class="story">${c.lore}</p>
    <div class="levels">${c.levels.map((lv, i) => `<button type="button" class="lvBtn" data-li="${i}" ${levelUnlocked(ci, i) ? '' : 'disabled'}>
      <span class="lvNo">Màn ${i + 1}</span><span class="lvName">${lv.name}</span></button>`).join('')}</div>
    <div class="actions"><button type="button" class="btn ghost" id="bBack">Chiến dịch khác</button></div>`, el => {
    $('bBack').onclick = toCampaignMenu;
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => showIntro(ci, +b.dataset.li));
  });
}

export function showIntro(ci, li) {
  const c = CAMPAIGNS[ci], lv = c.levels[li];
  showCard(`<p class="eyebrow">${c.name} · Màn ${li + 1}/${c.levels.length}</p><h2>${lv.name}</h2>
    ${li === 0 ? `<p class="story">${c.lore}</p>` : ''}
    <p class="story"><b>Nhiệm vụ:</b> ${lv.brief}</p>
    <div class="actions">
      <button type="button" class="btn ghost" id="iBack">Chọn màn khác</button>
      <button type="button" class="btn" id="iGo">Xuất quân</button>
    </div>`, el => {
    $('iBack').onclick = () => toLevelMenu(ci);
    $('iGo').onclick = () => { loadLevel(ci, li); showOnly(null); };
  });
}

export function showResult(won, campaignDone) {
  const c = curCampaign(), li = G.level;
  showCard(`<p class="eyebrow">${c.name} · Màn ${li + 1}</p><h2>${won ? (campaignDone ? 'Hoàn thành chiến dịch!' : 'Hoàn thành màn!') : 'Hy sinh…'}</h2>
    <p class="story">${won ? (campaignDone ? 'Chiến dịch kết thúc thắng lợi.' : 'Tiếp tục tiến lên.') : 'Đồng đội sẽ tiếp bước. Thử lại lần nữa.'}</p>
    <div class="actions">
      <button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
      <button type="button" class="btn" id="rGo">${won ? (campaignDone ? 'Chọn chiến dịch' : 'Màn kế') : 'Thử lại'}</button>
    </div>`, el => {
    $('rMenu').onclick = () => toLevelMenu(G.campaign);
    $('rGo').onclick = won
      ? (campaignDone ? toCampaignMenu : () => showIntro(G.campaign, li + 1))
      : () => { loadLevel(G.campaign, li); showOnly(null); };
  });
}

export function showPause() {
  showCard(`<p class="eyebrow">${curCampaign().name} · Màn ${G.level + 1}</p><h2>Tạm dừng</h2>
    <div class="actions">
      <button type="button" class="btn ghost" id="pMenu">Chọn màn</button>
      <button type="button" class="btn" id="pGo">Tiếp tục</button>
    </div>`, el => {
    $('pMenu').onclick = () => toLevelMenu(G.campaign);
    $('pGo').onclick = () => { G.mode = 'play'; showOnly(null); };
  });
}
