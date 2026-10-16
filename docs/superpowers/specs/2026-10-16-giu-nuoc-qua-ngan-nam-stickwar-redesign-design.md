# Giữ Nước Qua Ngàn Năm — Cải tạo lối chơi kiểu Stick War (Spec)

## Bối cảnh

`games/giu-nuoc-qua-ngan-nam` hiện là game thủ thành/auto-battler thuần: vàng là thu nhập
thụ động theo thời gian, trại lính tự động xuất quân theo cấp (người chơi không chọn loại
lính), lính ta hành quân tới một vị trí cố định rồi đứng giữ — không bao giờ chủ động tiến
đánh địch, và thắng = sống sót qua 5 đợt sóng mỗi thời kỳ (không có khái niệm phá căn cứ
địch).

Người dùng đối chiếu với Stick War (nghiên cứu qua stick-war.fandom.com) và nhận xét: Stick
War không chỉ là game thủ thành. Nó có 3 trục khác hẳn: (1) kinh tế **chủ động** — người
chơi phải đào vàng, không có thu nhập tự sinh; (2) **chọn lính để huấn luyện** bằng vàng
tích luỹ, không tự động theo cấp trại; (3) **2 thế trận Phòng thủ/Tấn công** — người chơi
chủ động quyết định khi nào dốc quân tiến đánh và phá tượng/căn cứ địch để thắng, thay vì
chỉ phòng thủ sống sót.

Spec này cải tạo toàn diện vòng lặp chơi theo đúng 3 trục trên, giữ nguyên 6 thời kỳ lịch
sử và phong cách đồ hoạ hiện có (chỉ đổi bố cục chiến trường và các hệ thống tương tác).

## Global Constraints

- Không có bước build; ES modules thuần, Canvas 2D 960×540, không thư viện ngoài.
- Phạm vi: chỉ `games/giu-nuoc-qua-ngan-nam/**` + file test mới
  `tests/test_giu_nuoc_qua_ngan_nam.py`. Không đụng `platform/**` hay game khác.
  `platform/games.js` không đổi.
- `STORE_KEY = 'giu-nuoc-qua-ngan-nam-v1'` giữ nguyên. `save.js` chỉ lưu `{ maxEra }` (tiến
  độ thời kỳ cao nhất đã thắng) — xác nhận không lưu state trận đang chơi (`G`), nên đổi
  toàn bộ engine **không phá save cũ**: `S.maxEra` đọc/ghi y hệt hiện tại.
- Giữ phong cách đồ hoạ làng Việt (chibi, `drawChibi`, `POSES`, bảng màu `ERA_ART` theo
  thời kỳ) và font/bảng UI hiện có (`platform/css/kit.css` + `style.css` riêng game).
  Không vẽ UI bằng framework ngoài — vẫn canvas + DOM nhẹ như hiện tại.
- Phải có debug globals (`exposeGlobals`) để test Playwright gọi thẳng hàm/ghi `G`, theo
  đúng quy ước các game khác trong repo (ví dụ `luy-tre-lang`).
- Game hiện **chưa có file test nào** — viết bộ test mới từ đầu theo TDD, không có test cũ
  cần giữ tương thích.

## Review Focus

1. **Chuyển thế trận giữa trận đấu** — đổi Phòng thủ ↔ Tấn công khi quân đang giao tranh
   giữa làn phải mượt (đổi hướng di chuyển ngay, không kẹt ở toạ độ cũ, không vô tình bỏ
   qua địch đang trong tầm đánh).
2. **Kinh tế đào vàng = 0 nếu người chơi không thao tác** — nếu người chơi không gán thợ
   mỏ vào Mỏ vàng, vàng phải đứng yên (không có fallback thu nhập ẩn) — đúng tinh thần "kinh
   tế chủ động", khác hẳn hành vi cũ.
3. **Giới hạn thợ mỏ (`maxMiners`) và hàng chờ huấn luyện** — không cho huấn luyện vượt
   giới hạn, và hàng chờ huấn luyện lính/thợ mỏ không được "nuốt" vàng đã trả nếu người
   chơi thoát trận giữa chừng huấn luyện (vàng trừ ngay khi bắt đầu train là chấp nhận
   được, miễn tài liệu ghi rõ, không cần hoàn tiền).
