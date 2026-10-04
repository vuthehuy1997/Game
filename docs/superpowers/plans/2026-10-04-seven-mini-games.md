# 7 Game Mới Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 7 game độc lập vào Game Hub: `ban-na` (bắn ná vật lý), `chay-lang` (endless runner), `noi-ngoc`
(match-3), `ban-bong` (bubble shooter), `lang-nghe` (idle clicker), `dung-nuoc` (xây dựng/quản lý), `mo-coi`
(dựng quân & chinh phục bản đồ). Mỗi game một task, không phụ thuộc lẫn nhau và không phụ thuộc 3 game đã có.

**Architecture:** ES modules thuần, Canvas 2D 960×540, không build, tái dùng `platform/`. 5 game đầu (nhẹ): một
vòng chơi chính, không tiến trình phức tạp. 2 game cuối (vừa): một bản đồ/lưới duy nhất, lưu toàn bộ trạng thái
vào `localStorage`, tải lại trang khôi phục nguyên trạng. Game có nhiều ô bấm (`dung-nuoc`, `mo-coi`, `lang-nghe`)
dùng nút DOM thật dưới/quanh canvas (giống mô hình HUD của `giu-nuoc-qua-ngan-nam`) để dễ bấm/chạm và dễ kiểm
thử; game vật lý/bắn (`ban-na`, `ban-bong`) dùng sự kiện con trỏ trực tiếp trên canvas.

**Tech Stack:** JavaScript ES modules + Canvas 2D, Playwright (Python) cho test, server tĩnh `python3 -m http.server`.

**Spec:** `docs/superpowers/specs/2026-10-04-seven-mini-games-design.md`

## Global Constraints

- Không thêm thư viện, không thêm bước build; mọi import chỉ từ `platform/` hoặc thư mục của chính game đó.
- Không sửa file nào trong `games/hao-khi/`, `games/doi-khang-anh-hung/`, `games/giu-nuoc-qua-ngan-nam/`.
- Không sửa file nào của game khác trong 7 game này (mỗi task chỉ chạm thư mục `games/<id>/` của task đó).
- Chỉ sửa `platform/games.js` theo cách cộng thêm (1 dòng import + 1 phần tử trong `GAMES`), đọc lại file ngay
  trước khi sửa mỗi task để hợp nhất với các task trước đó.
- Chỉ sửa `README.md` ở đúng phần liệt kê thư mục `games/` để thêm 1 dòng cho game của task đó.
- Mọi chữ hiển thị bằng tiếng Việt. Không multiplayer, không yêu cầu mạng.
- Mỗi task một commit, chỉ add các file task đó tạo/sửa.
- Game không lộ biến ra `window` khi không có `?debug`.
- Tiến trình/tài nguyên tích luỹ khi vắng mặt (`lang-nghe`, `dung-nuoc`, `mo-coi`) luôn có trần giới hạn
  (`MAX_OFFLINE_SEC`), không cho tích luỹ vô hạn.

## Review Focus

- `ban-na`: hết đạn mà còn mục tiêu phải chuyển sang màn thua rõ ràng, không bị kẹt ở trạng thái "đang bay" mãi.
- `chay-lang`: mỗi loại chướng ngại (chặn làn / phải nhảy / phải trượt) chỉ được né đúng bằng hành động tương
  ứng — né sai hành động (ví dụ nhảy một chướng ngại phải trượt) vẫn phải tính va chạm thua.
- `noi-ngoc`: đổi chỗ 2 ô không tạo hàng/cột ≥3 phải tự động hoàn tác về đúng vị trí cũ, bảng không được kẹt ở
  trạng thái đã đổi chỗ mà không hợp lệ.
- `lang-nghe` / `dung-nuoc` / `mo-coi` (3 game có `collectOffline()`): tính tài nguyên/tiến trình tích luỹ khi
  tải lại trang sau một khoảng thời gian dài (giả lập `lastSeen` lùi xa) phải bị chặn ở trần giới hạn, không
  cộng vô hạn. `ban-na`/`chay-lang`/`noi-ngoc`/`ban-bong` không có cơ chế này (chỉ lưu điểm cao/màn cao nhất).
- Tất cả 7 game: tải lại trang (đóng/mở lại `?debug`) phải khôi phục đúng trạng thái đã lưu trong `localStorage`
  (game nào có lưu tiến trình), không mất hoặc không tự ý reset tiến trình.

---

### Task 1: Bắn Ná (`ban-na`)

**Files:**
- Create: `games/ban-na/index.html`, `games/ban-na/style.css`, `games/ban-na/meta.js`
- Create: `games/ban-na/js/state.js`, `games/ban-na/js/data.js`, `games/ban-na/js/physics.js`,
  `games/ban-na/js/flow.js`, `games/ban-na/js/render.js`, `games/ban-na/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa), `README.md`
- Test: `tests/test_ban_na.py`

**Interfaces (produces):** `STORE_KEY='ban-na-v1'`. `G, blocks, targets, proj, setProj, ANCHOR, MAX_PULL, GRAVITY,
LAUNCH_K, DMG_K, PROJ_R, GROUND_Y, W, H` từ `state.js`. `LEVELS, S, save, unlocked` từ `data.js`.
`startLevel(i), startDrag(mx,my), updateDrag(mx,my), release(), updatePhysics(dt)` từ `physics.js`.
`toMenu(), showResult()` từ `flow.js`. `render()` từ `render.js`.

- [ ] **Step 1: Tạo `meta.js`**

```js
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'ban-na-v1';

export default {
  id: 'ban-na',
  title: 'Bắn Ná',
  tagline: 'Kéo ná, ngắm, phá sạch mục tiêu',
  desc: 'Kéo dây ná để ngắm rồi thả, đạn bay theo trọng lực phá công trình và tiêu diệt mục tiêu qua từng màn.',
  tags: ['Vật lý', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 4), text: `Đã phá ${s.maxLevel}/4 màn`, updated: 0 } : null;
  },
};
```

- [ ] **Step 2: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Bắn Ná · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Sân chơi"></canvas>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
</div>
<p class="keys">Kéo dây ná rồi thả để bắn</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`**

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
[hidden]{display:none!important}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}
.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em}
.card{width:min(90%,30em);max-height:92%;overflow:auto;background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;
  padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .levels,.card .actions{display:flex;flex-wrap:wrap;gap:.5em}
.card .actions{justify-content:flex-end}
.card .lvBtn{flex:1 1 40%;font:inherit;padding:.6em;border-radius:.5em;border:1px solid #ffffff40;background:#ffffff14;color:#f3efe6;cursor:pointer}
.card .lvBtn:disabled{opacity:.4;cursor:not-allowed}
.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
export const W = 960, H = 540, GROUND_Y = 480;
export const ANCHOR = { x: 150, y: 380 };
// Tầm bắn xa nhất (góc 45°, kéo hết cỡ) ≈ (MAX_PULL·LAUNCH_K)²/GRAVITY — phải lớn hơn hẳn khoảng cách xa nhất
// tới mục tiêu trong LEVELS (≈670px ở màn cuối) để mọi màn đều có thể thắng được bằng một góc bắn hợp lý.
export const MAX_PULL = 90, LAUNCH_K = 7.5, GRAVITY = 600, DMG_K = 0.09, PROJ_R = 14;
export const G = { mode: 'menu', level: -1, shotsLeft: 0, won: false, dragging: false, aim: { x: ANCHOR.x, y: ANCHOR.y }, t: 0 };
export const blocks = [];
export const targets = [];
export let proj = null;
export function setProj(p) { proj = p; }
```

- [ ] **Step 5: Tạo `js/data.js`**

```js
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const LEVELS = [
  { blocks: [{ cx: 600, cy: 440, w: 36, h: 100, hp: 30 }], targets: [{ cx: 600, cy: 370, r: 18, hp: 25 }], shots: 3 },
  { blocks: [{ cx: 650, cy: 460, w: 40, h: 56, hp: 28 }, { cx: 650, cy: 400, w: 40, h: 56, hp: 28 }], targets: [{ cx: 650, cy: 345, r: 18, hp: 25 }], shots: 4 },
  { blocks: [{ cx: 560, cy: 440, w: 34, h: 110, hp: 32 }, { cx: 740, cy: 440, w: 34, h: 110, hp: 32 }], targets: [{ cx: 560, cy: 360, r: 16, hp: 22 }, { cx: 740, cy: 360, r: 16, hp: 22 }], shots: 5 },
  { blocks: [{ cx: 700, cy: 430, w: 50, h: 140, hp: 50 }], targets: [{ cx: 700, cy: 340, r: 16, hp: 20 }, { cx: 820, cy: 460, r: 16, hp: 20 }], shots: 5 },
];

export const S = { maxLevel: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
```

- [ ] **Step 6: Tạo `js/flow.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { LEVELS, unlocked } from './data.js';
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
  showCard(`<p class="eyebrow">Bắn Ná</p><h2>Chọn màn</h2>
    <div class="levels">${LEVELS.map((_, i) => `<button type="button" class="lvBtn" data-lv="${i}" ${unlocked(i) ? '' : 'disabled'}>Màn ${i + 1}</button>`).join('')}</div>`, el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => { startLevel(+b.dataset.lv); showOnly(null); });
  });
}
export function showResult() {
  showCard(`<p class="eyebrow">Màn ${G.level + 1}</p><h2>${G.won ? 'Phá xong!' : 'Hết đạn…'}</h2>
    <div class="actions">
      <button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
      <button type="button" class="btn" id="rGo">${G.won ? 'Màn kế' : 'Thử lại'}</button>
    </div>`, el => {
    $('rMenu').onclick = toMenu;
    $('rGo').onclick = G.won
      ? () => { startLevel(Math.min(G.level + 1, LEVELS.length - 1)); showOnly(null); }
      : () => { startLevel(G.level); showOnly(null); };
  });
}
```

- [ ] **Step 7: Tạo `js/physics.js`**

```js
import { refill, prune } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { LEVELS, S, save } from './data.js';
import { G, blocks, targets, proj, ANCHOR, MAX_PULL, GRAVITY, LAUNCH_K, DMG_K, PROJ_R, GROUND_Y, W, setProj } from './state.js';
import { showResult } from './flow.js';

