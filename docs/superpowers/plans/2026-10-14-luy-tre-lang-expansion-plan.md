# Lũy Tre Làng — Nâng cấp toàn diện (7 hệ thống) Implementation Plan

> **Lưu ý về cách thực thi:** dự án này không dùng worktree/git riêng cho
> từng plan (toàn bộ phiên làm việc commit thẳng vào `main`, đã được
> người dùng chấp nhận xuyên suốt). Mỗi Task dưới đây được giao cho 1
> fork agent (subagent_type: "fork") thay vì tự thực thi từng bước nhỏ
> tại chỗ — mẫu đã dùng thành công cho boss/biome/đồ hoạ đợt trước.
> Người điều phối tự chạy lại `tests/test_luy_tre_lang.py` +
> `tests/test_platform.py` và xem ảnh chụp màn hình trước khi commit
> từng Task, rồi mới dispatch Task tiếp theo (tuần tự, không song song,
> vì các Task đều sửa chung nhiều file trong `games/luy-tre-lang/`).

**Goal:** Nâng cấp toàn diện game `games/luy-tre-lang/` với 7 hệ thống
mới: nông nghiệp, thú nuôi, biome Đầm Lầy, boss thứ 2, hệ kỹ năng, giáp
trang bị, NPC thợ rèn.

**Architecture:** Mỗi hệ thống thêm field mới vào `G` (state), hàm xử lý
riêng trong file `js/*.js` tương ứng (tái dùng file hiện có:
`data.js`/`world.js`/`mobs.js`/`player.js`/`state.js`/`render.js`/`art.js`/
`main.js`), test Playwright qua `tests/harness.py` theo mẫu 28 test hiện
có.

**Tech Stack:** ES module thuần, Canvas 2D 960×540, không build step,
Playwright (Python) cho test.

**Spec:** `docs/superpowers/specs/2026-10-14-luy-tre-lang-expansion-design.md`

## Global Constraints

- Không build step, ES module thuần, Canvas 2D 960×540, không WebGL.
- Chỉ sửa `games/luy-tre-lang/**` + `tests/test_luy_tre_lang.py`. Không
  đổi `platform/games.js` hay bất kỳ file nào trong `platform/`.
- Giữ nguyên toàn bộ test hiện có xanh sau mỗi Task (tăng dần: 28 →
  35+ → ... theo số test mới mỗi hệ thống).
- `net::ERR_NETWORK_CHANGED` là flake môi trường đã biết — rerun 3-5 lần
  nếu gặp.
- STORE_KEY giữ nguyên `'luy-tre-lang-v1'`; trường save mới phải có giá
  trị mặc định hợp lý khi tải save cũ thiếu trường đó.
- Vật liệu/hình ảnh giữ màu sắc làng quê Việt Nam, vẽ bằng
  `platform/art/draw.js` (`rr`, `ell`, `shade`) + `drawItemIcon` đã có,
  không dùng khối màu phẳng mới.
- Debug hook: field/hàm mới phải được expose qua `exposeGlobals()` trong
  `js/main.js` để test đọc/ghi được.
- Mỗi Task: KHÔNG git add/commit/push trong fork — người điều phối tự
  làm sau khi kiểm tra lại test + ảnh chụp màn hình.

## Review Focus

(xem đầy đủ trong spec — nhắc lại 5 điểm quan trọng nhất)
1. Save/load tương thích ngược khi thêm field mới.
2. Icon/texture mới không được là khối màu phẳng.
3. HUD không chồng chéo ở viewport di động 360px dù nhiều thanh trạng
   thái mới (XP/level, giáp, boss2...).
4. Vòng lặp chơi không bị kẹt trạng thái (ví dụ cưỡi trâu không xuống
   được, cây trồng tích luỹ vô hạn).
5. Hai NPC (thương nhân/thợ rèn) không xung đột điều kiện spawn nhà.

---

### Task 1: Nông nghiệp

**Files:**
- Modify: `games/luy-tre-lang/js/data.js` (thêm `TILE.FARMLAND`, 3 hạt
  giống + 3 nông sản vào `ITEMS`, thêm vào `SHOP_BUY`/`SHOP_SELL`)
- Modify: `games/luy-tre-lang/js/world.js` (hàm cày đất, kiểm tra
  `FARMLAND` trống)