4. **Phá `oppHq` khi không còn lính địch chặn đường** — quân ta ở thế Tấn công khi tới
   `OPP_HQ_FRONT_X` phải liên tục gây sát thương lên `oppHq.hp` giống hệt cách địch gây sát
   thương lên `hq.hp` khi áp sát (symmetry bắt buộc, dùng lại đúng công thức `dmg * dt`).
5. **Tướng giặc (`bossAt`) chỉ xuất hiện đúng 1 lần mỗi trận** — không lặp lại nếu trận kéo
   dài quá mốc thời gian, và việc tạm dừng (`pause()` debug) không làm mốc thời gian trôi
   tiếp ngầm (giữ nguyên quy ước `pause()`/`resume()` đã dùng cho boss ở `luy-tre-lang`).

## Hệ thống 1 — Chiến trường 1 làn đối xứng 2 căn cứ

Bỏ hệ 3 làn (`LANES`) và hệ 6 lô đất 2×3 (`PLOTS`). Chiến trường còn 1 làn (`LANE_Y = 360`)
với 2 căn cứ đối xứng:

- Ta: `HQ_X = 70`, `HQ_FRONT_X = 130` (mép ngoài tường ta).
- Địch: `OPP_HQ_X = 890`, `OPP_HQ_FRONT_X = 830` (mép ngoài tường địch).
- `ALLY_HOLD_X = 230` — vị trí quân ta tụ về khi ở thế Phòng thủ.
- `OPP_HOLD_X` không cần (địch không có thế phòng thủ, xem Hệ thống 5).
- 3 công trình cố định, luôn có sẵn từ đầu trận (không cần xây, không có hệ lô trống):
  `MINE_X = 170` (Mỏ vàng), `HOUSE_X = 110` (Nhà dân — huấn luyện thợ mỏ),
  `BARRACKS_X = 230` (Doanh trại — huấn luyện lính). Bỏ hẳn `BUILD_KINDS`, `costOf`,
  `canBuild`, `build`, tháp canh (`towers.js` xoá cả file) và trụ cọc.

`G.phase`: `'menu' | 'battle' | 'win' | 'lose'` (bỏ `'prep'` — xây/huấn luyện/đào vàng làm
được bất cứ lúc nào trong `'battle'`, không còn pha chuẩn bị tách biệt).

`state.js` export mới (thay toàn bộ phần cũ về `LANES`/`PLOTS`/`MAX_ALLIES_PER_LANE`):

```js
export const W = 960, H = 540, LANE_Y = 360;
export const HQ_X = 70, HQ_FRONT_X = 130;
export const OPP_HQ_X = 890, OPP_HQ_FRONT_X = 830;
export const ALLY_HOLD_X = 230;
export const MINE_X = 170, HOUSE_X = 110, BARRACKS_X = 230;
export const MAX_ALLIES = 8;

// phase: 'menu' | 'battle' | 'win' | 'lose'   stance: 'defend' | 'attack'
export const G = {
  eraIdx: -1, era: null, phase: 'menu', stance: 'defend', gold: 0, t: 0, shake: 0,
  hq: { hp: 0, maxHp: 0 }, oppHq: { hp: 0, maxHp: 0 },
  miners: { total: 0, atMine: 0 }, train: { queue: [] },
  enemySpawnT: 0, bossSpawned: false,
};
export const troops = [];  // { side:'ally'|'enemy', x, hp, maxHp, dmg, reach, spd, name, look, walk }
```

`projs`, `PROJ_SPEED`, `updateProjs`, `drawProj` bị xoá hoàn toàn — hệ quả trực tiếp của
việc xoá tháp canh (nhà sản xuất đạn duy nhất). Không còn đơn vị nào trong spec này bắn đạn
tầm xa; cung thủ/nỏ thủ vẫn chỉ có `reach` cận chiến như dữ liệu gốc hiện tại (hành vi có sẵn,
không đổi).

Test tối thiểu: `startEra(0)` khởi tạo `G.phase === 'battle'`, `G.hq.hp === G.hq.maxHp`,
`G.oppHq.hp === G.oppHq.maxHp`, `G.stance === 'defend'`, `G.miners.total === 0`,
`troops.length === 0`.

