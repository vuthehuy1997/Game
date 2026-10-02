# Đối Kháng Anh Hùng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm game đối kháng 1v1 góc nhìn ngang (`games/doi-khang-anh-hung/`) vào Game Hub: 2 người cùng bàn phím hoặc 1 người đấu máy, dùng 6 danh tướng lịch sử, đòn thường/mạnh/đỡ/né + 1 chiêu riêng mỗi tướng, đấu best-of-3 round.

**Architecture:** ES modules thuần, Canvas 2D 960×540, không build. Tái dùng `platform/core` (loop, input, audio, settings, storage, fx, util, debug) và `platform/art` (chibi, poses, draw) + `platform/ui` (theme, bar). Mã riêng của game chia theo trách nhiệm trong `games/doi-khang-anh-hung/js/`: `state.js` (dữ liệu trận đấu), `data.js` (bàn dữ liệu tướng/sân), `input.js` (gộp 2 bộ phím), `fighter.js` (di chuyển/trạng thái dùng chung cho cả hai bên), `combat.js` (hitbox, sát thương, nội lực, chiêu), `ai.js` (máy điều khiển P2), `hazards.js` (hiểm hoạ sân), `render.js` (vẽ), `flow.js` (menu/chọn tướng/chọn sân/kết quả), `main.js` (khởi tạo + vòng lặp).

**Tech Stack:** JavaScript ES modules + Canvas 2D, Playwright (Python) cho test, server tĩnh `python3 -m http.server`.

**Spec:** `docs/superpowers/specs/2026-10-02-doi-khang-anh-hung-design.md`

## Global Constraints

- Không thêm thư viện, không thêm bước build; mọi import chỉ từ `platform/` hoặc từ thư mục của chính game này (quy ước ở `README.md`).
- Không sửa bất kỳ file nào trong `games/hao-khi/` — một phiên khác đang refactor thư mục đó đồng thời.
- Chỉ sửa `platform/games.js` theo cách cộng thêm (1 dòng import + 1 phần tử trong mảng `GAMES`), đọc lại file ngay trước khi sửa để hợp nhất với thay đổi mới nhất; không sửa file `platform/` nào khác.
- 6 tướng, 3 sân ở v1 — không thêm tướng/sân ngoài danh sách trong spec.
- Mọi chữ hiển thị bằng tiếng Việt.
- Không online multiplayer.
- Không `git add`/`git commit` nào ngoài việc thực hiện đúng bước "Commit" của từng task dưới đây; mỗi task một commit, chỉ add các file task đó tạo/sửa.
- Game không điều khiển trực tiếp lộ biến ra `window` khi không có `?debug` (theo quy ước `core/debug.js` và bài test `test_open_game_and_come_back` của nền tảng).

## Review Focus

- Hai bên bấm đòn trúng cùng một khung hình: cả hai phải nhận đúng sát thương, không bị kẹt trạng thái hoặc crash.
- Bấm phím chiêu khi nội lực chưa đầy: không được có hiệu ứng gì, nội lực không âm, không vượt 100.
- Hết giờ round khi hai bên bằng máu: round phải được xử lý rõ ràng (hoà → đấu lại round, không cộng điểm cho ai) thay vì treo màn hình.
- Người chơi bị đẩy lùi tới mép sân (knockback lớn, ví dụ ăn liên tiếp đòn mạnh gần biên): vị trí phải bị kẹp trong biên sân, không ra ngoài canvas.
- Đổi P2 giữa "Người" và "Máy" ở màn chọn tướng rồi vào trận: đúng một nguồn điều khiển P2 (AI hoặc phím) hoạt động, không bị cả hai cùng ghi đè `held`/`pressed`.

---

### Task 1: Khung game + đăng ký lên trang chủ

**Files:**
- Create: `games/doi-khang-anh-hung/index.html`
- Create: `games/doi-khang-anh-hung/style.css`
- Create: `games/doi-khang-anh-hung/meta.js`
- Create: `games/doi-khang-anh-hung/js/main.js`
- Modify: `platform/games.js` (đọc lại trước khi sửa)
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `STORE_KEY = 'doi-khang-anh-hung-v1'` (export từ `meta.js`).
- Trang `games/doi-khang-anh-hung/` mở được, có `<canvas id="cv">`, có đường về trang chủ qua `mountHomeLink`.

- [ ] **Step 1: Tạo `meta.js`**

```js
// Thông tin Đối Kháng Anh Hùng cho trang chủ. Nhẹ: không import mã chạy game.
export const STORE_KEY = 'doi-khang-anh-hung-v1';

export default {
  id: 'doi-khang-anh-hung',
  title: 'Đối Kháng Anh Hùng',
  tagline: '6 danh tướng, 1 sàn đấu',
  desc: 'Đối kháng 1v1: 2 người cùng bàn phím hoặc đấu máy. Né, đỡ, tung chiêu riêng của từng tướng.',
  tags: ['Đối kháng', 'Bàn phím · 2 người'],
  url: new URL('./', import.meta.url).href,
};
```

- [ ] **Step 2: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Đối Kháng Anh Hùng · Game Hub</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Itim&family=Pattaya&display=swap">
<link rel="stylesheet" href="../../platform/css/kit.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="stage" id="stage">
  <canvas id="cv" width="960" height="540" aria-label="Sàn đấu"></canvas>
  <div class="touch" id="touch">
    <button data-k="p1_left" aria-label="Sang trái">◀</button>
    <button data-k="p1_right" aria-label="Sang phải">▶</button>
    <button data-k="p1_jump">Nhảy</button>
    <button data-k="p1_guard">Đỡ</button>
    <button data-k="p1_dash">Né</button>
    <button data-k="p1_light" class="big">Đánh</button>
    <button data-k="p1_heavy">Mạnh</button>
    <button data-k="p1_special">Chiêu</button>
  </div>
</div>
<p class="keys">P1: <kbd>A</kbd><kbd>D</kbd> di chuyển · <kbd>W</kbd> nhảy · <kbd>S</kbd> đỡ · <kbd>Q</kbd> né · <kbd>F</kbd> đánh · <kbd>G</kbd> mạnh · <kbd>H</kbd> chiêu —
P2: <kbd>←</kbd><kbd>→</kbd> · <kbd>↑</kbd> nhảy · <kbd>↓</kbd> đỡ · <kbd>Shift phải</kbd> né · <kbd>/</kbd> đánh · <kbd>.</kbd> mạnh · <kbd>,</kbd> chiêu</p>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Tạo `style.css`** (chép và chỉnh từ `games/_template/style.css`, chỉ thêm selector cho nút cảm ứng mới)

```css
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:12px 16px;background:#12141a;color:#eeede8;font-family:'Itim','Segoe UI',system-ui,sans-serif}
.stage{position:relative;width:min(100%,calc((100dvh - 80px)*16/9));aspect-ratio:16/9;border-radius:8px;overflow:hidden;
  background:#000;container-type:inline-size;font-size:clamp(10px,1.9cqw,19px);touch-action:none;user-select:none;-webkit-user-select:none}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.touch{position:absolute;inset:auto 0 0 0;display:none;flex-wrap:wrap;gap:1.2cqw;padding:2cqw;pointer-events:none;justify-content:flex-end}
.touch.on{display:flex}
.touch button{pointer-events:auto;width:9cqw;height:9cqw;border-radius:50%;border:2px solid #ffffff80;background:#0009;color:#fff;font:inherit;touch-action:none}
.touch button.act{background:#e9b949;color:#1b1d24}
.touch [data-k=p1_left],.touch [data-k=p1_right],.touch [data-k=p1_jump]{margin-right:auto}
.keys{margin:0;color:#a3a8b8;font-size:13px;text-align:center}
```

- [ ] **Step 4: Tạo `js/main.js`** (bản tối thiểu cho task này — vẽ sân trống, gắn đường về trang chủ; các task sau sẽ mở rộng `update`/`render`)

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const W = 960, H = 540;

