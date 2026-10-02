# Giữ Nước Qua Ngàn Năm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm game xây dựng + phòng thủ theo đợt (`games/giu-nuoc-qua-ngan-nam/`) vào Game Hub: người chơi chỉ xây/nâng cấp công trình quanh Nhà chính (trại lính, tháp canh, trụ cọc), lính và tháp tự hành quân/chiến đấu, qua 6 thời kỳ lịch sử chống ngoại xâm.

**Architecture:** ES modules thuần, Canvas 2D 960×540, không build. Tái dùng `platform/core` (loop, input không cần vì điều khiển bằng nút DOM, audio, settings, storage, fx, util, debug) và `platform/art` (chibi, poses, draw) + `platform/ui` (theme, bar). Chiến trường không cuộn (toàn bộ vừa một màn hình): Nhà chính bên trái, 6 lô đất cố định (2 cột × 3 làn) ngay bên phải Nhà chính, giặc tiến vào từ mép phải. Mọi thao tác xây dựng/nâng cấp/bắt đầu đợt dùng nút DOM thật (không bắt sự kiện click trên canvas) để dễ dùng trên cảm ứng và dễ kiểm thử; canvas chỉ vẽ, không nhận thao tác trực tiếp. Mã riêng của game chia theo trách nhiệm trong `games/giu-nuoc-qua-ngan-nam/js/`: `state.js` (hằng số + trạng thái dùng chung), `save.js` (tiến trình mở thời kỳ), `data.js` (bàn dữ liệu 6 thời kỳ), `buildings.js` (xây/nâng cấp, thu nhập), `troops.js` (xuất lính, hành quân, va chạm cận chiến, thua trận), `towers.js` (bắn tự động + đạn), `waves.js` (chuyển giai đoạn chuẩn bị/chiến đấu, trụ cọc, thắng màn/mở thời kỳ kế), `render.js` (vẽ), `flow.js` (menu/bản đồ thời kỳ/HUD tương tác/kết quả), `main.js` (khởi tạo + vòng lặp).

**Tech Stack:** JavaScript ES modules + Canvas 2D, Playwright (Python) cho test, server tĩnh `python3 -m http.server`.

**Spec:** `docs/superpowers/specs/2026-10-02-giu-nuoc-qua-ngan-nam-design.md`

## Global Constraints

- Không thêm thư viện, không thêm bước build; mọi import chỉ từ `platform/` hoặc từ thư mục của chính game này.
- Không sửa bất kỳ file nào trong `games/hao-khi/` hoặc `games/doi-khang-anh-hung/`.
- Chỉ sửa `platform/games.js` theo cách cộng thêm (1 dòng import + 1 phần tử trong mảng `GAMES`), đọc lại file ngay trước khi sửa để hợp nhất với thay đổi mới nhất; không sửa file `platform/` nào khác.
- Chỉ sửa `README.md` ở đúng phần liệt kê thư mục `games/` để thêm dòng cho `doi-khang-anh-hung` (đang thiếu) và `giu-nuoc-qua-ngan-nam`; không đổi nội dung nào khác trong README.
- 6 thời kỳ, mỗi màn độc lập — không cộng dồn chỉ số/tiến độ giữa các màn (chỉ tiến trình "đã mở thời kỳ nào" được lưu).
- Mọi chữ hiển thị bằng tiếng Việt.
- Không multiplayer, không điều khiển trực tiếp nhân vật trên chiến trường — người chơi chỉ xây dựng/quản lý.
- Mỗi task một commit, chỉ add các file task đó tạo/sửa.
- Game không lộ biến ra `window` khi không có `?debug` (theo quy ước `core/debug.js`).

## Review Focus

- Xây đè lên lô đất đã có công trình: phải bị chặn, không trừ thêm Vàng, không tạo bản ghi `B` thứ hai cho cùng lô.
- Hết Vàng giữa chừng (sau vài lần xây/nâng cấp/tuyển lính liên tiếp): mọi thao tác tốn Vàng phải bị chặn, `G.gold` không được âm.
- Tháp canh bắn giặc ngoài tầm (`towerDef.range`): không được bắn; giặc vào đúng tầm mới bắn và gây sát thương.
- Trụ cọc gây sát thương diện đúng 1 lần cho mỗi đợt rồi im cho tới giai đoạn chuẩn bị kế tiếp mới nạp lại — không được đánh liên tục khi giặc đứng yên tại chỗ.
- Nhà chính về 0 máu giữa lúc nhiều lính/giặc đang hoạt động: phải chuyển sang thua đúng một lần, vòng lặp tiếp tục chạy không báo lỗi console (không gọi lặp lại màn kết quả).

---

### Task 1: Khung game + đăng ký lên trang chủ

**Files:**
- Create: `games/giu-nuoc-qua-ngan-nam/index.html`
- Create: `games/giu-nuoc-qua-ngan-nam/style.css`
- Create: `games/giu-nuoc-qua-ngan-nam/meta.js`
- Create: `games/giu-nuoc-qua-ngan-nam/js/state.js`
- Create: `games/giu-nuoc-qua-ngan-nam/js/flow.js`
- Create: `games/giu-nuoc-qua-ngan-nam/js/render.js`
- Create: `games/giu-nuoc-qua-ngan-nam/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa)
- Modify: `README.md` (thêm dòng `doi-khang-anh-hung` đang thiếu + dòng `giu-nuoc-qua-ngan-nam` trong mục `games/`)
- Test: `tests/test_giu_nuoc.py`

**Interfaces (produces):**
- `STORE_KEY = 'giu-nuoc-qua-ngan-nam-v1'` (export từ `meta.js`).
- `W, H, LANES, HQ_X, HQ_FRONT_X, SPAWN_X, MAX_ALLIES_PER_LANE, PROJ_SPEED, PLOTS, findPlot(id), buildingOn(plotId), G, B, troops, projs` từ `state.js`. `G = { eraIdx, era, phase, wave, gold, t, shake, hq: { hp, maxHp, lvl }, queue, spawnT }`, `phase` ∈ `'menu' | 'prep' | 'battle' | 'win' | 'lose'`.
- `toTitle()`, `showOnly(id)`, `showCard(html, onRender)` từ `flow.js` (các task sau mở rộng `flow.js`).
- `render()` từ `render.js` (các task sau mở rộng).
- Trang `games/giu-nuoc-qua-ngan-nam/` mở được, có `<canvas id="cv">`, có đường về trang chủ qua `mountHomeLink`.

- [ ] **Step 1: Tạo `meta.js`**

```js
// Thông tin Giữ Nước Qua Ngàn Năm cho trang chủ. Nhẹ: không import mã chạy game.
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'giu-nuoc-qua-ngan-nam-v1';

