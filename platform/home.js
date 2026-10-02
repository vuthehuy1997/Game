// Trang chủ: danh sách game dạng thẻ, tiến độ của người chơi và cài đặt chung.
import { GAMES } from './games.js';
import { SETTINGS, saveSettings, resetSettings } from './core/settings.js';
import { ac, tone } from './core/audio.js';
import { $, esc } from './core/util.js';

const fmtDay = ts => new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
// Một game hỏng meta không được làm hỏng cả trang chủ
const safe = (fn, fallback = null) => { try { return fn(); } catch (e) { console.error(e); return fallback; } };

function cardHtml(g) {
  const pr = g.progress ? safe(() => g.progress()) : null;
  return `<li><a class="card" href="${esc(g.url)}" data-game="${esc(g.id)}">
    <canvas class="cover" width="640" height="360" aria-hidden="true"></canvas>
    <div class="body">
      <h2>${esc(g.title)}</h2>
      <p class="tagline">${esc(g.tagline || '')}</p>
      <p class="desc">${esc(g.desc || '')}</p>
      <ul class="tags">${(g.tags || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="progress">${pr
        ? `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pr.pct * 100)}"><i style="width:${Math.round(pr.pct * 100)}%"></i></div>
           <p>${esc(pr.text)}${pr.updated ? ` · chơi lần cuối ${fmtDay(pr.updated)}` : ''}</p>`
        : '<p>Chưa chơi</p>'}</div>
      <span class="play">${pr ? 'Chơi tiếp' : 'Chơi'} →</span>
    </div></a></li>`;
}
function renderGames() {
  $('games').innerHTML = GAMES.map(cardHtml).join('');
  $('count').textContent = `${GAMES.length} game`;
  const paint = () => GAMES.forEach(g => {
    const cv = document.querySelector(`[data-game="${g.id}"] .cover`);
    if (g.cover) safe(() => g.cover(cv)); else placeholderCover(cv, g.title);
  });
  paint();
  if (document.fonts) document.fonts.ready.then(paint);
}
function placeholderCover(cv, title) {
  const c = cv.getContext('2d');
  c.fillStyle = '#2b3350'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#ffffffcc'; c.font = '600 44px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(title, cv.width / 2, cv.height / 2 + 14, cv.width - 60);
}

function bindSettings() {
  const dlg = $('settings'), music = $('setMusic'), sfx = $('setSfx'), shake = $('setShake'), touch = $('setTouch');
  const fill = () => {
    music.value = SETTINGS.music; $('outMusic').textContent = SETTINGS.music;
    sfx.value = SETTINGS.sfx; $('outSfx').textContent = SETTINGS.sfx;
    shake.checked = SETTINGS.shake; touch.value = SETTINGS.touch;
  };
  $('openSettings').onclick = () => { fill(); dlg.showModal(); };
  music.oninput = () => { SETTINGS.music = +music.value; $('outMusic').textContent = music.value; saveSettings(); };
  music.onchange = () => { ac(); tone(392, .3, 'triangle', .05, 0, 0, 'music'); };
  sfx.oninput = () => { SETTINGS.sfx = +sfx.value; $('outSfx').textContent = sfx.value; saveSettings(); };
  sfx.onchange = () => { ac(); tone(988, .08, 'square', .05); };
  shake.onchange = () => { SETTINGS.shake = shake.checked; saveSettings(); };
  touch.onchange = () => { SETTINGS.touch = touch.value; saveSettings(); };
  $('setReset').onclick = () => { resetSettings(); fill(); };
}

renderGames();
bindSettings();
// Quay lại trang chủ bằng nút Back của trình duyệt: trang lấy từ bộ nhớ đệm nên phải vẽ lại tiến độ
addEventListener('pageshow', e => { if (e.persisted) renderGames(); });