function update(dt) {}
function render() {
  ctx.fillStyle = '#1b1d24'; ctx.fillRect(0, 0, W, H);
}

mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{ update, render }]);
startLoop(update, render);
```

- [ ] **Step 5: Đọc lại `platform/games.js`, thêm game vào `GAMES`**

```js
import haoKhi from '../games/hao-khi/meta.js';
import doiKhangAnhHung from '../games/doi-khang-anh-hung/meta.js';

export const GAMES = [haoKhi, doiKhangAnhHung];
```

- [ ] **Step 6: Viết `tests/test_doi_khang.py`**

```python
#!/usr/bin/env python3
"""Kiểm thử Đối Kháng Anh Hùng. Chạy: python3 tests/test_doi_khang.py [lọc tên]"""
from harness import run, root

URL = 'games/doi-khang-anh-hung/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


if __name__ == '__main__':
    run(TESTS)
```

- [ ] **Step 7: Chạy test mới**

Run: `python3 tests/test_doi_khang.py`
Expected: `PASS  test_game_loads_with_home_link` — 1 bài, 0 hỏng.

- [ ] **Step 8: Chạy lại test nền tảng để chắc chắn không làm hỏng trang chủ**

Run: `python3 tests/test_platform.py test_hub_lists_games test_every_game_meta_is_complete_and_loads`
Expected: cả hai PASS, game mới xuất hiện trong danh sách và tải được.

- [ ] **Step 9: Commit**

```bash
git add games/doi-khang-anh-hung/ platform/games.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: khung game, đăng ký lên trang chủ" -- games/doi-khang-anh-hung/ platform/games.js tests/test_doi_khang.py
```

---

### Task 2: Dữ liệu tướng/sân + hiện 2 tướng đứng yên

**Files:**
- Create: `games/doi-khang-anh-hung/js/data.js`
- Create: `games/doi-khang-anh-hung/js/state.js`
- Modify: `games/doi-khang-anh-hung/js/main.js`
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `FIGHTERS` — bàn 6 tướng: `{ id: { name, look, hp, spd, reach, dmgLight, dmgHeavy, special } }`.
- `STAGES` — bàn 3 sân: `{ id: { name, bg: [top,bottom] màu nền, hazard } }`.
- `newFighter(fid, x, face)` → đối tượng fighter runtime.
- `newMatch(f1id, f2id, stageId)` → `G` (trạng thái trận: `mode`, `round`, `wins`, `timer`, `f1`, `f2`, `stage`).

- [ ] **Step 1: Viết `js/data.js`**

```js
// Bàn dữ liệu tướng và sân. Mỗi tướng: 1 "look" chibi (platform/art/chibi.js) + thống kê + 1 chiêu riêng.
// specials: kind 'dmg' (sát thương + đẩy lùi ngay), 'dash' (xông tới gây sát thương, bất tử khi xông),
// 'ranged' (gây sát thương không cần đứng gần), 'counter' (thế đỡ-phản đòn tạm thời).
export const FIGHTERS = {
  tieuho: {
    name: 'Tiểu Hổ', hp: 100, spd: 260, reach: 70, dmgLight: 6, dmgHeavy: 14,
    look: { skin: '#f6d2ae', hair: '#1c1410', hat: 'topknot', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'club' },
    special: { name: 'Hồi Phong Cước', kind: 'dmg', dmg: 22, knock: 260 },
  },
  hungdao: {
    name: 'Hưng Đạo Vương', hp: 105, spd: 220, reach: 95, dmgLight: 7, dmgHeavy: 16,
    look: { skin: '#e8c49a', hair: '#1c1410', hat: 'mu', mu: '#2a3a6b', shirt: '#2a3a6b', trim: '#e9b949', pants: '#241f1a', belt: '#e9b949', weapon: 'spear', beard: 1 },
    special: { name: 'Chấn Động Giáo', kind: 'dmg', dmg: 26, knock: 320 },
  },
  quoctoan: {
    name: 'Trần Quốc Toản', hp: 95, spd: 300, reach: 65, dmgLight: 6, dmgHeavy: 13,
    look: { skin: '#f0cf9e', hair: '#1c1410', hat: 'khan', khan: '#b3261e', shirt: '#b3261e', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'saber' },
    special: { name: 'Phá Cường Địch', kind: 'dash', dmg: 20, knock: 300 },
  },
  ngulao: {
    name: 'Phạm Ngũ Lão', hp: 100, spd: 230, reach: 100, dmgLight: 8, dmgHeavy: 18,
    look: { skin: '#dcb888', hair: '#1c1410', hat: 'khan', khan: '#4a2e1a', shirt: '#4a2e1a', trim: '#c9a449', pants: '#241f1a', belt: '#c9a449', weapon: 'glaive' },
    special: { name: 'Đâm Xuyên', kind: 'dmg', dmg: 24, knock: 360 },
  },
  binhtrong: {
    name: 'Trần Bình Trọng', hp: 115, spd: 220, reach: 60, dmgLight: 7, dmgHeavy: 15,
    look: { skin: '#e8c49a', hair: '#1c1410', hat: 'mu', mu: '#5a2a20', shirt: '#5a2a20', trim: '#e9b949', pants: '#241f1a', belt: '#e9b949', weapon: 'club', scar: true },
    special: { name: 'Thà Làm Quỷ Nước Nam', kind: 'counter', dur: 2, counterDmg: 30 },
  },
  khanhdu: {
    name: 'Trần Khánh Dư', hp: 90, spd: 240, reach: 140, dmgLight: 5, dmgHeavy: 12,
    look: { skin: '#e2bd8c', hair: '#1c1410', hat: 'bandana', band: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'bow' },
    special: { name: 'Loạt Tên', kind: 'ranged', dmg: 10, hits: 3 },
  },
};

export const STAGES = {
  thanglong: { name: 'Thăng Long', sky: ['#3a1410', '#a3261d'], ground: '#140e0a' },
  bachdang: { name: 'Bạch Đằng', sky: ['#0d2436', '#2f6b7a'], ground: '#0a1a1a', hazard: 'stakes' },
  vankiep: { name: 'Rừng Vạn Kiếp', sky: ['#0e1f12', '#2f4a2a'], ground: '#0c140d' },
};
```

- [ ] **Step 2: Viết `js/state.js`**

```js
// Trạng thái runtime: 1 fighter, 1 trận. W/H là kích thước sàn dùng chung cho mọi module.
import { FIGHTERS } from './data.js';

export const W = 960, H = 540, GROUND = 440;

export function newFighter(fid, side, x) {
  const d = FIGHTERS[fid];
  return {
    fid, side, x, y: GROUND, vx: 0, vy: 0, face: side === 'p1' ? 1 : -1,
    hp: d.hp, maxHp: d.hp, meter: 0, t: 0, walk: 0, st: 0,
    state: 'idle', atk: null, guard: false, dashT: 0, dashCd: 0, counterT: 0, hitstun: 0,
  };
}

export function newMatch(f1id, f2id, stageId, p2cpu, diff) {
  return {
    mode: 'fight', stageId, p1id: f1id, p2id: f2id, p2cpu, diff,
    f1: newFighter(f1id, 'p1', 260), f2: newFighter(f2id, 'p2', 700),
    round: 1, wins: [0, 0], timer: 60, t: 0, shake: 0, banner: null,
  };
}
```

- [ ] **Step 3: Mở rộng `js/main.js`** để tạo một trận cố định (dùng cho các task kiểm thử sau, màn chọn tướng thật sẽ thay ở Task 9) và vẽ 2 tướng đứng yên

```js
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { groundShadow } from '../../../platform/art/draw.js';
import { FIGHTERS, STAGES } from './data.js';
import { W, H, GROUND, newMatch } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');
let G = newMatch('tieuho', 'hungdao', 'thanglong', true, 'normal');

