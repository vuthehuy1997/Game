# Giữ Nước Qua Ngàn Năm — Cải tạo lối chơi kiểu Stick War — Implementation Plan

> **For agentic workers:** Dự án này không dùng worktree — mọi task thực thi trực tiếp trên
> `main` qua fork-dispatch tuần tự (không dùng `subagent-driven-development`'s ledger/
> workspace machinery). Mỗi task: 1 fork độc lập, parent (điều phối) tự chạy lại test +
> chụp màn hình Playwright xác minh độc lập trước khi commit — không bao giờ tin báo cáo
> của fork một mình.

**Goal:** Thay vòng lặp phòng-thủ-sóng-địch hiện tại của Giữ Nước Qua Ngàn Năm bằng vòng
lặp kiểu Stick War: kinh tế đào vàng chủ động, huấn luyện lính theo lựa chọn, thế trận
Phòng thủ/Tấn công, thắng bằng phá căn cứ địch.

**Architecture:** 1 làn chiến trường đối xứng 2 căn cứ (`hq` ta trái, `oppHq` địch phải),
trận đấu liên tục không còn pha chuẩn bị/sóng tách biệt. Giữ nguyên 6 thời kỳ lịch sử và
phong cách đồ hoạ chibi làng Việt hiện có.

**Tech Stack:** ES modules thuần, Canvas 2D 960×540, không build step, test bằng
Playwright/Python (`tests/harness.py`), debug globals (`exposeGlobals`, `pause()`).

**Spec:**
`docs/superpowers/specs/2026-10-16-giu-nuoc-qua-ngan-nam-stickwar-redesign-design.md`

## Global Constraints

- Phạm vi: chỉ `games/giu-nuoc-qua-ngan-nam/**` + `tests/test_giu_nuoc_qua_ngan_nam.py`
  (file test **mới**, game này hiện chưa có test nào). Không đụng `platform/**`,
  `platform/games.js`, hay game khác.
- `STORE_KEY = 'giu-nuoc-qua-ngan-nam-v1'` không đổi; `save.js` (`S.maxEra`,
  `unlocked(i)`) giữ nguyên API, chỉ đổi nơi gọi `save()`.
- Không build step, ES modules, Canvas 2D 960×540, Vietnamese village chibi art style.
- TDD bắt buộc: viết test trước, thấy FAIL đúng lý do, rồi mới viết code cho PASS.
- Mỗi task: fork **TUYỆT ĐỐI KHÔNG** `git add`/`commit`/`push` — parent tự verify và commit
  sau khi tái kiểm độc lập.
- Game race condition đã biết trong repo (boss ở `luy-tre-lang`): test thao tác thời gian
  (`G.t`, mốc `bossAt`) phải bọc trong `pause(true)`/`pause(false)` để tránh đua với vòng
  lặp sống đang tự chạy mỗi khung hình.
- Flake môi trường đã biết: `net::ERR_NETWORK_CHANGED` gây lỗi console ngẫu nhiên không
  liên quan tới code — nếu gặp, chạy lại 2-5 lần để xác nhận trước khi coi là lỗi thật.

## Review Focus

1. Chuyển thế trận giữa trận không được làm lính "kẹt" ở toạ độ cũ hoặc bỏ qua địch đang
   trong tầm đánh (xem spec Hệ thống 4).
2. Không thao tác đào vàng (không gán thợ vào mỏ) → vàng phải đứng yên, không có nguồn thu
   ẩn nào khác (xem spec Hệ thống 2).
3. Hàng chờ huấn luyện dùng chung thợ mỏ/lính không được xử lý sai thứ tự hoặc nhân đôi khi
   2 hệ thống (Task 2, Task 3) cùng đẩy vào `G.train.queue`.
4. `checkEnd()` phải không kích hoạt 2 lần hoặc kích hoạt cả thắng lẫn thua cùng lúc nếu cả
   `hq.hp` và `oppHq.hp` cùng về 0 trong cùng 1 khung hình (quy tắc: kiểm tra thua trước,
   thắng sau — nếu cả hai cùng ≤0, trận coi là thua, vì `oppHq` chỉ về 0 khi lính ta vẫn
   sống để gây sát thương, hiếm khi trùng, nhưng phải định rõ thứ tự để test xác định được).
5. Tướng giặc (`bossAt`) không được sinh lặp lại nếu trận kéo dài, và không bị bỏ sót nếu
   test tua thời gian nhảy cóc qua mốc `bossAt` trong 1 bước `dt` lớn thay vì nhiều bước nhỏ.

---