export function startLevel(i) {
  G.mode = 'aim'; G.level = i; G.won = false; G.dragging = false; G.aim = { x: ANCHOR.x, y: ANCHOR.y };
  G.shotsLeft = LEVELS[i].shots;
  refill(blocks, LEVELS[i].blocks.map(b => ({ ...b, dead: false })));
  refill(targets, LEVELS[i].targets.map(t => ({ ...t, dead: false })));
  setProj(null);
}
export function startDrag(mx, my) {
  if (G.mode !== 'aim') return;
  if (Math.hypot(mx - ANCHOR.x, my - ANCHOR.y) < 50) G.dragging = true;
}
export function updateDrag(mx, my) {
  if (!G.dragging) return;
  const dx = mx - ANCHOR.x, dy = my - ANCHOR.y, d = Math.hypot(dx, dy) || 1;
  const k = d > MAX_PULL ? MAX_PULL / d : 1;
  G.aim = { x: ANCHOR.x + dx * k, y: ANCHOR.y + dy * k };
}
export function release() {
  if (!G.dragging) return;
  G.dragging = false;
  const vx = (ANCHOR.x - G.aim.x) * LAUNCH_K, vy = (ANCHOR.y - G.aim.y) * LAUNCH_K;
  setProj({ x: ANCHOR.x, y: ANCHOR.y, vx, vy });
  G.shotsLeft--; G.mode = 'fly'; G.aim = { x: ANCHOR.x, y: ANCHOR.y };
}
export function updatePhysics(dt) {
  if (G.mode !== 'fly' || !proj) return;
  proj.vy += GRAVITY * dt; proj.x += proj.vx * dt; proj.y += proj.vy * dt;
  for (const b of blocks) {
    if (b.dead) continue;
    if (proj.x > b.cx - b.w / 2 - PROJ_R && proj.x < b.cx + b.w / 2 + PROJ_R && proj.y > b.cy - b.h / 2 - PROJ_R && proj.y < b.cy + b.h / 2 + PROJ_R) {
      const spd = Math.hypot(proj.vx, proj.vy);
      b.hp -= spd * DMG_K; proj.vx *= .4; proj.vy *= .2;
      spark(proj.x, proj.y, 8, '#b08a5a'); if (b.hp <= 0) b.dead = true;
    }
  }
  for (const t of targets) {
    if (t.dead) continue;
    if (Math.hypot(proj.x - t.cx, proj.y - t.cy) < t.r + PROJ_R) {
      const spd = Math.hypot(proj.vx, proj.vy);
      t.hp -= spd * DMG_K; proj.vx *= .4; proj.vy *= .2;
      spark(t.cx, t.cy, 10, '#e9574a'); if (t.hp <= 0) t.dead = true;
    }
  }
  prune(blocks, b => !b.dead);
  prune(targets, t => !t.dead);
  if (proj.y > GROUND_Y + 60 || proj.x > W + 80 || proj.x < -80) {
    setProj(null);
    if (!targets.length) { G.mode = 'result'; G.won = true; S.maxLevel = Math.max(S.maxLevel, G.level + 1); save(); showResult(); }
    else if (G.shotsLeft <= 0) { G.mode = 'result'; G.won = false; showResult(); }
    else G.mode = 'aim';
  }
}
```

- [ ] **Step 8: Tạo `js/render.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { rr, ell, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, blocks, targets, proj, ANCHOR, PROJ_R } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#7ec8e3'); sky.addColorStop(1, '#e8f4d9');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 480);
  ctx.fillStyle = '#5f9a4a'; ctx.fillRect(0, 480, 960, 60);

  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(ANCHOR.x - 18, 480); ctx.lineTo(ANCHOR.x - 12, ANCHOR.y - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ANCHOR.x + 18, 480); ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 10); ctx.stroke();
  const tip = G.dragging ? G.aim : ANCHOR;
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ANCHOR.x - 12, ANCHOR.y - 10); ctx.lineTo(tip.x, tip.y); ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 10); ctx.stroke();

  if (G.dragging) {
    const vx = ANCHOR.x - G.aim.x, vy = ANCHOR.y - G.aim.y;
    for (let i = 1; i <= 6; i++) { const t = i * .12; ell(ctx, G.aim.x + vx * 5.2 * t, G.aim.y + vy * 5.2 * t + .5 * 1000 * t * t, 3, 3, 'rgba(255,255,255,.6)'); }
  }

  for (const b of blocks) { ctx.fillStyle = '#8a6a3e'; rr(ctx, b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h, 4); ctx.fill(); }
  for (const t of targets) ell(ctx, t.cx, t.cy, t.r, t.r, '#b3261e');
  if (proj) ell(ctx, proj.x, proj.y, PROJ_R, PROJ_R, '#2a2630');
  else ell(ctx, tip.x, tip.y, PROJ_R, PROJ_R, '#2a2630');

  drawParticles(ctx, G.t);
  ctx.textAlign = 'left'; outlinedText(ctx, `Đạn: ${G.shotsLeft}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, `Màn ${G.level + 1}`, 944, 30, `18px ${FB}`, '#fff');
}
```

- [ ] **Step 9: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { LEVELS, S, unlocked } from './data.js';
import { G, blocks, targets, setProj } from './state.js';
import { startLevel, startDrag, updateDrag, release, updatePhysics } from './physics.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
function toGame(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 960, y: (e.clientY - r.top) / r.height * 540 }; }
cv.addEventListener('pointerdown', e => { ac(); const p = toGame(e); startDrag(p.x, p.y); });
cv.addEventListener('pointermove', e => { const p = toGame(e); updateDrag(p.x, p.y); });
cv.addEventListener('pointerup', () => release());

function update(dt) { G.t += dt; updatePhysics(dt); updateParticles(dt, G.t); }

mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, blocks, targets, LEVELS, S, unlocked, update, render, startLevel, startDrag, updateDrag, release, updatePhysics, setProj }]);
startLoop(update, render);
```

- [ ] **Step 10: Đăng ký lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Thêm `import banNa from '../games/ban-na/meta.js';` và thêm `banNa` vào mảng `GAMES`.

- [ ] **Step 11: Thêm dòng vào `README.md`** (mục liệt kê `games/`, theo mẫu các dòng đã có)

- [ ] **Step 12: Viết `tests/test_ban_na.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Bắn Ná. Chạy: python3 tests/test_ban_na.py [lọc tên]"""
from harness import run, root

URL = 'games/ban-na/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_projectile_falls_under_gravity(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # So sánh vận tốc thẳng đứng (không phải vị trí): với vận tốc ban đầu hướng lên đủ mạnh, vị trí y có thể
    # vẫn đang tăng độ cao (y giảm) sau một khoảng ngắn dù trọng lực vẫn đang kéo đúng — đo theo vy mới tách
    # bạch được "trọng lực có cộng dồn mỗi khung hình" khỏi "đạn đã rơi qua điểm xuất phát hay chưa".
    vy0, vy1 = pg.evaluate("""() => {
      startDrag(150, 380); updateDrag(100, 440); release();
      const vy0 = proj.vy; for (let i = 0; i < 20; i++) update(1/60); return [vy0, proj.vy];
    }""")
    assert vy1 > vy0, 'vận tốc thẳng đứng không tăng theo trọng lực mỗi khung hình'


@test
def test_hitting_block_reduces_hp_and_destroys_it(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # Đặt thẳng đạn ngay sát khối (thay vì tính tay quỹ đạo kéo-thả, vốn dễ sai số và còn phụ thuộc cân bằng
    # vật lý có thể đổi sau này) để kiểm tra đúng phần va chạm/gây sát thương một cách tách biệt, xác định.
    hp0 = pg.evaluate("blocks[0].hp")
    pg.evaluate("""() => {
      G.mode = 'fly';
      setProj({ x: blocks[0].cx - 20, y: blocks[0].cy, vx: 260, vy: 0 });
      for (let i = 0; i < 10; i++) updatePhysics(1/60);
    }""")
    hp1 = pg.evaluate("blocks.length ? blocks[0].hp : 0")
    assert hp1 < hp0, 'khối không mất máu dù bị đạn trúng trực diện'


@test
def test_running_out_of_shots_with_targets_left_is_a_loss(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      for (let s = 0; s < 3; s++) {
        startDrag(150, 380); updateDrag(160, 390); release();  // kéo rất nhẹ, không trúng gì
        for (let i = 0; i < 180; i++) update(1/60);
      }
    }""")
    assert pg.evaluate("G.mode") == 'result' and pg.evaluate("G.won") == False
    assert pg.locator('#card h2').count() == 1


run(TESTS)
```

- [ ] **Step 13: Chạy test, xác nhận qua**

Run: `python3 tests/test_ban_na.py` — Expected: 4 bài PASS.
Run: `python3 tests/test_platform.py` — Expected: toàn bộ PASS, báo "(4 game)".

- [ ] **Step 14: Commit**

```bash
git add games/ban-na/ platform/games.js README.md tests/test_ban_na.py
git commit -m "ban-na: game bắn ná vật lý"
```

---

### Task 2: Chạy Làng (`chay-lang`)

**Files:**
- Create: `games/chay-lang/index.html`, `games/chay-lang/style.css`, `games/chay-lang/meta.js`
- Create: `games/chay-lang/js/state.js`, `games/chay-lang/js/save.js`, `games/chay-lang/js/game.js`,
  `games/chay-lang/js/flow.js`, `games/chay-lang/js/render.js`, `games/chay-lang/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa), `README.md`
- Test: `tests/test_chay_lang.py`

**Interfaces (produces):** `STORE_KEY='chay-lang-v1'`. `W, H, LANES_Y, PLAYER_X, JUMP_DUR, G, P, obstacles,
pickups` từ `state.js`. `S, save` từ `save.js`. `startRun(), moveLane(dir), doJump(), setDuck(v), updateRun(dt)`
từ `game.js`. `toMenu(), showResult()` từ `flow.js`.

- [ ] **Step 1: Tạo `meta.js`**

```js
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'chay-lang-v1';

export default {
  id: 'chay-lang',
  title: 'Chạy Làng',
  tagline: 'Đổi làn, nhảy, trượt — chạy càng xa càng tốt',
  desc: 'Tự động chạy về phía trước, đổi làn/nhảy/trượt để né chướng ngại, nhặt xu dọc đường, phá kỷ lục quãng đường.',
  tags: ['Chạy vô tận', 'Bàn phím · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.best ? { pct: Math.min(1, s.best / 500), text: `Kỷ lục ${s.best} điểm`, updated: 0 } : null;
  },
};
```

- [ ] **Step 2: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Chạy Làng · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Đường chạy"></canvas>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
  <div class="touch" id="touch">
    <button data-k="up" aria-label="Làn trên">▲</button>
    <button data-k="down" aria-label="Làn dưới">▼</button>
    <button data-k="duck" aria-label="Trượt">_</button>
    <button data-k="jump">Nhảy</button>
  </div>
</div>
<p class="keys">W/S hoặc ↑/↓ đổi làn · Space nhảy · X/Shift trượt</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`**

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
[hidden]{display:none!important}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.touch{position:absolute;inset:auto 0 0 0;display:none;gap:1.5cqw;padding:2cqw;pointer-events:none}
.touch.on{display:flex}
.touch button{pointer-events:auto;width:10cqw;height:10cqw;border-radius:50%;border:2px solid #ffffff80;background:#0009;color:#fff;font:inherit;touch-action:none}
.touch button.act{background:#e9b949;color:#1b1d24}
.touch [data-k=jump]{margin-left:auto}
.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}
.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em}
.card{width:min(90%,28em);background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .actions{display:flex;gap:.5em;justify-content:flex-end}
.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
export const W = 960, H = 540;
export const LANES_Y = [170, 300, 430];
export const PLAYER_X = 160;
export const JUMP_DUR = .55;
export const G = { mode: 'menu', t: 0, speed: 260, dist: 0, coins: 0, score: 0, shake: 0 };
export const P = { lane: 1, jumpT: 0, ducking: false, walk: 0 };
export const obstacles = []; // { lane, x, kind: 'block'|'jump'|'duck', hit }
export const pickups = [];   // { lane, x, got }
```

- [ ] **Step 5: Tạo `js/save.js`**

```js
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
export const S = { best: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
```

- [ ] **Step 6: Tạo `js/flow.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { G } from './state.js';
import { S } from './save.js';
import { startRun } from './game.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) {
  $('card').innerHTML = html; showOnly('cardWrap');
  onRender && onRender($('card'));
  const b = $('card').querySelector('.actions .btn:last-child') || $('card').querySelector('button');
  b && b.focus({ preventScroll: true });
}
export function toMenu() {
  G.mode = 'menu';
  showCard(`<p class="eyebrow">Chạy Làng</p><h2>Sẵn sàng chạy?</h2><p>Kỷ lục: ${S.best}</p>
    <div class="actions"><button type="button" class="btn" id="mGo">Bắt đầu</button></div>`, el => {
    $('mGo').onclick = () => { startRun(); showOnly(null); };
  });
}
export function showResult() {
  showCard(`<p class="eyebrow">Kết thúc</p><h2>Điểm: ${G.score}</h2><p>Kỷ lục: ${S.best}</p>
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Menu</button><button type="button" class="btn" id="rGo">Chạy lại</button></div>`, el => {
    $('rMenu').onclick = toMenu; $('rGo').onclick = () => { startRun(); showOnly(null); };
  });
}
```