- Modify: `games/luy-tre-lang/js/state.js` (thêm `G.crops = []`, lưu/tải)
- Modify: `games/luy-tre-lang/js/player.js` (hàm `tillSoil(c, r)`,
  `plantCrop(c, r, seedItem)`, `harvestCrop(c, r)`)
- Modify: `games/luy-tre-lang/js/art.js` (vẽ `FARMLAND` + 4 giai đoạn cây)
- Modify: `games/luy-tre-lang/js/render.js` (vẽ `G.crops` theo giai đoạn)
- Modify: `games/luy-tre-lang/js/main.js` (phím `T` cày đất, hotbar bán
  nông sản dùng icon có sẵn)
- Test: `tests/test_luy_tre_lang.py` (thêm ~6 test mô tả trong spec Hệ 1)

**Interfaces:**
- Consumes: `TOOL_POWER`/hotbar hiện có (không cần công cụ mới, chỉ cần
  đang cầm 1 cuốc bất kỳ để cày), `G.day` hiện có để tính giai đoạn cây.
- Produces: `TILE.FARMLAND` (dùng ở Task 3 không bắt buộc nhưng phải
  không phá `SOLID`/`HOUSE_BOUND` hiện có), `G.crops` (mảng
  `{c,r,kind,plantedDay}`) — Task sau không cần field này nhưng không
  được đặt trùng tên field mới nào khác là `crops`.

- [ ] **Bước 1:** Dispatch 1 fork (model mặc định phiên, không chỉ định
  model khác) với bản tóm tắt Hệ thống 1 từ spec + đường dẫn spec +
  yêu cầu TDD, scope, không git, báo cáo <280 từ, chụp ảnh world lúc có
  cây ở cả 4 giai đoạn.
- [ ] **Bước 2:** Nhận báo cáo, tự chạy `tests/test_luy_tre_lang.py` và
  `tests/test_platform.py` tại chỗ (không tin báo cáo), rerun nếu gặp
  flake.
- [ ] **Bước 3:** Tự chụp/xem ảnh màn hình xác nhận cây trồng hiển thị
  đúng giai đoạn, không phải khối màu phẳng.
- [ ] **Bước 4:** Commit với message riêng cho Task 1.

### Task 2: Thú nuôi

**Files:**
- Modify: `games/luy-tre-lang/js/data.js` (`ANIMAL_DEF`, `MAX_ANIMALS`,
  `ANIMAL_SPAWN_EVERY`, item `trung`/`thit_lon` vào `ITEMS`+`SHOP_SELL`)
- Modify: `games/luy-tre-lang/js/mobs.js` hoặc file mới
  `games/luy-tre-lang/js/animals.js` (spawn/update/tame/ride)
- Modify: `games/luy-tre-lang/js/state.js` (`G.pets = []`, `G.riding = false`)
- Modify: `games/luy-tre-lang/js/player.js` (xử lý `MOVE_SPEED` nhân khi
  `G.riding`)
- Modify: `games/luy-tre-lang/js/render.js`, `js/art.js` (vẽ gà/lợn/trâu)
- Modify: `games/luy-tre-lang/js/main.js` (phím `F` context-sensitive:
  NPC gần → giao thương như cũ; thú gần + đúng thức ăn → thuần/cưỡi)
- Test: thêm ~6 test mô tả trong spec Hệ 2

**Interfaces:**
- Consumes: `lua`/`rau`/`dua` từ Task 1 (item id phải khớp chính xác:
  `lua`, `rau`, `dua`) làm thức ăn thuần hoá; `biomeAt()` đã có (từ đợt
  nâng cấp trước) để giới hạn spawn ở Đồng Bằng.
- Produces: `G.pets`, `G.riding` — Task 6 (giáp) không đụng tới nhưng
  không được đặt trùng field `riding`/`pets` cho mục đích khác.

- [ ] **Bước 1:** Dispatch fork với tóm tắt Hệ thống 2 + spec + lưu ý
  item thức ăn phải đúng id từ Task 1 đã commit.
- [ ] **Bước 2-4:** giống Task 1 (tự test, tự xem ảnh thú/cưỡi trâu,
  commit).

### Task 3: Biome Đầm Lầy