function update(dt) {
  G.t += dt;
  for (const f of [G.f1, G.f2]) { f.t += dt; }
}
function render() {
  const st = STAGES[G.stageId];
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, st.sky[0]); sky.addColorStop(1, st.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = st.ground; ctx.fillRect(0, GROUND, W, H - GROUND);
  for (const f of [G.f1, G.f2]) {
    groundShadow(ctx, f.x, GROUND);
    drawChibi(ctx, f.x, f.y, FIGHTERS[f.fid].look, { face: f.face, t: f.t, ...POSES.idle(f) });
  }
}

mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{ G, FIGHTERS, STAGES, update, render }], { G: v => { G = v; } });
startLoop(update, render);
```

- [ ] **Step 4: Thêm bài test** vào `tests/test_doi_khang.py`

```python
@test
def test_two_fighters_spawn_with_correct_hp(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp = pg.evaluate("[G.f1.hp, G.f2.hp, G.f1.fid, G.f2.fid]")
    assert hp == [100, 105, 'tieuho', 'hungdao'], hp
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: cả 2 bài PASS.

- [ ] **Step 6: Commit**

```bash
git add games/doi-khang-anh-hung/js/data.js games/doi-khang-anh-hung/js/state.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: bàn dữ liệu tướng/sân, hiện 2 tướng" -- games/doi-khang-anh-hung/js/data.js games/doi-khang-anh-hung/js/state.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 3: Điều khiển 2 người + di chuyển/nhảy

**Files:**
- Create: `games/doi-khang-anh-hung/js/input.js`
- Create: `games/doi-khang-anh-hung/js/fighter.js`
- Modify: `games/doi-khang-anh-hung/js/main.js`
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `initInput()` — gọi 1 lần, gắn `bindKeys`/`bindTouch` với keymap gộp P1 + P2.
- `KEYMAP` export từ `input.js` (dùng lại ở test/debug nếu cần).
- `updateFighter(f, opp, dt)` trong `fighter.js` — xử lý di chuyển/nhảy/quay mặt; được gọi cho cả P1 và P2 (P2 có thể do AI giả lập phím ở Task 7).

- [ ] **Step 1: Viết `js/input.js`**

```js
// Gộp 2 bộ phím P1/P2 thành một keymap duy nhất cho platform/core/input.js.
import { bindKeys, bindTouch } from '../../../platform/core/input.js';
import { ac } from '../../../platform/core/audio.js';
import { $ } from '../../../platform/core/util.js';

export const KEYMAP = {
  KeyA: 'p1_left', KeyD: 'p1_right', KeyW: 'p1_jump', KeyS: 'p1_guard', KeyQ: 'p1_dash',
  KeyF: 'p1_light', KeyG: 'p1_heavy', KeyH: 'p1_special',
  ArrowLeft: 'p2_left', ArrowRight: 'p2_right', ArrowUp: 'p2_jump', ArrowDown: 'p2_guard',
  ShiftRight: 'p2_dash', Slash: 'p2_light', Period: 'p2_heavy', Comma: 'p2_special',
};

export function initInput() {
  bindKeys(KEYMAP, { onPress: () => ac() });
  bindTouch($('touch'));
}
```

- [ ] **Step 2: Viết `js/fighter.js`**

```js
// Di chuyển, nhảy, quay mặt — dùng chung cho fighter do người hoặc máy điều khiển.
// held/pressed chứa action 'p1_*' hoặc 'p2_*' tuỳ side của fighter.
import { held } from '../../../platform/core/input.js';
import { clamp } from '../../../platform/core/util.js';
import { FIGHTERS } from './data.js';
import { W, GROUND } from './state.js';

const GRAV = 2600, JUMP_VY = -760;

export function updateFighter(f, opp, dt) {
  const d = FIGHTERS[f.fid], act = a => f.side + '_' + a;
  if (f.hitstun > 0) { f.hitstun -= dt; }
  const locked = f.atk || f.hitstun > 0 || f.dashT > 0;
  const dir = locked ? 0 : (held.has(act('right')) ? 1 : 0) - (held.has(act('left')) ? 1 : 0);
  f.guard = !locked && held.has(act('guard')) && !f.air;

  if (f.dashT > 0) { f.dashT -= dt; f.x += f.dashDir * 900 * dt; }
  else { f.vx = f.guard ? 0 : dir * d.spd; f.x += f.vx * dt; }
  f.dashCd = Math.max(0, f.dashCd - dt);
  if (f.counterT > 0) f.counterT -= dt;

  if (!f.air && !locked && held.has(act('jump'))) { f.vy = JUMP_VY; f.air = true; }
  f.vy += GRAV * dt; f.y += f.vy * dt;
  if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; if (f.air) f.st = 0; f.air = false; }

  f.x = clamp(f.x, 36, W - 36);
  if (!locked) f.face = opp.x >= f.x ? 1 : -1;
  if (dir && !f.air) f.walk += dt * 10;
  f.state = f.air ? 'air' : f.guard ? 'guard' : dir ? 'run' : f.st < .12 ? 'land' : 'idle';
}
```

- [ ] **Step 3: Nối vào `js/main.js`**: gọi `initInput()` một lần và `updateFighter` mỗi khung hình cho cả hai bên

```js
// thêm vào đầu file, cạnh các import khác
import { initInput } from './input.js';
import { updateFighter } from './fighter.js';

// trong update(dt), thay thân hàm cũ bằng:
function update(dt) {
  G.t += dt;
  updateFighter(G.f1, G.f2, dt);
  updateFighter(G.f2, G.f1, dt);
}