- [ ] **Step 7: Tạo `js/game.js`**

```js
import { rand, prune, refill } from '../../../platform/core/util.js';
import { floatText } from '../../../platform/core/fx.js';
import { G, P, obstacles, pickups, LANES_Y, PLAYER_X, JUMP_DUR } from './state.js';
import { S, save } from './save.js';
import { showResult } from './flow.js';

const SPEED_MAX = 620, ACCEL = 4, HIT_RANGE = 26;
let spawnT = 0;

export function startRun() {
  G.mode = 'run'; G.t = 0; G.speed = 260; G.dist = 0; G.coins = 0; G.score = 0; G.shake = 0;
  P.lane = 1; P.jumpT = 0; P.ducking = false; P.walk = 0;
  refill(obstacles); refill(pickups); spawnT = .9;
}
export function moveLane(dir) { if (G.mode === 'run') P.lane = Math.max(0, Math.min(2, P.lane + dir)); }
export function doJump() { if (G.mode === 'run' && P.jumpT <= 0 && !P.ducking) P.jumpT = JUMP_DUR; }
export function setDuck(v) { if (P.jumpT <= 0) P.ducking = v; }

export function updateRun(dt) {
  if (G.mode !== 'run') return;
  G.t += dt; G.speed = Math.min(SPEED_MAX, G.speed + ACCEL * dt);
  G.dist += G.speed * dt; P.walk += dt * 10;
  if (P.jumpT > 0) P.jumpT = Math.max(0, P.jumpT - dt);

  spawnT -= dt;
  if (spawnT <= 0) {
    const lane = (Math.random() * 3) | 0, kind = ['block', 'jump', 'duck'][(Math.random() * 3) | 0];
    obstacles.push({ lane, x: 1040, kind });
    if (Math.random() < .6) pickups.push({ lane: (Math.random() * 3) | 0, x: 1040 + rand(-60, 60) });
    spawnT = Math.max(.55, 1.3 - G.speed / 1000);
  }
  for (const o of obstacles) o.x -= G.speed * dt;
  for (const c of pickups) c.x -= G.speed * dt;

  for (const o of obstacles) {
    if (o.hit || o.lane !== P.lane || Math.abs(o.x - PLAYER_X) > HIT_RANGE) continue;
    const dodged = (o.kind === 'jump' && P.jumpT > 0) || (o.kind === 'duck' && P.ducking);
    if (!dodged) { o.hit = true; return gameOver(); }
  }
  for (const c of pickups) {
    if (c.got || c.lane !== P.lane || Math.abs(c.x - PLAYER_X) > HIT_RANGE) continue;
    c.got = true; G.coins++; floatText(PLAYER_X, LANES_Y[P.lane] - 60, '+1', '#ffe6a8', 16);
  }
  prune(obstacles, o => o.x > -60 && !o.hit);
  prune(pickups, c => c.x > -60 && !c.got);
}
function gameOver() {
  G.mode = 'over'; G.shake = 8;
  G.score = Math.round(G.dist / 20) + G.coins * 5;
  if (G.score > S.best) { S.best = G.score; save(); }
  showResult();
}
```

- [ ] **Step 8: Tạo `js/render.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, outlinedText, groundShadow } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, P, obstacles, pickups, LANES_Y, PLAYER_X } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'khan', khan: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };

export function render() {
  ctx.save();
  if (G.shake > 0) { ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake); G.shake = Math.max(0, G.shake - 20 / 60); }
  const sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#7ec8e3'); sky.addColorStop(1, '#e8f4d9');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 500);
  ctx.fillStyle = '#5f9a4a'; ctx.fillRect(0, 500, 960, 40);
  LANES_Y.forEach(y => { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, y + 36, 960, 3); });

  for (const o of obstacles) {
    ctx.fillStyle = o.kind === 'block' ? '#8a6a3e' : o.kind === 'jump' ? '#b3261e' : '#4a6f9a';
    const y = LANES_Y[o.lane];
    if (o.kind === 'duck') rr(ctx, o.x - 22, y - 70, 44, 24, 4); else rr(ctx, o.x - 18, y - 46, 36, 46, 4);
    ctx.fill();
  }
  for (const c of pickups) ell(ctx, c.x, LANES_Y[c.lane] - 20, 9, 9, '#e9b949');

  const jumpOff = P.jumpT > 0 ? -Math.sin((1 - P.jumpT / .55) * Math.PI) * 70 : 0;
  const y = LANES_Y[P.lane] + jumpOff;
  groundShadow(ctx, PLAYER_X, LANES_Y[P.lane]);
  const pose = P.ducking ? { legF: .2, legB: -.2, armF: .1, armB: -.1, bob: -16 } : P.jumpT > 0 ? POSES.air() : POSES.run({ walk: P.walk });
  drawChibi(ctx, PLAYER_X, y, HERO, { face: 1, t: G.t, ...pose });

  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();

  ctx.textAlign = 'left'; outlinedText(ctx, `${Math.round(G.dist / 20)}m`, 16, 36, `26px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, `Xu: ${G.coins}`, 944, 36, `20px ${FB}`, '#fff');
}
```

- [ ] **Step 9: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { bindKeys, bindTouch, pressed, held } from '../../../platform/core/input.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { G, P, obstacles, pickups } from './state.js';
import { S } from './save.js';
import { startRun, updateRun, moveLane, doJump, setDuck } from './game.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

function update(dt) {
  if (pressed.has('up')) moveLane(-1);
  if (pressed.has('down')) moveLane(1);
  if (pressed.has('jump')) doJump();
  setDuck(held.has('duck'));
  updateRun(dt);
  updateParticles(dt, G.t);
}

bindKeys({ ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'jump', KeyX: 'duck', ShiftLeft: 'duck' }, { onPress: () => ac() });
bindTouch($('touch'));
mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, P, obstacles, pickups, S, update, render, startRun, moveLane, doJump, setDuck }]);
startLoop(update, render);
```

- [ ] **Step 10: Đăng ký lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Thêm `import chayLang from '../games/chay-lang/meta.js';` và thêm `chayLang` vào mảng `GAMES`.

- [ ] **Step 11: Thêm dòng vào `README.md`**

- [ ] **Step 12: Viết `tests/test_chay_lang.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Chạy Làng. Chạy: python3 tests/test_chay_lang.py [lọc tên]"""
from harness import run, root

URL = 'games/chay-lang/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_lane_change_moves_player(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("moveLane(-1)")
    assert pg.evaluate("P.lane") == 0


@test
def test_wrong_dodge_still_collides(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      P.lane = 1; obstacles.push({ lane: 1, x: 160, kind: 'duck' });
      doJump();  // né sai hành động cho chướng ngại 'duck' (phải trượt, không phải nhảy)
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'over', 'né sai hành động vẫn phải va chạm'


@test
def test_correct_dodge_avoids_collision(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      P.lane = 1; obstacles.push({ lane: 1, x: 160, kind: 'jump' });
      doJump();
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'run', 'né đúng hành động vẫn bị tính va chạm'


@test
def test_score_saved_as_new_best(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      G.dist = 5000; G.coins = 10;
      obstacles.push({ lane: P.lane, x: 160, kind: 'block' });
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'over'
    assert pg.evaluate("S.best") == pg.evaluate("G.score") and pg.evaluate("G.score") > 0


run(TESTS)
```

- [ ] **Step 13: Chạy test, xác nhận qua**

Run: `python3 tests/test_chay_lang.py` — Expected: 5 bài PASS.
Run: `python3 tests/test_platform.py` — Expected: toàn bộ PASS, báo "(5 game)".

- [ ] **Step 14: Commit**

```bash
git add games/chay-lang/ platform/games.js README.md tests/test_chay_lang.py
git commit -m "chay-lang: endless runner 3 làn"
```

---

### Task 3: Nối Ngọc (`noi-ngoc`)

**Files:**
- Create: `games/noi-ngoc/index.html`, `games/noi-ngoc/style.css`, `games/noi-ngoc/meta.js`
- Create: `games/noi-ngoc/js/state.js`, `games/noi-ngoc/js/data.js`, `games/noi-ngoc/js/match3.js`,
  `games/noi-ngoc/js/flow.js`, `games/noi-ngoc/js/render.js`, `games/noi-ngoc/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa), `README.md`
- Test: `tests/test_noi_ngoc.py`

**Interfaces (produces):** `STORE_KEY='noi-ngoc-v1'`. `GRID_N, CELL, ORIGIN_X, ORIGIN_Y, COLORS, G, grid` từ
`state.js`. `LEVELS, S, save, unlocked` từ `data.js`. `startLevel(i), selectCell(x,y), trySwap(a,b)` từ `match3.js`.
`toMenu(), showResult()` từ `flow.js`.

- [ ] **Step 1: Tạo `meta.js`**

```js
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'noi-ngoc-v1';

export default {
  id: 'noi-ngoc',
  title: 'Nối Ngọc',
  tagline: 'Đổi chỗ, nối 3 viên ngọc cùng màu',
  desc: 'Bấm 2 viên ngọc liền kề để đổi chỗ, nối từ 3 viên cùng màu trở lên để ghi điểm, đạt mục tiêu trước khi hết lượt.',
  tags: ['Xếp hình', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 5), text: `Đã qua ${s.maxLevel}/5 màn`, updated: 0 } : null;
  },
};
```

- [ ] **Step 2: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Nối Ngọc · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Bàn cờ"></canvas>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
</div>
<p class="keys">Bấm 1 viên rồi bấm viên liền kề để đổi chỗ</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`** (giống hệt khối dùng chung ở Task 1 Step 3, không có `.touch`)

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
[hidden]{display:none!important}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}
.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em}
.card{width:min(90%,30em);max-height:92%;overflow:auto;background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;
  padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .levels,.card .actions{display:flex;flex-wrap:wrap;gap:.5em}
.card .actions{justify-content:flex-end}
.card .lvBtn{flex:1 1 40%;font:inherit;padding:.6em;border-radius:.5em;border:1px solid #ffffff40;background:#ffffff14;color:#f3efe6;cursor:pointer}
.card .lvBtn:disabled{opacity:.4;cursor:not-allowed}
.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
export const GRID_N = 8, CELL = 48, ORIGIN_X = (960 - GRID_N * CELL) / 2, ORIGIN_Y = 60;
export const COLORS = ['#e9574a', '#4a9fe9', '#5fae4a', '#e9b949', '#9a5ae9', '#e97aa8'];
export const G = { mode: 'menu', level: -1, movesLeft: 0, score: 0, won: false, selected: null, busy: false };
export const grid = new Array(GRID_N * GRID_N).fill(0);
```

- [ ] **Step 5: Tạo `js/data.js`**

```js
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const LEVELS = [
  { target: 300, moves: 15 }, { target: 600, moves: 18 }, { target: 1000, moves: 20 },
  { target: 1500, moves: 22 }, { target: 2200, moves: 25 },
];
export const S = { maxLevel: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
```

- [ ] **Step 6: Tạo `js/flow.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { LEVELS, unlocked } from './data.js';
import { startLevel } from './match3.js';
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
  showCard(`<p class="eyebrow">Nối Ngọc</p><h2>Chọn màn</h2>
    <div class="levels">${LEVELS.map((_, i) => `<button type="button" class="lvBtn" data-lv="${i}" ${unlocked(i) ? '' : 'disabled'}>Màn ${i + 1}</button>`).join('')}</div>`, el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => { startLevel(+b.dataset.lv); showOnly(null); });
  });
}
export function showResult() {
  showCard(`<p class="eyebrow">Màn ${G.level + 1}</p><h2>${G.won ? 'Đạt mục tiêu!' : 'Hết lượt…'}</h2><p>Điểm: ${G.score}</p>
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
    <button type="button" class="btn" id="rGo">${G.won ? 'Màn kế' : 'Thử lại'}</button></div>`, el => {
    $('rMenu').onclick = toMenu;
    $('rGo').onclick = G.won
      ? () => { startLevel(Math.min(G.level + 1, LEVELS.length - 1)); showOnly(null); }
      : () => { startLevel(G.level); showOnly(null); };
  });
}
```

- [ ] **Step 7: Tạo `js/match3.js`**

```js
import { GRID_N, G, grid } from './state.js';
import { LEVELS, S, save } from './data.js';
import { showResult } from './flow.js';