**Files:**
- Modify: `games/luy-tre-lang/js/data.js` (`TILE.WATER`, `TILE.REED`,
  tên biome thứ 4)
- Modify: `games/luy-tre-lang/js/world.js` (chia lại 4 dải cột, sinh
  `WATER`/`REED` ở dải Đầm Lầy, `biomeAt()` trả đúng 4 giá trị)
- Modify: `games/luy-tre-lang/js/player.js` (giảm `MOVE_SPEED`/`JUMP_V`
  hiệu dụng khi đứng trong `WATER`)
- Modify: `games/luy-tre-lang/js/render.js`, `js/art.js` (màu trời/đồi
  xa Đầm Lầy, vẽ `WATER`/`REED`)
- Test: thêm ~3 test mô tả trong spec Hệ 3

**Interfaces:**
- Consumes: `biomeAt(col)` đã tồn tại (đợt trước) — SỬA chữ ký/nội dung
  để trả 4 dải thay vì 3, không đổi tên hàm.
- Produces: `TILE.WATER` — Task 4 (boss2 Đầm Lầy) không phụ thuộc kỹ
  thuật vào tile này, chỉ phụ thuộc chủ đề/tên gọi.

- [ ] **Bước 1-4:** như Task 1, fork với tóm tắt Hệ thống 3 + spec + lưu
  ý sửa `biomeAt()` không đổi chữ ký, cập nhật lại test biome cũ
  (`test_biome_bands_match_expected`) cho đúng 4 dải thay vì 3.

### Task 4: Boss thứ 2 "Thần Đầm Lầy"

**Files:**
- Modify: `games/luy-tre-lang/js/data.js` (`MOB_DEF.boss_than_dam`,
  `BOSS2_EVERY_DAYS = 15`, item `ngoc_dam_lay`)
- Modify: `games/luy-tre-lang/js/mobs.js` (`maybeSpawnBoss2`, triệu hồi
  lính phụ, `G.boss2SpawnedDay`)
- Modify: `games/luy-tre-lang/js/render.js` (thanh máu boss đổi tên/màu
  theo loại boss đang sống), `js/art.js` (hình vẽ boss2)
- Test: thêm ~4 test mô tả trong spec Hệ 4

**Interfaces:**
- Consumes: cơ chế `maybeSpawnBoss`/`G.bossSpawnedDay` của boss 1 (đợt
  trước) làm mẫu, không sửa boss 1.
- Produces: `ngoc_dam_lay` (item id chính xác) — Task 6 cần id này khớp
  tuyệt đối cho công thức giáp tier 5.

- [ ] **Bước 1-4:** như trên, fork với tóm tắt Hệ thống 4 + spec + lưu ý
  ngày bội số 15 ưu tiên boss2 (không spawn cả 2 boss cùng đêm).

### Task 5: Hệ kỹ năng

**Files:**
- Modify: `games/luy-tre-lang/js/data.js` (bảng XP theo hành động, công
  thức ngưỡng lên cấp)
- Modify: `games/luy-tre-lang/js/state.js` (`G.xp, G.level,
  G.skillPoints, G.skills`)
- Modify: `games/luy-tre-lang/js/player.js` (cộng XP khi đào/giết quái/
  nhận quest, áp dụng hiệu ứng kỹ năng vào `weaponDmg()`/`HARDNESS`
  hiệu dụng/giá bán)
- Modify: `games/luy-tre-lang/js/main.js` (panel "Kỹ năng" mới)
- Test: thêm ~5 test mô tả trong spec Hệ 5

**Interfaces:**
- Consumes: `weaponDmg()`, `TOOL_POWER`, `SHOP_SELL` giá bán hiện có —
  sửa các hàm này để nhân thêm hệ số kỹ năng thay vì tạo bản sao.
- Produces: `G.skills.warrior[]`, `G.skills.miner[]` — không Task nào
  khác phụ thuộc, nhưng tên field phải khớp để tránh xung đột nếu Task
  6 cũng muốn đọc trạng thái kỹ năng khi tính damage giáp (không bắt
  buộc nhưng nên cộng dồn đúng thứ tự: giáp giảm dmg SAU khi kỹ năng
  Chiến Binh đã tăng % sát thương gây ra — không liên quan chiều nhận
  dmg nên không xung đột).