### Task 1: Nền tảng — chiến trường 1 làn + dữ liệu era mới

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/js/state.js` (viết lại toàn bộ theo spec Hệ thống 1)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/data.js` (viết lại `makeEra`, xoá `waves`,
  `campCost`, `campUpgradeCost`, `towerDef`, `stakeDef`, `hq.income`, `hq.upgradeCost`;
  thêm `hq.hp`, `oppHq.hp`, `mine.perMinerRate`, `minerCost`, `minerTrainTime`, `maxMiners`,
  `enemy.spawnEvery`, `enemy.maxAlive`, `bossAt` cho cả 6 era)
- Delete: `games/giu-nuoc-qua-ngan-nam/js/towers.js`
- Create: `tests/test_giu_nuoc_qua_ngan_nam.py` (file test mới, bắt đầu bộ test cho cả plan)

**Interfaces:**
- Produces: `state.js` exports `W, H, LANE_Y, HQ_X, HQ_FRONT_X, OPP_HQ_X, OPP_HQ_FRONT_X,
  ALLY_HOLD_X, MINE_X, HOUSE_X, BARRACKS_X, MAX_ALLIES, G, troops` đúng shape trong spec Hệ
  thống 1, **cộng thêm `startEra(i)`** (chuyển từ `waves.js` cũ vào thẳng `state.js`, đúng
  tiền lệ đã có ở `luy-tre-lang/js/state.js` nơi `newGame()`/lifecycle sống chung với state —
  tránh phải giữ `waves.js` sống dở tới Task 5 chỉ vì 1 hàm). `data.js` export `ERAS` với mỗi
  era có đủ field liệt kê ở trên cho Task 2-7 dùng, và `bossDef(era)` giữ nguyên chữ ký hiện
  có (dùng `era.enemy` làm nền, scale như code gốc).
- Consumes: không (task nền tảng).

- [ ] **Bước 1: Viết test khởi tạo trận (RED)**

```python
#!/usr/bin/env python3
"""Kiểm thử Giữ Nước Qua Ngàn Năm. Chạy: python3 tests/test_giu_nuoc_qua_ngan_nam.py [lọc tên]"""
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


@test
def test_start_era_resets_battlefield_state(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        return {
            phase: G.phase, stance: G.stance,
            hqFull: G.hq.hp === G.hq.maxHp, oppHqFull: G.oppHq.hp === G.oppHq.maxHp,
            minersTotal: G.miners.total, minersAtMine: G.miners.atMine,
            troopsLen: troops.length, trainQueueLen: G.train.queue.length,
        };
    }""")
    assert r["phase"] == "battle"
    assert r["stance"] == "defend"
    assert r["hqFull"] is True
    assert r["oppHqFull"] is True
    assert r["minersTotal"] == 0
    assert r["minersAtMine"] == 0
    assert r["troopsLen"] == 0
    assert r["trainQueueLen"] == 0


run(TESTS)
```

Quy ước đã xác nhận từ các file test khác trong repo (`test_co_thanh_ngan_nam.py`,
`test_luy_tre_lang.py`): `exposeGlobals` đưa export thẳng lên `window` không qua tiền tố —
trong `pg.evaluate`, gọi thẳng `G`, `troops`, `startEra(...)` như biến/hàm toàn cục, KHÔNG
viết `window.__G`. Mỗi test tự `pg.goto(root(base) + URL)` rồi `pg.wait_for_timeout(300)` —
không cần `wait_for_function`, vì `exposeGlobals` chạy ngay lúc module nạp. Mọi task sau
trong plan này dùng đúng quy ước này; `startEra`, `G`, `troops` được expose ngay ở Task 1
(sửa dòng `exposeGlobals` hiện tại trong `main.js`, bỏ các tên không còn tồn tại như
`startWave`, `updateStakes`, `PLOTS`, `buildingOn`, `ERA_ART`, `buildingHeight`,
`drawBuilding` nếu Task 1 chưa cần — Task 7 sẽ hoàn thiện danh sách expose đầy đủ).

- [ ] **Bước 2: Chạy test, xác nhận FAIL**

Run: `python3 tests/test_giu_nuoc_qua_ngan_nam.py`
Expected: FAIL (ví dụ `AttributeError`/`undefined` vì `state.js`/`data.js` chưa đổi, hoặc vì
`main.js` còn gọi hàm từ `towers.js`/`waves.js` cũ gây lỗi import trước khi đổi).

- [ ] **Bước 3: Viết `state.js`, `data.js` mới, xoá `towers.js`**