const idx = (x, y) => y * GRID_N + x;
const N_COLORS = 6;
const randColor = () => 1 + ((Math.random() * N_COLORS) | 0);

function wouldMatch(x, y, c) {
  if (x >= 2 && grid[idx(x - 1, y)] === c && grid[idx(x - 2, y)] === c) return true;
  if (y >= 2 && grid[idx(x, y - 1)] === c && grid[idx(x, y - 2)] === c) return true;
  return false;
}
function genGrid() {
  for (let y = 0; y < GRID_N; y++) for (let x = 0; x < GRID_N; x++) {
    let c; do { c = randColor(); } while (wouldMatch(x, y, c));
    grid[idx(x, y)] = c;
  }
}
export function startLevel(i) {
  G.mode = 'play'; G.level = i; G.score = 0; G.won = false; G.selected = null; G.busy = false;
  G.movesLeft = LEVELS[i].moves; genGrid();
}
const adjacent = (a, b) => {
  const ax = a % GRID_N, ay = (a / GRID_N) | 0, bx = b % GRID_N, by = (b / GRID_N) | 0;
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
};
function findMatches() {
  const hit = new Set();
  for (let y = 0; y < GRID_N; y++) {
    let run = 1;
    for (let x = 1; x <= GRID_N; x++) {
      const same = x < GRID_N && grid[idx(x, y)] === grid[idx(x - 1, y)] && grid[idx(x - 1, y)] !== 0;
      if (same) run++; else { if (run >= 3) for (let k = x - run; k < x; k++) hit.add(idx(k, y)); run = 1; }
    }
  }
  for (let x = 0; x < GRID_N; x++) {
    let run = 1;
    for (let y = 1; y <= GRID_N; y++) {
      const same = y < GRID_N && grid[idx(x, y)] === grid[idx(x, y - 1)] && grid[idx(x, y - 1)] !== 0;
      if (same) run++; else { if (run >= 3) for (let k = y - run; k < y; k++) hit.add(idx(x, k)); run = 1; }
    }
  }
  return hit;
}
function applyGravityAndRefill() {
  for (let x = 0; x < GRID_N; x++) {
    let write = GRID_N - 1;
    for (let y = GRID_N - 1; y >= 0; y--) if (grid[idx(x, y)] !== 0) { grid[idx(x, write)] = grid[idx(x, y)]; write--; }
    for (let y = write; y >= 0; y--) grid[idx(x, y)] = randColor();
  }
}
function resolveMatches() {
  let gained = 0, hit = findMatches();
  while (hit.size) {
    gained += hit.size * 10;
    for (const i of hit) grid[i] = 0;
    applyGravityAndRefill();
    hit = findMatches();
  }
  return gained;
}
export function trySwap(a, b) {
  [grid[a], grid[b]] = [grid[b], grid[a]];
  if (findMatches().size === 0) { [grid[a], grid[b]] = [grid[b], grid[a]]; return false; }
  return true;
}
function checkEnd() {
  if (G.score >= LEVELS[G.level].target) { G.mode = 'result'; G.won = true; S.maxLevel = Math.max(S.maxLevel, G.level + 1); save(); showResult(); }
  else if (G.movesLeft <= 0) { G.mode = 'result'; G.won = false; showResult(); }
}
export function selectCell(x, y) {
  if (G.busy || G.mode !== 'play') return;
  const i = idx(x, y);
  if (G.selected === null) { G.selected = i; return; }
  if (G.selected === i) { G.selected = null; return; }
  if (!adjacent(G.selected, i)) { G.selected = i; return; }
  const ok = trySwap(G.selected, i);
  G.selected = null;
  if (ok) { G.movesLeft--; G.score += resolveMatches(); checkEnd(); }
}
```

- [ ] **Step 8: Tạo `js/render.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { ell, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { GRID_N, CELL, ORIGIN_X, ORIGIN_Y, COLORS, G, grid } from './state.js';
import { LEVELS } from './data.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  for (let y = 0; y < GRID_N; y++) for (let x = 0; x < GRID_N; x++) {
    const i = y * GRID_N + x, cx = ORIGIN_X + x * CELL + CELL / 2, cy = ORIGIN_Y + y * CELL + CELL / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.strokeRect(ORIGIN_X + x * CELL, ORIGIN_Y + y * CELL, CELL, CELL);
    const c = grid[i]; if (!c) continue;
    ell(ctx, cx, cy, CELL * .38, CELL * .38, COLORS[c - 1]);
    if (i === G.selected) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, CELL * .44, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.textAlign = 'left'; outlinedText(ctx, `Điểm: ${G.score}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right';
  const target = LEVELS[G.level] ? LEVELS[G.level].target : 0;
  outlinedText(ctx, `Mục tiêu: ${target}`, 944, 30, `16px ${FB}`, '#fff');
  outlinedText(ctx, `Lượt: ${G.movesLeft}`, 944, 52, `16px ${FB}`, '#ffd35a');
}
```

- [ ] **Step 9: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { GRID_N, CELL, ORIGIN_X, ORIGIN_Y, G, grid } from './state.js';
import { LEVELS, S, unlocked } from './data.js';
import { startLevel, selectCell, trySwap } from './match3.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', e => {
  ac();
  const r = cv.getBoundingClientRect();
  const mx = (e.clientX - r.left) / r.width * 960, my = (e.clientY - r.top) / r.height * 540;
  const x = Math.floor((mx - ORIGIN_X) / CELL), y = Math.floor((my - ORIGIN_Y) / CELL);
  if (x >= 0 && x < GRID_N && y >= 0 && y < GRID_N) selectCell(x, y);
});

function update() {}

mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, grid, LEVELS, S, unlocked, update, render, startLevel, selectCell, trySwap }]);
startLoop(update, render);
```

- [ ] **Step 10: Đăng ký lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Thêm `import noiNgoc from '../games/noi-ngoc/meta.js';` và thêm `noiNgoc` vào mảng `GAMES`.

- [ ] **Step 11: Thêm dòng vào `README.md`**

- [ ] **Step 12: Viết `tests/test_noi_ngoc.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Nối Ngọc. Chạy: python3 tests/test_noi_ngoc.py [lọc tên]"""
from harness import run, root

URL = 'games/noi-ngoc/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_valid_swap_scores_and_invalid_swap_reverts(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # Dàn 1 hàng gần khớp rồi đổi 1 ô để tạo đúng 3 liên tiếp
    before, after, ok = pg.evaluate("""() => {
      for (let x = 0; x < 8; x++) grid[x] = 1;   // cả hàng 0 cùng màu 1 -> đã khớp sẵn, dùng để kiểm tra logic đổi chỗ thuần tuý
      grid[0] = 2; grid[1] = 1; grid[2] = 1;      // [2,1,1,1,1,1,1,1] ở hàng 0
      const g0 = grid.slice(0, 8);
      const ok = trySwap(0, 1);                   // đổi ô (0,0)=2 và (1,0)=1 -> [1,2,1,...] không còn 3 liên tục tại đầu nhưng vẫn còn 1,1,1,1,1 từ cột 2 -> vẫn match
      return [g0, grid.slice(0, 8), ok];
    }""")
    assert ok == True, 'đổi chỗ hợp lệ (vẫn tạo được hàng ≥3) phải trả về true'


@test
def test_invalid_swap_with_no_match_reverts_grid(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    reverted = pg.evaluate("""() => {
      // Dựng bàn cờ không có hàng/cột nào ≥3, xen kẽ 2 màu theo ca-rô
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = ((x + y) % 2) + 1;
      const before = grid.slice();
      const ok = trySwap(0, 1);  // đổi 2 ô liền kề khác màu trong bàn ca-rô -> không tạo hàng/cột nào ≥3
      const after = grid.slice();
      return !ok && JSON.stringify(before) === JSON.stringify(after);
    }""")
    assert reverted, 'đổi chỗ không hợp lệ phải tự hoàn tác về đúng bàn cờ cũ'


@test
def test_running_out_of_moves_without_target_is_a_loss(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("G.movesLeft = 0; G.score = 0; selectCell(0, 0)")  # chạm 1 ô bất kỳ để trigger checkEnd qua 1 lượt đổi hợp lệ giả lập
    pg.evaluate("""() => {
      G.movesLeft = 1; G.score = 0;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = ((x + y) % 2) + 1;
      selectCell(0, 0); selectCell(0, 1);  // đổi không hợp lệ: không tốn lượt, không kết thúc
    }""")
    assert pg.evaluate("G.mode") == 'play', 'đổi chỗ không hợp lệ không được tính là hết lượt'


run(TESTS)
```

- [ ] **Step 13: Chạy test, xác nhận qua**

Run: `python3 tests/test_noi_ngoc.py` — Expected: 4 bài PASS.
Run: `python3 tests/test_platform.py` — Expected: toàn bộ PASS, báo "(6 game)".

- [ ] **Step 14: Commit**

```bash
git add games/noi-ngoc/ platform/games.js README.md tests/test_noi_ngoc.py
git commit -m "noi-ngoc: game match-3"
```

---

### Task 4: Bắn Bóng (`ban-bong`)

**Files:**
- Create: `games/ban-bong/index.html`, `games/ban-bong/style.css`, `games/ban-bong/meta.js`
- Create: `games/ban-bong/js/state.js`, `games/ban-bong/js/data.js`, `games/ban-bong/js/physics.js`,
  `games/ban-bong/js/flow.js`, `games/ban-bong/js/render.js`, `games/ban-bong/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa), `README.md`
- Test: `tests/test_ban_bong.py`

**Interfaces (produces):** `STORE_KEY='ban-bong-v1'`. `COLS, ROWS, LOSE_ROW, CELL, TOP_Y, BOARD_X0, SHOOTER_X,
SHOOTER_Y, PROJ_SPEED, N_COLORS, COLORS, G, grid, proj, setProj, getProj` từ `state.js`. `LEVELS, S, save,
unlocked` từ `data.js`. `startLevel(i), fire(mx,my), updateFly(dt)` từ `physics.js`. `toMenu(), showResult()` từ
`flow.js`.

- [ ] **Step 1: Tạo `meta.js`**

```js
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'ban-bong-v1';

export default {
  id: 'ban-bong',
  title: 'Bắn Bóng',
  tagline: 'Ngắm bắn, nối 3 bóng cùng màu',
  desc: 'Ngắm và bắn bóng màu lên lưới, từ 3 bóng cùng màu liền kề trở lên sẽ nổ. Dọn sạch lưới trước khi bóng tràn xuống.',
  tags: ['Bắn bóng', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 4), text: `Đã qua ${s.maxLevel}/4 màn`, updated: 0 } : null;
  },
};
```

- [ ] **Step 2: Tạo `index.html`** (giống khung Task 1 Step 2, đổi tiêu đề/chú thích)

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Bắn Bóng · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Lưới bóng"></canvas>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
</div>
<p class="keys">Di chuột để ngắm, bấm để bắn</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`**

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
[hidden]{display:none!important}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}
.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em}
.card{width:min(90%,30em);max-height:92%;overflow:auto;background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;
  padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .levels,.card .actions{display:flex;flex-wrap:wrap;gap:.5em}
.card .actions{justify-content:flex-end}
.card .lvBtn{flex:1 1 40%;font:inherit;padding:.6em;border-radius:.5em;border:1px solid #ffffff40;background:#ffffff14;color:#f3efe6;cursor:pointer}
.card .lvBtn:disabled{opacity:.4;cursor:not-allowed}
.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
export const COLS = 10, ROWS = 9, LOSE_ROW = 7, CELL = 44, TOP_Y = 50;
export const BOARD_X0 = (960 - COLS * CELL) / 2;
export const SHOOTER_X = 480, SHOOTER_Y = 480, PROJ_SPEED = 560, N_COLORS = 4;
export const COLORS = ['#e9574a', '#4a9fe9', '#5fae4a', '#e9b949'];
export const G = { mode: 'menu', level: -1, won: false, cur: 1, next: 1, aimX: SHOOTER_X, aimY: TOP_Y };
export const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
export let proj = null;
export function setProj(p) { proj = p; }
// exposeGlobals (debug.js) chụp giá trị của `proj` tại thời điểm tạo object literal, không phải live binding —
// để test đọc/ghi được proj hiện tại sau khi fire() đã gán, phải đi qua hàm này thay vì biến `proj` trần.
export function getProj() { return proj; }
```

- [ ] **Step 5: Tạo `js/data.js`**

```js
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const LEVELS = [
  { fillRows: 3, colors: 3 }, { fillRows: 4, colors: 3 }, { fillRows: 4, colors: 4 }, { fillRows: 5, colors: 4 },
];
export const S = { maxLevel: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
```

- [ ] **Step 6: Tạo `js/flow.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { LEVELS, unlocked } from './data.js';
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
  showCard(`<p class="eyebrow">Bắn Bóng</p><h2>Chọn màn</h2>
    <div class="levels">${LEVELS.map((_, i) => `<button type="button" class="lvBtn" data-lv="${i}" ${unlocked(i) ? '' : 'disabled'}>Màn ${i + 1}</button>`).join('')}</div>`, el => {
    el.querySelectorAll('.lvBtn').forEach(b => b.onclick = () => { startLevel(+b.dataset.lv); showOnly(null); });
  });
}
export function showResult() {
  showCard(`<p class="eyebrow">Màn ${G.level + 1}</p><h2>${G.won ? 'Sạch lưới!' : 'Bóng tràn xuống…'}</h2>
    <div class="actions"><button type="button" class="btn ghost" id="rMenu">Chọn màn</button>
    <button type="button" class="btn" id="rGo">${G.won ? 'Màn kế' : 'Thử lại'}</button></div>`, el => {
    $('rMenu').onclick = toMenu;
    $('rGo').onclick = G.won
      ? () => { startLevel(Math.min(G.level + 1, LEVELS.length - 1)); showOnly(null); }
      : () => { startLevel(G.level); showOnly(null); };
  });
}
```

- [ ] **Step 7: Tạo `js/physics.js`**

```js
import { COLS, ROWS, LOSE_ROW, CELL, TOP_Y, BOARD_X0, SHOOTER_X, SHOOTER_Y, PROJ_SPEED, N_COLORS, G, grid, proj, setProj } from './state.js';
import { LEVELS, S, save } from './data.js';
import { showResult } from './flow.js';

const SHOTS_PER_INSERT = 6;
let shotCount = 0;

function randColorFromGrid() {
  const present = new Set();
  for (const row of grid) for (const c of row) if (c) present.add(c);
  const arr = [...present];
  return arr.length ? arr[(Math.random() * arr.length) | 0] : 1 + ((Math.random() * N_COLORS) | 0);
}
export function startLevel(i) {
  G.mode = 'aim'; G.level = i; G.won = false;
  for (const row of grid) row.fill(0);
  const def = LEVELS[i];
  for (let r = 0; r < def.fillRows; r++) for (let c = 0; c < COLS; c++) grid[r][c] = 1 + ((Math.random() * def.colors) | 0);
  shotCount = 0; setProj(null);
  G.cur = randColorFromGrid(); G.next = randColorFromGrid();
  G.aimX = SHOOTER_X; G.aimY = TOP_Y;
}
export function aim(mx, my) { G.aimX = mx; G.aimY = my; }
export function fire(mx, my) {
  if (G.mode !== 'aim') return;
  const dx = mx - SHOOTER_X, dy = -Math.abs(my - SHOOTER_Y) || -1;
  const d = Math.hypot(dx, dy) || 1;
  setProj({ x: SHOOTER_X, y: SHOOTER_Y, vx: dx / d * PROJ_SPEED, vy: dy / d * PROJ_SPEED, color: G.cur });
  G.cur = G.next; G.next = randColorFromGrid();
  G.mode = 'fly';
}
function cluster(r0, c0, color) {
  const seen = new Set(), stack = [[r0, c0]], key = (r, c) => r * COLS + c;
  seen.add(key(r0, c0));
  const out = [[r0, c0]];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || seen.has(key(nr, nc))) continue;
      if (grid[nr][nc] === color) { seen.add(key(nr, nc)); stack.push([nr, nc]); out.push([nr, nc]); }
    }
  }
  return out;
}
function dropFloating() {
  const reach = new Set(), key = (r, c) => r * COLS + c, stack = [];
  for (let c = 0; c < COLS; c++) if (grid[0][c]) { stack.push([0, c]); reach.add(key(0, c)); }
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || reach.has(key(nr, nc))) continue;
      if (grid[nr][nc]) { reach.add(key(nr, nc)); stack.push([nr, nc]); }
    }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && !reach.has(key(r, c))) grid[r][c] = 0;
}
function tryAttach() {
  const col = Math.max(0, Math.min(COLS - 1, Math.round((proj.x - BOARD_X0 - CELL / 2) / CELL)));
  let topRow = ROWS;
  for (let r = 0; r < ROWS; r++) if (grid[r][col]) { topRow = r; break; }
  // topRow === 0 nghĩa là cột đã đầy tới tận trần (rất hay gặp sau insertRow, vì hàng 0 luôn được lấp kín) —
  // không còn hàng nào ở trên để gắn thêm, kẹp về 0 để tránh tính topRow-1 = -1 rồi ghi ra ngoài mảng.
  const stopY = topRow === ROWS ? TOP_Y : TOP_Y + (Math.max(0, topRow - 1)) * CELL;
  if (proj.y > stopY) return false;
  const row = Math.max(0, topRow === ROWS ? 0 : topRow - 1);
  grid[row][col] = proj.color;
  const group = cluster(row, col, proj.color);
  if (group.length >= 3) for (const [r, c] of group) grid[r][c] = 0;
  dropFloating();
  return true;
}
function isEmpty() { return grid.every(row => row.every(c => !c)); }
function hasOverflow() { for (let r = LOSE_ROW; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) return true; return false; }
function insertRow() {
  for (let r = ROWS - 1; r > 0; r--) grid[r] = grid[r - 1].slice();
  grid[0] = Array.from({ length: COLS }, () => 1 + ((Math.random() * N_COLORS) | 0));
}
function win() { G.mode = 'result'; G.won = true; S.maxLevel = Math.max(S.maxLevel, G.level + 1); save(); showResult(); }
function lose() { G.mode = 'result'; G.won = false; showResult(); }
export function updateFly(dt) {
  if (G.mode !== 'fly' || !proj) return;
  proj.x += proj.vx * dt; proj.y += proj.vy * dt;
  if (proj.x < CELL / 2 || proj.x > 960 - CELL / 2) proj.vx *= -1;
  if (tryAttach()) {
    setProj(null);
    shotCount++;
    if (shotCount % SHOTS_PER_INSERT === 0) insertRow();
    if (isEmpty()) return win();
    if (hasOverflow()) return lose();
    G.mode = 'aim';
  }
}
```

- [ ] **Step 8: Tạo `js/render.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { ell, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { COLS, ROWS, CELL, TOP_Y, BOARD_X0, SHOOTER_X, SHOOTER_Y, COLORS, G, grid, proj } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!grid[r][c]) continue;
    ell(ctx, BOARD_X0 + c * CELL + CELL / 2, TOP_Y + r * CELL + CELL / 2, CELL * .42, CELL * .42, COLORS[grid[r][c] - 1]);
  }
  if (G.mode === 'aim') {
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(SHOOTER_X, SHOOTER_Y); ctx.lineTo(G.aimX, Math.min(G.aimY, SHOOTER_Y - 10)); ctx.stroke();
    ctx.setLineDash([]);
  }
  ell(ctx, SHOOTER_X, SHOOTER_Y, CELL * .42, CELL * .42, COLORS[G.cur - 1]);
  ell(ctx, SHOOTER_X + 70, SHOOTER_Y, CELL * .28, CELL * .28, COLORS[G.next - 1]);
  if (proj) ell(ctx, proj.x, proj.y, CELL * .42, CELL * .42, COLORS[proj.color - 1]);

  ctx.textAlign = 'right'; outlinedText(ctx, `Màn ${G.level + 1}`, 944, 30, `18px ${FB}`, '#fff');
  ctx.textAlign = 'left'; outlinedText(ctx, 'Tiếp theo', 16, 30, `16px ${FD}`, '#ffe6a8');
}
```

- [ ] **Step 9: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { G, grid, getProj } from './state.js';
import { LEVELS, S, unlocked } from './data.js';
import { startLevel, aim, fire, updateFly } from './physics.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
function toGame(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 960, y: (e.clientY - r.top) / r.height * 540 }; }
cv.addEventListener('pointermove', e => { const p = toGame(e); aim(p.x, p.y); });
cv.addEventListener('pointerdown', e => { ac(); const p = toGame(e); fire(p.x, p.y); });

function update(dt) { updateFly(dt); }

mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, grid, getProj, LEVELS, S, unlocked, update, render, startLevel, aim, fire, updateFly }]);
startLoop(update, render);
```

- [ ] **Step 10: Đăng ký lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Thêm `import banBong from '../games/ban-bong/meta.js';` và thêm `banBong` vào mảng `GAMES`.

- [ ] **Step 11: Thêm dòng vào `README.md`**

- [ ] **Step 12: Viết `tests/test_ban_bong.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Bắn Bóng. Chạy: python3 tests/test_ban_bong.py [lọc tên]"""
from harness import run, root

