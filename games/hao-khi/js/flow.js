// Luồng game: màn hình chính, ô lưu, cài đặt, bản đồ hành quân, hội thoại, thẻ sử ký,
// luyện công, tạm dừng, thua, kết thúc.
import { drawBust } from '../../../platform/art/chibi.js';
import { ell } from '../../../platform/art/draw.js';
import { ac } from '../../../platform/core/audio.js';
import { pressed } from '../../../platform/core/input.js';
import { $, clamp, fmtTime, esc } from '../../../platform/core/util.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { SFX, startMusic } from './audio.js';
import { SPK, STAGES, MAIN, EDEF, UPS, upCost, MAP_POINTS, SKILLS, BRANCHES, xpNeed, CH_COINS, CHALS, MILESTONES, totalStars, ms, RUSH_BONUS, makeArena, PATH_LV, PATH_COST, PATHS, ITEMS } from './data.js';
import { applyTouch } from './input.js';
import { LOOKS } from './looks.js';
import { render } from './render.js';
import { DEFAULT_CFG, DIFF, TEXT_SPEED, STORE, CFG, S, sk, persist, save, useSlot, exportCode, importCode } from './save.js';
import { W, H, starStr, G, P, setAlly } from './state.js';
import { dropItem, resetWorld } from './world.js';

// Khi có lớp phủ (menu, hội thoại, thẻ) thì ẩn nút cảm ứng để chúng không che và nuốt lượt bấm của các nút trên thẻ.
export function showOnly(id) { ['menu', 'dlgWrap', 'cardWrap'].forEach(k => $(k).hidden = k !== id); $('stage').classList.toggle('covered', !!id); }
export function resumePlay() { G.mode = 'play'; showOnly(null); }
export function banner(text, sub, dur = 2.6) { G.banner = { text, sub, t: 0, dur }; }
// thời gian chơi của lượt này (đánh lại từ điểm lưu thì không tính lại phần trước boss)
export const playedNow = () => G.time - (G.cpUsed && G.cp ? G.cp.time : 0);
export const fmtDate = ts => ts ? new Date(ts).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

// Ải chính đi theo thứ tự (MAIN ải); ải ngoại truyện (side) nằm ngoài tiến trình, mở bằng mốc sao
export const unlocked = i => STAGES[i].side ? ms('side') : i <= S.maxStage;
export const stageLabel = i => i < 0 ? G.st.label : STAGES[i].side ? 'Ngoại truyện' : `Ải ${i + 1}`;
export const heroName = () => SPK[G.st.hero || 'hero'].short;

export function toTitle() {
  G.mode = 'title'; resetWorld(0); setAlly(null); P.x = 300; showOnly('menu');
}
export function startStage(i) {
  if (!STAGES[i].side) { S.stage = i; S.maxStage = Math.max(S.maxStage || 0, i); }
  save(); resetWorld(i);
  runDialog(STAGES[i].intro, () => { resumePlay(); banner(`${stageLabel(i)} · ${STAGES[i].name}`, STAGES[i].year); SFX.gong(); });
}

/* ---------------- Hội thoại ---------------- */
export let DLG = null;
export function runDialog(lines, done) {
  G.mode = 'dialog'; DLG = { lines, i: 0, done, shown: 0 }; showOnly('dlgWrap'); paintLine();
}
export function paintLine() {
  const [who] = DLG.lines[DLG.i], sp = SPK[who];
  $('who').textContent = sp.name; $('txt').textContent = '';
  $('dlg').classList.toggle('narr', !sp.look);
  const pc = $('portrait'); pc.hidden = !sp.look;
  if (sp.look) drawPortrait(pc, sp.look);
}
export function advanceDialog() {
  if (!DLG) return;
  const full = DLG.lines[DLG.i][1];
  if (DLG.shown < full.length) { DLG.shown = full.length; $('txt').textContent = full; return; }
  DLG.i++; DLG.shown = 0;
  if (DLG.i >= DLG.lines.length) endDialog(); else paintLine();
}
export function endDialog() { if (!DLG) return; const d = DLG.done; DLG = null; d(); }
export function updateDialog(dt) {
  if (!DLG) return;
  const full = DLG.lines[DLG.i][1];
  if (DLG.shown < full.length) { DLG.shown = Math.min(full.length, DLG.shown + dt * TEXT_SPEED[CFG.textSpeed].cps); $('txt').textContent = full.slice(0, DLG.shown | 0); }
}
export const drawPortrait = (canvas, look) => drawBust(canvas, LOOKS[look]);

/* ---------------- Thẻ ---------------- */
export function showCard(html, onRender, mode = 'card') {
  G.mode = mode;
  $('card').innerHTML = html; showOnly('cardWrap'); $('card').scrollTop = 0;
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}