Dùng đúng code mẫu trong spec Hệ thống 1 cho `state.js`. Với `data.js`, viết lại `makeEra`
theo khung:

```js
function makeEra(i, flavor) {
  const k = 1 + i * 0.3;
  const troopTypes = flavor.troops.map((t, lvl) => ({
    id: `t${lvl}`, name: t.name, look: t.look,
    hp: Math.round((40 + lvl * 24) * k), dmg: Math.round((7 + lvl * 5) * k),
    reach: 22, spd: 42,
    cost: 8 + lvl * 7, trainTime: 2 + lvl * 1.2,
  }));
  return {
    id: flavor.id, name: flavor.name, year: flavor.year, foe: flavor.foe, bg: flavor.bg,
    hq: { hp: Math.round(140 * k) }, oppHq: { hp: Math.round(160 * k) },
    mine: { perMinerRate: 2.2 + i * .3 },
    minerCost: 18, minerTrainTime: 2.5, maxMiners: 4,
    enemy: {
      hp: Math.round(30 * k), dmg: Math.round(6 * k), reach: 22, spd: 40, look: flavor.enemyLook,
      spawnEvery: Math.max(1.6, 3.4 - i * .3), maxAlive: 5 + i,
    },
    bossAt: 70,
    troopTypes,
  };
}
```

Giữ nguyên toàn bộ 6 khối `ERAS.push`/literal era hiện có (tên, năm, quân địch, màu `bg`,
`troops[].name/look`, `enemyLook`) — chỉ thay cách `makeEra` lắp field, không đổi nội dung
lịch sử/màu sắc. Giữ nguyên `bossDef(era)` hiện có (chỉ đổi nếu field `era.enemy` thiếu gì
so với bản cũ — không thiếu, giữ y nguyên).

Thêm `startEra(i)` vào cuối `state.js` (import `ERAS` từ `./data.js`, `refill` từ
`../../../platform/core/util.js`):

```js
export function startEra(i) {
  if (!ERAS[i]) return; // chỉ số thời kỳ không hợp lệ: bỏ qua thay vì crash
  G.eraIdx = i; G.era = ERAS[i]; G.phase = 'battle'; G.stance = 'defend';
  G.gold = 40; G.t = 0; G.shake = 0;
  G.hq = { hp: G.era.hq.hp, maxHp: G.era.hq.hp };
  G.oppHq = { hp: G.era.oppHq.hp, maxHp: G.era.oppHq.hp };
  G.miners = { total: 0, atMine: 0 };
  G.train = { queue: [] };
  G.enemySpawnT = 0; G.bossSpawned = false;
  refill(troops);
}
```

Xoá file `towers.js` và `waves.js` ở bước này luôn (không đợi Task 5 — nội dung còn lại của
`waves.js` ngoài `startEra` là `armStakes`/`startWave`/`updateWaveSpawns`/`updateStakes`,
toàn bộ đều thuộc hệ sóng/trụ cọc đã bỏ, không còn lý do giữ file sống dở). Task 5 chỉ còn
việc tạo `enemy.js` mới cho AI địch, không cần xoá `waves.js` nữa (đã xoá ở đây). Trong
`main.js`, sửa import `startEra` từ `./state.js` thay vì `./waves.js`, tạm bỏ mọi lời gọi
hàm thuộc Task 2-7 chưa tồn tại (comment lại, Task 2-7 thêm lại dần), miễn
`test_start_era_resets_battlefield_state` chạy qua được. Mục tiêu Task 1 là nền dữ liệu +
state, không phải toàn bộ vòng lặp chơi hoàn chỉnh.

Thêm luôn cơ chế tạm dừng debug ngay từ Task 1 (Task 5 cần dùng để test mốc giờ tướng giặc),
theo đúng mẫu đã dùng ở `luy-tre-lang/js/main.js`:

```js
let paused = false;
function update(dt) {
  if (paused) return;
  // ... các updateX(dt) hiện có
}
// trong exposeGlobals: thêm { pause: v => { paused = v; } } vào danh sách module
```

`pause(true)`/`pause(false)` gọi được từ Playwright ngay sau Task 1, không đợi tới Task 7.

- [ ] **Bước 4: Chạy test, xác nhận PASS**

Run: `python3 tests/test_giu_nuoc_qua_ngan_nam.py`
Expected: PASS, không lỗi console.