URL = 'games/ban-bong/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_cluster_of_three_pops(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    popped = pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      grid[8][4] = 1; grid[8][5] = 1;   // 2 bóng màu 1 sẵn ở hàng đáy, cột 4-5
      fire(480, 50);                     // G.cur có thể không phải màu 1 -> ép màu để kiểm thử xác định
      const p = getProj(); p.color = 1; p.x = 480 + (4 - 5) * 44; p.y = 50;  // đưa đạn về đúng cột 4, gần hàng đáy
      for (let i = 0; i < 200; i++) update(1/60);
      return grid[8][4] === 0 && grid[8][5] === 0;
    }""")
    assert popped, 'cụm ≥3 bóng cùng màu phải nổ hết'


@test
def test_floating_bubbles_drop_after_pop(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    remaining = pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      grid[0][0] = 1; grid[0][1] = 1; grid[1][1] = 2;  // bóng màu 2 ở (1,1) chỉ còn bám vào lưới qua (0,1)
      fire(480, 50);
      const p = getProj(); p.color = 1; p.x = 260 + 2 * 44 + 22; p.y = 50;  // nhắm vào cột 2 (trống) -> gắn ở hàng 0
      for (let i = 0; i < 200; i++) update(1/60);
      return grid[1][1];
    }""")
    # Cụm (0,0)-(0,1)-(0,2) cùng màu 1 nổ hết -> (1,1) mất liên kết với hàng trên -> phải tự rơi (bị xoá).
    assert remaining == 0, 'bóng mất liên kết với hàng trên phải tự rơi sau khi cụm nổ'