/* ---------------- Ô lưu ---------------- */
export function slotsCard(msg = '') {
  const rows = STORE.slots.map((sv, i) => {
    if (!sv) return `<div class="slot empty"><div class="info"><b>Ô ${i + 1} · Trống</b><small>Bắt đầu một hành trình mới</small></div>
      <div class="acts"><button class="btn" data-new="${i}">Bắt đầu</button></div></div>`;
    const ups = sv.up.atk + sv.up.hp + sv.up.mp;
    return `<div class="slot"><div class="info"><b>Ô ${i + 1} · Ải ${sv.stage + 1}: ${STAGES[sv.stage].name}</b>
      <small>${sv.coins} văn · ${totalStars(sv)}/${STAGES.length * 3} ★ · luyện công ${ups} tầng · đã chơi ${fmtTime(sv.play || 0)}</small>
      <small>Lưu lúc ${fmtDate(sv.updated)}</small></div>
      <div class="acts"><button class="btn" data-play="${i}">Chơi tiếp</button><button class="btn ghost" data-exp="${i}">Xuất mã</button><button class="btn ghost" data-del="${i}">Xoá</button></div></div>`;
  }).join('');
  showCard(`<p class="eyebrow">Sổ hành trình</p><h2>Chọn ô lưu</h2>
    <p class="note">Game tự lưu khi bắt đầu mỗi ải, sau khi thắng và khi luyện công. Dữ liệu nằm trong trình duyệt này; muốn chuyển sang máy khác thì dùng <b>Xuất mã</b> rồi <b>Nhập mã lưu</b>.</p>
    ${msg ? `<p class="status">${esc(msg)}</p>` : ''}
    <div class="slots">${rows}</div>
    <div class="actions"><button class="btn ghost" id="slBack">Quay lại</button><button class="btn ghost" id="slImport">Nhập mã lưu</button></div>`, el => {
    el.querySelectorAll('[data-new]').forEach(b => b.onclick = () => { useSlot(+b.dataset.new, true); startStage(0); });
    el.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { useSlot(+b.dataset.play); showMap(S.stage, 'continue'); });
    el.querySelectorAll('[data-exp]').forEach(b => b.onclick = () => exportCard(+b.dataset.exp));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      if (b.dataset.armed) { STORE.slots[+b.dataset.del] = null; persist(); slotsCard(`Đã xoá ô ${+b.dataset.del + 1}.`); }
      else { b.dataset.armed = 1; b.textContent = 'Bấm lần nữa để xoá'; b.classList.add('danger'); }
    });
    el.querySelector('#slImport').onclick = importCard;
    el.querySelector('#slBack').onclick = toTitle;
  });
}
export function exportCard(i) {
  const code = exportCode(STORE.slots[i]);
  showCard(`<p class="eyebrow">Ô ${i + 1}</p><h2>Mã lưu</h2>
    <p>Sao chép đoạn mã này, mở game trên máy khác, chọn <b>Chơi → Nhập mã lưu</b> rồi dán vào.</p>
    <textarea id="codeOut" class="code" rows="4" readonly>${code}</textarea>
    <p class="status" id="cpMsg" aria-live="polite"></p>
    <div class="actions"><button class="btn ghost" id="exBack">Quay lại</button><button class="btn" id="exCopy">Sao chép</button></div>`, el => {
    const ta = el.querySelector('#codeOut');
    el.querySelector('#exCopy').onclick = () => {
      const done = ok => { el.querySelector('#cpMsg').textContent = ok ? 'Đã sao chép.' : 'Không sao chép tự động được, mã đã được bôi đen: bấm Ctrl+C.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => done(true), () => { ta.focus(); ta.select(); done(false); });
      else { ta.focus(); ta.select(); done(false); }
    };
    el.querySelector('#exBack').onclick = () => slotsCard();
  });
}
export function importCard() {
  showCard(`<p class="eyebrow">Sổ hành trình</p><h2>Nhập mã lưu</h2>
    <label for="codeIn">Dán mã bắt đầu bằng <code>HKDA1:</code></label>
    <textarea id="codeIn" class="code" rows="4" placeholder="HKDA1:..."></textarea>
    <p class="status" id="imMsg" aria-live="polite"></p>
    <div class="actions">${STORE.slots.map((sv, i) => `<button class="btn ghost" data-into="${i}">Vào ô ${i + 1}${sv ? ' (ghi đè)' : ''}</button>`).join('')}<button class="btn ghost" id="imBack">Quay lại</button></div>`, el => {
    el.querySelectorAll('[data-into]').forEach(b => b.onclick = () => {
      const data = importCode(el.querySelector('#codeIn').value);
      if (!data) { el.querySelector('#imMsg').textContent = 'Mã không hợp lệ. Kiểm tra lại xem đã sao chép đủ cả đoạn chưa.'; return; }
      STORE.slots[+b.dataset.into] = data; persist();
      slotsCard(`Đã nhập vào ô ${+b.dataset.into + 1}: Ải ${data.stage + 1}, ${data.coins} văn.`);
    });
    el.querySelector('#imBack').onclick = () => slotsCard();
  });
}

/* ---------------- Cài đặt ---------------- */
export function settingsCard(back, mode = 'card') {
  const seg = (key, opts) => `<div class="seg" role="group">${opts.map((o, i) => `<button type="button" data-k="${key}" data-v="${i}" aria-pressed="${CFG[key] === i}">${o}</button>`).join('')}</div>`;
  const TOUCH = ['auto', 'on', 'off'];
  showCard(`<p class="eyebrow">Tuỳ chỉnh</p><h2>Cài đặt</h2>
    <div class="settings">
      <label for="stMusic">Nhạc nền</label><div class="rng"><input type="range" id="stMusic" min="0" max="100" step="5" value="${CFG.music}"><output id="oMusic">${CFG.music}</output></div>
      <label for="stSfx">Hiệu ứng âm thanh</label><div class="rng"><input type="range" id="stSfx" min="0" max="100" step="5" value="${CFG.sfx}"><output id="oSfx">${CFG.sfx}</output></div>
      <span>Độ khó</span><div>${seg('diff', DIFF.map(d => d.name))}<small id="diffDesc">${DIFF[CFG.diff].desc}</small></div>
      <span>Tốc độ chữ</span>${seg('textSpeed', TEXT_SPEED.map(t => t.name))}
      <label for="stShake">Rung màn hình</label><input type="checkbox" id="stShake" ${CFG.shake ? 'checked' : ''}>
      <label for="stDmg">Hiện số sát thương</label><input type="checkbox" id="stDmg" ${CFG.dmgNum ? 'checked' : ''}>
      <span>Nút cảm ứng</span><div class="seg" role="group">${['Tự động', 'Luôn bật', 'Tắt'].map((n, i) => `<button type="button" data-touch="${TOUCH[i]}" aria-pressed="${CFG.touch === TOUCH[i]}">${n}</button>`).join('')}</div>
    </div>
    <details class="keyref"><summary>Phím điều khiển</summary>
      <p><kbd>A</kbd> <kbd>D</kbd> đi trái, phải · <kbd>W</kbd> <kbd>S</kbd> đổi làn · <kbd>Space</kbd> nhảy · <kbd>Shift</kbd> lướt · <kbd>J</kbd> đánh · <kbd>K</kbd> <kbd>L</kbd> <kbd>I</kbd> <kbd>O</kbd> <kbd>H</kbd> (hoặc <kbd>1</kbd>–<kbd>5</kbd>) năm kỹ năng · <kbd>U</kbd> tuyệt kỹ · <kbd>Q</kbd> bánh chưng · <kbd>E</kbd> rượu nếp · <kbd>P</kbd>/<kbd>Esc</kbd> tạm dừng. Phím mũi tên dùng thay WASD được.</p>
    </details>
    <p class="note">Độ khó đổi ngay cho đợt giặc tiếp theo.</p>
    <div class="actions"><button class="btn ghost" id="stReset">Mặc định</button><button class="btn" id="stDone">Xong</button></div>`, el => {
    const bindRange = (id, out, key, preview) => {
      const inp = el.querySelector(id);
      inp.oninput = () => { CFG[key] = +inp.value; el.querySelector(out).textContent = inp.value; persist(); };
      inp.onchange = preview;
    };
    bindRange('#stMusic', '#oMusic', 'music', () => startMusic());
    bindRange('#stSfx', '#oSfx', 'sfx', () => SFX.coin());
    el.querySelectorAll('.seg [data-k]').forEach(b => b.onclick = () => {
      CFG[b.dataset.k] = +b.dataset.v; persist();
      el.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach(o => o.setAttribute('aria-pressed', o === b));
      if (b.dataset.k === 'diff') el.querySelector('#diffDesc').textContent = DIFF[CFG.diff].desc;
    });
    el.querySelectorAll('[data-touch]').forEach(b => b.onclick = () => {
      CFG.touch = b.dataset.touch; persist(); applyTouch();
      el.querySelectorAll('[data-touch]').forEach(o => o.setAttribute('aria-pressed', o === b));
    });
    el.querySelector('#stShake').onchange = e => { CFG.shake = e.target.checked; persist(); };
    el.querySelector('#stDmg').onchange = e => { CFG.dmgNum = e.target.checked; persist(); };
    el.querySelector('#stReset').onclick = () => { Object.assign(CFG, DEFAULT_CFG); persist(); applyTouch(); settingsCard(back, mode); };
    el.querySelector('#stDone').onclick = back;
  }, mode);
}

/* ---------------- Bản đồ hành quân ---------------- */
export const MAP_W = 640, MAP_H = 340;
export const proj = (lon, lat) => [30 + (lon - 105.6) / 2.1 * 580, 20 + (21.5 - lat) / 1.1 * 300];
export const COAST = [[106.1, 20.2], [106.4, 20.45], [106.55, 20.6], [106.7, 20.75], [106.8, 20.9], [106.95, 21.0], [107.1, 20.98], [107.3, 21.05], [107.5, 21.2], [107.7, 21.35], [107.9, 21.5]];
export const RIVERS = [
  [[105.6, 21.35], [105.75, 21.15], [105.85, 21.03], [105.95, 20.9], [106.05, 20.75], [106.2, 20.55], [106.35, 20.35]],   // sông Hồng
  [[105.85, 21.03], [106.1, 21.08], [106.38, 21.12], [106.55, 21.0], [106.7, 20.95], [106.8, 20.9]],                      // sông Đuống, sông Thái Bình ra Bạch Đằng
];
export function drawMap(cvs, sel, t) {
  const c = cvs.getContext('2d');
  c.fillStyle = '#efe1bf'; c.fillRect(0, 0, MAP_W, MAP_H);
  // biển
  c.fillStyle = '#9cc3cc'; c.beginPath();
  COAST.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.lineTo(MAP_W + 10, -10); c.lineTo(MAP_W + 10, MAP_H + 10); c.lineTo(proj(...COAST[0])[0], MAP_H + 10); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) { const x = 420 + (i % 3) * 70 + Math.sin(t + i) * 4, y = 210 + Math.floor(i / 3) * 40; c.beginPath(); c.arc(x, y, 9, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  c.strokeStyle = '#5d7f86'; c.lineWidth = 2.5; c.beginPath();
  COAST.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
  // đảo quanh Vân Đồn, Hạ Long
  [[107.42, 21.07, 9], [107.52, 21.0, 6], [107.3, 20.95, 5], [107.62, 21.12, 7], [107.15, 20.9, 4], [107.2, 20.82, 5]].forEach(([lo, la, r]) => { const [x, y] = proj(lo, la); ell(c, x, y, r * 1.5, r, '#d9c79c'); });
  // núi phía tây bắc
  c.fillStyle = '#c9b182';
  [[60, 50], [95, 35], [130, 60], [40, 90], [170, 40], [210, 30], [250, 55]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x - 14, y + 12); c.lineTo(x, y - 8); c.lineTo(x + 14, y + 12); c.fill(); });
  // sông
  c.strokeStyle = '#6f9fb0'; c.lineWidth = 3; c.lineCap = 'round';
  RIVERS.forEach(r => { c.beginPath(); r.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); });
  // chữ
  c.textAlign = 'center'; c.fillStyle = 'rgba(58,38,22,.35)'; c.font = `34px ${FD}`; c.fillText('Đại Việt', 170, 290);
  c.fillStyle = 'rgba(40,80,95,.55)'; c.font = `18px ${FB}`; c.fillText('Vịnh Bắc Bộ', 520, 300);
  // đường hành quân
  const pts = MAP_POINTS.map(m => proj(m.lon, m.lat));
  c.setLineDash([7, 6]); c.lineDashOffset = -t * 20; c.lineWidth = 2.5;
  for (let i = 1; i < MAIN; i++) {
    c.strokeStyle = i <= S.maxStage ? '#a3261d' : 'rgba(58,38,22,.25)';
    c.beginPath(); c.moveTo(...pts[i - 1]); c.lineTo(...pts[i]); c.stroke();
  }
  c.setLineDash([]);
  // địa điểm
  pts.forEach(([x, y], i) => {
    const open = unlocked(i), won = (S.stars[i] || 0) > 0, side = STAGES[i].side;
    if (i === sel) { c.strokeStyle = '#a3261d'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 14 + Math.sin(t * 4) * 3, 0, Math.PI * 2); c.stroke(); }
    ell(c, x, y, 9, 9, won ? '#e9b949' : open ? (side ? '#3f8f78' : '#a3261d') : '#b5a586');
    c.strokeStyle = '#3a2616'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
    c.fillStyle = won ? '#3a2616' : '#f4e7c9'; c.font = `bold 11px ${FB}`; c.textAlign = 'center'; c.fillText(side ? '✦' : String(i + 1), x, y + 4);
    // vị trí nhãn riêng cho từng điểm để Phù Ủng và Hàm Tử (rất gần nhau) không đè lên nhau
    const [lx, ly, al] = [[14, 20, 'left'], [0, -15, 'center'], [-14, -10, 'right'], [0, -15, 'center'], [0, -15, 'center'], [0, -15, 'center'], [10, -18, 'center']][i];
    c.textAlign = al; c.font = `${i === sel ? 'bold ' : ''}14px ${FB}`; c.lineWidth = 4; c.strokeStyle = '#efe1bf';
    c.strokeText(MAP_POINTS[i].place, x + lx, y + ly); c.fillStyle = open ? '#3a2616' : 'rgba(58,38,22,.45)'; c.fillText(MAP_POINTS[i].place, x + lx, y + ly);
  });
}
export function showMap(sel, reason) {
  if (!STAGES[sel] || !unlocked(sel)) sel = clamp(sel, 0, S.maxStage);
  const title = reason === 'next' ? `Hành quân đến ${MAP_POINTS[sel].place}` : 'Chọn nơi xuất trận';
  showCard(`<p class="eyebrow">Bản đồ hành quân · ${S.coins} văn · ${totalStars(S)}/${STAGES.length * 3} ★</p><h2 id="mTitle">${title}</h2>
    <canvas id="mapCv" class="map" width="${MAP_W}" height="${MAP_H}" aria-label="Bản đồ các ải"></canvas>
    <div class="chips" role="group" aria-label="Chọn ải">${STAGES.map((st, i) => `<button type="button" data-st="${i}" ${unlocked(i) ? '' : 'disabled'} aria-pressed="${i === sel}">${stageLabel(i)}${S.stars[i] ? ' ' + starStr(S.stars[i]) : ''}${st.side && !unlocked(i) ? ` · cần ${MILESTONES.find(m => m.id === 'side').need}★` : ''}</button>`).join('')}</div>
    <p class="dest" id="mDest"></p>
    <div id="mChal"></div>
    <details class="keyref"><summary>Phần thưởng theo tổng số sao (${totalStars(S)}★) · ${totalCh(S)}/${STAGES.length * CHALS.length} ấn</summary>${milesHtml()}</details>
    <div class="chips modes" role="group" aria-label="Võ đài">
      <button type="button" id="mEndless" ${arenaOpen('endless') ? '' : 'disabled'}>Thí luyện vô tận · ${arenaOpen('endless') ? recText('endless') : 'qua ải 1 để mở'}</button>
      <button type="button" id="mRush" ${arenaOpen('rush') ? '' : 'disabled'}>Đấu tướng · ${arenaOpen('rush') ? recText('rush') : 'thắng Bạch Đằng để mở'}</button>
    </div>
    <p class="note">Bản đồ phỏng theo, vị trí gần đúng, không theo tỉ lệ.</p>
    <div class="actions"><button class="btn ghost" id="mHome">Màn hình chính</button><button class="btn" id="mGo">Luyện công & lên đường</button></div>`, el => {
    const cvs = el.querySelector('#mapCv');
    const setSel = i => {
      sel = i; const st = STAGES[i];
      el.querySelector('#mDest').innerHTML = `<b>${stageLabel(i)} · ${st.name}</b> · ${st.year}${S.stars[i] ? ` · thành tích ${starStr(S.stars[i])}` : ''}`;
      el.querySelector('#mChal').innerHTML = chalHtml(i);
      el.querySelectorAll('[data-st]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.st === i));
    };
    setSel(sel);
    el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => setSel(+b.dataset.st));
    cvs.addEventListener('click', ev => {
      const r = cvs.getBoundingClientRect(), mx = (ev.clientX - r.left) / r.width * MAP_W, my = (ev.clientY - r.top) / r.height * MAP_H;
      MAP_POINTS.forEach((m, i) => { const [x, y] = proj(m.lon, m.lat); if (unlocked(i) && Math.hypot(mx - x, my - y) < 22) setSel(i); });
    });
    const t0 = performance.now();
    const loop = now => { if (!document.body.contains(cvs)) return; drawMap(cvs, sel, (now - t0) / 1000); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    el.querySelector('#mGo').onclick = () => { ac(); startMusic(); const i = sel; openShop(() => startStage(i)); };
    el.querySelector('#mHome').onclick = toTitle;
    el.querySelector('#mEndless').onclick = () => { ac(); startMusic(); openShop(() => startArena('endless'), null, 'Vào võ đài'); };
    el.querySelector('#mRush').onclick = () => { ac(); startMusic(); openShop(() => startArena('rush'), null, 'Vào võ đài'); };
  });
}

/* ---------------- Sau trận ---------------- */
export function stageCleared() {
  G.mode = 'clear'; G.clearT = 2.6; G.slow = 1.2; banner('Chiến thắng!', `${stageLabel(G.stage)} · ${G.st.name}`, 2.4); SFX.gong();
  // sao theo số lần trúng đòn; chơi Dễ (kể cả hạ xuống Dễ giữa trận) thì tối đa 2★
  let stars = G.hits <= 5 ? 3 : G.hits <= 12 ? 2 : 1;
  const capped = G.minDiff === 0 && stars === 3; if (capped) stars = 2;
  const r = G.result = { stars, capped, time: G.time, hits: G.hits, maxCombo: G.maxCombo, diff: G.minDiff };
  const had = S.ch[G.stage] || [], before = totalStars(S);
  r.newCh = CHALS.filter(c => !had.includes(c.id) && c.ok(r, G.st)).map(c => c.id);
  r.bonus = stars * 15 + r.newCh.length * CH_COINS;
  S.ch[G.stage] = had.concat(r.newCh);
  S.coins += r.bonus; S.play = (S.play || 0) + playedNow(); S.stars[G.stage] = Math.max(S.stars[G.stage] || 0, stars);
  const after = totalStars(S);
  r.newMs = MILESTONES.filter(m => before < m.need && after >= m.need).map(m => m.id);
  if (ms('sp') && !S.ms.sp) { S.ms.sp = true; S.sp++; }
  save();
}
export function afterClear() {
  const i = G.stage, st = STAGES[i];
  runDialog(st.outro, () => historyCard(st, () => {
    if (st.side) showMap(i, 'continue');
    else if (i >= MAIN - 1) { S.stage = 0; save(); ending(); }
    else { S.stage = i + 1; S.maxStage = Math.max(S.maxStage, i + 1); save(); showMap(i + 1, 'next'); }
  }));
}
// Ba ấn thử thách của một ải; fresh = các ấn vừa đạt trong trận này
export function chalHtml(i, fresh = []) {
  const st = STAGES[i], had = S.ch[i] || [];
  return `<ul class="chal">${CHALS.map(c => `<li class="${had.includes(c.id) ? 'done' : ''}"><b>${had.includes(c.id) ? '✔' : '○'} ${c.name}</b> ${c.desc(st)}${fresh.includes(c.id) ? ` <em>mới · +${CH_COINS} văn</em>` : ''}</li>`).join('')}</ul>`;
}
export const totalCh = sv => (sv.ch || []).reduce((a, b) => a + (b ? b.length : 0), 0);
export function milesHtml() {
  const n = totalStars(S);
  return `<ul class="miles">${MILESTONES.map(m => `<li class="${n >= m.need ? 'done' : ''}"><b>${m.need}★ ${m.name}</b> ${m.desc}</li>`).join('')}</ul>`;
}
export function historyCard(st, done) {
  const c = st.card, r = G.result;
  showCard(`<p class="eyebrow">${c.eyebrow}</p><h2>${c.title}</h2>
    ${r ? `<div class="result"><span class="stars">${starStr(r.stars)}</span><span>Thời gian ${fmtTime(r.time)}</span><span>Trúng đòn ${r.hits} lần</span><span>Chuỗi dài nhất ${r.maxCombo} đòn</span><span>Thưởng ${r.bonus} văn</span><span>Cấp ${S.lv}${S.sp ? ` · ${S.sp} điểm kỹ năng chưa dùng` : ''}</span></div>
    ${r.capped ? '<p class="note">Độ khó Dễ chỉ cho tối đa 2★. Chơi ở Thường để lấy ★ thứ ba.</p>' : ''}
    ${chalHtml(G.stage, r.newCh)}
    ${r.newMs.map(id => { const m = MILESTONES.find(x => x.id === id); return `<p class="status">Đạt ${m.need}★ · mở ${m.name}: ${m.desc}.</p>`; }).join('')}` : ''}
    <p>${c.text}</p>${c.poem ? `<p class="poem">${c.poem}</p>` : ''}
    <p class="note">Đã lưu tiến độ vào ô ${STORE.cur + 1}.</p>
    <div class="actions"><button class="btn" id="cOk">Tiếp tục</button></div>`,
    el => el.querySelector('#cOk').onclick = done);
}
// Võ đường: tab Luyện công (tiền → chỉ số) và tab Cây kỹ năng (điểm kỹ năng → kỹ năng).
// Từ menu tạm dừng chỉ mở Cây kỹ năng (chỉ số luyện công áp dụng từ ải sau).
export const prevOf = id => { const d = SKILLS[id]; return Object.keys(SKILLS).find(k => SKILLS[k].branch === d.branch && SKILLS[k].tier === d.tier - 1); };
export const canLearn = id => { const d = SKILLS[id]; if (sk(id) >= 3 || S.sp < 1) return false; return d.tier === 0 || sk(prevOf(id)) >= 1; };
export const RESET_COST = 50;
export function openShop(done, tab, goLabel = 'Lên đường', mode = 'card', treeOnly = false) {
  tab = treeOnly ? 'tree' : (tab || (S.sp > 0 ? 'tree' : 'up'));
  const upHtml = () => `<p class="purse">Tiền đồng: <b>${S.coins}</b> văn</p>
    <div class="shop">${UPS.map(u => {
      const lv = S.up[u.k], cost = upCost(lv), max = lv >= 8;
      return `<div class="item"><h3>${u.name}</h3><p>${u.desc}</p><span class="lv">Tầng ${lv}/8</span><button class="btn" data-up="${u.k}" ${S.coins < cost || max ? 'disabled' : ''}>${max ? 'Đã viên mãn' : `Luyện · ${cost} văn`}</button></div>`;
    }).join('')}</div>`;
  const node = id => {
    const d = SKILLS[id], lv = sk(id), prev = prevOf(id), locked = d.tier > 0 && sk(prev) < 1;
    return `<div class="node ${lv ? 'has' : ''} ${locked ? 'locked' : ''}">
      <span class="tag">${d.slot ? `Chủ động · phím ${d.key}` : 'Bị động'}</span>
      <b>${d.name}</b><span class="pips" aria-label="Tầng ${lv}/3">${'●'.repeat(lv)}${'○'.repeat(3 - lv)}</span>
      <p>${d.desc}</p>
      <p>${lv < 3 ? `<b>Tầng ${lv + 1}:</b> ${d.lv[lv]}` : 'Đã đạt tầng cao nhất'}</p>
      ${d.slot ? `<p>${d.mp} nội lực · hồi ${d.cd[Math.max(0, lv - 1)]} giây</p>` : ''}
      ${locked ? `<p>Cần học ${SKILLS[prev].name} trước</p>` : ''}
      ${lv < 3 ? `<button class="btn" data-learn="${id}" ${canLearn(id) ? '' : 'disabled'}>${lv ? 'Nâng tầng' : 'Học'} · 1 điểm</button>` : ''}
    </div>`;
  };
  let spent = 0; // tính lại mỗi lần vẽ: số điểm đã tiêu thay đổi ngay khi học / tẩy tủy
  const treeHtml = () => (spent = Object.values(S.skills).reduce((a, v) => a + v, 0) - 1, `<div class="lvline"><b>Cấp ${S.lv}</b><span>Kinh nghiệm ${S.xp}/${xpNeed(S.lv)}</span><span class="xpbar"><i style="width:${Math.round(100 * S.xp / xpNeed(S.lv))}%"></i></span><b>${S.sp} điểm kỹ năng</b></div>
    <div class="tree">${BRANCHES.map((bn, bi) => `<div class="branch"><h3>${bn}</h3>${Object.keys(SKILLS).filter(k => SKILLS[k].branch === bi).sort((x, y) => SKILLS[x].tier - SKILLS[y].tier).map(node).join('')}</div>`).join('')}</div>
    <p class="note">Lên cấp bằng cách đánh giặc; mỗi cấp được 1 điểm. ${spent > 0 ? `<button class="btn ghost" id="tReset" ${S.coins < RESET_COST ? 'disabled' : ''}>Tẩy tủy: lấy lại ${spent} điểm · ${RESET_COST} văn</button>` : ''}</p>`);
  const pathHtml = () => `<h3 class="sub">Tuyệt học · chọn một${S.lv < PATH_LV ? ` (mở ở cấp ${PATH_LV})` : S.path ? ` · đổi đường khác tốn ${PATH_COST} văn` : ''}</h3>
    <div class="paths" role="group" aria-label="Tuyệt học">${PATHS.map(p => `<button type="button" data-path="${p.id}" aria-pressed="${S.path === p.id}" ${S.lv < PATH_LV || (S.path && S.path !== p.id && S.coins < PATH_COST) ? 'disabled' : ''}><b>${p.name}</b><small>${p.branch}</small><small>${p.desc}</small></button>`).join('')}</div>`;
  const bagHtml = () => `<p class="purse">Tiền đồng: <b>${S.coins}</b> văn</p>
    <div class="shop">${ITEMS.map(it => {
      const n = S.bag[it.id] || 0, full = n >= it.max;
      return `<div class="item"><h3>${it.name}</h3><p>${it.desc} Bấm <kbd>${it.key}</kbd> trong trận.</p><span class="lv">Đang có ${n}/${it.max}</span><button class="btn" data-buy="${it.id}" ${S.coins < it.cost || full ? 'disabled' : ''}>${full ? 'Đã đầy túi' : `Mua · ${it.cost} văn`}</button></div>`;
    }).join('')}</div>
    <p class="note">Đồ đã dùng trong trận là mất, kể cả khi thua.</p>`;
  const render = () => {
    showCard(`<p class="eyebrow">Võ đường Vạn Kiếp</p><h2>${tab === 'tree' ? 'Cây kỹ năng' : tab === 'bag' ? 'Hành trang' : 'Rèn luyện trước trận'}</h2>
      ${treeOnly ? '' : `<div class="tabs" role="tablist"><button role="tab" data-tab="up" aria-selected="${tab === 'up'}">Luyện công</button><button role="tab" data-tab="tree" aria-selected="${tab === 'tree'}">Cây kỹ năng${S.sp ? ` (${S.sp})` : ''}</button><button role="tab" data-tab="bag" aria-selected="${tab === 'bag'}">Hành trang</button></div>`}
      ${tab === 'tree' ? treeHtml() + pathHtml() : tab === 'bag' ? bagHtml() : upHtml()}
      <div class="actions"><button class="btn" id="sGo">${goLabel}</button></div>`, el => {
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
      el.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
        const k = b.dataset.up, cost = upCost(S.up[k]);
        if (S.coins >= cost) { S.coins -= cost; S.up[k]++; save(); SFX.coin(); render(); }
      });
      el.querySelectorAll('[data-learn]').forEach(b => b.onclick = () => {
        const id = b.dataset.learn; if (!canLearn(id)) return;
        S.skills[id] = sk(id) + 1; S.sp--; save(); SFX.heal(); render();
      });
      el.querySelectorAll('[data-path]').forEach(b => b.onclick = () => {
        const id = b.dataset.path; if (S.lv < PATH_LV || S.path === id) return;
        if (S.path) { if (S.coins < PATH_COST) return; S.coins -= PATH_COST; }
        S.path = id; save(); SFX.gong(); render();
      });
      el.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
        const it = ITEMS.find(x => x.id === b.dataset.buy), n = S.bag[it.id] || 0;
        if (S.coins >= it.cost && n < it.max) { S.coins -= it.cost; S.bag[it.id] = n + 1; save(); SFX.coin(); render(); }
      });
      const rs = el.querySelector('#tReset');
      if (rs) rs.onclick = () => {
        if (!rs.dataset.armed) { rs.dataset.armed = 1; rs.textContent = 'Bấm lần nữa để tẩy tủy'; rs.classList.add('danger'); return; }
        S.coins -= RESET_COST; S.sp += spent; S.skills = { chuong: 1 }; save(); SFX.gong(); render();
      };
      el.querySelector('#sGo').onclick = done;
    }, mode);
  };
  render();
}
export function ending() {
  showCard(`<p class="eyebrow">Hết truyện</p><h2>Non sông thu về một mối</h2>
    <p>Ba lần đánh thắng đế quốc Nguyên Mông hùng mạnh nhất thời bấy giờ, quân dân Đại Việt đã viết nên một bản hùng ca. Tiểu Hổ trở về võ đường Vạn Kiếp, dạy võ cho lớp trẻ, và kể cho chúng nghe về những người đã giữ nước.</p>
    <div class="result"><span class="stars">Tổng ${totalStars(S)}/${STAGES.length * 3} ★</span><span>Đã chơi ${fmtTime(S.play || 0)}</span><span>Chơi lại các ải trên bản đồ để lấy đủ sao</span></div>
    <p>Cảm ơn bạn đã chơi <b>Hào Khí Việt Nam</b>.</p>
    <div class="actions"><button class="btn ghost" id="eMap">Bản đồ</button><button class="btn" id="eOk">Về màn hình chính</button></div>`, el => {
    el.querySelector('#eOk').onclick = toTitle;
    el.querySelector('#eMap').onclick = () => showMap(MAIN - 1, 'continue');
  });
}
export function gameOver() {
  if (G.st.arena) return arenaOver(false);
  // thua sau khi đã tới boss: giữ tiền nhặt được tính đến điểm lưu và cho đánh lại từ đó
  const cp = G.cp, coins0 = G.coinsAtStart;
  S.coins = cp ? cp.coins : coins0; S.play = (S.play || 0) + playedNow(); save();
  showCard(`<p class="eyebrow">${stageLabel(G.stage)} · ${G.st.name}</p><h2>${heroName()} ngã xuống…</h2><p>Thất bại là mẹ thành công. Lấy lại hơi thở, luyện thêm và quay lại trận này. ${cp ? 'Bạn đã tới chỗ tướng giặc: tái chiến sẽ vào thẳng trận đó, tiền nhặt trước đó vẫn còn.' : 'Tiền nhặt trong trận vừa rồi không được tính.'}</p>
    <div class="actions"><button class="btn ghost" id="oHome">Màn hình chính</button><button class="btn ghost" id="oMap">Bản đồ</button><button class="btn ghost" id="oShop">Luyện công</button>${cp ? '<button class="btn ghost" id="oStart">Đánh lại từ đầu ải</button>' : ''}<button class="btn" id="oRe">${cp ? 'Tái chiến trước tướng giặc' : 'Tái chiến'}</button></div>`, el => {
    const fromStart = () => { S.coins = coins0; save(); resetWorld(G.stage); resumePlay(); banner(`${stageLabel(G.stage)} · ${G.st.name}`, 'Tái chiến'); };
    const retry = cp ? () => { resetWorld(G.stage, cp); resumePlay(); banner('Tái chiến', 'Trước mặt là tướng giặc'); } : fromStart;
    el.querySelector('#oRe').onclick = retry;
    if (cp) el.querySelector('#oStart').onclick = fromStart;
    el.querySelector('#oShop').onclick = () => openShop(retry);
    el.querySelector('#oMap').onclick = () => showMap(G.stage, 'continue');
    el.querySelector('#oHome').onclick = toTitle;
  });
}