## Hệ thống 2 — Kinh tế chủ động: Mỏ vàng + thợ mỏ

`buildings.js` thay toàn bộ nội dung cũ. API mới:

```js
export function trainMiner() {
  if (G.phase !== 'battle') return false;
  if (G.miners.total >= G.era.maxMiners) return false;
  if (G.gold < G.era.minerCost) return false;
  G.gold -= G.era.minerCost;
  G.train.queue.push({ kind: 'miner', t: G.era.minerTrainTime });
  return true;
}
export function assignMinerToMine() {
  if (G.miners.atMine >= G.miners.total) return false;
  G.miners.atMine++; return true;
}
export function unassignMinerFromMine() {
  if (G.miners.atMine <= 0) return false;
  G.miners.atMine--; return true;
}
export function updateMineIncome(dt) { G.gold += G.miners.atMine * G.era.mine.perMinerRate * dt; }
```

Thợ mỏ huấn luyện xong (`train.queue` tick về 0, xem Hệ thống 3 cho hàng chờ dùng chung) thì
`G.miners.total++` nhưng **không** tự gán vào mỏ (`atMine` không đổi) — người chơi phải bấm
gán thủ công, đúng thiết kế "đào vàng chủ động".

`data.js` mỗi era thêm: `mine: { perMinerRate }`, `minerCost`, `minerTrainTime`, `maxMiners`.

Test tối thiểu: không gán thợ vào mỏ → `G.gold` không tăng qua `updateMineIncome(dt)`; gán 1
thợ → vàng tăng đúng `perMinerRate * dt`; `trainMiner()` thất bại khi `gold` không đủ hoặc
`miners.total >= maxMiners`; `assignMinerToMine()` thất bại khi không còn thợ rảnh.

## Hệ thống 3 — Huấn luyện lính (Doanh trại) + hàng chờ dùng chung

Hàng chờ huấn luyện (`G.train.queue`) dùng chung cho thợ mỏ và lính, xử lý tuần tự (chỉ 1
mục được train cùng lúc, giống trại lính cũ chỉ có 1 timer):

```js
export function trainTroop(troopTypeId) {
  if (G.phase !== 'battle') return false;
  const def = G.era.troopTypes.find(t => t.id === troopTypeId);
  if (!def || G.gold < def.cost) return false;
  const alive = troops.filter(u => u.side === 'ally').length;
  if (alive + G.train.queue.filter(q => q.kind === 'troop').length >= MAX_ALLIES) return false;
  G.gold -= def.cost;
  G.train.queue.push({ kind: 'troop', t: def.trainTime, troopTypeId });
  return true;
}
export function updateTrainQueue(dt) {
  if (!G.train.queue.length) return;
  const head = G.train.queue[0];
  head.t -= dt;
  if (head.t > 0) return;
  G.train.queue.shift();
  if (head.kind === 'miner') { G.miners.total++; return; }
  const def = G.era.troopTypes.find(t => t.id === head.troopTypeId);
  spawnTroop('ally', def);
}
```

`spawnTroop('ally', def)` (trong `troops.js`) đặt lính mới tại `HQ_FRONT_X + 10`, các field
khác giữ như cũ (`hp,maxHp,dmg,reach,spd,name,look,walk:0`), không còn tham số `lane`.

`flow.js`: bấm Doanh trại mở bảng chọn `G.era.troopTypes` (tái dùng cấu trúc `troopTypes` có
sẵn, không đổi tên field so với hiện tại ngoại trừ `spawnCost → cost`, `spawnEvery →
trainTime`).

Test tối thiểu: `trainTroop('t0')` trừ đúng vàng, đẩy vào `train.queue`; sau khi
`updateTrainQueue` tick đủ `trainTime` thì `troops` có thêm 1 lính `side==='ally'`; thất bại
khi vàng không đủ hoặc đã đạt `MAX_ALLIES`.

## Hệ thống 4 — Thế trận Phòng thủ/Tấn công cho quân ta

```js
export function setStance(stance) { if (stance === 'defend' || stance === 'attack') G.stance = stance; }
```