@test
def test_reaching_lose_row_ends_in_loss(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      // Hàng LOSE_ROW (7) đã có bóng sẵn ngay từ đầu -> bất kỳ lượt bắn nào kết thúc cũng phải phát hiện tràn
      // ngay sau khi gắn xong (hasOverflow() luôn được kiểm tra lại mỗi khi một viên bóng vừa gắn vào lưới).
      for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++) grid[r][c] = (r < 8) ? 1 : 0;
    }""")
    assert pg.evaluate("G.mode") != 'result'  # chưa trigger tới khi có lượt bắn tiếp theo
    pg.evaluate("G.cur = 2; fire(480, 50); for (let i = 0; i < 300; i++) update(1/60)")
    assert pg.evaluate("G.mode") == 'result' and pg.evaluate("G.won") == False, 'lưới tràn qua LOSE_ROW phải báo thua'


@test
def test_shooting_into_a_column_full_to_the_ceiling_does_not_crash(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      for (let r = 0; r < 9; r++) grid[r][4] = 1;  // cột 4 đầy kín từ hàng 0 tới đáy (topRow sẽ là 0)
      fire(480, 50);
      const p = getProj(); p.color = 1; p.x = 260 + 4 * 44 + 22; p.y = 50;  // đặt thẳng đạn vào đúng cột 4, sát trần
      for (let i = 0; i < 200; i++) update(1/60);
    }""")
    # Không có assert đặc biệt: bài test tự fail nếu có lỗi console (harness kiểm tra lỗi console ở mọi bài).
    # Mục đích riêng: trước khi vá, dòng `grid[row][col]` với row=-1 ném TypeError ngay khi đạn chạm đỉnh cột đầy.


run(TESTS)
```

- [ ] **Step 13: Chạy test, xác nhận qua**

Run: `python3 tests/test_ban_bong.py` — Expected: 5 bài PASS.
Run: `python3 tests/test_platform.py` — Expected: toàn bộ PASS, báo "(7 game)".

- [ ] **Step 14: Commit**

```bash
git add games/ban-bong/ platform/games.js README.md tests/test_ban_bong.py
git commit -m "ban-bong: game bubble shooter"
```

---

### Task 5: Làng Nghề (`lang-nghe`)

**Files:**
- Create: `games/lang-nghe/index.html`, `games/lang-nghe/style.css`, `games/lang-nghe/meta.js`
- Create: `games/lang-nghe/js/state.js`, `games/lang-nghe/js/data.js`, `games/lang-nghe/js/save.js`,
  `games/lang-nghe/js/clicker.js`, `games/lang-nghe/js/flow.js`, `games/lang-nghe/js/render.js`,
  `games/lang-nghe/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa), `README.md`
- Test: `tests/test_lang_nghe.py`

**Interfaces (produces):** `STORE_KEY='lang-nghe-v1'`. `UPGRADES, MAX_OFFLINE_SEC` từ `data.js`. `S, save` từ
`save.js`. `click(), buy(u), costOf(u), canBuy(u), autoPerSec(), tickAuto(dt), collectOffline(), fmt(n)` từ
`clicker.js`. `G` từ `state.js`.

- [ ] **Step 1: Tạo `meta.js`**

```js
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'lang-nghe-v1';

export default {
  id: 'lang-nghe',
  title: 'Làng Nghề',
  tagline: 'Bấm sản xuất, mua nâng cấp, để dành rồi quay lại',
  desc: 'Bấm để tạo của cải, mua thợ và nâng cấp để tăng thu nhập tự động. Làng vẫn sản xuất cả khi bạn vắng mặt.',
  tags: ['Idle', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.wealth ? { pct: Math.min(1, s.wealth / 100000), text: `${Math.floor(s.wealth)} của cải`, updated: 0 } : null;
  },
};
```

- [ ] **Step 2: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Làng Nghề · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Làng"></canvas>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
  <div class="shop" id="shop"></div>
</div>
<p class="keys">Bấm vào làng để sản xuất · mua nâng cấp bên dưới</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`**

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
[hidden]{display:none!important}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:60%;display:block}
.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}
.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em;z-index:2}
.card{width:min(90%,28em);background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .actions{display:flex;gap:.5em;justify-content:flex-end}
.shop{position:absolute;inset:60% 0 0 0;display:grid;grid-template-columns:repeat(2,1fr);gap:.6cqw;padding:1.2cqw;overflow:auto}
.upBtn{font:inherit;font-size:.82em;padding:.5em;border-radius:.5em;border:1px solid #ffffff40;background:#ffffff14;color:#f3efe6;cursor:pointer;text-align:left}
.upBtn:disabled{opacity:.4;cursor:not-allowed}
.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
export const G = { pulse: 0 };
```

- [ ] **Step 5: Tạo `js/data.js`**

```js
export const UPGRADES = [
  { id: 'phuong', name: 'Phường hội', kind: 'click', baseCost: 15, costMul: 1.15, value: 1 },
  { id: 'tho', name: 'Thợ mộc', kind: 'auto', baseCost: 25, costMul: 1.15, value: 1 },
  { id: 'xuong', name: 'Xưởng dệt', kind: 'auto', baseCost: 200, costMul: 1.17, value: 8 },
  { id: 'cang', name: 'Thương cảng', kind: 'auto', baseCost: 1500, costMul: 1.2, value: 50 },
];
export const MAX_OFFLINE_SEC = 4 * 3600;
```

- [ ] **Step 6: Tạo `js/save.js`**

```js
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
export const S = { wealth: 0, perClick: 1, owned: {}, lastSeen: Date.now(), ...(readJSON(STORE_KEY) || {}) };
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
```

- [ ] **Step 7: Tạo `js/clicker.js`**

```js
import { UPGRADES, MAX_OFFLINE_SEC } from './data.js';
import { S, save } from './save.js';

export function autoPerSec() {
  let sum = 0;
  for (const u of UPGRADES) if (u.kind === 'auto') sum += (S.owned[u.id] || 0) * u.value;
  return sum;
}
export function costOf(u) { return Math.round(u.baseCost * Math.pow(u.costMul, S.owned[u.id] || 0)); }
export function canBuy(u) { return S.wealth >= costOf(u); }
export function buy(u) {
  if (!canBuy(u)) return false;
  S.wealth -= costOf(u); S.owned[u.id] = (S.owned[u.id] || 0) + 1;
  if (u.kind === 'click') S.perClick += u.value;
  save();
  return true;
}
export function click() { S.wealth += S.perClick; }
export function tickAuto(dt) { S.wealth += autoPerSec() * dt; }
export function collectOffline() {
  const elapsed = Math.min(MAX_OFFLINE_SEC, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  const gain = Math.round(elapsed * autoPerSec());
  S.wealth += gain;
  return gain;
}
export function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toFixed(1) + 'k';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'tr';
  return (n / 1e9).toFixed(1) + 'B';
}
```

- [ ] **Step 8: Tạo `js/flow.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { UPGRADES } from './data.js';
import { S } from './save.js';
import { buy, costOf, canBuy, fmt } from './clicker.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) { $('card').innerHTML = html; showOnly('cardWrap'); onRender && onRender($('card')); }
export function showOfflineGain(gain) {
  showCard(`<p class="eyebrow">Chào mừng trở lại</p><h2>+${fmt(gain)} của cải</h2><p>Làng đã sản xuất trong lúc bạn vắng mặt.</p>
    <div class="actions"><button type="button" class="btn" id="oOk">Nhận</button></div>`, el => { $('oOk').onclick = () => showOnly(null); });
}
export function initShop() {
  $('shop').innerHTML = UPGRADES.map(u => `<button type="button" class="upBtn" data-id="${u.id}">${u.name}<br><small data-lbl></small></button>`).join('');
  $('shop').querySelectorAll('.upBtn').forEach((btn, i) => btn.onclick = () => buy(UPGRADES[i]));
}
export function updateShop() {
  $('shop').querySelectorAll('.upBtn').forEach((btn, i) => {
    const u = UPGRADES[i];
    btn.querySelector('[data-lbl]').textContent = `Đã mua ${S.owned[u.id] || 0} · ${costOf(u)}v`;
    btn.disabled = !canBuy(u);
  });
}
```

- [ ] **Step 9: Tạo `js/render.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { outlinedText, ell } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G } from './state.js';
import { S } from './save.js';
import { autoPerSec, fmt } from './clicker.js';

const cv = $('cv'), ctx = cv.getContext('2d');
export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  ctx.textAlign = 'center';
  outlinedText(ctx, fmt(S.wealth), 480, 140, `56px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `+${fmt(autoPerSec())} / giây · bấm +${S.perClick}`, 480, 180, `18px ${FB}`, '#a3a8b8');
  const s = 1 + G.pulse * .25;
  ctx.save(); ctx.translate(480, 300); ctx.scale(s, s);
  ell(ctx, 0, 0, 70, 70, '#6b8f3a'); ell(ctx, 0, -10, 40, 30, '#8a6a3e');
  ctx.restore();
  outlinedText(ctx, 'Bấm vào làng để sản xuất', 480, 400, `16px ${FB}`, '#fff');
}
```

- [ ] **Step 10: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac, tone } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { UPGRADES } from './data.js';
import { S, save } from './save.js';
import { G } from './state.js';
import { click, tickAuto, collectOffline, buy, costOf, canBuy, autoPerSec, fmt } from './clicker.js';
import { showOfflineGain, initShop, updateShop } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => { ac(); click(); tone(660, .05, 'square', .03); G.pulse = 1; });

function update(dt) { tickAuto(dt); G.pulse = Math.max(0, G.pulse - dt * 3); updateShop(); }

mountHomeLink($('stage'));
initShop();
const gain = collectOffline();
if (gain > 0) showOfflineGain(gain);
setInterval(save, 5000);
if (debugOn()) exposeGlobals([{ S, G, UPGRADES, update, render, click, tickAuto, collectOffline, buy, costOf, canBuy, autoPerSec, fmt, save }]);
startLoop(update, render);
```

- [ ] **Step 11: Đăng ký lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Thêm `import langNghe from '../games/lang-nghe/meta.js';` và thêm `langNghe` vào mảng `GAMES`.

- [ ] **Step 12: Thêm dòng vào `README.md`**

- [ ] **Step 13: Viết `tests/test_lang_nghe.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Làng Nghề. Chạy: python3 tests/test_lang_nghe.py [lọc tên]"""
from harness import run, root

URL = 'games/lang-nghe/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_click_adds_wealth_and_buy_spends_and_scales_cost(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("click()")
    assert pg.evaluate("S.wealth") == 1
    pg.evaluate("S.wealth = 1000")
    cost0 = pg.evaluate("costOf(UPGRADES[1])")  # 'tho' (auto)
    ok = pg.evaluate("buy(UPGRADES[1])")
    cost1 = pg.evaluate("costOf(UPGRADES[1])")
    assert ok and cost1 > cost0, 'giá nâng cấp phải tăng sau khi mua'


@test
def test_auto_income_accrues_over_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.wealth = 1000; buy(UPGRADES[1])")  # có 1 'tho' (+1/giây)
    w0 = pg.evaluate("S.wealth")
    pg.evaluate("for (let i = 0; i < 180; i++) update(1/60)")  # 3 giây
    assert pg.evaluate("S.wealth") > w0, 'thu nhập tự động không cộng dồn theo thời gian'


@test
def test_offline_earnings_are_capped(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    gain = pg.evaluate("""() => {
      S.wealth = 0; S.owned = { tho: 10 };  // +10/giây
      S.lastSeen = Date.now() - 100 * 3600 * 1000;  // vắng mặt 100 giờ, vượt xa trần 4 giờ
      return collectOffline();
    }""")
    assert gain == 10 * 4 * 3600, ('thu nhập khi vắng mặt phải bị chặn ở trần MAX_OFFLINE_SEC', gain)


run(TESTS)
```

