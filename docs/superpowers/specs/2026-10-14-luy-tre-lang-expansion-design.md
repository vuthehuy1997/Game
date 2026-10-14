# Lũy Tre Làng — Nâng cấp toàn diện (thiết kế)

**Ngày:** 2026-10-14
**Trạng thái:** đã chốt với người dùng qua hỏi đáp trong phiên làm việc.

## Bối cảnh

Game `games/luy-tre-lang/` (sandbox đào-xây-chế tạo kiểu Terraria, bối cảnh làng
quê Việt Nam) đã có: world 160×90 sinh theo seed, 4 tầng quặng, đào/đặt
block, 14 công thức chế tạo, chu kỳ ngày/đêm, 2 loại quái đêm, 1 boss
("Vua Quái Rừng", đêm mỗi 5 ngày), NPC thương nhân (mua/bán + 3 nhiệm vụ),
3 biome theo dải cột (Đồng Bằng/Rừng Tre Rậm/Núi Đá Vôi), texture tile +
icon vật phẩm vẽ bằng canvas. Lưu game nén RLE qua `STORE_KEY =
'luy-tre-lang-v1'`.

Người dùng yêu cầu nâng cấp toàn diện tiếp theo, đã chốt phạm vi: làm cả
7 hệ thống dưới đây, mỗi hệ thống giao cho 1 fork riêng, làm tuần tự,
người điều phối (tôi) tự kiểm tra test + ảnh chụp màn hình trước khi
commit từng hệ thống — đúng quy trình đã dùng cho boss/biome/đồ hoạ đợt
trước.

## Global Constraints

- Không build step, ES module thuần, Canvas 2D 960×540, không WebGL.
- Chỉ sửa trong `games/luy-tre-lang/` + `tests/test_luy_tre_lang.py`.
  Không đổi `platform/games.js` (đăng ký/vị trí game giữ nguyên).
- Mỗi hệ thống giữ nguyên toàn bộ test hiện có (28 bài) xanh, cộng thêm
  test mới cho tính năng của hệ thống đó.
- `net::ERR_NETWORK_CHANGED` là flake môi trường đã biết — rerun 3-5 lần
  nếu gặp, không phải bug thật nếu pass sạch ít nhất 1 lần không đổi code.
- STORE_KEY giữ nguyên `'luy-tre-lang-v1'`; mọi trường mới trong save
  phải có giá trị mặc định hợp lý khi tải save cũ (không có trường mới)
  để không vỡ `test_save_and_load_roundtrip` / `test_old_save_keeps_progress`.
- Vật liệu/hình ảnh tiếp tục mang màu sắc làng quê Việt Nam (tre, gốm,
  đồng, lúa, trâu, gà, lợn...), không lệch sang fantasy chung chung.
- Debug/test hook: mọi state mới cần expose qua `exposeGlobals()` để
  Playwright test đọc/ghi được, theo đúng mẫu đang dùng trong `js/main.js`.

## Review Focus

1. Save/load tương thích ngược: save cũ (trước khi có 7 hệ thống mới)
   phải tải được mà không lỗi console, các trường mới mặc định hợp lý.
2. Icon/texture mới (giáp, thú, cây trồng, NPC thợ rèn, boss 2) không
   được chỉ là khối màu phẳng — phải nhất quán với chất lượng đồ hoạ đã
   nâng cấp đợt trước (texture/icon riêng biệt từng loại).
3. HUD không bị chồng chéo khi nhiều thanh trạng thái cùng hiện (máu
   người chơi, máu boss, XP/level, trang bị) — đặc biệt ở viewport di
   động 360px.
4. Vòng lặp chơi không bị phá vỡ: ví dụ cưỡi trâu xong không được kẹt
   trạng thái không xuống được; cây trồng không mọc vô hạn gây tràn bộ
   nhớ nếu người chơi để qua nhiều ngày.
5. Hai NPC (thương nhân cũ + thợ rèn mới) không được xung đột điều kiện
   spawn nhà (ví dụ cả hai cùng spawn trong 1 nhà, hoặc nhà có đe cả
   torch lẫn anvil thì phải có quy tắc rõ ràng ưu tiên ai).

---