`updateTroops(dt)` (viết lại trong `troops.js`): với mỗi lính ta (`side==='ally'`),
mục tiêu x phụ thuộc `G.stance`:

- `'defend'`: mục tiêu = `ALLY_HOLD_X`. Nếu có địch trong tầm `reach` → đứng đánh tại chỗ
  (không tiến thêm). Nếu không có địch trong tầm và `x !== ALLY_HOLD_X` → di chuyển về
  `ALLY_HOLD_X` (hướng `Math.sign(ALLY_HOLD_X - x)`).
- `'attack'`: mục tiêu = `OPP_HQ_FRONT_X`. Nếu có địch trong tầm → đứng đánh tại chỗ. Nếu
  không và `x < OPP_HQ_FRONT_X` → tiến `+spd*dt`. Nếu `x >= OPP_HQ_FRONT_X` và không có địch
  chặn trong tầm → gây `dmg*dt` lên `G.oppHq.hp` (y hệt công thức địch gây sát thương lên
  `G.hq.hp` khi áp sát, xem Hệ thống 1 của plan cũ `troops.js:39`).

Lính địch luôn hành vi "tấn công" cố định (xem Hệ thống 5), không đọc `G.stance`.

Test tối thiểu: lính ta ở thế Phòng thủ với địch ngoài tầm → di chuyển về đúng hướng
`ALLY_HOLD_X`; đổi sang Tấn công giữa trận → lính đổi hướng tiến về `OPP_HQ_FRONT_X` ngay
khung hình kế (không cần đợi); lính ta tới `OPP_HQ_FRONT_X` không có địch chặn → `oppHq.hp`
giảm đúng `dmg*dt`; có địch trong tầm → đứng đánh, không tiến thêm bất kể thế trận.

## Hệ thống 5 — AI địch: tự sinh quân liên tục + tướng giặc theo mốc giờ

Thay `waves.js` bằng `enemy.js`:

```js
export function updateEnemySpawns(dt) {
  if (G.phase !== 'battle') return;
  G.enemySpawnT -= dt;
  const alive = troops.filter(u => u.side === 'enemy').length;
  if (G.enemySpawnT <= 0 && alive < G.era.enemy.maxAlive) {
    G.enemySpawnT = G.era.enemy.spawnEvery;
    spawnTroop('enemy', G.era.enemy);
  }
  if (!G.bossSpawned && G.t >= G.era.bossAt) { G.bossSpawned = true; spawnTroop('enemy', bossDef(G.era)); }
}
```

Lính địch luôn tiến về `HQ_FRONT_X` (hướng `-1`), đứng đánh khi có lính ta trong tầm, gây
`dmg*dt` lên `G.hq.hp` khi tới `HQ_FRONT_X` mà không bị chặn — **giữ nguyên y hệt logic hiện
có** trong `troops.js` hiện tại cho phía `enemy` (không đổi), chỉ bỏ điều kiện theo `lane`.

`data.js` mỗi era thêm vào `enemy`: `spawnEvery`, `maxAlive`; thêm `bossAt` (giây) cấp era.
Bỏ hẳn `waves` array và `bossFinal`.

Test tối thiểu: không có địch, `t` chưa qua `spawnEvery` → không sinh thêm; qua mốc
`spawnEvery` và `alive < maxAlive` → sinh đúng 1 địch; đã đạt `maxAlive` → không sinh thêm;
`t >= bossAt` lần đầu → sinh đúng 1 tướng giặc, lần sau không sinh thêm
(`G.bossSpawned === true`) dù `t` tiếp tục tăng. Dùng `pause(true)`/`pause(false)` quanh thao
tác set `G.t` thủ công để tránh đua với vòng lặp sống, theo đúng quy ước đã áp dụng cho boss
ở `luy-tre-lang`.

## Hệ thống 6 — Thắng/thua: phá căn cứ thay vì sống sót qua sóng

```js
export function checkEnd() {
  // Thua kiểm tra trước thắng: nếu cả 2 căn cứ cùng về 0 trong cùng 1 khung hình, tính thua.
  if (G.hq.hp <= 0 && G.phase === 'battle') { G.hq.hp = 0; G.phase = 'lose'; showResult(); }
  else if (G.oppHq.hp <= 0 && G.phase === 'battle') { G.phase = 'win'; S.maxEra = Math.max(S.maxEra, G.eraIdx + 1); save(); showResult(); }
}
```