- [ ] **Step 14: Chạy test, xác nhận qua**

Run: `python3 tests/test_lang_nghe.py` — Expected: 4 bài PASS.
Run: `python3 tests/test_platform.py` — Expected: toàn bộ PASS, báo "(8 game)".

- [ ] **Step 15: Commit**

```bash
git add games/lang-nghe/ platform/games.js README.md tests/test_lang_nghe.py
git commit -m "lang-nghe: game idle clicker"
```

---

### Task 6: Dựng Nước (`dung-nuoc`)

**Files:**
- Create: `games/dung-nuoc/index.html`, `games/dung-nuoc/style.css`, `games/dung-nuoc/meta.js`
- Create: `games/dung-nuoc/js/state.js`, `games/dung-nuoc/js/data.js`, `games/dung-nuoc/js/save.js`,
  `games/dung-nuoc/js/buildings.js`, `games/dung-nuoc/js/flow.js`, `games/dung-nuoc/js/render.js`,
  `games/dung-nuoc/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa), `README.md`
- Test: `tests/test_dung_nuoc.py`

**Interfaces (produces):** `STORE_KEY='dung-nuoc-v1'`. `COLS, ROWS` từ `state.js`. `BUILDING_DEFS,
MAX_OFFLINE_SEC` từ `data.js`. `S, save` từ `save.js`. `recomputePop(), unlockedKinds(), canAfford(kind),
canBuild(plot,kind), build(plot,kind), incomePerSec(), tick(dt), collectOffline()` từ `buildings.js`.

- [ ] **Step 1: Tạo `meta.js`**

```js
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'dung-nuoc-v1';