/* ---------------- Võ đài: Thí luyện vô tận và Đấu tướng ---------------- */
export const arenaOpen = kind => kind === 'endless' ? S.maxStage >= 1 : (S.stars[MAIN - 1] || 0) > 0;
export const recText = kind => kind === 'endless' ? (S.rec.endless ? `kỷ lục ${S.rec.endless} đợt` : 'chưa có kỷ lục') : (S.rec.rush ? `kỷ lục ${fmtTime(S.rec.rush)}` : 'chưa có kỷ lục');
export const arenaProgress = () => G.st.arena === 'endless' ? `Đợt ${G.wave + 1} · ${recText('endless')}` : `Tướng ${Math.min(G.wave + 1, G.st.waves.length)}/${G.st.waves.length} · ${fmtTime(G.time)}`;
export function startArena(kind) {
  resetWorld(makeArena(kind)); resumePlay(); banner(G.st.name, G.st.sub); SFX.gong();
}
// Xong một đợt (G.wave đã tăng): hồi nội lực, thả bánh chưng, báo đợt kế
export function arenaWaveDone() {
  const st = G.st;
  if (st.arena === 'rush' && G.wave >= st.waves.length) return arenaOver(true);
  P.mp = P.maxMp; SFX.coin();
  if (st.arena === 'rush' || G.wave % 2 === 0) dropItem('banh', clamp(P.x + 70, 60, W - 60), P.gy);
  if (st.arena === 'endless') banner(`Đợt ${G.wave + 1}`, (G.wave + 1) % 5 === 0 ? 'Tướng giặc tới!' : 'Giặc mạnh dần lên', 1.5);
  else banner(`Tướng thứ ${G.wave + 1}`, EDEF[st.waves[G.wave].list[0]].name, 1.5);
}
// Ghi kỷ lục; trả về true nếu vừa lập kỷ lục mới
export function arenaRecord(win) {
  S.play = (S.play || 0) + G.time;
  if (G.st.arena === 'endless') { if (G.wave > (S.rec.endless || 0)) { S.rec.endless = G.wave; return true; } return false; }
  if (win && (!S.rec.rush || G.time < S.rec.rush)) { S.rec.rush = Math.round(G.time * 10) / 10; return true; }
  return false;
}
export function arenaOver(win) {
  const kind = G.st.arena, best = arenaRecord(win), n = G.st.waves.length;
  if (win) S.coins += RUSH_BONUS;
  save();
  const body = kind === 'endless'
    ? `<p>${heroName()} trụ được <b>${G.wave} đợt</b> trong ${fmtTime(G.time)}.</p>`
    : win ? `<p>Hạ đủ ${n} tướng giặc trong <b>${fmtTime(G.time)}</b>. Thưởng ${RUSH_BONUS} văn.</p>` : `<p>${heroName()} hạ được <b>${G.wave}/${n} tướng</b> rồi ngã xuống.</p>`;
  showCard(`<p class="eyebrow">${G.st.label}</p><h2>${win ? 'Quét sạch tướng giặc!' : kind === 'endless' ? 'Hết sức rồi…' : 'Chưa xong đâu…'}</h2>
    ${body}
    <div class="result"><span class="stars">${best ? 'Kỷ lục mới!' : 'Kỷ lục'}</span><span>${recText(kind)}</span><span>Chuỗi dài nhất ${G.maxCombo} đòn</span><span>${S.coins} văn</span><span>Cấp ${S.lv}</span></div>
    <p class="note">Tiền và kinh nghiệm kiếm được ở võ đài đều được giữ. Đã lưu vào ô ${STORE.cur + 1}.</p>
    <div class="actions"><button class="btn ghost" id="aHome">Màn hình chính</button><button class="btn ghost" id="aMap">Bản đồ</button><button class="btn ghost" id="aShop">Luyện công</button><button class="btn" id="aRe">Đánh lại</button></div>`, el => {
    el.querySelector('#aRe').onclick = () => startArena(kind);
    el.querySelector('#aShop').onclick = () => openShop(() => startArena(kind));
    el.querySelector('#aMap').onclick = () => showMap(S.stage, 'continue');
    el.querySelector('#aHome').onclick = toTitle;
  });
}