- [ ] **Bước 5: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/js/state.js games/giu-nuoc-qua-ngan-nam/js/data.js tests/test_giu_nuoc_qua_ngan_nam.py games/giu-nuoc-qua-ngan-nam/js/main.js
git rm games/giu-nuoc-qua-ngan-nam/js/towers.js games/giu-nuoc-qua-ngan-nam/js/waves.js
git commit -m "feat(giu-nuoc-qua-ngan-nam): Task 1/7 — nền tảng chiến trường 1 làn + dữ liệu era Stick War"
```

---

### Task 2: Kinh tế chủ động — Mỏ vàng + thợ mỏ

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/js/buildings.js` (viết lại hoàn toàn)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `updateMineIncome(dt)`,
  `updateTrainQueue(dt)` mỗi khung hình trong `'battle'`)
- Modify: `tests/test_giu_nuoc_qua_ngan_nam.py` (thêm test)

**Interfaces:**
- Consumes: `G.miners`, `G.train.queue`, `G.era.mine/minerCost/minerTrainTime/maxMiners` từ
  Task 1.
- Produces: `trainMiner()`, `assignMinerToMine()`, `unassignMinerFromMine()`,
  `updateMineIncome(dt)`, `updateTrainQueue(dt)` (export từ `buildings.js`, dùng đúng chữ ký
  trong spec Hệ thống 2 — `updateTrainQueue` xử lý cả `kind:'miner'` lẫn `kind:'troop'` nên
  thuộc về Task 2 viết khung, Task 3 bổ sung nhánh `troop`). Task 3-7 dùng các hàm này qua
  import từ `buildings.js`.

- [ ] **Bước 1: Viết test (RED)**

```python
@test
def test_mine_income_only_when_miner_assigned(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        updateMineIncome(1); // 1s, chưa gán thợ nào
        const goldAfterNoMiner = G.gold;
        G.miners.total = 1;
        assignMinerToMine();
        updateMineIncome(1); // 1s, đã gán 1 thợ
        return { goldAfterNoMiner, goldAfterMiner: G.gold, rate: G.era.mine.perMinerRate };
    }""")
    assert r["goldAfterNoMiner"] == 40  # G.gold khởi tạo 40 (giữ nguyên hằng số cũ trong startEra), không đổi
    assert abs(r["goldAfterMiner"] - (40 + r["rate"])) < 0.01


@test
def test_train_miner_respects_cost_and_cap(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.gold = 1000;
        const results = [];
        for (let i = 0; i < G.era.maxMiners + 1; i++) results.push(trainMiner());
        return { results, queueLen: G.train.queue.length, maxMiners: G.era.maxMiners };
    }""")
    assert r["results"][:r["maxMiners"]] == [True] * r["maxMiners"]
    assert r["results"][r["maxMiners"]] is False  # vượt maxMiners phải thất bại
    assert r["queueLen"] == r["maxMiners"]
```

- [ ] **Bước 2: Chạy test, xác nhận FAIL** (hàm chưa tồn tại)

- [ ] **Bước 3: Viết `buildings.js`** theo đúng 4 hàm mẫu trong spec Hệ thống 2, cộng
  `updateTrainQueue(dt)` xử lý nhánh `'miner'` (nhánh `'troop'` thêm ở Task 3, nhưng khung
  hàm và vòng lặp viết ở đây để Task 3 chỉ cần thêm 1 nhánh `if`).

- [ ] **Bước 4: Nối vào `main.js`**, expose `trainMiner, assignMinerToMine,
  unassignMinerFromMine, updateMineIncome, updateTrainQueue` qua `exposeGlobals`.

- [ ] **Bước 5: Chạy test, xác nhận PASS** (toàn bộ file, không chỉ test mới)

Run: `python3 tests/test_giu_nuoc_qua_ngan_nam.py`