export default {
  id: 'giu-nuoc-qua-ngan-nam',
  title: 'Giữ Nước Qua Ngàn Năm',
  tagline: 'Xây làng, giữ đất qua 6 thời kỳ',
  desc: 'Dựng trại lính, tháp canh, trụ cọc quanh Nhà chính rồi để quân ta tự chống trả giặc ngoại xâm qua 6 thời kỳ lịch sử.',
  tags: ['Phòng thủ', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxEra ? { pct: s.maxEra / 6, text: `Đã thắng ${s.maxEra}/6 thời kỳ`, updated: 0 } : null;
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
<title>Giữ Nước Qua Ngàn Năm · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Chiến trường"></canvas>
  <div class="menu" id="menu" hidden></div>
  <div class="cardWrap" id="cardWrap" hidden><div class="card" id="card"></div></div>
  <div class="hud" id="hud" hidden>
    <div class="plots" id="plots">
      <button type="button" class="plot" data-plot="0">1<br><small>Trống</small></button>
      <button type="button" class="plot" data-plot="1">2<br><small>Trống</small></button>
      <button type="button" class="plot" data-plot="2">3<br><small>Trống</small></button>
      <button type="button" class="plot" data-plot="3">4<br><small>Trống</small></button>
      <button type="button" class="plot" data-plot="4">5<br><small>Trống</small></button>
      <button type="button" class="plot" data-plot="5">6<br><small>Trống</small></button>
    </div>
    <button type="button" class="btn ghost" id="btnHqUp">Nâng Nhà chính</button>
    <button type="button" class="btn" id="btnStartWave">Bắt đầu đợt</button>
  </div>
</div>
<p class="keys">Bấm lô đất để xây/nâng cấp công trình · bấm "Bắt đầu đợt" khi đã sẵn sàng</p>
<script type="module" src="main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`**

```css
/* Theme riêng của game: không dùng biến từ game khác. */
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#10120e;color:#f3efe6;font-family:'Itim','Segoe UI',system-ui,sans-serif}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}

.btn{font:inherit;font-size:1em;padding:.5em 1.1em;border-radius:.6em;border:none;background:#caa65a;color:#201a10;cursor:pointer}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn.ghost{background:#0000;border:1px solid #ffffff80;color:#f3efe6}

.menu{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6em;
  text-align:center;background:linear-gradient(180deg,#0000 20%,#10120ecc 100%)}
.menu h1{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:3em;margin:0;color:#caa65a}
.menu .sub{margin:0 0 .4em;font-size:1em;color:#f3efe6}
.menu .row{display:flex;gap:.6em}

.cardWrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;padding:1em}
.card{width:min(90%,32em);max-height:92%;overflow:auto;background:#2a2418;border:.18em solid #caa65a;border-radius:.8em;
  padding:1em 1.2em;display:flex;flex-direction:column;gap:.6em}
.card .eyebrow{font-size:.8em;letter-spacing:.1em;text-transform:uppercase;color:#caa65a;margin:0}
.card h2{font-family:'Pattaya',Georgia,serif;font-weight:400;font-size:1.5em;margin:0}
.card .eras,.card .actions{display:flex;flex-wrap:wrap;gap:.5em}
.card .actions{justify-content:flex-end}
.card .eraBtn{flex:1 1 40%;font:inherit;padding:.5em;border-radius:.5em;border:1px solid #ffffff40;background:#ffffff14;color:#f3efe6;cursor:pointer}
.card .eraBtn:disabled{opacity:.4;cursor:not-allowed}

.hud{position:absolute;inset:auto 0 0 0;display:flex;align-items:center;gap:1cqw;padding:1.2cqw 2cqw;background:#0009}
.hud .plots{display:flex;gap:.8cqw;flex:1}
.plot{flex:1;font:inherit;font-size:.78em;padding:.4em .2em;border-radius:.5em;border:1px solid #ffffff59;background:#ffffff14;color:#f3efe6;cursor:pointer}
.plot.filled{background:#caa65a40;border-color:#caa65a}
.plot small{display:block;opacity:.85}

.keys{margin:0;color:#a3a8b8;font-size:14px;text-align:center}
```

- [ ] **Step 4: Tạo `js/state.js`**

```js
// Hằng số hình học + trạng thái dùng chung cho mọi module. Mảng dùng chung: làm rỗng bằng refill(), không gán lại biến.
export const W = 960, H = 540;
export const LANES = [280, 360, 440];           // y mặt đất của 3 làn: trên, giữa, dưới
export const HQ_X = 70, HQ_FRONT_X = 130, SPAWN_X = 900;
export const MAX_ALLIES_PER_LANE = 3;
export const PROJ_SPEED = 420;
// 6 lô đất cố định: 2 cột × 3 làn, cạnh Nhà chính
export const PLOTS = [
  { id: 0, lane: 0, x: 190 }, { id: 1, lane: 0, x: 270 },
  { id: 2, lane: 1, x: 190 }, { id: 3, lane: 1, x: 270 },
  { id: 4, lane: 2, x: 190 }, { id: 5, lane: 2, x: 270 },
];
export const findPlot = id => PLOTS.find(p => p.id === id);

// phase: 'menu' | 'prep' | 'battle' | 'win' | 'lose'
export const G = {
  eraIdx: -1, era: null, phase: 'menu', wave: 0, gold: 0, t: 0, shake: 0,
  hq: { hp: 0, maxHp: 0, lvl: 1 }, queue: [], spawnT: 0,
};
export const B = [];       // { plot, kind: 'camp'|'tower'|'stake', lvl, t, used }
export const troops = [];  // { side: 'ally'|'enemy', lane, x, hp, maxHp, dmg, reach, spd, name, walk }
export const projs = [];   // { lane, x, target, dmg, dead }

export const buildingOn = plotId => B.find(b => b.plot === plotId);
```

- [ ] **Step 5: Tạo `js/flow.js` (chỉ phần tối thiểu: menu tiêu đề)**

```js
// Luồng game: menu, bản đồ thời kỳ, HUD tương tác trong trận, kết quả. Task 2-3-6 mở rộng file này.
import { $ } from '../../../platform/core/util.js';
import { G } from './state.js';

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
    <div class="row"><button type="button" class="btn" id="mPlay" disabled>Chọn thời kỳ (Task 2)</button></div>`;
  showOnly('menu');
}
```

- [ ] **Step 6: Tạo `js/render.js` (chỉ vẽ nền trống)**

```js
// Vẽ chiến trường. Task 2 thêm Nhà chính/lô đất/HUD, Task 4 thêm lính, Task 5 thêm đạn.
import { $ } from '../../../platform/core/util.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  ctx.fillStyle = '#12141a';
  ctx.fillRect(0, 0, W_FALLBACK, H_FALLBACK);
}
const W_FALLBACK = 960, H_FALLBACK = 540;
```

- [ ] **Step 7: Tạo `js/main.js`**

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { G, B, troops, projs, PLOTS, buildingOn } from './state.js';
import { toTitle } from './flow.js';
import { render } from './render.js';

function update(dt) {
  G.t += dt;
}

mountHomeLink($('stage'));
toTitle();
if (debugOn()) exposeGlobals([{ G, B, troops, projs, PLOTS, buildingOn, update, render }]);
startLoop(update, render);
```