## Hệ thống 1 — Nông nghiệp

- Tile mới `FARMLAND` (đất canh tác): tạo bằng cách người chơi đứng cạnh
  ô `DIRT` có `AIR` phía trên, chọn công cụ cuốc bất kỳ trong hotbar, và
  bấm phím mới `T` ("cày đất") nhắm vào ô đó → chuyển `DIRT` → `FARMLAND`
  (không tiêu hao vật phẩm, chỉ cần có cuốc trong hotbar đang chọn).
- 3 loại hạt giống mới (item, không đào được, chỉ mua): `hat_lua` (hạt
  lúa), `hat_rau` (hạt rau), `hat_dua` (hạt dưa) — thêm vào `SHOP_BUY`
  với giá 2/3/4 vàng.
- Trồng: chọn hạt giống trong hotbar, bấm chuột phải (place mode) nhắm
  vào `FARMLAND` trống → thêm 1 bản ghi vào `G.crops` (mảng):
  `{ c, r, kind, plantedDay }`. `FARMLAND` đó không đặt được cây khác
  cho tới khi thu hoạch.
- Lớn dần theo ngày: mỗi crop có 4 giai đoạn hiển thị (0=vừa trồng,
  1,2,3=chín), mốc `G.day - plantedDay` là 0/1/2/>=3 tương ứng 4 giai
  đoạn (lúa/rau/dưa dùng chung mốc số ngày để đơn giản).
- Thu hoạch: ở giai đoạn 3 (chín), bấm chuột trái (giống `hitTile`) vào
  ô đó → nhận 2-3 đơn vị nông sản tương ứng (`lua`/`rau`/`dua`, số
  lượng ngẫu nhiên nhẹ 2 hoặc 3), xoá bản ghi khỏi `G.crops`, tile vẫn
  là `FARMLAND` (trồng lại được ngay, không cần cày lại).
- 3 item nông sản mới `lua`, `rau`, `dua` thêm vào `SHOP_SELL` (giá lần
  lượt 2/3/4 vàng) và dùng làm thức ăn thuần hoá thú ở Hệ thống 2.
- `G.crops` phải được lưu/tải trong save (mảng JSON thường, không cần
  nén RLE vì số lượng nhỏ).
- Test tối thiểu: cày đất chuyển đúng tile; trồng hạt tiêu hao đúng 1
  hạt giống; không trồng được lên `FARMLAND` đã có cây; crop lớn đúng
  giai đoạn theo số ngày trôi qua (set `G.day` qua debug rồi kiểm tra
  giai đoạn hiển thị/trạng thái); thu hoạch ở giai đoạn chín cho đúng
  nông sản và xoá cây, chưa chín thì không thu hoạch được; save/load giữ
  đúng `G.crops`.

## Hệ thống 2 — Thú nuôi

- 3 loại thú mới trong `ANIMAL_DEF`: `ga` (gà, hp 6, không tấn công),
  `lon` (lợn, hp 10), `trau` (trâu, hp 20) — spawn CHỈ ban ngày, CHỈ ở
  biome Đồng Bằng, đi lang thang ngang (giống logic `updateMobs` nhưng
  không gây sát thương người chơi), tối đa 4 con cùng lúc
  (`MAX_ANIMALS`), spawn mỗi ví dụ 6 giây nếu chưa đủ (`ANIMAL_SPAWN_EVERY`).
- Thuần hoá: đứng gần thú (bán kính giống `BENCH_RADIUS`), đang chọn
  đúng thức ăn trong hotbar (gà↔`lua`, lợn↔`rau`, trâu↔`dua`), bấm phím
  `F` (giống phím giao thương hiện tại — nhưng chỉ kích hoạt thuần hoá
  khi gần thú thay vì NPC) → tiêu 1 thức ăn, đánh dấu con thú đó
  `tamed: true`, thêm vào `G.pets`.
- Thú đã thuần không bị mất khi qua đêm (khác quái thường), đứng yên
  loanh quanh gần nơi được thuần (không đi lang thang xa).
- Gà đã thuần: mỗi 20 giây thời gian thực sinh ra 1 vật phẩm `trung`
  (trứng) ngay tại vị trí gà, người chơi đi qua tự nhặt (giống cơ chế
  nhặt vật phẩm đào được).