- [ ] **Bước 6: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/js/buildings.js games/giu-nuoc-qua-ngan-nam/js/main.js tests/test_giu_nuoc_qua_ngan_nam.py
git commit -m "feat(giu-nuoc-qua-ngan-nam): Task 2/7 — kinh tế đào vàng chủ động (Mỏ vàng + thợ mỏ)"
```

---

### Task 3: Huấn luyện lính (Doanh trại)

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/js/buildings.js` (thêm `trainTroop`, nhánh `'troop'`
  trong `updateTrainQueue`)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/troops.js` (viết lại `spawnTroop(side, def)` —
  bỏ tham số `lane`, giữ các field còn lại)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (expose `trainTroop`, `spawnTroop`)
- Modify: `tests/test_giu_nuoc_qua_ngan_nam.py`

**Interfaces:**
- Consumes: `MAX_ALLIES`, `troops`, `HQ_FRONT_X` từ Task 1; `updateTrainQueue` khung từ
  Task 2.
- Produces: `trainTroop(troopTypeId)`, `spawnTroop(side, def)` (chữ ký mới, 2 tham số thay
  vì 3) — Task 4-5 dùng `spawnTroop` để tạo lính ta/địch.

- [ ] **Bước 1: Viết test (RED)**

```python
@test
def test_train_troop_spawns_ally_after_train_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        const goldBefore = G.gold;
        const def = G.era.troopTypes[0];
        const ok = trainTroop(def.id);
        const goldAfterTrain = G.gold;
        updateTrainQueue(def.trainTime + 0.01);
        return {
            ok, goldBefore, goldAfterTrain, cost: def.cost, expectedName: def.name,
            troopsLen: troops.length,
            allyName: troops[0] && troops[0].name,
        };
    }""")
    assert r["ok"] is True
    assert r["goldAfterTrain"] == r["goldBefore"] - r["cost"]
    assert r["troopsLen"] == 1
    assert r["allyName"] == r["expectedName"]


@test
def test_train_troop_fails_without_enough_gold(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.gold = 0;
        return trainTroop(G.era.troopTypes[0].id);
    }""")
    assert r is False
```

- [ ] **Bước 2: Chạy test, xác nhận FAIL**

- [ ] **Bước 3: Viết `trainTroop`** theo mẫu spec Hệ thống 3, thêm nhánh `'troop'` vào
  `updateTrainQueue` (gọi `spawnTroop('ally', def)` khi `head.kind === 'troop'`). Viết lại
  `spawnTroop(side, def)` trong `troops.js`:

```js
export function spawnTroop(side, def) {
  troops.push({
    side, x: side === 'ally' ? HQ_FRONT_X + 10 : OPP_HQ_FRONT_X - 10,
    hp: def.hp, maxHp: def.hp, dmg: def.dmg, reach: def.reach, spd: def.spd,
    name: def.name || '', look: def.look, walk: 0,
  });
}
```

- [ ] **Bước 4: Chạy test, xác nhận PASS**

- [ ] **Bước 5: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/js/buildings.js games/giu-nuoc-qua-ngan-nam/js/troops.js games/giu-nuoc-qua-ngan-nam/js/main.js tests/test_giu_nuoc_qua_ngan_nam.py
git commit -m "feat(giu-nuoc-qua-ngan-nam): Task 3/7 — huấn luyện lính theo lựa chọn (Doanh trại)"
```

---

### Task 4: Thế trận Phòng thủ/Tấn công cho quân ta

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/js/troops.js` (viết lại `updateTroops(dt)`, thêm
  `setStance(stance)`)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (expose `setStance`, `updateTroops`,
  `ALLY_HOLD_X`, `OPP_HQ_FRONT_X` — `spawnTroop`/`troops`/`G` đã expose từ Task 1/3)
- Modify: `tests/test_giu_nuoc_qua_ngan_nam.py`

**Interfaces:**
- Consumes: `G.stance`, `ALLY_HOLD_X`, `OPP_HQ_FRONT_X` từ Task 1; `spawnTroop` từ Task 3.
- Produces: `setStance('defend'|'attack')`, `updateTroops(dt)` (hành vi theo spec Hệ thống
  4) — Task 5 (AI địch) và Task 6 (thắng/thua) dựa vào `G.oppHq.hp`/`G.hq.hp` bị
  `updateTroops` trừ đúng khi quân áp sát.

- [ ] **Bước 1: Viết test (RED)**

Dùng lại bài học đo tốc độ đã rút ra ở `luy-tre-lang`: so sánh vị trí **trước/sau đúng 1
lần gọi `updateTroops(dt)`** tại cùng 1 trạng thái, không tích luỹ qua nhiều khung hình khác
điều kiện.

```python
@test
def test_stance_defend_moves_ally_toward_hold_x(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.stance = 'defend';
        spawnTroop('ally', G.era.troopTypes[0]);
        const u = troops[0];
        u.x = 400; // xa ALLY_HOLD_X (230), không có địch nên phải lùi về
        const before = u.x;
        updateTroops(0.1);
        return { before, after: u.x, holdX: ALLY_HOLD_X };
    }""")
    assert r["after"] < r["before"]  # phải di chuyển VỀ hướng ALLY_HOLD_X (giảm x vì 230 < 400)


@test
def test_stance_attack_moves_ally_toward_enemy_hq_and_damages_it(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.stance = 'attack';
        spawnTroop('ally', G.era.troopTypes[0]);
        const u = troops[0];
        u.x = OPP_HQ_FRONT_X; // đã áp sát, không có địch nào chặn
        const hpBefore = G.oppHq.hp;
        updateTroops(0.5);
        return { hpBefore, hpAfter: G.oppHq.hp, dmg: u.dmg };
    }""")
    assert r["hpAfter"] == r["hpBefore"] - r["dmg"] * 0.5