- [ ] **Step 8: Đăng ký game lên trang chủ — đọc lại `platform/games.js` trước khi sửa**

Đọc `platform/games.js` hiện tại (đã có `haoKhi` và `doiKhangAnhHung`), thêm một dòng import và một phần tử:

```js
import giuNuoc from '../games/giu-nuoc-qua-ngan-nam/meta.js';
// ...giữ nguyên các import khác đã có...
export const GAMES = [haoKhi, doiKhangAnhHung, giuNuoc];
```

- [ ] **Step 9: Sửa `README.md` — thêm 2 dòng còn thiếu trong mục `games/`**

Trong khối liệt kê cấu trúc thư mục, sửa:

```
games/
  hao-khi/              Hào Khí Việt Nam
  _template/            game mẫu để chép khi làm game mới
```

thành:

```
games/
  hao-khi/              Hào Khí Việt Nam
  doi-khang-anh-hung/   Đối Kháng Anh Hùng
  giu-nuoc-qua-ngan-nam/ Giữ Nước Qua Ngàn Năm
  _template/            game mẫu để chép khi làm game mới
```

- [ ] **Step 10: Viết test `tests/test_giu_nuoc.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Giữ Nước Qua Ngàn Năm. Chạy: python3 tests/test_giu_nuoc.py [lọc tên]"""
from harness import run, root

URL = 'games/giu-nuoc-qua-ngan-nam/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


run(TESTS)
```

- [ ] **Step 11: Chạy test, xác nhận qua**

Run: `python3 tests/test_giu_nuoc.py`
Expected: `PASS test_game_loads_with_home_link`, `1 bài, 0 hỏng`.

- [ ] **Step 12: Chạy `test_platform.py` để chắc trang chủ vẫn liệt kê đúng cả 3 game**

Run: `python3 tests/test_platform.py`
Expected: toàn bộ PASS, `test_every_game_meta_is_complete_and_loads` báo `(3 game)`.

- [ ] **Step 13: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/ platform/games.js README.md tests/test_giu_nuoc.py
git commit -m "giu-nuoc-qua-ngan-nam: khung game + đăng ký lên trang chủ"
```

---

### Task 2: Dữ liệu 6 thời kỳ + tiến trình lưu + bản đồ chọn thời kỳ

**Files:**
- Create: `games/giu-nuoc-qua-ngan-nam/js/data.js`
- Create: `games/giu-nuoc-qua-ngan-nam/js/save.js`
- Create: `games/giu-nuoc-qua-ngan-nam/js/waves.js` (chỉ `startEra`/`armStakes` ở task này)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (thêm `showEraSelect`, `beginEra`)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/render.js` (vẽ nền theo thời kỳ, Nhà chính, lô đất trống, HUD chữ)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `toTitle` → nút mở bản đồ thật)
- Test: `tests/test_giu_nuoc.py`

**Interfaces:**
- Consumes: `W, H, LANES, HQ_X, PLOTS, G` từ `state.js` (Task 1).
- Produces: `ERAS` (6 phần tử, `{ id, name, year, foe, bg, hq, campCost, campUpgradeCost, towerDef, stakeDef, enemy, waves }`) và `bossDef(era)` từ `data.js`. `S = { maxEra }`, `save()`, `unlocked(i)` từ `save.js`. `startEra(i)`, `armStakes()` từ `waves.js`. `showEraSelect()`, `beginEra(i)` từ `flow.js`.

- [ ] **Step 1: Tạo `js/data.js`**

```js
// Dữ liệu 6 thời kỳ. makeEra sinh số liệu tăng dần theo độ khó (i = 0..5) từ một khung chung:
// cùng một bộ máy chơi, chỉ khó dần và khác tên/mốc năm/quân địch.
const TROOP_NAMES = ['Dân binh', 'Lính giáo', 'Cấm quân'];

function makeEra(i, flavor) {
  const k = 1 + i * 0.3;
  const troopTypes = TROOP_NAMES.map((name, lvl) => ({
    id: `t${lvl}`, name,
    hp: Math.round((40 + lvl * 24) * k),
    dmg: Math.round((7 + lvl * 5) * k),
    reach: 22, spd: 42,
    spawnCost: 8 + lvl * 7,
    spawnEvery: 3.6 - lvl * 0.5,
  }));
  const waves = [0, 1, 2, 3, 4].map(w => ({
    mix: [{ type: 'grunt', count: 3 + w + i }],
    bossFinal: w === 4,
  }));
  return {
    id: flavor.id, name: flavor.name, year: flavor.year, foe: flavor.foe, bg: flavor.bg,
    hq: { hp: Math.round(90 * k), income: [4, 7, 11], upgradeCost: [40, 90] },
    campCost: 30, campUpgradeCost: [35, 60],
    towerDef: { cost: 35, dmg: Math.round(10 * k), range: 170, rate: 1 },
    stakeDef: { cost: 25, dmg: Math.round(50 * k) },
    enemy: { hp: Math.round(30 * k), dmg: Math.round(6 * k), reach: 22, spd: 40 },
    waves,
  };
}

export const ERAS = [
  makeEra(0, { id: 'hai-ba-trung', name: 'Hai Bà Trưng', year: '40–43', foe: 'quân Hán', bg: '#6fa33a' }),
  makeEra(1, { id: 'bach-dang-938', name: 'Ngô Quyền · Bạch Đằng', year: '938', foe: 'quân Nam Hán', bg: '#3a7a93' }),
  makeEra(2, { id: 'ly-thuong-kiet', name: 'Lý Thường Kiệt', year: '1075–1077', foe: 'quân Tống', bg: '#8a6a3a' }),
  makeEra(3, { id: 'hung-dao-vuong', name: 'Hưng Đạo Vương', year: '1258–1288', foe: 'quân Nguyên Mông', bg: '#5a5a7a' }),
  makeEra(4, { id: 'le-loi', name: 'Lê Lợi', year: '1418–1427', foe: 'quân Minh', bg: '#7a3a3a' }),
  makeEra(5, { id: 'quang-trung', name: 'Quang Trung', year: '1789', foe: 'quân Thanh', bg: '#3a5a3a' }),
];

export function bossDef(era) {
  return {
    hp: Math.round(era.enemy.hp * 3.2), dmg: Math.round(era.enemy.dmg * 1.6),
    reach: era.enemy.reach + 10, spd: era.enemy.spd * .8, name: 'Tướng giặc',
  };
}
```

- [ ] **Step 2: Tạo `js/save.js`**