- [ ] **Bước 1-4:** như trên, fork với tóm tắt Hệ thống 5 + spec.

### Task 6: Giáp trang bị

**Files:**
- Modify: `games/luy-tre-lang/js/data.js` (5 item giáp vào `ITEMS`, 4
  công thức đầu vào `RECIPES`, % giảm dmg mỗi loại)
- Modify: `games/luy-tre-lang/js/state.js` (`G.armor = null`)
- Modify: `games/luy-tre-lang/js/mobs.js` (`damagePlayer()` áp dụng %
  giảm theo `G.armor`)
- Modify: `games/luy-tre-lang/js/main.js` (phím `R` mặc/cởi giáp)
- Modify: `games/luy-tre-lang/js/render.js` (icon giáp cạnh thanh máu)
- Test: thêm ~4 test mô tả trong spec Hệ 6

**Interfaces:**
- Consumes: `ngoc_dam_lay` từ Task 4 (id chính xác) cho công thức
  `giap_ngoc_dam` — nhưng công thức này KHÔNG vào `RECIPES` chung, để
  dành cho Task 7 (thợ rèn) thêm riêng.
- Produces: `G.armor`, hàm `armorReduction()` — Task 7 không cần nhưng
  không được trùng tên.

- [ ] **Bước 1-4:** như trên, fork với tóm tắt Hệ thống 6 + spec + lưu ý
  công thức `giap_ngoc_dam` chỉ định nghĩa DATA (trong `ITEMS`/một danh
  sách công thức riêng tên ví dụ `BLACKSMITH_RECIPES`) nhưng UI chế tạo
  nó thuộc Task 7.

### Task 7: NPC thợ rèn

**Files:**
- Modify: `games/luy-tre-lang/js/data.js` (`TILE.ANVIL`, công thức
  `anvil` vào `RECIPES`, danh sách `BLACKSMITH_RECIPES = [kiem_ngoc,
  giap_ngoc_dam]`, xoá `kiem_ngoc` khỏi `RECIPES` chung)
- Modify: `games/luy-tre-lang/js/world.js` (`checkHouse` biến thể nhận
  diện anvil, hàm `findHouse` trả thêm loại nhà tìm thấy: thương nhân
  hay thợ rèn)
- Modify: `games/luy-tre-lang/js/state.js` (`G.blacksmith` tương tự
  `G.npc` hiện có, hoặc mở rộng `G.npc.kind`)
- Modify: `games/luy-tre-lang/js/main.js` (panel "Thợ rèn" riêng dùng
  `BLACKSMITH_RECIPES`)
- Modify: `games/luy-tre-lang/js/render.js`, `js/art.js` (hình NPC thợ
  rèn khác thương nhân)
- Test: thêm ~4 test mô tả trong spec Hệ 7

**Interfaces:**
- Consumes: `giap_ngoc_dam` data từ Task 6, `ngoc_quy`/`kiem_ngoc` đã có
  từ đợt boss 1 trước, `checkHouse`/`findHouse` hiện có (đợt trước).

- [ ] **Bước 1-4:** như trên, fork với tóm tắt Hệ thống 7 + spec + lưu ý
  đây là Task cuối, sau khi xong chạy lại TOÀN BỘ
  `tests/test_luy_tre_lang.py` (dự kiến ~55 bài) + `tests/test_platform.py`
  lần cuối trước khi báo cáo hoàn tất với người dùng.

---

## Ghi chú thực thi

- Thứ tự Task là bắt buộc (xem phần "Thứ tự thực thi" trong spec) vì
  Task sau phụ thuộc item/hàm Task trước tạo ra.
- Nếu 1 fork báo BLOCKED/NEEDS_CONTEXT: đọc lý do, bổ sung ngữ cảnh từ
  spec, dispatch lại cùng Task (không chuyển Task tiếp theo).
- Nếu phát hiện xung đột giữa mô tả spec và thực tế code hiện có khi
  review diff của 1 fork: tự quyết theo nguyên tắc "giữ test hiện có
  xanh" là ưu tiên cao nhất, ghi chú quyết định trong message báo cáo
  người dùng ở cuối Task đó.
- Sau khi cả 7 Task xong và commit: báo cáo tổng kết cho người dùng
  (danh sách tính năng, tổng số test, nhắc push).