@test
def test_stance_switch_mid_battle_redirects_immediately(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.stance = 'defend';
        spawnTroop('ally', G.era.troopTypes[0]);
        const u = troops[0];
        u.x = ALLY_HOLD_X; // đã ở vị trí giữ
        setStance('attack');
        const before = u.x;
        updateTroops(0.1);
        return { before, after: u.x };
    }""")
    assert r["after"] > r["before"]  # đổi thế trận → tiến về phía địch ngay khung kế tiếp
```

- [ ] **Bước 2: Chạy test, xác nhận FAIL**

- [ ] **Bước 3: Viết `setStance`/`updateTroops`** đúng theo spec Hệ thống 4 — lưu ý nhánh
  `'attack'` khi `x >= OPP_HQ_FRONT_X` và không có địch trong tầm thì trừ `G.oppHq.hp -=
  u.dmg * dt` (không phải `foe.hp`). Giữ nguyên nhánh enemy hiện có (tiến về `HQ_FRONT_X`,
  trừ `G.hq.hp`) — Task 5 sẽ điều chỉnh lại cho khớp spawn không-theo-lane nhưng hành vi di
  chuyển/gây sát thương của enemy **không đổi** so với code gốc.

- [ ] **Bước 4: Chạy test, xác nhận PASS**

- [ ] **Bước 5: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/js/troops.js games/giu-nuoc-qua-ngan-nam/js/main.js tests/test_giu_nuoc_qua_ngan_nam.py
git commit -m "feat(giu-nuoc-qua-ngan-nam): Task 4/7 — thế trận Phòng thủ/Tấn công"
```

---

### Task 5: AI địch — tự sinh quân liên tục + tướng giặc theo mốc giờ

**Files:**
- Create: `games/giu-nuoc-qua-ngan-nam/js/enemy.js` (`waves.js` đã bị xoá ở Task 1 cùng với
  `startEra` chuyển sang `state.js` — Task 5 chỉ tạo file AI địch hoàn toàn mới, không xoá
  gì thêm)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `updateEnemySpawns(dt)`, expose hàm
  mới)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (bỏ nút "Bắt đầu đợt" khỏi
  `initHud()`/`updateHud()` nếu Task 1 chưa kịp dọn — trận giờ chạy liên tục ngay sau
  `beginEra(i)`, không còn khái niệm đợt)
- Modify: `tests/test_giu_nuoc_qua_ngan_nam.py`

**Interfaces:**
- Consumes: `troops`, `spawnTroop`, `bossDef` từ Task 1/3; `era.enemy.spawnEvery/maxAlive`,
  `era.bossAt` từ Task 1.
- Produces: `updateEnemySpawns(dt)` (export từ `enemy.js`) — Task 6 chỉ cần `G.hq.hp` bị
  trừ đúng (logic đã có từ code gốc, giữ nguyên trong `updateTroops`), không cần API mới từ
  Task 5 ngoài hàm này.

- [ ] **Bước 1: Viết test (RED)**

Dùng `pause(true)`/`pause(false)` quanh thao tác set `G.t`/`G.enemySpawnT` để tránh đua với
vòng lặp sống, đúng quy ước đã rút ra từ boss `luy-tre-lang`.

```python
@test
def test_enemy_spawns_on_schedule_capped_at_max_alive(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        pause(true);
        startEra(0);
        G.era.enemy.maxAlive = 1; // ép giới hạn nhỏ để test nhanh
        updateEnemySpawns(G.era.enemy.spawnEvery + 0.01);
        const afterFirst = troops.filter(u => u.side === 'enemy').length;
        updateEnemySpawns(G.era.enemy.spawnEvery + 0.01); // đã đạt maxAlive, không sinh thêm
        const afterSecond = troops.filter(u => u.side === 'enemy').length;
        pause(false);
        return { afterFirst, afterSecond };
    }""")
    assert r["afterFirst"] == 1
    assert r["afterSecond"] == 1