Bỏ hẳn `G.wave`, `finishWave`, `armStakes`, điều kiện thắng theo số đợt. `showResult()`
trong `flow.js` cập nhật câu chữ cho phù hợp (không còn "đã thắng N đợt", thay bằng "đã phá
thành địch"/"mất thành"). `S.maxEra`/`unlocked(i)` trong `save.js` **không đổi API** — vẫn
đọc/ghi y hệt, chỉ nơi gọi `save()` đổi điều kiện kích hoạt.

Test tối thiểu: ép `G.oppHq.hp = 0` rồi gọi `checkEnd()` → `G.phase === 'win'` và
`S.maxEra` tăng đúng; ép `G.hq.hp = 0` → `G.phase === 'lose'`; gọi `checkEnd()` khi cả hai
HP còn dương → `G.phase` không đổi.

## Hệ thống 7 — HUD/UI + đồ hoạ căn cứ địch đối xứng

- `index.html`: bỏ lưới 6 ô `plots`, `btnHqUp`, `btnStartWave`. Thêm: nút `btnMine+`
  (gán thợ vào mỏ), `btnMine-` (rút thợ), nút `btnTrainHouse` (huấn luyện thợ mỏ, mở bảng
  xác nhận chi phí), nút `btnBarracks` (mở bảng chọn lính theo `troopTypes`), 1 nút chuyển
  thế trận `btnStance` (hiển thị "Phòng thủ"/"Tấn công", bấm gọi `setStance`).
- `render.js`: vẽ `oppHq` đối xứng gương với `hq` (lật trục x quanh `OPP_HQ_X`), thanh máu
  2 căn cứ, HUD vàng/số thợ mỏ (`atMine/total`)/thế trận hiện tại thay cho "Đợt N/5". Xoá
  `drawProj`/vòng lặp `projs.forEach` (không còn đạn, xem Hệ thống 1).
- `art.js`: `drawHQ` thêm tham số `flip` (mặc định `false`) để vẽ căn cứ địch quay mặt
  ngược lại ta (lật toạ độ `dx` khi vẽ cờ/mái theo `flip ? -1 : 1`). Xoá `drawBuilding` các
  nhánh `tower`/`stake` cùng các hàm `drawTower`/`drawStakes` (không còn dùng). Giữ nguyên
  `ERA_ART`, `drawCamp`-style (đổi tên phù hợp Doanh trại/Nhà dân/Mỏ vàng) để giữ phong cách
  hình ảnh làng Việt theo thời kỳ.
- HQ không còn cấp độ nâng cấp (`lvl`) — vẽ cố định ở cấp đẹp nhất (tương đương `lvl=3` cũ)
  cho cả 2 căn cứ, bỏ `btnHqUp`/`canUpgradeHQ`/`upgradeHQ`.

Test tối thiểu (Playwright, parent verify bằng screenshot thủ công sau khi fork báo cáo):
HUD hiển thị đúng thế trận hiện tại và đổi nhãn khi bấm `btnStance`; thanh máu `oppHq` hiển
thị và giảm khi `oppHq.hp` giảm; không còn phần tử `plots`/`btnHqUp`/`btnStartWave` trong
DOM.

## Thứ tự thực thi

1 (nền tảng state/data) → 2 (kinh tế mỏ vàng, cần `train.queue` rỗng từ Hệ 1 + field
`minerCost/minerTrainTime/maxMiners` từ Hệ 1) → 3 (huấn luyện lính, dùng chung
`train.queue` với Hệ 2) → 4 (thế trận, cần lính đã có thể được tạo ra từ Hệ 3 để test di
chuyển) → 5 (AI địch, độc lập với 2-4 nhưng cần `troops`/`spawnTroop` từ Hệ 1/3) → 6
(thắng/thua, cần `oppHq.hp` giảm được từ Hệ 4 và `hq.hp` giảm được từ Hệ 5) → 7 (UI/đồ hoạ,
nối tất cả nút bấm tới API của Hệ 2-6, chỉ làm sau cùng vì phụ thuộc toàn bộ logic).