```js
// Tiến trình: thời kỳ cao nhất đã mở. Mỗi thời kỳ chơi độc lập, không cộng dồn chỉ số giữa các màn.
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const S = { maxEra: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxEra;
```

- [ ] **Step 3: Tạo `js/waves.js` (chỉ phần khởi tạo trận ở task này; Task 6 thêm phần đợt/thắng-thua)**

```js
// Chuyển giai đoạn chuẩn bị/chiến đấu + trụ cọc. Task 1 có state.js, Task 6 thêm startWave/updateWaveSpawns/updateStakes.
import { refill } from '../../../platform/core/util.js';
import { ERAS } from './data.js';
import { G, B, troops, projs } from './state.js';

export function startEra(i) {
  G.eraIdx = i; G.era = ERAS[i]; G.phase = 'prep'; G.wave = 0; G.gold = 40; G.t = 0; G.shake = 0;
  G.hq = { hp: G.era.hq.hp, maxHp: G.era.hq.hp, lvl: 1 }; G.queue = []; G.spawnT = 0;
  refill(B); refill(troops); refill(projs);
  armStakes();
}
export function armStakes() {
  for (const b of B) if (b.kind === 'stake') b.used = false;
}
```

- [ ] **Step 4: Mở rộng `js/flow.js` — thêm bản đồ chọn thời kỳ**

```js
// Thêm vào đầu file, cạnh các import đã có:
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { startEra } from './waves.js';

// Thêm các hàm export mới (giữ nguyên showOnly/showCard/toTitle đã có, sửa nút mPlay trong toTitle):
export function showEraSelect() {
  showCard(`<p class="eyebrow">Bản đồ</p><h2>Chọn thời kỳ</h2>
    <div class="eras">${ERAS.map((e, i) => `<button type="button" class="eraBtn" data-era="${i}" ${unlocked(i) ? '' : 'disabled'}>${e.name}<br><small>${e.year}${unlocked(i) ? '' : ' · khoá'}</small></button>`).join('')}</div>
    <div class="actions"><button type="button" class="btn ghost" id="eBack">Về menu</button></div>`, el => {
    el.querySelectorAll('.eraBtn').forEach(b => b.onclick = () => beginEra(+b.dataset.era));
    $('eBack').onclick = toTitle;
  });
}
export function beginEra(i) { startEra(i); showOnly(null); }
```

Sửa nút trong `toTitle()` từ `disabled` sang gọi `showEraSelect`:

```js
export function toTitle() {
  G.phase = 'menu';
  $('menu').innerHTML = `<h1>Giữ Nước Qua Ngàn Năm</h1><p class="sub">Xây làng, giữ đất qua 6 thời kỳ lịch sử</p>
    <div class="row"><button type="button" class="btn" id="mPlay">Chọn thời kỳ</button></div>`;
  $('mPlay').onclick = showEraSelect;
  showOnly('menu');
}
```

- [ ] **Step 5: Viết lại `js/render.js` — vẽ nền theo thời kỳ, Nhà chính, lô đất trống, HUD chữ**

```js
import { $, clamp } from '../../../platform/core/util.js';
import { rr, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, B, LANES, PLOTS, HQ_X } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  if (!G.era) { ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540); return; }
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake);
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, G.era.bg); sky.addColorStop(1, '#1c2a1c');
  ctx.fillStyle = sky; ctx.fillRect(-10, -10, 980, 560);
  LANES.forEach(y => { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y + 8, 960, 3); });

  drawHQ();
  PLOTS.forEach(drawPlot);
  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();
  drawHud();
}
function drawHQ() {
  LANES.forEach(y => { ctx.fillStyle = '#5a4a36'; rr(ctx, HQ_X - 36, y - 56, 72, 56, 6); ctx.fill(); });
  const y = LANES[1];
  ctx.textAlign = 'center';
  outlinedText(ctx, `Nhà chính Lv${G.hq.lvl}`, HQ_X, y - 70, `13px ${FB}`, '#fff');
  drawBar(HQ_X - 36, y - 80, 72, 7, G.hq.hp / G.hq.maxHp, '#7bbf5a');
}
function drawPlot(p) {
  const b = B.find(x => x.plot === p.id);
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.setLineDash(b ? [] : [4, 4]);
  rr(ctx, p.x - 28, LANES[p.lane] - 48, 56, 48, 6); ctx.stroke(); ctx.setLineDash([]);
}
function drawBar(x, y, w, h, frac, col) {
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
}
function drawHud() {
  ctx.textAlign = 'left';
  outlinedText(ctx, `Vàng: ${Math.floor(G.gold)}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `${G.era.name} · ${G.era.year}`, 16, 54, `16px ${FB}`, '#fff');
  ctx.textAlign = 'right';
  outlinedText(ctx, `Đợt ${Math.min(G.wave + 1, G.era.waves.length)}/${G.era.waves.length}`, 944, 30, `18px ${FB}`, '#fff');
  outlinedText(ctx, G.phase === 'prep' ? 'Chuẩn bị' : G.phase === 'battle' ? 'Chiến đấu' : '', 944, 52, `14px ${FB}`, '#ffd35a');
  ctx.textAlign = 'left';
}
```

- [ ] **Step 6: Sửa `js/main.js` — thêm các module mới vào debug + vòng lặp**

```js
import { updateParticles } from '../../../platform/core/fx.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { startEra } from './waves.js';
import { showEraSelect } from './flow.js';
// (giữ nguyên các import đã có ở Task 1)

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
  updateParticles(dt, G.t);
}