- Lợn đã thuần: mỗi 30 giây sinh ra 1 `thit_lon` (thịt lợn) tương tự.
- Trâu đã thuần: người chơi đứng cạnh bấm `F` lần nữa để "cưỡi" (toggle
  `G.riding = true`), khi cưỡi `MOVE_SPEED` nhân 1.6, nhảy (`Space`) tự
  động xuống trâu (`G.riding = false`) rồi mới nhảy bình thường.
- 2 item mới `trung`, `thit_lon` thêm vào `SHOP_SELL` (giá 3/5 vàng).
- Test tối thiểu: thú chỉ spawn ban ngày và chỉ ở Đồng Bằng; thuần hoá
  tiêu đúng thức ăn và đổi trạng thái `tamed`; gà/lợn đã thuần sinh đúng
  vật phẩm sau đúng thời gian (dùng debug tua nhanh thời gian); cưỡi
  trâu tăng đúng tốc độ di chuyển và nhảy sẽ xuống trâu; save/load giữ
  đúng danh sách `G.pets` và trạng thái `tamed`.

## Hệ thống 3 — Biome Đầm Lầy / Sông Nước (biome thứ 4)

- Chia lại 160 cột thành 4 dải ~40 cột: Đồng Bằng, Rừng Tre Rậm, Đầm
  Lầy (mới), Núi Đá Vôi (giữ thứ tự trái→phải như liệt kê).
- Tile mới `WATER` (không `SOLID`, không đào được bằng cách thường —
  đào `WATER` không làm gì, chỉ chắn cảnh báo "không thể đào nước" nếu
  có log debug, không bắt buộc). Ở dải Đầm Lầy, mặt đất thấp hơn các
  biome khác (`surf()` trừ thêm hằng số cho dải này) và có các rãnh
  `WATER` nông rải rác ngay trên bề mặt (ví dụ cứ ~10 cột có 1 rãnh
  nước sâu 2 tile).
- Khi người chơi đứng trong tile `WATER` (vị trí chân trùng ô `WATER`):
  `MOVE_SPEED` hiệu dụng giảm còn 60%, `JUMP_V` giảm còn 70% (di chuyển
  ì ạch trong nước, không cần vật lý nổi phức tạp).
  Tre mọc thêm `REED` trang trí.
- Tile trang trí `REED` (bụi sậy): không `SOLID`, chỉ vẽ ở hàng mặt đất
  dải Đầm Lầy, không ảnh hưởng va chạm (xử lý giống cách vẽ `BAMBOO`
  hiện tại nhưng không đưa vào `SOLID`).
- Biome Đầm Lầy: màu trời/đồi xa riêng (tông xanh xám sương mù), tên
  hiển thị "Đầm Lầy" trên HUD giống 3 biome kia.
- Test tối thiểu: `biomeAt()` trả đúng cho cả 4 dải theo cột; đứng
  trong `WATER` giảm đúng tốc độ di chuyển (so sánh quãng đường đi được
  trong cùng 1 khoảng `dt` ở trong nước và ngoài nước); world sinh ra có
  ít nhất một số tile `WATER` trong dải Đầm Lầy.

## Hệ thống 4 — Boss thứ 2

- id `boss_than_dam`, tên "Thần Đầm Lầy". Thêm hằng số
  `BOSS2_EVERY_DAYS = 15` — xuất hiện đêm mỗi ngày bội số 15 (15, 30...),
  dùng chung cơ chế chống spawn 2 lần/đêm như boss 1 (field riêng
  `G.boss2SpawnedDay`).
- Chỉ số: HP 350, dmg thường 22, tốc độ 40, không có đòn lao (khác cơ
  chế boss 1): thay vào đó cứ 8 giây triệu hồi 1 `quai_rung` phụ (tối
  đa 3 con đang sống do boss này triệu hồi cùng lúc, đếm riêng không
  tính vào `MAX_MOBS` tổng, giống cách boss 1 không bị giới hạn
  `MAX_MOBS`).
- Giết được: +250 vàng, chắc chắn rơi 2 vật phẩm hiếm mới `ngoc_dam_lay`
  (Ngọc Đầm Lầy) — dùng cho công thức giáp tốt nhất ở Hệ thống 6.