@test
def test_boss_spawns_once_at_boss_at_mark(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        pause(true);
        startEra(0);
        G.t = G.era.bossAt + 50; // nhảy cóc qua mốc trong 1 bước dt lớn
        updateEnemySpawns(0.016);
        const bossNameAfterFirst = troops.filter(u => u.name === 'Tướng giặc').length;
        updateEnemySpawns(0.016); // vẫn ở sau mốc, không sinh thêm
        const bossNameAfterSecond = troops.filter(u => u.name === 'Tướng giặc').length;
        pause(false);
        return { bossNameAfterFirst, bossNameAfterSecond, bossSpawned: G.bossSpawned };
    }""")
    assert r["bossNameAfterFirst"] == 1
    assert r["bossNameAfterSecond"] == 1
    assert r["bossSpawned"] is True
```

- [ ] **Bước 2: Chạy test, xác nhận FAIL**

- [ ] **Bước 3: Viết `enemy.js`** theo mẫu spec Hệ thống 5, import `startEra` từ
  `./state.js` nếu cần. Trong `flow.js`, `beginEra(i)` gọi `startEra(i); showOnly(null);` y
  nguyên (không còn `startWave`), `initHud()`/`updateHud()` bỏ phần `btnStartWave`.

- [ ] **Bước 4: Chạy test, xác nhận PASS**

- [ ] **Bước 5: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/js/enemy.js games/giu-nuoc-qua-ngan-nam/js/main.js games/giu-nuoc-qua-ngan-nam/js/flow.js tests/test_giu_nuoc_qua_ngan_nam.py
git commit -m "feat(giu-nuoc-qua-ngan-nam): Task 5/7 — AI địch tự sinh quân liên tục + tướng giặc theo mốc giờ"
```

---

### Task 6: Thắng/thua — phá căn cứ thay vì sống sót qua sóng

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/js/enemy.js` (thêm `checkEnd()` — file đã tồn tại từ
  Task 5, tránh sinh thêm file chỉ cho 1 hàm nhỏ)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (`showResult()` đổi câu chữ theo spec Hệ
  thống 6)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (gọi `checkEnd()` mỗi khung hình trong
  `'battle'`, expose `checkEnd`)
- Modify: `tests/test_giu_nuoc_qua_ngan_nam.py`

**Interfaces:**
- Consumes: `G.hq.hp`, `G.oppHq.hp`, `S.maxEra`, `save()`, `showResult()` từ Task 1/4/5.
- Produces: `checkEnd()` — không có task nào sau dùng tới (task cuối cùng của mạch
  logic chơi; Task 7 chỉ nối UI).

- [ ] **Bước 1: Viết test (RED)**

```python
@test
def test_check_end_win_destroys_opp_hq_and_advances_max_era(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        const maxEraBefore = S.maxEra;
        G.oppHq.hp = 0;
        checkEnd();
        return { phase: G.phase, maxEraAfter: S.maxEra, maxEraBefore };
    }""")
    assert r["phase"] == "win"
    assert r["maxEraAfter"] == max(r["maxEraBefore"], 1)


@test
def test_check_end_lose_when_hq_destroyed(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.hq.hp = 0;
        checkEnd();
        return { phase: G.phase };
    }""")
    assert r["phase"] == "lose"


@test
def test_check_end_noop_while_both_hq_alive(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        checkEnd();
        return G.phase;
    }""")
    assert r == "battle"
```

- [ ] **Bước 2: Chạy test, xác nhận FAIL**

- [ ] **Bước 3: Viết `checkEnd()`** đúng theo spec Hệ thống 6 — kiểm tra `hq.hp <= 0` TRƯỚC
  `oppHq.hp <= 0` (thua được ưu tiên nếu cả hai cùng về 0 cùng khung hình, theo Review Focus
  #4 của plan này). Cập nhật `showResult()`.

- [ ] **Bước 4: Chạy test, xác nhận PASS**

- [ ] **Bước 5: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/js/enemy.js games/giu-nuoc-qua-ngan-nam/js/flow.js games/giu-nuoc-qua-ngan-nam/js/main.js tests/test_giu_nuoc_qua_ngan_nam.py
git commit -m "feat(giu-nuoc-qua-ngan-nam): Task 6/7 — thắng bằng phá căn cứ địch, thua khi mất Nhà chính"
```

---

### Task 7: HUD/UI + đồ hoạ căn cứ địch đối xứng (hoàn tất)