export default {
  id: 'dung-nuoc',
  title: 'Dựng Nước',
  tagline: 'Xây làng, phát triển dân số không ngừng',
  desc: 'Đặt nhà dân, ruộng lúa, chợ búa lên từng ô đất, tích luỹ Vàng và Lương thực để mở khoá thêm công trình mới.',
  tags: ['Xây dựng', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.pop ? { pct: Math.min(1, s.pop / 200), text: `Dân số ${s.pop}`, updated: 0 } : null;
  },
};
```

- [ ] **Step 2: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Dựng Nước · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Bản đồ làng"></canvas>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
  <div class="plots" id="plots"></div>
</div>
<p class="keys">Bấm ô đất trống để xây công trình</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`**

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
[hidden]{display:none!important}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:26%;display:block}
.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}
.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em;z-index:2}
.card{width:min(90%,28em);background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .kinds,.card .actions{display:flex;flex-wrap:wrap;gap:.5em}
.card .actions{justify-content:flex-end}
.card .kindBtn{flex:1 1 40%;font:inherit;padding:.5em;border-radius:.5em;border:1px solid #ffffff40;background:#ffffff14;color:#f3efe6;cursor:pointer}
.card .kindBtn:disabled{opacity:.4;cursor:not-allowed}
.plots{position:absolute;inset:26% 0 0 0;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(6,1fr);gap:.25cqw;padding:1cqw}
.plot{font:inherit;font-size:.68em;border-radius:.4em;border:1px dashed #ffffff40;background:#ffffff0f;color:#f3efe6;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center;padding:.2em}
.plot.filled{border-style:solid;background:#caa65a30;border-color:#caa65a}
.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
export const COLS = 8, ROWS = 6;
```

- [ ] **Step 5: Tạo `js/data.js`**

```js
export const BUILDING_DEFS = {
  house:   { name: 'Nhà dân',    cost: { gold: 20 },            pop: 4,  unlockAt: 0 },
  farm:    { name: 'Ruộng lúa',  cost: { gold: 15 },            food: 2, unlockAt: 0 },
  market:  { name: 'Chợ',        cost: { gold: 40, food: 10 },  gold: 2, unlockAt: 10 },
  well:    { name: 'Giếng nước', cost: { gold: 30 },            pop: 6,  unlockAt: 20 },
  granary: { name: 'Kho thóc',   cost: { gold: 60 },            food: 6, unlockAt: 30 },
  temple:  { name: 'Đình làng',  cost: { gold: 80, food: 30 },  pop: 10, unlockAt: 40 },
};
export const MAX_OFFLINE_SEC = 4 * 3600;
```

- [ ] **Step 6: Tạo `js/save.js`**

```js
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
export const S = { grid: {}, gold: 50, food: 20, pop: 0, lastSeen: Date.now(), ...(readJSON(STORE_KEY) || {}) };
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
```

- [ ] **Step 7: Tạo `js/buildings.js`**

```js
import { BUILDING_DEFS, MAX_OFFLINE_SEC } from './data.js';
import { S, save } from './save.js';

export function recomputePop() {
  let pop = 0;
  for (const kind of Object.values(S.grid)) pop += BUILDING_DEFS[kind].pop || 0;
  S.pop = pop;
}
export function unlockedKinds() { return Object.keys(BUILDING_DEFS).filter(k => BUILDING_DEFS[k].unlockAt <= S.pop); }
export function canAfford(kind) {
  const cost = BUILDING_DEFS[kind].cost;
  return (cost.gold || 0) <= S.gold && (cost.food || 0) <= S.food;
}
export function canBuild(plot, kind) { return !S.grid[plot] && unlockedKinds().includes(kind) && canAfford(kind); }
export function build(plot, kind) {
  if (!canBuild(plot, kind)) return false;
  const cost = BUILDING_DEFS[kind].cost;
  S.gold -= cost.gold || 0; S.food -= cost.food || 0;
  S.grid[plot] = kind; recomputePop(); save();
  return true;
}
export function incomePerSec() {
  let gold = 0, food = 0;
  for (const kind of Object.values(S.grid)) { gold += BUILDING_DEFS[kind].gold || 0; food += BUILDING_DEFS[kind].food || 0; }
  return { gold, food };
}
export function tick(dt) { const inc = incomePerSec(); S.gold += inc.gold * dt; S.food += inc.food * dt; }
export function collectOffline() {
  const elapsed = Math.min(MAX_OFFLINE_SEC, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  const inc = incomePerSec(); S.gold += inc.gold * elapsed; S.food += inc.food * elapsed;
  return elapsed;
}
```

- [ ] **Step 8: Tạo `js/flow.js`**

```js
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
```

- [ ] **Step 9: Tạo `js/render.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { BUILDING_DEFS } from './data.js';
import { S } from './save.js';
import { unlockedKinds } from './buildings.js';

const cv = $('cv'), ctx = cv.getContext('2d');
export function render() {
  const sky = ctx.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, '#2a3b2a'); sky.addColorStop(1, '#4a6b3a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 540);
  ctx.textAlign = 'left';
  outlinedText(ctx, `Vàng: ${Math.floor(S.gold)}`, 16, 36, `26px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `Lương thực: ${Math.floor(S.food)}`, 16, 64, `18px ${FB}`, '#fff');
  ctx.textAlign = 'right';
  outlinedText(ctx, `Dân số: ${S.pop}`, 944, 36, `26px ${FD}`, '#ffe6a8');
  const locked = Object.keys(BUILDING_DEFS).filter(k => !unlockedKinds().includes(k));
  if (locked.length) {
    const next = locked.reduce((a, b) => BUILDING_DEFS[a].unlockAt < BUILDING_DEFS[b].unlockAt ? a : b);
    outlinedText(ctx, `Mở ${BUILDING_DEFS[next].name} ở dân số ${BUILDING_DEFS[next].unlockAt}`, 944, 64, `14px ${FB}`, '#a3a8b8');
  }
}
```

- [ ] **Step 10: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { COLS, ROWS } from './state.js';
import { BUILDING_DEFS } from './data.js';
import { S, save } from './save.js';
import { recomputePop, unlockedKinds, canAfford, canBuild, build, incomePerSec, tick, collectOffline } from './buildings.js';
import { initPlots, updatePlots } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => ac(), { once: true });

function update(dt) { tick(dt); updatePlots(); }

mountHomeLink($('stage'));
recomputePop();
initPlots(COLS * ROWS);
collectOffline(); save();
setInterval(save, 5000);
if (debugOn()) exposeGlobals([{ S, BUILDING_DEFS, update, render, recomputePop, unlockedKinds, canAfford, canBuild, build, incomePerSec, tick, collectOffline }]);
startLoop(update, render);
```

- [ ] **Step 11: Đăng ký lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Thêm `import dungNuoc from '../games/dung-nuoc/meta.js';` và thêm `dungNuoc` vào mảng `GAMES`.

- [ ] **Step 12: Thêm dòng vào `README.md`**

- [ ] **Step 13: Viết `tests/test_dung_nuoc.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Dựng Nước. Chạy: python3 tests/test_dung_nuoc.py [lọc tên]"""
from harness import run, root

URL = 'games/dung-nuoc/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_build_deducts_cost_and_blocks_on_occupied_plot(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.gold = 100; S.food = 50")
    ok, gold1 = pg.evaluate("() => { const ok = build('0', 'house'); return [ok, S.gold]; }")
    assert ok and gold1 == 80
    ok2 = pg.evaluate("build('0', 'farm')")
    assert ok2 == False, 'không xây đè lên ô đã có công trình được'


@test
def test_population_unlocks_new_building_kind(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("unlockedKinds().includes('market')") == False
    pg.evaluate("S.pop = 10")  # đặt tay dân số để kiểm tra ngưỡng mở khoá, độc lập với việc xây công trình thật
    assert pg.evaluate("unlockedKinds().includes('market')") == True


@test
def test_income_accrues_and_offline_income_is_capped(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.gold = 1000; S.food = 1000; build('0', 'farm')")
    food0 = pg.evaluate("S.food")
    pg.evaluate("for (let i = 0; i < 180; i++) update(1/60)")  # 3 giây, farm +2/giây
    assert pg.evaluate("S.food") > food0
    gained = pg.evaluate("""() => {
      S.lastSeen = Date.now() - 100 * 3600 * 1000;
      const g0 = S.food; collectOffline(); return S.food - g0;
    }""")
    assert gained == 2 * 4 * 3600, ('thu nhập offline phải bị chặn ở trần 4 giờ', gained)


@test
def test_reload_keeps_the_built_grid(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.gold = 1000; build('5', 'house'); save()")
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("S.grid['5']") == 'house', 'tải lại trang phải giữ nguyên bản đồ đã xây'


run(TESTS)
```

- [ ] **Step 14: Chạy test, xác nhận qua**

Run: `python3 tests/test_dung_nuoc.py` — Expected: 5 bài PASS.
Run: `python3 tests/test_platform.py` — Expected: toàn bộ PASS, báo "(9 game)".

- [ ] **Step 15: Commit**

```bash
git add games/dung-nuoc/ platform/games.js README.md tests/test_dung_nuoc.py
git commit -m "dung-nuoc: game xây dựng/quản lý"
```

---

### Task 7: Mở Cõi (`mo-coi`)

**Files:**
- Create: `games/mo-coi/index.html`, `games/mo-coi/style.css`, `games/mo-coi/meta.js`
- Create: `games/mo-coi/js/state.js`, `games/mo-coi/js/save.js`, `games/mo-coi/js/conquest.js`,
  `games/mo-coi/js/flow.js`, `games/mo-coi/js/render.js`, `games/mo-coi/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa), `README.md`
- Test: `tests/test_mo_coi.py`

**Interfaces (produces):** `STORE_KEY='mo-coi-v1'`. `COLS, ROWS, N, HOME, MAX_TROOPS, SPAWN_PER_SEC,
DEFENSE_GROW_PER_SEC, DEFENSE_CAP, G` từ `state.js`. `S, save` từ `save.js`. `neighbors(i), tick(dt),
canAttack(from,to), attack(from,to), hasWon(), collectOffline()` từ `conquest.js`.

- [ ] **Step 1: Tạo `meta.js`**

```js
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'mo-coi-v1';

export default {
  id: 'mo-coi',
  title: 'Mở Cõi',
  tagline: 'Dựng quân, chiếm trọn bản đồ',
  desc: 'Vùng bạn kiểm soát tự sinh quân theo thời gian. Chọn vùng xuất quân rồi tấn công vùng kề để mở rộng lãnh thổ.',
  tags: ['Chiến thuật', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    if (!s || !s.owner) return null;
    const n = s.owner.filter(o => o === 1).length;
    return n > 1 ? { pct: n / s.owner.length, text: `Kiểm soát ${n}/${s.owner.length} vùng`, updated: 0 } : null;
  },
};
```

- [ ] **Step 2: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Mở Cõi · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Bản đồ"></canvas>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
  <div class="regions" id="regions"></div>
</div>
<p class="keys">Bấm vùng của bạn rồi bấm vùng kề chưa chiếm để tấn công</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`**

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
[hidden]{display:none!important}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:18%;display:block}
.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}
.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em;z-index:2}
.card{width:min(90%,26em);background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .actions{display:flex;gap:.5em;justify-content:flex-end}
.regions{position:absolute;inset:18% 0 0 0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:.4cqw;padding:1.2cqw}
.region{font:inherit;font-size:.85em;border-radius:.5em;border:2px solid #ffffff40;background:#5a2a2a;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center}
.region.mine{background:#2a5a3a;border-color:#7bbf5a}
.region.selected{outline:3px solid #ffd35a}
.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
export const COLS = 4, ROWS = 3, N = COLS * ROWS, HOME = 0;
export const MAX_TROOPS = 60, SPAWN_PER_SEC = 1.5, DEFENSE_GROW_PER_SEC = .3, DEFENSE_CAP = 40;
export const G = { selected: null, won: false };
```

- [ ] **Step 5: Tạo `js/save.js`**

```js
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
import { N, HOME } from './state.js';

export const S = {
  owner: Array.from({ length: N }, (_, i) => i === HOME ? 1 : 0),
  troops: Array.from({ length: N }, (_, i) => i === HOME ? 5 : 8),
  lastSeen: Date.now(), ...(readJSON(STORE_KEY) || {}),
};
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
```

- [ ] **Step 6: Tạo `js/conquest.js`**

```js
import { COLS, ROWS, N, MAX_TROOPS, SPAWN_PER_SEC, DEFENSE_GROW_PER_SEC, DEFENSE_CAP } from './state.js';
import { S, save } from './save.js';

export const neighbors = i => {
  const x = i % COLS, y = (i / COLS) | 0, out = [];
  if (x > 0) out.push(i - 1); if (x < COLS - 1) out.push(i + 1);
  if (y > 0) out.push(i - COLS); if (y < ROWS - 1) out.push(i + COLS);
  return out;
};
export function tick(dt) {
  for (let i = 0; i < N; i++) {
    if (S.owner[i]) S.troops[i] = Math.min(MAX_TROOPS, S.troops[i] + SPAWN_PER_SEC * dt);
    else S.troops[i] = Math.min(DEFENSE_CAP, S.troops[i] + DEFENSE_GROW_PER_SEC * dt);
  }
}
export function canAttack(from, to) {
  return !!S.owner[from] && !S.owner[to] && neighbors(from).includes(to) && S.troops[from] > 1;
}
export function attack(from, to) {
  if (!canAttack(from, to)) return false;
  const sent = Math.floor(S.troops[from]) - 1;
  if (sent <= 0) return false;
  S.troops[from] = 1;
  if (sent > S.troops[to]) { S.owner[to] = 1; S.troops[to] = sent - S.troops[to]; }
  save();
  return true;
}
export function hasWon() { return S.owner.every(o => o === 1); }
export function collectOffline() {
  const elapsed = Math.min(4 * 3600, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  tick(elapsed);
  return elapsed;
}
```

- [ ] **Step 7: Tạo `js/flow.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { S } from './save.js';
import { canAttack, attack, hasWon } from './conquest.js';
import { G } from './state.js';

export function showOnly(id) { $('cardWrap').hidden = id !== 'cardWrap'; }
export function showCard(html, onRender) { $('card').innerHTML = html; showOnly('cardWrap'); onRender && onRender($('card')); }
export function showWin() {
  showCard(`<p class="eyebrow">Mở Cõi</p><h2>Đã chiếm trọn bản đồ!</h2>
    <div class="actions"><button type="button" class="btn" id="wOk">Tiếp tục</button></div>`, el => { $('wOk').onclick = () => showOnly(null); });
}
export function initRegions(n) {
  $('regions').innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" class="region" data-r="${i}"></button>`).join('');
  $('regions').querySelectorAll('.region').forEach(btn => btn.onclick = () => onRegionClick(+btn.dataset.r));
}
function onRegionClick(i) {
  if (G.selected === null) { if (S.owner[i]) G.selected = i; return; }
  if (G.selected === i) { G.selected = null; return; }
  if (S.owner[i]) { G.selected = i; return; }
  if (canAttack(G.selected, i)) { attack(G.selected, i); G.selected = null; if (hasWon() && !G.won) { G.won = true; showWin(); } }
}
export function updateRegions() {
  $('regions').querySelectorAll('.region').forEach(btn => {
    const i = +btn.dataset.r;
    btn.classList.toggle('mine', !!S.owner[i]);
    btn.classList.toggle('selected', G.selected === i);
    btn.textContent = Math.floor(S.troops[i]);
  });
}
```

- [ ] **Step 8: Tạo `js/render.js`**

```js
import { $ } from '../../../platform/core/util.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { S } from './save.js';

const cv = $('cv'), ctx = cv.getContext('2d');
export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  const mine = S.owner.filter(o => o === 1).length;
  ctx.textAlign = 'left'; outlinedText(ctx, `Vùng kiểm soát: ${mine}/${S.owner.length}`, 16, 34, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, 'Mở Cõi', 944, 34, `18px ${FB}`, '#fff');
}
```

- [ ] **Step 9: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { COLS, ROWS, N, HOME, MAX_TROOPS, SPAWN_PER_SEC, DEFENSE_GROW_PER_SEC, DEFENSE_CAP, G } from './state.js';
import { S, save } from './save.js';
import { neighbors, tick, canAttack, attack, hasWon, collectOffline } from './conquest.js';
import { initRegions, updateRegions } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => ac(), { once: true });

function update(dt) { tick(dt); updateRegions(); }

mountHomeLink($('stage'));
initRegions(N);
collectOffline(); save();
setInterval(save, 5000);
if (debugOn()) exposeGlobals([{ S, G, N, HOME, MAX_TROOPS, update, render, neighbors, tick, canAttack, attack, hasWon, collectOffline }]);
startLoop(update, render);
```

- [ ] **Step 10: Đăng ký lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Thêm `import moCoi from '../games/mo-coi/meta.js';` và thêm `moCoi` vào mảng `GAMES`.

- [ ] **Step 11: Thêm dòng vào `README.md`**

- [ ] **Step 12: Viết `tests/test_mo_coi.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Mở Cõi. Chạy: python3 tests/test_mo_coi.py [lọc tên]"""
from harness import run, root

URL = 'games/mo-coi/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_owned_region_spawns_troops_over_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    t0 = pg.evaluate("S.troops[HOME]")
    pg.evaluate("for (let i = 0; i < 180; i++) update(1/60)")  # 3 giây
    assert pg.evaluate("S.troops[HOME]") > t0, 'vùng của người chơi không tự sinh quân'


@test
def test_attack_wins_when_stronger_and_captures_region(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    ok, owner1, nb = pg.evaluate("""() => {
      const to = neighbors(HOME)[0];
      S.troops[HOME] = 50; S.troops[to] = 5;
      const ok = attack(HOME, to);
      return [ok, S.owner[to], to];
    }""")
    assert ok == True and owner1 == 1, 'tấn công mạnh hơn phải chiếm được vùng'


@test
def test_attack_loses_when_weaker_and_target_unchanged(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # attack() trả về true hễ cuộc tấn công được THỰC HIỆN (đủ quân xuất phát), bất kể thắng hay thua trận —
    # thắng/thua được phản ánh qua S.owner/S.troops của vùng mục tiêu, không phải qua giá trị trả về.
    result = pg.evaluate("""() => {
      const to = neighbors(HOME)[0];
      S.troops[HOME] = 5; S.troops[to] = 50; S.owner[to] = 0;
      const defBefore = S.troops[to];
      attack(HOME, to);
      return [S.owner[to], S.troops[to] === defBefore];
    }""")
    assert result[0] == 0 and result[1] == True, 'thua trận thì vùng mục tiêu phải giữ nguyên, không đổi chủ'


@test
def test_cannot_attack_non_adjacent_region(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    far = pg.evaluate("N - 1")
    pg.evaluate("S.troops[HOME] = 50")
    ok = pg.evaluate(f"canAttack(HOME, {far})")
    assert ok == False, 'không được tấn công vùng không kề'


@test
def test_offline_elapsed_time_is_capped(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # MAX_TROOPS/DEFENSE_CAP tự nó cũng chặn số quân rất sớm (trong vài chục giây) nên không dùng được để suy ra
    # trần thời gian offline — kiểm tra thẳng giá trị `elapsed` mà collectOffline() trả về mới cô lập đúng trần.
    elapsed = pg.evaluate("""() => {
      S.lastSeen = Date.now() - 100 * 3600 * 1000;  // vắng mặt 100 giờ, vượt xa trần 4 giờ
      return collectOffline();
    }""")
    assert elapsed == 4 * 3600, ('thời gian cộng dồn khi vắng mặt phải bị chặn ở trần 4 giờ', elapsed)


run(TESTS)
```

- [ ] **Step 13: Chạy test, xác nhận qua**

Run: `python3 tests/test_mo_coi.py` — Expected: 6 bài PASS.
Run: `python3 tests/test_platform.py` — Expected: toàn bộ PASS, báo "(10 game)".

- [ ] **Step 14: Chạy lại toàn bộ test các game khác để xác nhận không có gì hỏng**

```
python3 tests/test_hao_khi.py
python3 tests/test_doi_khang.py
python3 tests/test_giu_nuoc.py
python3 tests/test_ban_na.py
python3 tests/test_chay_lang.py
python3 tests/test_noi_ngoc.py
python3 tests/test_ban_bong.py
python3 tests/test_lang_nghe.py
python3 tests/test_dung_nuoc.py
```
Expected: tất cả `0 hỏng` (lưu ý các flaky đã biết: `test_doi_khang.py::test_double_ko_is_a_draw` và
`test_hao_khi.py::test_stage1_fair_play` có thể hỏng ngẫu nhiên, chạy lại riêng bài đó nếu là lỗi duy nhất).

- [ ] **Step 15: Commit**

```bash
git add games/mo-coi/ platform/games.js README.md tests/test_mo_coi.py
git commit -m "mo-coi: game dựng quân và chinh phục bản đồ"
```