// cuối file, trước startLoop(update, render):
initInput();
```

- [ ] **Step 4: Thêm bài test** (giả lập P1 đi phải, P2 nhảy)

```python
@test
def test_movement_and_jump(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    x0 = pg.evaluate('G.f1.x')
    pg.keyboard.down('KeyD'); pg.wait_for_timeout(250); pg.keyboard.up('KeyD')
    assert pg.evaluate('G.f1.x') > x0 + 20, 'P1 không đi sang phải'
    pg.keyboard.press('ArrowUp'); pg.wait_for_timeout(100)
    assert pg.evaluate('G.f2.air'), 'P2 không nhảy'
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 3 bài PASS.

- [ ] **Step 6: Commit**

```bash
git add games/doi-khang-anh-hung/js/input.js games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: điều khiển 2 người, di chuyển/nhảy" -- games/doi-khang-anh-hung/js/input.js games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 4: Đòn thường/mạnh, hitbox, sát thương

**Files:**
- Create: `games/doi-khang-anh-hung/js/combat.js`
- Modify: `games/doi-khang-anh-hung/js/fighter.js` (đọc action đánh, chuyển vào `atk` state)
- Modify: `games/doi-khang-anh-hung/js/main.js`
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `startAttack(f, kind)` — `kind: 'light'|'heavy'`; đặt `f.atk = { kind, t: 0, hit: false }`.
- `updateCombat(f, opp, dt)` — chạy khung thời gian đòn, mở/đóng hitbox, gọi `applyDamage`.
- `applyDamage(attacker, defender, dmg, knock)` — trừ máu, đẩy lùi, hitstop, cộng nội lực (nội lực xử lý đầy đủ ở Task 6, ở đây chỉ cộng số thô vào `defender.meter`/`attacker.meter`).
- Hằng số khung hình: `WIND = { light: .12, heavy: .22 }`, `ACTIVE = { light: .08, heavy: .1 }`, `RECOVER = { light: .18, heavy: .3 }`.

- [ ] **Step 1: Viết `js/combat.js`**

```js
// Hitbox, sát thương, hitstop. 1 đòn có 3 giai đoạn theo thời gian: wind (vươn người, chưa gây sát thương) ->
// active (có hitbox, gây sát thương đúng 1 lần) -> recover (không thể hành động, chưa thể đánh tiếp).
import { overlap, clamp } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { FIGHTERS } from './data.js';
import { W } from './state.js';

export const WIND = { light: .12, heavy: .22 };
export const ACTIVE = { light: .08, heavy: .1 };
export const RECOVER = { light: .18, heavy: .3 };

export function startAttack(f, kind) {
  if (f.atk || f.hitstun > 0 || f.dashT > 0) return;
  f.atk = { kind, t: 0, hit: false };
}

function hurtbox(f) { return { x: f.x - 20, y: f.y - 110, w: 40, h: 110 }; }
function hitbox(f, reach) {
  const w = reach, x = f.face > 0 ? f.x : f.x - w;
  return { x, y: f.y - 95, w, h: 70 };
}

export function applyDamage(attacker, defender, dmg, knock) {
  if (defender.counterT > 0) { // Task 5/6: thế phản đòn đang chủ động -> phản sát thương, kẻ tấn công nhận dmg thay
    const back = FIGHTERS[defender.fid].special.counterDmg;
    attacker.hp = clamp(attacker.hp - back, 0, FIGHTERS[attacker.fid].hp);
    spark(attacker.x, attacker.y - 70, 14, '#ffd35a'); attacker.hitstun = .3;
    return;
  }
  const guarded = defender.guard && !defender.air;
  const taken = guarded ? dmg * .3 : dmg;
  defender.hp = clamp(defender.hp - taken, 0, FIGHTERS[defender.fid].hp);
  defender.vx = attacker.face * (guarded ? knock * .3 : knock);
  defender.x = clamp(defender.x + defender.vx * .03, 36, W - 36);
  defender.hitstun = guarded ? .12 : .25;
  attacker.meter = Math.min(100, attacker.meter + (dmg >= 12 ? 14 : 8));
  defender.meter = Math.min(100, defender.meter + 5);
  spark(defender.x, defender.y - 70, guarded ? 5 : 12, guarded ? '#9fb0c9' : '#ff6a4a');
}

export function updateCombat(f, opp, dt) {
  if (!f.atk) return;
  const a = f.atk, d = FIGHTERS[f.fid];
  a.t += dt;
  const wind = WIND[a.kind], active = ACTIVE[a.kind], recover = RECOVER[a.kind];
  if (!a.hit && a.t >= wind && a.t < wind + active) {
    const reach = a.kind === 'heavy' ? d.reach : d.reach * .8;
    if (overlap(hitbox(f, reach), hurtbox(opp))) {
      a.hit = true;
      applyDamage(f, opp, a.kind === 'heavy' ? d.dmgHeavy : d.dmgLight, a.kind === 'heavy' ? 220 : 120);
    }
  }
  if (a.t >= wind + active + recover) f.atk = null;
}
```

- [ ] **Step 2: Đọc action đánh trong `js/fighter.js`**, và gộp trạng thái đòn đánh vào dòng tính `f.state` cuối `updateFighter` (thay nguyên dòng `f.state = ...` cũ của Task 3 bằng bản có nhánh `f.atk`, để nó không bị ghi đè mất)

```js
import { pressed } from '../../../platform/core/input.js'; // thêm vào import đầu file
import { startAttack } from './combat.js'; // thêm vào import đầu file

// thêm trước dòng f.state cũ:
if (!locked) {
  if (pressed.has(act('light'))) startAttack(f, 'light');
  else if (pressed.has(act('heavy'))) startAttack(f, 'heavy');
}
// thay dòng `f.state = f.air ? 'air' : f.guard ? 'guard' : dir ? 'run' : f.st < .12 ? 'land' : 'idle';` của Task 3 bằng:
f.state = f.atk ? (f.atk.kind === 'heavy' ? 'heavy' : 'light')
  : f.air ? 'air' : f.guard ? 'guard' : dir ? 'run' : f.st < .12 ? 'land' : 'idle';
```

- [ ] **Step 3: Gọi `updateCombat` trong `js/main.js`**

```js
import { updateCombat } from './combat.js'; // thêm vào import

function update(dt) {
  G.t += dt;
  updateFighter(G.f1, G.f2, dt);
  updateFighter(G.f2, G.f1, dt);
  updateCombat(G.f1, G.f2, dt);
  updateCombat(G.f2, G.f1, dt);
}
```

- [ ] **Step 4: Thêm bài test** — ép 2 tướng đứng sát nhau rồi P1 đánh, kiểm tra P2 mất máu đúng lúc active frame (không mất máu sớm hơn)

```python
@test
def test_light_attack_hits_in_active_window(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1")
    hp0 = pg.evaluate("G.f2.hp")
    pg.evaluate("startAttack ? startAttack(G.f1, 'light') : null")  # phòng khi chưa expose, test lại bằng phím
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(50)
    assert pg.evaluate("G.f2.hp") == hp0, 'ăn đòn trước khung hình active'
    pg.wait_for_timeout(200)
    assert pg.evaluate("G.f2.hp") < hp0, 'không mất máu sau khi đòn vào khung active'
```

- [ ] **Step 5: Chạy test, xác nhận PASS** (nếu bước gọi `startAttack` trực tiếp báo lỗi vì chưa expose, bỏ dòng đó — chỉ cần `pg.keyboard.press('KeyF')` là đủ vì `pressed` được `fighter.js` đọc mỗi khung hình)

Run: `python3 tests/test_doi_khang.py`
Expected: 4 bài PASS.

- [ ] **Step 6: Commit**

```bash
git add games/doi-khang-anh-hung/js/combat.js games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: đòn thường/mạnh, hitbox, sát thương" -- games/doi-khang-anh-hung/js/combat.js games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 5: Đỡ, lướt né, phản đòn (Trần Bình Trọng)

**Files:**
- Modify: `games/doi-khang-anh-hung/js/fighter.js` (kích hoạt dash)
- Modify: `games/doi-khang-anh-hung/js/combat.js` (đã có `guard`/`counterT` trong `applyDamage` từ Task 4 — task này thêm cách kích hoạt)
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `startDash(f)` trong `fighter.js` — đặt `f.dashT = .18`, `f.dashDir = f.face`, bất tử khi `f.dashT > 0` (xử lý ở `applyDamage`: bỏ qua nếu `defender.dashT > 0`).
- Đỡ (`f.guard`) đã hoạt động từ Task 3/4 — task này chỉ bổ sung test xác nhận giảm 70% sát thương.

- [ ] **Step 1: Thêm `startDash` vào `js/fighter.js`**

```js
// thêm hàm export, dùng chung file
export function startDash(f) {
  if (f.dashT > 0 || f.dashCd > 0 || f.atk) return;
  f.dashT = .18; f.dashCd = .6; f.dashDir = f.face;
}

// trong updateFighter, cùng khối đọc action đánh (Task 4), thêm:
if (!locked && pressed.has(act('dash'))) startDash(f);
```

- [ ] **Step 2: Bỏ qua sát thương khi đang né** — sửa đầu `applyDamage` trong `js/combat.js`

```js
export function applyDamage(attacker, defender, dmg, knock) {
  if (defender.dashT > 0) return; // bất tử trong lúc lướt né
  if (defender.counterT > 0) { /* giữ nguyên phần đã viết ở Task 4 */
```

- [ ] **Step 3: Thêm bài test đỡ giảm sát thương + né miễn nhiễm**

```python
@test
def test_guard_reduces_damage_and_dash_is_invulnerable(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1; G.f2.hp = 100")
    full = pg.evaluate("""() => { const h0 = G.f2.hp; startAttack(G.f1, 'heavy');
      for (let i = 0; i < 40; i++) update(1/60); return h0 - G.f2.hp; }""")
    pg.evaluate("G.f1.atk = null; G.f1.x = 500; G.f2.x = 540; G.f2.hp = 100")
    guarded = pg.evaluate("""() => { const h0 = G.f2.hp; G.f2.guard = true; startAttack(G.f1, 'heavy');
      for (let i = 0; i < 40; i++) { held.add('p2_guard'); update(1/60); } held.delete('p2_guard'); return h0 - G.f2.hp; }""")
    assert guarded < full * .4, (full, guarded)
    pg.evaluate("G.f1.atk = null; G.f1.x = 500; G.f2.x = 540; G.f2.hp = 100")
    dashed = pg.evaluate("""() => { const h0 = G.f2.hp; startDash(G.f2); startAttack(G.f1, 'heavy');
      for (let i = 0; i < 20; i++) update(1/60); return h0 - G.f2.hp; }""")
    assert dashed == 0, dashed
```

Lưu ý: `startAttack`, `startDash`, `held`, `update` phải có trên `window` khi `?debug` — đã được `exposeGlobals` đưa ra từ các task trước (hàm trong file `main.js` import rồi truyền cho `exposeGlobals`); nếu `startAttack`/`startDash` chưa có trong danh sách truyền vào `exposeGlobals`, thêm chúng vào object truyền ở Task 4/5.

- [ ] **Step 4: Thêm `startAttack`, `startDash` vào `exposeGlobals` trong `js/main.js`**

```js
import { startAttack, updateCombat } from './combat.js';
import { updateFighter, startDash } from './fighter.js';
// ...
if (debugOn()) exposeGlobals([{ G, FIGHTERS, STAGES, update, render, startAttack, startDash, updateFighter }], { G: v => { G = v; } });
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 5 bài PASS.

- [ ] **Step 6: Commit**

```bash
git add games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/combat.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: đỡ, lướt né bất tử" -- games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/combat.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 6: Nội lực + 4 kiểu chiêu đặc biệt

**Files:**
- Modify: `games/doi-khang-anh-hung/js/combat.js`
- Modify: `games/doi-khang-anh-hung/js/fighter.js`
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `tryUseSpecial(f, opp)` trong `combat.js` — nếu `f.meter >= 100` và không bị khoá hành động: trừ hết nội lực, áp dụng hiệu ứng theo `FIGHTERS[f.fid].special.kind`.
- Áp dụng 4 kind: `'dmg'` (sát thương + đẩy lùi ngay nếu trong tầm `reach * 1.4`), `'dash'` (xông tới `220px` theo hướng mặt, gây sát thương nếu chạm đối thủ trên đường xông, bất tử suốt lúc xông), `'ranged'` (gây sát thương `hits` lần, không cần khoảng cách), `'counter'` (đặt `f.counterT = dur`, không gây sát thương ngay).

- [ ] **Step 1: Thêm vào `js/combat.js`**

```js
import { FIGHTERS } from './data.js'; // đã có từ Task 4, giữ nguyên dòng import gốc nếu đã tồn tại

export function tryUseSpecial(f, opp) {
  if (f.meter < 100 || f.atk || f.hitstun > 0 || f.dashT > 0) return false;
  const sp = FIGHTERS[f.fid].special;
  f.meter = 0;
  if (sp.kind === 'counter') { f.counterT = sp.dur; return true; }
  if (sp.kind === 'ranged') {
    for (let i = 0; i < sp.hits; i++) applyDamage(f, opp, sp.dmg, 80);
    return true;
  }
  if (sp.kind === 'dash') {
    f.dashT = .22; f.dashCd = .6; f.dashDir = f.face; f.specialDashDmg = sp.dmg; f.specialDashKnock = sp.knock;
    return true;
  }
  // 'dmg': chỉ trúng nếu còn trong tầm rộng
  const reach = FIGHTERS[f.fid].reach * 1.4;
  if (Math.abs(opp.x - f.x) <= reach) applyDamage(f, opp, sp.dmg, sp.knock);
  return true;
}
```

- [ ] **Step 2: Gây sát thương khi xông bằng chiêu `dash`** — sửa `updateCombat` trong `js/combat.js` để kiểm tra va chạm trong lúc `dashT > 0` và có `specialDashDmg`

```js
export function updateCombat(f, opp, dt) {
  if (f.dashT > 0 && f.specialDashDmg && !f.specialDashHit && overlap(hurtbox(f), hurtbox(opp))) {
    f.specialDashHit = true; applyDamage(f, opp, f.specialDashDmg, f.specialDashKnock);
  }
  if (f.dashT <= 0) { f.specialDashDmg = null; f.specialDashHit = false; }
  if (!f.atk) return;
  /* phần còn lại giữ nguyên như Task 4 */
```

- [ ] **Step 3: Đọc phím chiêu trong `js/fighter.js`** — thêm vào khối đọc action (cạnh `light`/`heavy`/`dash`)

```js
import { tryUseSpecial } from './combat.js'; // thêm vào import, cùng dòng startAttack

// trong updateFighter, thêm vào khối đọc action:
if (!locked && pressed.has(act('special'))) tryUseSpecial(f, opp);
```

- [ ] **Step 4: Thêm bài test** — ép đầy nội lực, kiểm tra chiêu trừ hết nội lực và gây sát thương; bấm khi chưa đầy thì không có gì xảy ra

```python
@test
def test_special_requires_full_meter(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1; G.f2.hp = 100; G.f1.meter = 40")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    assert pg.evaluate("[G.f1.meter, G.f2.hp]") == [40, 100], 'chiêu kích hoạt khi chưa đầy nội lực'
    pg.evaluate("G.f1.meter = 100")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    hp, meter = pg.evaluate("[G.f2.hp, G.f1.meter]")
    assert meter == 0 and hp < 100, (hp, meter)
```

- [ ] **Step 5: Thêm `tryUseSpecial` vào `exposeGlobals`** trong `js/main.js`

```js
import { startAttack, tryUseSpecial, updateCombat } from './combat.js';
// ... exposeGlobals thêm tryUseSpecial vào object truyền
```

- [ ] **Step 6: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 6 bài PASS.

- [ ] **Step 7: Commit**

```bash
git add games/doi-khang-anh-hung/js/combat.js games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: nội lực và 4 kiểu chiêu đặc biệt" -- games/doi-khang-anh-hung/js/combat.js games/doi-khang-anh-hung/js/fighter.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 7: Máy điều khiển P2 (3 độ khó)

**Files:**
- Create: `games/doi-khang-anh-hung/js/ai.js`
- Modify: `games/doi-khang-anh-hung/js/main.js`
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `DIFF = { easy: {...}, normal: {...}, hard: {...} }`.
- `aiTick(f, opp, dt, diff)` — giả lập phím cho fighter phía máy bằng cách thêm/xoá trực tiếp trong `held`/`pressed` của `platform/core/input.js` (action tiền tố đúng `f.side`, ví dụ `p2_right`).

- [ ] **Step 1: Viết `js/ai.js`**

```js
// Máy điều khiển P2: quyết định lại mỗi `interval` giây dựa trên khoảng cách hiện tại tới đối thủ.
// Độ khó chỉnh qua: interval (độ trễ phản ứng), guardChance, specialChance, reach khởi đánh.
import { held, pressed } from '../../../platform/core/input.js';
import { FIGHTERS } from './data.js';

export const DIFF = {
  easy: { interval: .5, guardChance: .1, specialChance: .2 },
  normal: { interval: .25, guardChance: .35, specialChance: .5 },
  hard: { interval: .1, guardChance: .6, specialChance: .8 },
};

export function aiTick(f, opp, dt, diffName) {
  const diff = DIFF[diffName] || DIFF.normal, act = a => f.side + '_' + a;
  f._aiT = (f._aiT || 0) + dt;
  ['left', 'right', 'guard'].forEach(a => held.delete(act(a)));
  if (f._aiT < diff.interval) return;
  f._aiT = 0;
  const dx = opp.x - f.x, dist = Math.abs(dx), reach = FIGHTERS[f.fid].reach;
  if (f.meter >= 100 && Math.random() < diff.specialChance) { pressed.add(act('special')); return; }
  if (dist > reach + 30) { held.add(act(dx > 0 ? 'right' : 'left')); return; }
  if (Math.random() < diff.guardChance && opp.atk) { held.add(act('guard')); return; }
  pressed.add(act(Math.random() < .5 ? 'light' : 'heavy'));
}
```

- [ ] **Step 2: Gọi `aiTick` trong `js/main.js`** khi trận đang dùng máy (ở task này, cố định `G.p2cpu = true` như `newMatch` đã đặt ở Task 2; Task 9 sẽ cho chọn thật)

```js
import { aiTick } from './ai.js';

function update(dt) {
  G.t += dt;
  if (G.p2cpu) aiTick(G.f2, G.f1, dt, G.diff);
  updateFighter(G.f1, G.f2, dt);
  updateFighter(G.f2, G.f1, dt);
  updateCombat(G.f1, G.f2, dt);
  updateCombat(G.f2, G.f1, dt);
}
```

- [ ] **Step 3: Thêm bài test** — máy phải tiến về phía P1 khi đứng xa, và phải tung ít nhất 1 đòn trong một khoảng thời gian hợp lý

```python
@test
def test_ai_approaches_and_attacks(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.f1.x = 200; G.f2.x = 900; G.diff = 'hard'")
    x0 = pg.evaluate("G.f2.x")
    pg.evaluate("for (let i = 0; i < 90; i++) update(1/60)")
    assert pg.evaluate("G.f2.x") < x0 - 40, 'máy không tiến lại gần'
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.hp = 100")
    hit = pg.evaluate("""() => { const h0 = G.f1.hp; for (let i = 0; i < 300; i++) update(1/60); return h0 - G.f1.hp; }""")
    assert hit > 0, 'máy không ra được đòn nào trong 5 giây mô phỏng'
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 7 bài PASS.

- [ ] **Step 5: Commit**

```bash
git add games/doi-khang-anh-hung/js/ai.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: máy điều khiển P2, 3 độ khó" -- games/doi-khang-anh-hung/js/ai.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 8: Hiểm hoạ sân (bãi cọc Bạch Đằng)

**Files:**
- Create: `games/doi-khang-anh-hung/js/hazards.js`
- Modify: `games/doi-khang-anh-hung/js/main.js`
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `updateHazard(f, stageId, dt)` — nếu sân có `hazard: 'stakes'` và `f` đứng trong 40px mép sân (x < 76 hoặc x > W - 76) liên tục ≥ 1.5 giây, gây 10 sát thương 1 lần rồi reset bộ đếm (không gây liên tục mỗi khung hình).

- [ ] **Step 1: Viết `js/hazards.js`**

```js
// Hiểm hoạ sân Bạch Đằng: đứng gần mép quá lâu thì mắc cọc, mất máu 1 lần rồi được tha cho tới lần đứng tiếp theo.
import { clamp } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { FIGHTERS, STAGES } from './data.js';
import { W } from './state.js';

export function updateHazard(f, stageId, dt) {
  const st = STAGES[stageId];
  if (!st || st.hazard !== 'stakes') { f.edgeT = 0; return; }
  const nearEdge = f.x < 76 || f.x > W - 76;
  f.edgeT = nearEdge ? (f.edgeT || 0) + dt : 0;
  if (f.edgeT >= 1.5) {
    f.edgeT = 0;
    f.hp = clamp(f.hp - 10, 0, FIGHTERS[f.fid].hp);
    spark(f.x, f.y - 60, 10, '#6fd06a');
  }
}
```

- [ ] **Step 2: Gọi `updateHazard` trong `js/main.js`**, và đổi sân mặc định của `newMatch` demo sang `'bachdang'` chỉ để việc test hazard khả thi qua `G.stageId` (test sẽ tự set lại `G.stageId` nếu cần, không bắt buộc đổi mặc định)

```js
import { updateHazard } from './hazards.js';

function update(dt) {
  G.t += dt;
  if (G.p2cpu) aiTick(G.f2, G.f1, dt, G.diff);
  updateFighter(G.f1, G.f2, dt);
  updateFighter(G.f2, G.f1, dt);
  updateCombat(G.f1, G.f2, dt);
  updateCombat(G.f2, G.f1, dt);
  updateHazard(G.f1, G.stageId, dt);
  updateHazard(G.f2, G.stageId, dt);
}
```

- [ ] **Step 3: Thêm bài test**

```python
@test
def test_edge_hazard_on_bachdang(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.stageId = 'bachdang'; G.f1.x = 50; G.f1.hp = 100; G.f2.x = 500")
    pg.evaluate("for (let i = 0; i < 80; i++) update(1/60)")  # ~1.33s, chưa đủ 1.5s
    hp1 = pg.evaluate("G.f1.hp")
    assert hp1 == 100, hp1
    pg.evaluate("for (let i = 0; i < 20; i++) update(1/60)")  # thêm ~0.33s, vượt 1.5s
    assert pg.evaluate("G.f1.hp") == 90
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 8 bài PASS.

- [ ] **Step 5: Commit**

```bash
git add games/doi-khang-anh-hung/js/hazards.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: hiểm hoạ bãi cọc Bạch Đằng" -- games/doi-khang-anh-hung/js/hazards.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 9: Luồng trận đấu — round, hết giờ, best-of-3

**Files:**
- Create: `games/doi-khang-anh-hung/js/flow.js`
- Modify: `games/doi-khang-anh-hung/js/state.js` (thêm `resetRound`)
- Modify: `games/doi-khang-anh-hung/js/main.js`
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `resetRound(G)` trong `state.js` — đặt lại HP/meter/vị trí 2 fighter, `G.timer = 60`, giữ `G.wins`.
- `updateFlow(G, dt)` trong `flow.js` — chỉ chạy khi `G.mode === 'fight'`: giảm `G.timer`; khi 1 bên HP = 0 hoặc hết giờ, xử lý thắng round/hoà/thắng trận; chuyển `G.mode` giữa `'fight' | 'roundEnd' | 'matchEnd'`.
- `G.banner = { text, t: 0, dur }` dùng để hiện chữ "Round 2", "Hoà! Đấu lại round", "P1 thắng trận" (vẽ ở Task 10).

- [ ] **Step 1: Thêm `resetRound` vào `js/state.js`**

```js
export function resetRound(G) {
  G.f1 = newFighter(G.p1id, 'p1', 260);
  G.f2 = newFighter(G.p2id, 'p2', 700);
  G.timer = 60;
}
```

- [ ] **Step 2: Viết `js/flow.js`**

```js
// Luồng 1 trận: round kết thúc khi 1 bên hết máu hoặc hết giờ; hoà giờ thì đấu lại round, không cộng điểm.
// Thắng round: +1 điểm cho bên thắng; ai đạt 2 điểm trước thắng trận (mode chuyển 'matchEnd').
import { resetRound } from './state.js';

function banner(G, text, dur = 1.8) { G.banner = { text, t: 0, dur }; }

export function updateFlow(G, dt) {
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }
  if (G.mode !== 'fight') return;
  G.timer = Math.max(0, G.timer - dt);
  const dead1 = G.f1.hp <= 0, dead2 = G.f2.hp <= 0;
  let winner = null;
  if (dead1 && dead2) winner = 'draw';
  else if (dead1) winner = 'p2';
  else if (dead2) winner = 'p1';
  else if (G.timer <= 0) winner = G.f1.hp === G.f2.hp ? 'draw' : (G.f1.hp > G.f2.hp ? 'p1' : 'p2');
  if (!winner) return;

  if (winner === 'draw') { banner(G, 'Hoà! Đấu lại round'); resetRound(G); return; }
  const idx = winner === 'p1' ? 0 : 1;
  G.wins[idx]++;
  if (G.wins[idx] >= 2) { G.mode = 'matchEnd'; banner(G, (winner === 'p1' ? 'P1' : 'P2') + ' thắng trận!', 4); return; }
  G.round++; banner(G, 'Round ' + G.round); resetRound(G);
}
```

- [ ] **Step 3: Gọi `updateFlow` trong `js/main.js`**, bọc phần chiến đấu để không chạy khi `mode !== 'fight'`

```js
import { updateFlow } from './flow.js';

function update(dt) {
  G.t += dt;
  if (G.mode === 'fight') {
    if (G.p2cpu) aiTick(G.f2, G.f1, dt, G.diff);
    updateFighter(G.f1, G.f2, dt);
    updateFighter(G.f2, G.f1, dt);
    updateCombat(G.f1, G.f2, dt);
    updateCombat(G.f2, G.f1, dt);
    updateHazard(G.f1, G.stageId, dt);
    updateHazard(G.f2, G.stageId, dt);
  }
  updateFlow(G, dt);
}
```

- [ ] **Step 4: Thêm bài test** — ép thắng 2 round liên tiếp, rồi test tình huống hoà giờ không cộng điểm

```python
@test
def test_round_and_match_flow(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.p2cpu = false; G.f2.hp = 0; for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.mode, G.round]") == [[1, 0], 'fight', 2], pg.evaluate("[G.wins, G.mode, G.round]")
    pg.evaluate("G.f2.hp = 0; for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.mode]") == [[2, 0], 'matchEnd']

    pg.evaluate("""() => { G.mode = 'fight'; G.wins = [0, 0]; G.round = 1;
      G.timer = 0.001; G.f1.hp = 50; G.f2.hp = 50; }""")
    pg.evaluate("for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.round, G.mode]") == [[0, 0], 1, 'fight'], 'hoà giờ không được cộng điểm hay sang round mới'
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 9 bài PASS.

- [ ] **Step 6: Commit**

```bash
git add games/doi-khang-anh-hung/js/flow.js games/doi-khang-anh-hung/js/state.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: luồng round/trận, hoà giờ đấu lại" -- games/doi-khang-anh-hung/js/flow.js games/doi-khang-anh-hung/js/state.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 10: HUD (máu, nội lực, round) + banner

**Files:**
- Create: `games/doi-khang-anh-hung/js/render.js`
- Modify: `games/doi-khang-anh-hung/js/main.js` (chuyển toàn bộ `render()` sang gọi `renderMatch`)
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `renderMatch(ctx, G)` — vẽ sân, 2 tướng theo state (`idle/run/air/guard/land/light/heavy`), 2 thanh máu + 2 thanh nội lực, số round, đồng hồ, banner giữa màn hình khi `G.banner` tồn tại.

- [ ] **Step 1: Viết `js/render.js`**

```js
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, groundShadow, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FIGHTERS, STAGES } from './data.js';
import { W, H, GROUND } from './state.js';
import { FB, FD } from '../../../platform/ui/theme.js';

const ATK_POSE = { light: () => ({ armF: -.3, armB: -1.8, legF: .3, legB: -.1, lean: .25 }),
                    heavy: () => ({ armF: -.6, armB: -2.4, legF: .4, legB: -.2, lean: .4 }) };

function fighterPose(f) {
  if (f.atk) return ATK_POSE[f.atk.kind]();
  if (f.counterT > 0) return POSES.guard(f);
  return (POSES[f.state] || POSES.idle)(f);
}

function healthBar(ctx, x, align, f) {
  const w = 300, pct = Math.max(0, f.hp / FIGHTERS[f.fid].hp);
  ctx.save(); if (align === 'r') { ctx.translate(x, 0); ctx.scale(-1, 1); x = 0; } else ctx.translate(x, 0);
  rr(ctx, 0, 18, w, 16, 6); ctx.fillStyle = '#1b1d24a0'; ctx.fill();
  rr(ctx, 2, 20, (w - 4) * pct, 12, 5); ctx.fillStyle = pct > .3 ? '#5fae4a' : '#b3261e'; ctx.fill();
  rr(ctx, 0, 36, w * (f.meter / 100), 6, 3); ctx.fillStyle = '#e9b949'; ctx.fill();
  ctx.restore();
}

export function renderMatch(ctx, G) {
  const st = STAGES[G.stageId];
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, st.sky[0]); sky.addColorStop(1, st.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = st.ground; ctx.fillRect(0, GROUND, W, H - GROUND);

  for (const f of [G.f1, G.f2]) {
    groundShadow(ctx, f.x, GROUND);
    drawChibi(ctx, f.x, f.y, FIGHTERS[f.fid].look, { face: f.face, t: f.t, ...fighterPose(f) });
  }
  drawParticles(ctx, G.t); drawTexts(ctx, FB);

  healthBar(ctx, 20, 'l', G.f1); healthBar(ctx, W - 20, 'r', G.f2);
  ctx.textAlign = 'center';
  outlinedText(ctx, String(Math.ceil(G.timer)), W / 2, 40, `30px ${FD}`, '#fff');
  outlinedText(ctx, `Round ${G.round} · ${G.wins[0]} - ${G.wins[1]}`, W / 2, 64, `16px ${FB}`, '#ffe6a8');
  if (G.banner) { ctx.globalAlpha = Math.min(1, G.banner.dur - G.banner.t); outlinedText(ctx, G.banner.text, W / 2, H / 2, `44px ${FD}`, '#ffe6a8'); ctx.globalAlpha = 1; }
}
```

- [ ] **Step 2: Rút gọn `render()` trong `js/main.js`**

```js
import { renderMatch } from './render.js';

function render() { renderMatch(ctx, G); }
```

Và xoá các import/sử dụng `drawChibi`, `POSES`, `groundShadow`, `FIGHTERS`/`STAGES` trong `main.js` nếu không còn dùng trực tiếp ở đó (vẫn giữ import `FIGHTERS`, `STAGES` nếu `newMatch`/test còn cần).

- [ ] **Step 3: Thêm bài test** — HUD vẽ xong có pixel không trong suốt tại vị trí thanh máu (cùng kiểu kiểm tra `getImageData` mà `test_platform.py` dùng cho ảnh bìa)

```python
@test
def test_hud_renders(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    alpha = pg.evaluate("document.getElementById('cv').getContext('2d').getImageData(30, 26, 1, 1).data[3]")
    assert alpha == 255
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 10 bài PASS.

- [ ] **Step 5: Commit**

```bash
git add games/doi-khang-anh-hung/js/render.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: HUD máu/nội lực/round, banner" -- games/doi-khang-anh-hung/js/render.js games/doi-khang-anh-hung/js/main.js tests/test_doi_khang.py
```

---

### Task 11: Menu, chọn tướng, chọn sân, chọn Người/Máy

**Files:**
- Create: `games/doi-khang-anh-hung/js/menu.js`
- Modify: `games/doi-khang-anh-hung/js/main.js` (bắt đầu ở `mode: 'menu'` thay vì vào trận ngay)
- Modify: `games/doi-khang-anh-hung/js/render.js` (vẽ màn menu/chọn tướng khi `G.mode` tương ứng)
- Modify: `games/doi-khang-anh-hung/index.html` (thêm lớp phủ DOM cho menu, theo đúng kiểu `games/_template` dùng canvas-only hay lớp `.ov` như hao-khi — ở đây dùng canvas để không phải thêm CSS mới)
- Test: `tests/test_doi_khang.py`

**Interfaces (produces):**
- `G.mode` nhận thêm `'select'` (chọn tướng/sân/đối thủ) trước khi vào `'fight'`.
- `startMatch(G, p1id, p2id, stageId, p2cpu, diff)` trong `menu.js` — gán lại toàn bộ trường trận đấu của `G` tại chỗ (không tạo đối tượng `G` mới, vì `main.js` giữ 1 tham chiếu `G` cố định) và đặt `G.mode = 'fight'`.
- Lựa chọn trên màn `select` điều khiển bằng phím đã có (`p1_left/right` di chuyển con trỏ chọn tướng, `p1_light` xác nhận, tương tự cho P2 nếu 2 người; nếu 1 người thì P1 chọn cả việc Người/Máy cho P2 bằng `p1_special` để đổi).

- [ ] **Step 1: Viết `js/menu.js`**

```js
// Màn chọn trước trận: điều khiển bằng action đã có sẵn (không cần bộ phím mới).
// cursor1/cursor2: chỉ số trong danh sách tướng; p2cpu: true/false; stageCursor: chỉ số sân.
import { pressed } from '../../../platform/core/input.js';
import { FIGHTERS, STAGES } from './data.js';
import { resetRound } from './state.js';

export const FIGHTER_IDS = Object.keys(FIGHTERS);
export const STAGE_IDS = Object.keys(STAGES);

export function newSelect() {
  return { mode: 'select', cursor1: 0, cursor2: 1, p2cpu: true, diff: 'normal', stageCursor: 0 };
}

export function updateSelect(sel) {
  if (pressed.has('p1_left')) sel.cursor1 = (sel.cursor1 + FIGHTER_IDS.length - 1) % FIGHTER_IDS.length;
  if (pressed.has('p1_right')) sel.cursor1 = (sel.cursor1 + 1) % FIGHTER_IDS.length;
  if (pressed.has('p2_left')) sel.cursor2 = (sel.cursor2 + FIGHTER_IDS.length - 1) % FIGHTER_IDS.length;
  if (pressed.has('p2_right')) sel.cursor2 = (sel.cursor2 + 1) % FIGHTER_IDS.length;
  if (pressed.has('p1_special')) sel.p2cpu = !sel.p2cpu;
  if (pressed.has('p2_special')) sel.diff = sel.diff === 'easy' ? 'normal' : sel.diff === 'normal' ? 'hard' : 'easy';
  if (pressed.has('p1_jump')) sel.stageCursor = (sel.stageCursor + 1) % STAGE_IDS.length;
  if (pressed.has('p1_light') || pressed.has('p2_light')) sel.confirm = true;
}

export function startMatch(G, sel) {
  G.p1id = FIGHTER_IDS[sel.cursor1]; G.p2id = FIGHTER_IDS[sel.cursor2];
  G.stageId = STAGE_IDS[sel.stageCursor]; G.p2cpu = sel.p2cpu; G.diff = sel.diff;
  G.round = 1; G.wins = [0, 0]; G.banner = null; G.mode = 'fight';
  resetRound(G);
}
```

- [ ] **Step 2: Sửa `js/main.js`** để khởi động ở màn chọn và chuyển sang trận khi xác nhận

```js
import { newSelect, updateSelect, startMatch } from './menu.js';

let G = newSelect(); // thay cho newMatch(...) cố định của Task 2-10
Object.assign(G, { p1id: 'tieuho', p2id: 'hungdao', stageId: 'thanglong', diff: 'normal' }); // giá trị an toàn trước khi chọn xong

function update(dt) {
  G.t = (G.t || 0) + dt;
  if (G.mode === 'select') {
    updateSelect(G);
    if (G.confirm) { G.confirm = false; startMatch(G, G); }
    return;
  }
  if (G.mode === 'fight') {
    if (G.p2cpu) aiTick(G.f2, G.f1, dt, G.diff);
    updateFighter(G.f1, G.f2, dt);
    updateFighter(G.f2, G.f1, dt);
    updateCombat(G.f1, G.f2, dt);
    updateCombat(G.f2, G.f1, dt);
    updateHazard(G.f1, G.stageId, dt);
    updateHazard(G.f2, G.stageId, dt);
  }
  updateFlow(G, dt);
}
```

Lưu ý: `startMatch(G, G)` dùng chính `G` vừa làm đối tượng trận vừa làm đối tượng lựa chọn (các trường `cursor1/cursor2/p2cpu/diff/stageCursor/confirm` cứ để tồn tại xen cạnh, không ảnh hưởng vì các hàm trận chỉ đọc các trường của chúng, không kiểm tra "object sạch").

- [ ] **Step 3: Vẽ màn `select` trong `js/render.js`** — thêm nhánh đầu `renderMatch` (đổi tên theo nội dung mới hoặc thêm hàm `renderSelect` gọi riêng từ `main.js`)

```js
// thêm vào render.js
import { FIGHTER_IDS, STAGE_IDS } from './menu.js';

export function renderSelect(ctx, sel) {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  outlinedText(ctx, 'Đối Kháng Anh Hùng', W / 2, 70, `40px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `P1: ${FIGHTERS[FIGHTER_IDS[sel.cursor1]].name}  ◀ A/D ▶`, W / 2, 160, `22px ${FB}`, '#fff');
  outlinedText(ctx, sel.p2cpu ? `Máy (${sel.diff}) — đổi: H` : `P2: ${FIGHTERS[FIGHTER_IDS[sel.cursor2]].name}  ◀ ←/→ ▶`, W / 2, 200, `22px ${FB}`, '#fff');
  outlinedText(ctx, `Sân: ${STAGES[STAGE_IDS[sel.stageCursor]].name} — đổi: W`, W / 2, 240, `20px ${FB}`, '#ffe6a8');
  outlinedText(ctx, 'F hoặc / để bắt đầu', W / 2, 300, `18px ${FB}`, '#a3a8b8');
}
```

- [ ] **Step 4: Gọi đúng hàm vẽ trong `js/main.js`**

```js
import { renderMatch, renderSelect } from './render.js';

function render() { G.mode === 'select' ? renderSelect(ctx, G) : renderMatch(ctx, G); }
```

- [ ] **Step 5: Thêm bài test**

```python
@test
def test_select_screen_then_start_match(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("G.mode") == 'select'
    pg.keyboard.press('KeyD'); pg.wait_for_timeout(50)
    assert pg.evaluate("G.cursor1") == 1
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(100)
    assert pg.evaluate("G.mode") == 'fight'
    assert pg.evaluate("G.p1id") == pg.evaluate("Object.keys({tieuho:1,hungdao:1,quoctoan:1,ngulao:1,binhtrong:1,khanhdu:1})[1]")
```

- [ ] **Step 6: Chạy toàn bộ test của game, xác nhận PASS**

Run: `python3 tests/test_doi_khang.py`
Expected: 11 bài PASS.

- [ ] **Step 7: Commit**

```bash
git add games/doi-khang-anh-hung/js/menu.js games/doi-khang-anh-hung/js/main.js games/doi-khang-anh-hung/js/render.js tests/test_doi_khang.py
git commit -m "doi-khang-anh-hung: menu chọn tướng/sân/Người-Máy" -- games/doi-khang-anh-hung/js/menu.js games/doi-khang-anh-hung/js/main.js games/doi-khang-anh-hung/js/render.js tests/test_doi_khang.py
```

---

### Task 12: Kiểm thử toàn nền tảng + dọn lại

**Files:**
- Modify: `games/doi-khang-anh-hung/js/main.js` (dọn import thừa sau các task trước)
- Test: chạy toàn bộ bộ test, không tạo file mới

- [ ] **Step 1: Soát lại `js/main.js` không còn import không dùng** (ví dụ `FIGHTERS`/`STAGES`/`drawChibi`/`POSES`/`groundShadow` nếu không còn gọi trực tiếp trong file này sau khi chuyển hết sang `render.js`/`menu.js`)

- [ ] **Step 2: Chạy toàn bộ test riêng của game**

Run: `python3 tests/test_doi_khang.py`
Expected: 11 bài PASS, 0 hỏng.

- [ ] **Step 3: Chạy toàn bộ test nền tảng** (đảm bảo game mới không làm hỏng trang chủ, không lộ biến ra `window` khi không có `?debug`)

Run: `python3 tests/test_platform.py`
Expected: toàn bộ PASS.

- [ ] **Step 4: Nếu Step 1 có thay đổi, commit**

```bash
git add games/doi-khang-anh-hung/js/main.js
git commit -m "doi-khang-anh-hung: dọn import thừa" -- games/doi-khang-anh-hung/js/main.js
```

Nếu Step 1 không có gì để sửa, bỏ qua bước commit này (không tạo commit rỗng).