**Files:**
- Modify: `games/giu-nuoc-qua-ngan-nam/index.html` (HUD mới theo spec Hệ thống 7)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/flow.js` (nối nút mới: `btnStance`, `btnMine+`,
  `btnMine-`, `btnTrainHouse`, `btnBarracks` → bảng chọn lính)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/render.js` (vẽ `oppHq` đối xứng, HUD vàng/thợ
  mỏ/thế trận)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/art.js` (`drawHQ` thêm tham số `flip`, xoá
  `drawTower`/`drawStakes`, đổi `drawCamp` → vẽ Doanh trại/Nhà dân/Mỏ vàng theo `MINE_X/
  HOUSE_X/BARRACKS_X`)
- Modify: `games/giu-nuoc-qua-ngan-nam/style.css` (bỏ `.plots`/`.plot`, thêm style nút thế
  trận/mỏ vàng nếu cần)
- Modify: `games/giu-nuoc-qua-ngan-nam/js/main.js` (hoàn thiện `exposeGlobals` đầy đủ:
  `G, troops, startEra, setStance, updateTroops, trainMiner, assignMinerToMine,
  unassignMinerFromMine, trainTroop, updateEnemySpawns, checkEnd, S, ALLY_HOLD_X,
  OPP_HQ_FRONT_X` — `pause` đã được thêm từ Task 1, giữ nguyên, không cần sửa lại)
- Modify: `tests/test_giu_nuoc_qua_ngan_nam.py` (test DOM/HUD cuối cùng)

**Interfaces:**
- Consumes: toàn bộ API từ Task 1-6.
- Produces: không — task cuối của plan.

- [ ] **Bước 1: Viết test (RED)**

```python
@test
def test_hud_has_no_leftover_plot_or_wave_elements(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    assert pg.evaluate("document.getElementById('plots')") is None
    assert pg.evaluate("document.getElementById('btnHqUp')") is None
    assert pg.evaluate("document.getElementById('btnStartWave')") is None
    assert pg.evaluate("document.getElementById('btnStance')") is not None


@test
def test_stance_button_click_toggles_label_and_state(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        document.getElementById('btnStance').click();
        return { stance: G.stance, label: document.getElementById('btnStance').textContent };
    }""")
    assert r["stance"] == "attack"
    assert "Tấn công" in r["label"]
```

- [ ] **Bước 2: Chạy test, xác nhận FAIL**

- [ ] **Bước 3: Viết HUD/render/art** theo spec Hệ thống 7.

- [ ] **Bước 4: Chạy TOÀN BỘ file test, xác nhận PASS**

Run: `python3 tests/test_giu_nuoc_qua_ngan_nam.py` (chạy lại 2-3 lần nếu gặp
`net::ERR_NETWORK_CHANGED` để loại trừ flake môi trường đã biết).

- [ ] **Bước 5: Chụp màn hình Playwright xác minh thủ công** (parent thực hiện sau khi
  fork báo cáo, không phải bước của fork): mở trang, `startEra(0)`, chụp lúc thế trận
  Phòng thủ (quân tụ gần `hq`), chuyển "Tấn công" và chụp lại sau vài giây (quân tiến về
  `oppHq`, thanh máu `oppHq` còn nguyên hoặc giảm nếu đã chạm).

- [ ] **Bước 6: Commit**

```bash
git add games/giu-nuoc-qua-ngan-nam/index.html games/giu-nuoc-qua-ngan-nam/js/flow.js games/giu-nuoc-qua-ngan-nam/js/render.js games/giu-nuoc-qua-ngan-nam/js/art.js games/giu-nuoc-qua-ngan-nam/style.css games/giu-nuoc-qua-ngan-nam/js/main.js tests/test_giu_nuoc_qua_ngan_nam.py
git commit -m "feat(giu-nuoc-qua-ngan-nam): Task 7/7 — HUD thế trận + căn cứ địch đối xứng (hoàn tất cải tạo Stick War)"
```

## Ghi chú thực thi

- Thứ tự 1→2→3→4→5→6→7 là bắt buộc (mỗi task tiêu thụ interface task trước, xem mục
  Interfaces từng task) — không chạy song song.
- Nếu một fork phát hiện xung đột giữa plan và spec, spec là authority — ghi rõ quyết định
  trong báo cáo, parent xác nhận rồi mới cho tiếp tục (như đã làm ở đợt `luy-tre-lang`
  trước, ví dụ Task 7 đổi kiểu trả về của `checkHouse()`).
- Parent (điều phối) sau mỗi task: tự chạy lại `tests/test_giu_nuoc_qua_ngan_nam.py` độc
  lập (không tin báo cáo fork), tự viết script Playwright phụ để chụp màn hình xác minh
  tính năng hình ảnh nếu task có phần đồ hoạ (Task 1, 7), rồi mới commit.
- Sau Task 7: chạy lại toàn bộ `tests/test_giu_nuoc_qua_ngan_nam.py` 2 lần liên tiếp để loại
  flake trước khi coi plan hoàn tất, đúng quy trình đã dùng cho đợt `luy-tre-lang`.