/* ---------------- Tạm dừng ---------------- */
export function showPause() {
  showCard(`<p class="eyebrow">${stageLabel(G.stage)} · ${G.st.name} · ${G.st.year}</p><h2>Tạm nghỉ</h2>
    <p class="note">Ô lưu ${STORE.cur + 1} · lưu lúc ${fmtDate(S.updated)}. ${G.st.arena ? 'Rời võ đài bây giờ vẫn giữ tiền, kinh nghiệm và kỷ lục đã đạt.' : 'Game tự lưu ở đầu mỗi ải; nếu bỏ dở, lần sau sẽ đánh lại ải này từ đầu.'}</p>
    <div class="actions"><button class="btn ghost" id="pHome">Về màn hình chính</button><button class="btn ghost" id="pSet">Cài đặt</button><button class="btn ghost" id="pSkill">Kỹ năng${S.sp ? ` (${S.sp})` : ''}</button><button class="btn" id="pGo">Tiếp tục</button></div>`, el => {
    el.querySelector('#pGo').onclick = togglePause;
    el.querySelector('#pSkill').onclick = () => openShop(showPause, 'tree', 'Quay lại', 'paused', true);
    el.querySelector('#pSet').onclick = () => settingsCard(showPause, 'paused');
    el.querySelector('#pHome').onclick = () => { if (G.st.arena) { arenaRecord(false); save(); return toTitle(); } S.coins = G.coinsAtStart; S.play = (S.play || 0) + playedNow(); save(); toTitle(); };
  }, 'paused');
}
export function togglePause() {
  if (G.mode === 'play') showPause();
  else if (G.mode === 'paused') resumePlay();
}

// Gắn các nút có sẵn trong index.html
export function initFlow() {
  $('dlg').addEventListener('click', () => { ac(); advanceDialog(); });
  $('dlgSkip').addEventListener('click', e => { e.stopPropagation(); endDialog(); });
  $('bPlay').onclick = () => { ac(); startMusic(); slotsCard(); };
  $('bSettings').onclick = () => { ac(); settingsCard(toTitle); };
  $('bHelp').onclick = () => { $('help').hidden = !$('help').hidden; };
  mountHomeLink($('menu'));
}