// Sửa dòng exposeGlobals: thêm ERAS, S, startEra, showEraSelect
if (debugOn()) exposeGlobals([{ G, B, troops, projs, PLOTS, buildingOn, update, render, ERAS, S, unlocked, startEra, showEraSelect }]);
```

- [ ] **Step 7: Thêm test vào `tests/test_giu_nuoc.py`**

```python
@test
def test_start_era_sets_up_match(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    st = pg.evaluate("[G.phase, G.era.id, G.gold, G.hq.hp, G.hq.maxHp, B.length]")
    assert st[:3] == ['prep', 'hai-ba-trung', 40], st
    assert st[3] == st[4] and st[5] == 0, st


@test
def test_era_select_locks_future_eras(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    n_open = pg.evaluate("() => { showEraSelect(); return document.querySelectorAll('.eraBtn:not([disabled])').length; }")
    assert n_open == 1, n_open
```

- [ ] **Step 8: Chạy test, xác nhận qua**

Run: `python3 tests/test_giu_nuoc.py`
Expected: 3 bài PASS (`test_game_loads_with_home_link`, `test_start_era_sets_up_match`, `test_era_select_locks_future_eras`).

- [ ] **Step 9: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/ tests/test_giu_nuoc.py
git commit -m "giu-nuoc-qua-ngan-nam: dữ liệu 6 thời kỳ + bản đồ chọn thời kỳ"
```

---

### Task 3: Xây dựng & nâng cấp công trình

**Files:**
- Create: `games/giu-nuoc-qua-ngan-nam/js/buildings.js`
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (thêm `onPlotClick`, `initHud`, `updateHud`)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/render.js` (vẽ công trình đã xây trên lô)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `initHud`, `updateHud`, `updateIncome`)
- Test: `tests/test_giu_nuoc.py`

**Interfaces:**
- Consumes: `G, B, buildingOn` từ `state.js`.
- Produces: `BUILD_KINDS`, `buildLabel(kind)`, `costOf(kind)`, `canBuild(plotId, kind)`, `build(plotId, kind)`, `campUpgradeCost(b)`, `canUpgrade(b)`, `upgrade(b)`, `canUpgradeHQ()`, `upgradeHQ()`, `updateIncome(dt)` từ `buildings.js`. `initHud()`, `updateHud()` từ `flow.js`.

- [ ] **Step 1: Tạo `js/buildings.js`**

```js
// Xây/nâng cấp công trình + thu nhập Vàng theo thời gian. Mọi thao tác tốn Vàng chỉ cho phép ở giai đoạn chuẩn bị.
import { G, B, buildingOn } from './state.js';

export const BUILD_KINDS = ['camp', 'tower', 'stake'];
export const buildLabel = k => k === 'camp' ? 'Trại lính' : k === 'tower' ? 'Tháp canh' : 'Trụ cọc';

export function costOf(kind) {
  return kind === 'camp' ? G.era.campCost : kind === 'tower' ? G.era.towerDef.cost : G.era.stakeDef.cost;
}
export function canBuild(plotId, kind) {
  return G.phase === 'prep' && !buildingOn(plotId) && G.gold >= costOf(kind);
}
export function build(plotId, kind) {
  if (!canBuild(plotId, kind)) return false;
  G.gold -= costOf(kind);
  B.push({ plot: plotId, kind, lvl: 1, t: 0, used: false });
  return true;
}
export function campUpgradeCost(b) { return G.era.campUpgradeCost[b.lvl - 1]; }
export function canUpgrade(b) {
  return b.kind === 'camp' && b.lvl < 3 && G.phase === 'prep' && G.gold >= campUpgradeCost(b);
}
export function upgrade(b) {
  if (!canUpgrade(b)) return false;
  G.gold -= campUpgradeCost(b); b.lvl++; return true;
}
export function canUpgradeHQ() {
  return G.hq.lvl < 3 && G.phase === 'prep' && G.gold >= G.era.hq.upgradeCost[G.hq.lvl - 1];
}
export function upgradeHQ() {
  if (!canUpgradeHQ()) return false;
  G.gold -= G.era.hq.upgradeCost[G.hq.lvl - 1];
  G.hq.lvl++; G.hq.maxHp = Math.round(G.era.hq.hp * (1 + .25 * (G.hq.lvl - 1))); G.hq.hp = G.hq.maxHp;
  return true;
}
export function updateIncome(dt) { G.gold += G.era.hq.income[G.hq.lvl - 1] * dt; }
```

- [ ] **Step 2: Mở rộng `js/flow.js` — HUD tương tác trong trận**

```js
// Thêm vào đầu file, cạnh các import đã có:
import { BUILD_KINDS, buildLabel, costOf, build, campUpgradeCost, upgrade, canUpgradeHQ, upgradeHQ } from './buildings.js';
import { buildingOn } from './state.js'; // buildingOn đã export từ state.js; thêm vào danh sách import G đã có

// Thêm các hàm export mới:
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
```

- [ ] **Step 3: Mở rộng `js/render.js` — vẽ công trình đã xây**

Thêm import `{ B }` đã có sẵn ở Task 2; sửa `drawPlot`:

```js
function drawPlot(p) {
  const b = B.find(x => x.plot === p.id);
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.setLineDash(b ? [] : [4, 4]);
  rr(ctx, p.x - 28, LANES[p.lane] - 48, 56, 48, 6); ctx.stroke(); ctx.setLineDash([]);
  if (b) {
    ctx.fillStyle = b.kind === 'camp' ? '#6b8f3a' : b.kind === 'tower' ? '#4a6f9a' : '#8a6a3a';
    rr(ctx, p.x - 24, LANES[p.lane] - 42, 48, 36, 5); ctx.fill();
    ctx.textAlign = 'center';
    outlinedText(ctx, b.kind === 'camp' ? `C${b.lvl}` : b.kind === 'tower' ? 'T' : 'X', p.x, LANES[p.lane] - 18, `15px ${FD}`, '#fff');
  }
}
```

- [ ] **Step 4: Sửa `js/main.js` — gọi `initHud`/`updateHud`/`updateIncome`**

```js
import { initHud, updateHud, showEraSelect, toTitle } from './flow.js'; // gộp với import flow.js đã có
import { build, upgrade, upgradeHQ, updateIncome } from './buildings.js';

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
  if (G.phase === 'prep' || G.phase === 'battle') { updateIncome(dt); updateHud(); }
  updateParticles(dt, G.t);
}

mountHomeLink($('stage'));
initHud();
toTitle();
if (debugOn()) exposeGlobals([{ G, B, troops, projs, PLOTS, buildingOn, update, render, ERAS, S, unlocked, startEra, showEraSelect, build, upgrade, upgradeHQ }]);
```

- [ ] **Step 5: Thêm test vào `tests/test_giu_nuoc.py`**

```python
@test
def test_build_blocks_on_occupied_plot_and_when_poor(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    gold0 = pg.evaluate("G.gold")
    assert pg.evaluate("build(0, 'camp')") == True
    assert pg.evaluate("G.gold") == gold0 - 30
    assert pg.evaluate("B.length") == 1
    # lô đã có công trình: không xây đè được, không trừ thêm vàng
    gold1 = pg.evaluate("G.gold")
    assert pg.evaluate("build(0, 'tower')") == False
    assert pg.evaluate("B.length") == 1 and pg.evaluate("G.gold") == gold1
    # hết vàng: không xây lô khác được nữa
    pg.evaluate("G.gold = 0")
    assert pg.evaluate("build(1, 'camp')") == False
    assert pg.evaluate("B.length") == 1 and pg.evaluate("G.gold") == 0


@test
def test_hq_upgrade_increases_max_hp_and_costs_gold(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0); G.gold = 1000")
    maxHp0 = pg.evaluate("G.hq.maxHp")
    ok = pg.evaluate("upgradeHQ()")
    assert ok and pg.evaluate("G.hq.lvl") == 2
    assert pg.evaluate("G.hq.maxHp") > maxHp0
    assert pg.evaluate("G.hq.hp") == pg.evaluate("G.hq.maxHp")
```

- [ ] **Step 6: Chạy test, xác nhận qua**

Run: `python3 tests/test_giu_nuoc.py`
Expected: 5 bài PASS.

- [ ] **Step 7: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/ tests/test_giu_nuoc.py
git commit -m "giu-nuoc-qua-ngan-nam: xây dựng và nâng cấp công trình"
```

---

### Task 4: Trại lính, hành quân, va chạm cận chiến, thua khi Nhà chính hết máu

**Files:**
- Create: `games/giu-nuoc-qua-ngan-nam/js/troops.js`
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (thêm `showResult`)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/render.js` (vẽ lính/giặc)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `updateCamps`/`updateTroops`)
- Test: `tests/test_giu_nuoc.py`

**Interfaces:**
- Consumes: `G, B, troops, LANES, findPlot, SPAWN_X, HQ_FRONT_X, MAX_ALLIES_PER_LANE` từ `state.js`; `showResult` (mới, từ `flow.js` — import vòng với `troops.js`, chỉ gọi bên trong hàm nên an toàn, giống mẫu `world.js`↔`flow.js` của `hao-khi`).
- Produces: `spawnTroop(side, lane, def)`, `updateCamps(dt)`, `updateTroops(dt)` từ `troops.js`. `showResult()` từ `flow.js`.

- [ ] **Step 1: Tạo `js/troops.js`**

```js
// Trại lính xuất quân, lính/giặc hành quân và va chạm cận chiến, giặc áp sát Nhà chính gây sát thương liên tục.
import { prune } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { G, B, troops, LANES, findPlot, SPAWN_X, HQ_FRONT_X, MAX_ALLIES_PER_LANE } from './state.js';
import { showResult } from './flow.js';

export function spawnTroop(side, lane, def) {
  troops.push({
    side, lane, x: side === 'ally' ? HQ_FRONT_X + 10 : SPAWN_X,
    hp: def.hp, maxHp: def.hp, dmg: def.dmg, reach: def.reach, spd: def.spd, name: def.name || '', walk: 0,
  });
}
function nearestFoe(u) {
  let best = null, bd = Infinity;
  for (const o of troops) {
    if (o.side === u.side || o.lane !== u.lane || o.hp <= 0) continue;
    const d = Math.abs(o.x - u.x);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
export function updateCamps(dt) {
  for (const b of B) {
    if (b.kind !== 'camp') continue;
    b.t -= dt;
    if (b.t > 0) continue;
    const def = G.era.troopTypes[b.lvl - 1];
    b.t = def.spawnEvery;
    const lane = findPlot(b.plot).lane;
    const alive = troops.filter(u => u.side === 'ally' && u.lane === lane).length;
    if (G.gold >= def.spawnCost && alive < MAX_ALLIES_PER_LANE) { G.gold -= def.spawnCost; spawnTroop('ally', lane, def); }
  }
}
export function updateTroops(dt) {
  for (const u of troops) {
    const dir = u.side === 'ally' ? 1 : -1;
    const foe = nearestFoe(u);
    if (foe && Math.abs(foe.x - u.x) <= u.reach) { foe.hp -= u.dmg * dt; u.walk += dt * 3; continue; }
    if (u.side === 'enemy' && u.x <= HQ_FRONT_X) { G.hq.hp -= u.dmg * dt; G.shake = Math.max(G.shake, 2); continue; }
    u.x += dir * u.spd * dt; u.walk += dt * 8;
  }
  prune(troops, u => {
    if (u.hp > 0) return true;
    spark(u.x, LANES[u.lane] - 40, 8, u.side === 'ally' ? '#8fd6ff' : '#ff8f6b');
    return false;
  });
  if (G.hq.hp <= 0 && G.phase !== 'lose') { G.hq.hp = 0; G.phase = 'lose'; showResult(); }
}
```

- [ ] **Step 2: Mở rộng `js/flow.js` — màn kết quả thắng/thua**

```js
// Thêm vào đầu file:
// (ERAS, S, unlocked, startEra đã import từ Task 2)

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
```

- [ ] **Step 3: Mở rộng `js/render.js` — vẽ lính/giặc**

```js
// Thêm import ở đầu file:
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { troops } from './state.js'; // gộp vào dòng import state.js đã có

const ALLY_LOOK = { skin: '#f6d2ae', hair: '#1c1410', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', hat: 'khan', weapon: 'spear', scale: .5 };
const ENEMY_LOOK = { skin: '#e3b98f', hair: '#201810', shirt: '#7a2d2d', trim: '#c99a4a', pants: '#2a2020', belt: '#c99a4a', hat: 'mongol', weapon: 'glaive', scale: .5 };

// Trong render(), sau PLOTS.forEach(drawPlot); thêm:
  troops.forEach(drawTroop);

function drawTroop(u) {
  const look = u.side === 'ally' ? ALLY_LOOK : ENEMY_LOOK, face = u.side === 'ally' ? 1 : -1;
  drawChibi(ctx, u.x, LANES[u.lane], look, { face, t: G.t, ...POSES.run({ walk: u.walk }) });
  drawBar(u.x - 16, LANES[u.lane] - 76, 32, 5, u.hp / u.maxHp, u.side === 'ally' ? '#8fd6ff' : '#ff8f6b');
}
```

- [ ] **Step 4: Sửa `js/main.js` — gọi `updateCamps`/`updateTroops`**

```js
import { updateCamps, updateTroops } from './troops.js';

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
  if (G.phase === 'prep' || G.phase === 'battle') { updateIncome(dt); updateCamps(dt); updateTroops(dt); updateHud(); }
  updateParticles(dt, G.t);
}
```

- [ ] **Step 5: Thêm test vào `tests/test_giu_nuoc.py`**

```python
@test
def test_camp_spawns_troop_up_to_lane_limit(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("build(0, 'camp'); G.gold = 1000")
    pg.evaluate("for (let i = 0; i < 300; i++) update(1/60)")  # 5 giây mô phỏng
    n = pg.evaluate("troops.filter(u => u.side === 'ally' && u.lane === 0).length")
    assert 1 <= n <= 3, n


@test
def test_hq_loses_when_health_reaches_zero(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("G.phase = 'battle'; G.hq.hp = 1")
    pg.evaluate("troops.push({side:'enemy', lane:0, x:100, hp:40, maxHp:40, dmg:50, reach:0, spd:40, name:'t', walk:0})")
    pg.evaluate("for (let i = 0; i < 10; i++) update(1/60)")
    assert pg.evaluate("G.phase") == 'lose'
    assert pg.locator('#card h2').count() == 1
```

- [ ] **Step 6: Chạy test, xác nhận qua**

Run: `python3 tests/test_giu_nuoc.py`
Expected: 7 bài PASS, không có lỗi console (vòng lặp vẫn chạy ổn định sau khi thua).

- [ ] **Step 7: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/ tests/test_giu_nuoc.py
git commit -m "giu-nuoc-qua-ngan-nam: trại lính, hành quân, va chạm, thua trận"
```

---

### Task 5: Tháp canh & đạn

**Files:**
- Create: `games/giu-nuoc-qua-ngan-nam/js/towers.js`
- Modify: `games/giu-nuoc-qua-ngan-nam/js/render.js` (vẽ đạn)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `updateTowers`/`updateProjs`)
- Test: `tests/test_giu_nuoc.py`

**Interfaces:**
- Consumes: `G, B, troops, projs, findPlot, PROJ_SPEED` từ `state.js`.
- Produces: `updateTowers(dt)`, `updateProjs(dt)` từ `towers.js`.

- [ ] **Step 1: Tạo `js/towers.js`**

```js
// Tháp canh tự bắn giặc gần nhất trong tầm, cùng làn; đạn bay tới mục tiêu rồi gây sát thương.
import { prune } from '../../../platform/core/util.js';
import { G, B, troops, projs, findPlot, PROJ_SPEED } from './state.js';

export function updateTowers(dt) {
  for (const b of B) {
    if (b.kind !== 'tower') continue;
    b.t -= dt;
    if (b.t > 0) continue;
    const plot = findPlot(b.plot);
    const target = troops.find(u => u.side === 'enemy' && u.lane === plot.lane && Math.abs(u.x - plot.x) <= G.era.towerDef.range);
    if (!target) continue;
    b.t = 1 / G.era.towerDef.rate;
    projs.push({ lane: plot.lane, x: plot.x, target, dmg: G.era.towerDef.dmg, dead: false });
  }
}
export function updateProjs(dt) {
  for (const p of projs) {
    if (p.dead || p.target.hp <= 0) { p.dead = true; continue; }
    const dir = Math.sign(p.target.x - p.x) || 1;
    p.x += dir * PROJ_SPEED * dt;
    if (Math.abs(p.target.x - p.x) < 14) { p.target.hp -= p.dmg; p.dead = true; }
  }
  prune(projs, p => !p.dead);
}
```

- [ ] **Step 2: Mở rộng `js/render.js` — vẽ đạn**

```js
// Thêm import ell cạnh rr, outlinedText đã có:
import { rr, ell, outlinedText } from '../../../platform/art/draw.js';
import { projs } from './state.js'; // gộp vào dòng import state.js đã có

// Trong render(), sau troops.forEach(drawTroop); thêm:
  projs.forEach(drawProj);

function drawProj(q) { ell(ctx, q.x, LANES[q.lane] - 36, 5, 5, '#ffe6a8'); }
```

- [ ] **Step 3: Sửa `js/main.js` — gọi `updateTowers`/`updateProjs`**

```js
import { updateTowers, updateProjs } from './towers.js';

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
  if (G.phase === 'prep' || G.phase === 'battle') {
    updateIncome(dt); updateCamps(dt); updateTroops(dt); updateTowers(dt); updateProjs(dt); updateHud();
  }
  updateParticles(dt, G.t);
}
```

- [ ] **Step 4: Thêm test vào `tests/test_giu_nuoc.py`**

```python
@test
def test_tower_fires_only_within_range(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("build(2, 'tower')")  # lô 2 = làn 1, x 190, tầm 170
    pg.evaluate("G.phase = 'battle'")
    pg.evaluate("troops.push({side:'enemy', lane:1, x:900, hp:30, maxHp:30, dmg:0, reach:0, spd:0, name:'t', walk:0})")
    pg.evaluate("for (let i = 0; i < 30; i++) update(1/60)")
    assert pg.evaluate("projs.length") == 0, 'bắn khi địch còn ngoài tầm'
    pg.evaluate("troops.find(u => u.side === 'enemy').x = 260")
    pg.evaluate("for (let i = 0; i < 30; i++) update(1/60)")
    hit = pg.evaluate("projs.length >= 1 || troops.find(u => u.side === 'enemy').hp < 30")
    assert hit, 'không bắn khi địch vào tầm'
```

- [ ] **Step 5: Chạy test, xác nhận qua**

Run: `python3 tests/test_giu_nuoc.py`
Expected: 8 bài PASS.

- [ ] **Step 6: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/ tests/test_giu_nuoc.py
git commit -m "giu-nuoc-qua-ngan-nam: tháp canh và đạn"
```

---

### Task 6: Đợt giặc, trụ cọc, thắng màn/mở thời kỳ kế

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/js/waves.js` (thêm `startWave`, `updateWaveSpawns`, `updateStakes`, `finishWave` nội bộ)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (nút "Bắt đầu đợt" trong `initHud`/`updateHud`)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `updateWaveSpawns`/`updateStakes`)
- Test: `tests/test_giu_nuoc.py`

**Interfaces:**
- Consumes: `spawnTroop` từ `troops.js`; `showResult` từ `flow.js` (import vòng, chỉ gọi bên trong hàm).
- Produces: `startWave()`, `updateWaveSpawns(dt)`, `updateStakes()` từ `waves.js`.

- [ ] **Step 1: Mở rộng `js/waves.js`**

```js
// Thêm import ở đầu file:
import { floatText, spark } from '../../../platform/core/fx.js';
import { bossDef } from './data.js';
import { spawnTroop } from './troops.js';
import { S, save } from './save.js';
import { showResult } from './flow.js';

// Thêm các hàm export mới, cạnh startEra/armStakes đã có:
export function startWave() {
  if (G.phase !== 'prep') return;
  const wv = G.era.waves[G.wave];
  G.phase = 'battle';
  G.queue = wv.mix.flatMap(m => Array(m.count).fill(m.type));
  if (wv.bossFinal) G.queue.push('boss');
  G.spawnT = .4;
}
export function updateWaveSpawns(dt) {
  if (G.phase !== 'battle') return;
  G.spawnT -= dt;
  if (G.queue.length && G.spawnT <= 0) {
    const type = G.queue.shift();
    const def = type === 'boss' ? bossDef(G.era) : G.era.enemy;
    const lane = (Math.random() * 3) | 0;
    spawnTroop('enemy', lane, { ...def, name: def.name || 'Quân giặc' });
    G.spawnT = .7;
  }
  if (!G.queue.length && !troops.some(u => u.side === 'enemy')) finishWave();
}
function finishWave() {
  G.wave++;
  if (G.wave >= G.era.waves.length) {
    G.phase = 'win'; S.maxEra = Math.max(S.maxEra, G.eraIdx + 1); save(); showResult(); return;
  }
  G.gold += 20 + G.wave * 5; G.phase = 'prep'; armStakes();
}
export function updateStakes() {
  for (const b of B) {
    if (b.kind !== 'stake' || b.used) continue;
    const plot = findPlot(b.plot);
    const hit = troops.find(u => u.side === 'enemy' && u.lane === plot.lane && Math.abs(u.x - plot.x) < 14);
    if (!hit) continue;
    b.used = true; hit.hp -= G.era.stakeDef.dmg;
    floatText(hit.x, LANES[plot.lane] - 80, 'Mắc cọc!', '#ffd35a', 18);
    spark(hit.x, LANES[plot.lane] - 10, 10, '#d9c7a0', 320);
  }
}
```

Cần thêm `troops` và `LANES` vào dòng import `state.js` đã có đầu file nếu chưa có.

- [ ] **Step 2: Mở rộng `js/flow.js` — nút "Bắt đầu đợt"**

```js
// Thêm import:
import { startWave } from './waves.js'; // gộp với startEra đã import ở Task 2

// Trong initHud(), thêm:
  $('btnStartWave').onclick = () => startWave();

// Trong updateHud(), thêm:
  $('btnStartWave').hidden = G.phase !== 'prep';
```

- [ ] **Step 3: Sửa `js/main.js` — gọi `updateWaveSpawns`/`updateStakes`, expose `startWave`**

```js
import { updateWaveSpawns, updateStakes } from './waves.js'; // gộp với startEra đã import

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
  if (G.phase === 'prep' || G.phase === 'battle') {
    updateIncome(dt); updateCamps(dt); updateTroops(dt); updateTowers(dt); updateProjs(dt);
    if (G.phase === 'battle') { updateWaveSpawns(dt); updateStakes(); }
    updateHud();
  }
  updateParticles(dt, G.t);
}

// Thêm startWave vào exposeGlobals (gộp với các export đã có):
if (debugOn()) exposeGlobals([{ G, B, troops, projs, PLOTS, buildingOn, update, render, ERAS, S, unlocked, startEra, startWave, showEraSelect, build, upgrade, upgradeHQ }]);
```

- [ ] **Step 4: Thêm test vào `tests/test_giu_nuoc.py`**

```python
@test
def test_stake_damages_once_per_wave_then_recharges(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("build(2, 'stake')")  # lô 2 = làn 1, x 190
    pg.evaluate("startWave(); G.queue = []")  # cô lập: không để đợt thật xen vào
    pg.evaluate("troops.push({side:'enemy', lane:1, x:190, hp:200, maxHp:200, dmg:0, reach:0, spd:0, name:'t', walk:0})")
    pg.evaluate("update(1/60)")
    hp1 = pg.evaluate("troops[0].hp")
    assert hp1 < 200, 'trụ cọc không gây sát thương'
    pg.evaluate("update(1/60)")
    assert pg.evaluate("troops[0].hp") == hp1, 'trụ cọc đánh quá 1 lần trong cùng đợt'


@test
def test_winning_all_waves_unlocks_next_era(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    n = pg.evaluate("ERAS[0].waves.length")
    for _ in range(n):
        pg.evaluate("startWave(); G.queue = []; troops.length = 0; update(1/60)")
    assert pg.evaluate("G.phase") == 'win'
    assert pg.evaluate("S.maxEra") >= 1
    assert pg.evaluate("unlocked(1)") == True
```

- [ ] **Step 5: Chạy test, xác nhận qua**

Run: `python3 tests/test_giu_nuoc.py`
Expected: 10 bài PASS.

- [ ] **Step 6: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/ tests/test_giu_nuoc.py
git commit -m "giu-nuoc-qua-ngan-nam: đợt giặc, trụ cọc, thắng màn và mở thời kỳ kế"
```

---

### Task 7: Hoàn thiện luồng chơi + kiểm thử toàn cục

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (nút "Bắt đầu đợt" ẩn đúng lúc đã có từ Task 6; không cần sửa thêm trừ khi test Step 1 phát hiện thiếu)
- Test: `tests/test_giu_nuoc.py` (thêm bài kiểm thử toàn luồng)

**Interfaces:** không thêm interface mới — task này chỉ xác nhận toàn bộ hệ thống (Task 1-6) khớp nhau qua một kịch bản chơi thật từ menu tới thắng một thời kỳ.

- [ ] **Step 1: Thêm test toàn luồng vào `tests/test_giu_nuoc.py`**

```python
@test
def test_full_flow_menu_to_win_via_real_building(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # Từ menu, bấm thật vào nút để vào bản đồ rồi chọn thời kỳ đầu
    pg.click('#mPlay'); pg.wait_for_timeout(100)
    pg.click('.eraBtn[data-era="0"]'); pg.wait_for_timeout(100)
    assert pg.evaluate("G.phase") == 'prep'
    # Xây 1 trại lính + 1 tháp canh bằng thao tác bấm thật
    pg.click('.plot[data-plot="0"]'); pg.wait_for_timeout(50)
    pg.click('[data-k="camp"]'); pg.wait_for_timeout(50)
    pg.click('.plot[data-plot="2"]'); pg.wait_for_timeout(50)
    pg.click('[data-k="tower"]'); pg.wait_for_timeout(50)
    assert pg.evaluate("B.length") == 2
    # Bơm vàng để không bị kẹt kinh tế, rồi đánh hết các đợt bằng cách giả lập dọn sạch giặc mỗi đợt
    n = pg.evaluate("ERAS[0].waves.length")
    for _ in range(n):
        pg.evaluate("G.gold = 1000")
        pg.click('#btnStartWave'); pg.wait_for_timeout(50)
        pg.evaluate("G.queue = []; troops.filter(u => u.side === 'enemy').forEach(u => u.hp = 0); update(1/60)")
    assert pg.evaluate("G.phase") == 'win'
    assert pg.locator('#card h2').count() == 1
    # Bấm "Thời kỳ kế" quay lại trạng thái prep của thời kỳ 2
    pg.click('#rGo'); pg.wait_for_timeout(100)
    assert pg.evaluate("G.eraIdx") == 1 and pg.evaluate("G.phase") == 'prep'
```

- [ ] **Step 2: Chạy toàn bộ test của game, xác nhận qua**

Run: `python3 tests/test_giu_nuoc.py`
Expected: 11 bài PASS, `0 hỏng`.

- [ ] **Step 3: Chạy lại toàn bộ test nền tảng + 2 game còn lại, xác nhận không có gì hỏng**

Run:
```
python3 tests/test_platform.py
python3 tests/test_hao_khi.py
python3 tests/test_doi_khang.py
```
Expected: cả 3 lệnh đều `0 hỏng` (lưu ý `test_double_ko_is_a_draw` của `test_doi_khang.py` từng flaky vì `ERR_NETWORK_CHANGED` môi trường — chạy lại riêng bài đó nếu nó là bài FAIL duy nhất).

- [ ] **Step 4: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/ tests/test_giu_nuoc.py
git commit -m "giu-nuoc-qua-ngan-nam: kiểm thử toàn luồng menu → thắng thời kỳ"
```