- UI: thanh máu boss2 dùng chung vị trí/kiểu với boss 1 (chỉ 1 boss
  sống tại một thời điểm theo lịch ngày nên không xung đột hiển thị),
  tên hiển thị đổi theo đúng loại boss đang sống.
- Hình vẽ: khác biệt rõ với boss 1 (ví dụ tông xanh rêu/đầm lầy, có vây
  hoặc rong rêu quanh thân thay vì sừng).
- Test tối thiểu: spawn đúng ngày bội số 15, không trùng ngày với boss 1
  (ngày 15 chỉ spawn boss2, không spawn boss1 cùng lúc — coi bội số 15
  ưu tiên boss2, bội số 5 không phải 15 mới spawn boss1); triệu hồi lính
  phụ đúng chu kỳ và đúng giới hạn tối đa; giết boss2 cho đúng vàng +
  đúng số lượng `ngoc_dam_lay`.

## Hệ thống 5 — Hệ kỹ năng

- `G.xp`, `G.level` (bắt đầu 1), `G.skillPoints`. Nhận XP:
  đào quặng đồng/sắt/bạc/vàng +2/+3/+4/+6 (đào đất/đá/tre +0, không tính
  nguyên liệu thường); giết quái thường +5; giết boss +50; hoàn thành
  nhiệm vụ +10.
- Lên cấp: ngưỡng XP cần cho cấp tiếp theo = `level * 100` (cấp 1→2 cần
  100 XP tích luỹ, cấp 2→3 cần thêm 200, v.v., tích luỹ kiểu cộng dồn
  ngưỡng tăng dần). Lên cấp: `level += 1`, `skillPoints += 1`, dư XP giữ
  lại cộng dồn cho cấp sau (không mất XP dư).
- 2 nhánh, mỗi nhánh 3 bậc, phải mở tuần tự (bậc 2 cần đã mở bậc 1):
  - Chiến Binh: bậc1 `+10%` sát thương cận chiến; bậc2 `+20` HP tối đa;
    bậc3 giảm `HIT_COOLDOWN` còn 70% giá trị gốc.
  - Thợ Mỏ: bậc1 tốc độ đào `+20%` (giảm thời gian đào theo `TOOL_POWER`
    hiệu dụng tăng 20%); bậc2 `+15%` cơ hội rơi gấp đôi nguyên liệu khi
    đào; bậc3 bán nguyên liệu cho thương nhân được `+10%` vàng.
- UI: panel mới "Kỹ năng" (nút riêng cạnh nút Chế tạo), hiện XP/level
  hiện tại, số điểm kỹ năng còn lại, 2 cột nút theo nhánh, nút bậc chưa
  đủ điều kiện/đã hết điểm thì bị khoá (disabled).
- Lưu `G.xp, G.level, G.skillPoints, G.skills` (ví dụ
  `{ warrior: [false,false,false], miner: [false,false,false] }`) vào
  save.
- Test tối thiểu: đào quặng cộng đúng XP theo loại; đủ ngưỡng XP thì lên
  cấp đúng và cộng đúng điểm kỹy năng, XP dư được giữ lại; mở bậc kỹ
  năng tiêu đúng 1 điểm và áp dụng đúng hiệu ứng (ví dụ bậc1 Chiến Binh
  làm sát thương cận chiến tăng đúng 10%); không mở được bậc 2 khi chưa
  có bậc 1; save/load giữ đúng toàn bộ trạng thái kỹ năng.

## Hệ thống 6 — Giáp trang bị

- 5 item giáp mới: `giap_tre` (giảm dmg nhận 5%), `giap_da` (10%),
  `giap_dong` (15%), `giap_sat` (22%), `giap_ngoc_dam` (30%, cần
  `ngoc_dam_lay` từ boss2 — xem phần "NPC thợ rèn" bên dưới về nơi lấy
  công thức này).
- 4 công thức đầu (tre/đá/đồng/sắt) thêm vào `RECIPES` bình thường, cần
  bàn chế tác, nguyên liệu tương ứng (ví dụ tre: 6 tre; đá: 6 đá + 2 tre;
  đồng: 6 đồng + 2 tre; sắt: 6 sắt + 2 tre).
- Trang bị: `G.armor` giữ item id đang mặc hoặc `null`. Chọn item giáp
  trong hotbar, bấm phím mới `R` để mặc/cởi (nếu đang mặc giáp khác, trả
  giáp cũ về inventory trước khi mặc giáp mới). Giáp đang mặc không nằm
  trong hotbar/inventory nữa cho tới khi cởi ra.
- `damagePlayer()` áp dụng giảm theo `%` của giáp đang mặc trước khi trừ
  `G.hp`.
- HUD: icon nhỏ giáp đang mặc cạnh thanh máu người chơi (dùng
  `drawItemIcon`), không hiện gì nếu chưa mặc giáp.
- Test tối thiểu: mặc giáp giảm đúng % sát thương nhận từ quái; cởi giáp
  trả lại đúng item vào inventory; đổi giáp khi đang mặc giáp khác trả
  lại đúng giáp cũ; save/load giữ đúng `G.armor`.

## Hệ thống 7 — NPC thợ rèn

- Tile mới `ANVIL` (đe rèn): công thức chế tạo mới `anvil` (cần 4 sắt +
  2 đá, cần bàn chế tác) thêm vào `RECIPES`, đặt được như block thường.
- Điều kiện nhà cho thợ rèn: dùng lại `checkHouse()` nhưng thêm biến thể
  — nhà có `ANVIL` thay vì `TORCH` ở vị trí yêu cầu đèn (giữ nguyên yêu
  cầu tường/mái/cửa) thì spawn thợ rèn thay vì thương nhân. Một nhà chỉ
  có 1 trong 2 (torch → thương nhân, anvil → thợ rèn); nếu nhà có cả
  torch và anvil thì ưu tiên spawn thợ rèn trước (vì anvil hiếm/khó làm
  hơn, coi như "nâng cấp" nhà thương nhân thành nhà thợ rèn — chỉ áp
  dụng khi dò nhà mới, không tự nâng cấp NPC đã có sẵn).
- Panel giao diện riêng "Thợ rèn" (khác panel thương nhân): liệt kê và
  cho chế tạo (giống `renderCraftList` nhưng là danh sách riêng) đúng 2
  công thức: `kiem_ngoc` (đã có sẵn trong data, cần `ngoc_quy` — di
  chuyển công thức này từ `RECIPES` chung sang danh sách riêng của thợ
  rèn, không hiện trong bảng Chế tạo thường nữa) và `giap_ngoc_dam`
  (mới, cần `ngoc_dam_lay`, tạo ở Hệ thống 6).
- Test tối thiểu: nhà có anvil spawn đúng thợ rèn (không spawn thương
  nhân); nhà có cả torch+anvil chỉ spawn thợ rèn; panel thợ rèn chỉ cho
  chế 2 công thức cao cấp và không xuất hiện trong panel Chế tạo thường
  nữa; chế `kiem_ngoc`/`giap_ngoc_dam` qua thợ rèn tiêu đúng nguyên liệu.

---

## Thứ tự thực thi

1. Nông nghiệp
2. Thú nuôi (dùng nông sản hệ 1 làm thức ăn)
3. Biome Đầm Lầy
4. Boss thứ 2 (đặt tên gắn với Đầm Lầy vừa có ở bước 3)
5. Hệ kỹ năng
6. Giáp trang bị (công thức thường 4 tier đầu; tier 5 cần `ngoc_dam_lay` từ bước 4)
7. NPC thợ rèn (hoàn thiện nơi chế `kiem_ngoc` + `giap_ngoc_dam`)

Mỗi hệ thống là 1 task độc lập trong plan, giao cho 1 fork, kiểm tra
test + ảnh chụp màn hình trước khi commit, rồi mới sang hệ thống tiếp
theo — thứ tự trên đảm bảo hệ sau không cần chờ dữ liệu của hệ trước
(nông sản → thức ăn thú; Đầm Lầy → boss2 cùng chủ đề; boss2 →
`ngoc_dam_lay` → giáp tier 5 → thợ rèn mở khoá công thức cao cấp).
