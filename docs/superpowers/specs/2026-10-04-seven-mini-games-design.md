# 7 Game Mới — Design Spec

> 7 dự án độc lập, mỗi game một thư mục `games/<id>/` riêng, không phụ thuộc lẫn nhau và không phụ thuộc 3 game
> hiện có (`hao-khi`, `doi-khang-anh-hung`, `giu-nuoc-qua-ngan-nam`). Mỗi game lấy cảm hứng cơ chế từ một thể
> loại mobile game phổ biến, làm bản gốc riêng (tên, hình vẽ, chủ đề của Game Hub — không sao chép thương hiệu).
> 5 game đầu ở độ sâu "nhẹ" (1 vòng chơi chính, không nhiều màn). 2 game cuối (Dựng Nước, Mở Cõi) ở độ sâu "vừa"
> (có tiến trình/bản đồ lưu lại, nhưng không nhiều "màn" tách biệt như Giữ Nước Qua Ngàn Năm).

## Quy ước chung cho cả 7 game

- ES modules thuần, Canvas 2D 960×540, không build, tái dùng `platform/` (loop, input, audio, storage, settings,
  fx, util, debug, chibi/draw, ui) đúng quy ước đã có trong `README.md`.
- Mỗi game: `index.html`, `style.css`, `meta.js` (export `STORE_KEY` riêng dạng `'<id>-v1'`), `js/main.js` +
  các module chia theo trách nhiệm.
- Lưu điểm cao/tiến trình riêng bằng `localStorage` qua `STORE_KEY` của chính game đó.
- Mọi chữ hiển thị bằng tiếng Việt. Không multiplayer, không yêu cầu mạng.
- Đăng ký vào `platform/games.js` (đọc lại trước khi sửa) và thêm dòng vào `README.md`.

---

## 1. Bắn Ná (`ban-na`) — bắn ná vật lý, nhẹ

**Lấy cảm hứng:** game bắn ná phá công trình kiểu Angry Birds.

**Vòng lặp:** chọn màn (1..N đã mở) → kéo-thả dây ná để ngắm và bắn → đạn bay theo vật lý đơn giản (trọng lực +
vận tốc ban đầu tỉ lệ nghịch với vector kéo) → va chạm khối gỗ/đá (AABB) hoặc mục tiêu (hình tròn) → khối/mục
tiêu mất máu theo động năng va chạm, hết máu thì biến mất → hết đạn hoặc hết mục tiêu thì kết thúc màn (thắng
nếu mọi mục tiêu bị phá trong số lượt bắn cho phép, thua nếu hết lượt mà còn mục tiêu).

**Hệ thống:**
- Không mô phỏng vật lý khối-chồng-khối (không toppling); khối chỉ là chướng ngại tĩnh có máu, bị phá thì biến
  mất ngay (không rơi/va chạm tiếp). Giữ đơn giản cho v1.
- `LEVELS = [{ blocks: [{x,y,w,h,hp}], targets: [{x,y,r,hp}], shots }]`, 4-5 màn tăng dần độ khó.
- Bắn: `pointerdown` trong bán kính dây ná → kéo (giới hạn bán kính kéo tối đa) → `pointerup` thả, vận tốc =
  `(anchor - kéoTới) * hệ số`, trọng lực kéo quỹ đạo xuống.
- Va chạm: AABB giữa hình tròn đạn và khối/mục tiêu (dùng `overlap` của `platform/core/util.js` trên hộp bao
  quanh đạn); sát thương = hằng số × tốc độ va chạm tại thời điểm chạm.
- Lưu: màn cao nhất đã thắng (`S.maxLevel`), mở dần như các game khác (`unlocked(i) = i <= S.maxLevel`).

**Kiểm thử trọng tâm:** đạn bay đúng quỹ đạo vật lý (rơi theo trọng lực); va chạm đúng khối gây mất máu đúng
khối đó, không xuyên qua; hết lượt bắn mà còn mục tiêu → thua; phá hết mục tiêu → thắng, mở màn kế.

---

## 2. Chạy Làng (`chay-lang`) — endless runner, nhẹ

**Lấy cảm hứng:** endless runner 3 làn kiểu Subway Surfers.

**Vòng lặp:** nhân vật tự chạy về phía trước (thế giới cuộn qua), người chơi đổi làn trong 3 làn và nhảy/trượt né
chướng ngại vật xuất hiện liên tục; tốc độ tăng dần theo thời gian; va chạm chướng ngại thì thua; nhặt đồng tiền
dọc đường cộng điểm; điểm chính = quãng đường đã chạy (mét), cộng thêm điểm từ tiền nhặt được.

**Hệ thống:**
- 3 làn cố định (trái/giữa/phải theo chiều ngang màn hình nhìn từ trên xuống một phần, hoặc trước/giữa/sau theo
  chiều sâu — chọn kiểu object chạy dọc một đường thẳng, đổi làn = đổi vị trí ngang tức thời có easing ngắn).
  Chướng ngại: vật cản phải nhảy qua, vật cản phải trượt qua (cúi/trượt), vật cản phải đổi làn né.
- Sinh chướng ngại theo khoảng cách đã chạy (tăng tần suất/tốc độ theo thời gian chơi, có trần tốc độ).
- Điều khiển: trái/phải đổi làn, lên nhảy, xuống trượt — phím + nút cảm ứng qua `bindKeys`/`bindTouch`.
- Lưu: điểm cao nhất (`S.best`).

**Kiểm thử trọng tâm:** đổi làn đúng hướng; nhảy né được chướng ngại kiểu "nhảy", không né được nếu đứng yên;
va chạm đúng loại chướng ngại thì kết thúc trò chơi; điểm tăng theo thời gian sống sót; lưu đúng kỷ lục mới.

---

## 3. Nối Ngọc (`noi-ngoc`) — match-3, nhẹ

**Lấy cảm hứng:** đổi chỗ-nối-3 kiểu Candy Crush.

**Vòng lặp:** lưới 8×8 ô ngọc màu; người chơi bấm 1 ô rồi bấm 1 ô liền kề (trên/dưới/trái/phải) để đổi chỗ — nếu
sau khi đổi tạo thành hàng/cột ≥3 ô cùng màu liên tiếp thì các ô đó nổ biến mất và tính điểm, ô phía trên rơi
xuống lấp chỗ trống, ô mới sinh ngẫu nhiên lấp đầy từ trên; nếu đổi chỗ mà không tạo hàng/cột ≥3 thì đổi lại về
vị trí cũ (đổi chỗ không hợp lệ). Mỗi màn có giới hạn số lượt đổi chỗ và một điểm mục tiêu; đạt điểm mục tiêu
trước khi hết lượt thì thắng màn, hết lượt mà chưa đạt thì thua (thử lại màn đó).

**Hệ thống:**
- `grid[8][8]` giá trị màu 1..6, sinh ban đầu đảm bảo không có sẵn hàng/cột ≥3 cùng màu (tránh nổ ngay khi vào
  màn gây khó hiểu).
- Dò hàng/cột ≥3 cùng màu liên tiếp sau mỗi lần đổi chỗ (quét toàn lưới theo hàng rồi theo cột); có thể nổ dây
  chuyền (sau khi ô rơi lấp đầy, dò lại một lần nữa, lặp tới khi không còn hàng/cột nào ≥3).
- `LEVELS = [{ target: điểmCần, moves: sốLượt }]`, 4-5 màn tăng dần độ khó, mở dần như các game khác.
- Lưu: màn cao nhất đã thắng (`S.maxLevel`), điểm cao nhất mỗi màn.

**Kiểm thử trọng tâm:** đổi chỗ tạo hàng/cột ≥3 thì nổ và cộng điểm đúng; đổi chỗ không tạo hàng/cột ≥3 thì tự
đổi lại vị trí cũ (không tốn lượt một cách vô ích — hoặc có tốn tuỳ thiết kế plan, miễn nhất quán); nổ dây chuyền
tính đúng tổng điểm; đạt điểm mục tiêu → thắng, mở màn kế; hết lượt chưa đạt → thua.

---

## 4. Bắn Bóng (`ban-bong`) — bubble shooter, nhẹ

**Lấy cảm hứng:** bắn bóng màu kiểu Puzzle Bobble.

**Vòng lặp:** lưới bóng màu treo từ mép trên; người chơi ngắm (theo vị trí con trỏ/chạm) rồi bắn 1 bóng màu từ
dưới lên; bóng bay theo đường thẳng (nảy tường trái/phải) tới khi chạm lưới thì gắn vào ô lưới gần nhất; nếu tạo
thành cụm ≥3 bóng cùng màu liền kề (kể cả bóng vừa bắn) thì cụm đó nổ biến mất; bóng nào không còn liên kết tới
hàng trên cùng (rơi tự do) cũng biến mất theo; lưới trống hết thì thắng màn; nếu lưới bóng hạ xuống chạm ranh
giới dưới thì thua.

**Hệ thống:**
- Lưới lục giác xen kẽ hàng (offset hàng chẵn/lẻ) hoặc lưới vuông đơn giản hoá cho v1 (chấp nhận lưới vuông,
  không cần đúng hình lục giác, miễn thuật toán "cụm cùng màu liền kề" và "mất liên kết thì rơi" đúng).
- Màu bóng kế tiếp hiển thị trước (hàng đợi 1 viên), chọn ngẫu nhiên trong tập màu đang còn trên lưới (tránh bắn
  mãi không trúng màu nào còn lại).
- Lưu: số màn đã thắng cao nhất, mở dần theo thứ tự (giống mô hình `unlocked(i)` của các game khác), 3-4 màn.

**Kiểm thử trọng tâm:** bắn trúng tạo cụm ≥3 cùng màu thì nổ; cụm chỉ 2 thì không nổ; bóng mất liên kết với hàng
trên rơi theo; lưới trống → thắng; bóng chạm ranh giới dưới → thua.

---

## 5. Làng Nghề (`lang-nghe`) — idle clicker, nhẹ

**Lấy cảm hứng:** idle/clicker kiểu cookie-clicker.

**Vòng lặp:** bấm vào hình chính để cộng "của cải" mỗi lần bấm; dùng của cải mua nâng cấp: tăng giá trị mỗi lần
bấm, hoặc mua "thợ" tạo thu nhập tự động mỗi giây; giá nâng cấp tăng dần theo số lượng đã mua (cấp số nhân); khi
quay lại game sau khi đóng tab, cộng dồn thu nhập tự động trong thời gian vắng mặt (giới hạn trần, ví dụ tối đa
4 giờ quy đổi) để đúng cảm giác thể loại idle.

**Hệ thống:**
- `UPGRADES = [{ id, name, baseCost, costMul, kind: 'click'|'auto', value }]` — vài loại nâng cấp (ví dụ: "thợ
  mộc" tăng thu tự động, "phường hội" tăng giá trị mỗi cú bấm).
- `S = { wealth, perClick, ownedAuto: {id: count}, lastSeen: timestamp }`. Khi tải trang: `elapsed =
  min(MAX_OFFLINE_SEC, (Date.now() - lastSeen)/1000)`, cộng `wealth += elapsed * tổngThuTựĐộng`.
- Hiển thị số lớn rút gọn (ví dụ `1.2k`, `3.4tr`) để không tràn màn hình.

**Kiểm thử trọng tâm:** bấm cộng đúng `perClick` vào của cải; mua nâng cấp trừ đúng giá, giá tăng đúng hệ số sau
mỗi lần mua; thu nhập tự động cộng dồn đúng theo thời gian trôi qua mỗi khung hình; tính đúng thu nhập khi vắng
mặt (giả lập `lastSeen` lùi về quá khứ rồi tải lại), có trần giới hạn.

---

## 6. Dựng Nước (`dung-nuoc`) — xây dựng/quản lý, độ sâu vừa

**Lấy cảm hứng:** xây làng/thành phố kiểu Township/SimCity rút gọn — **không có combat, không có đợt giặc**
(khác hẳn Giữ Nước Qua Ngàn Năm, vốn là tower-defense theo đợt).

**Vòng lặp:** một bản đồ lưới duy nhất (không chia nhiều "thời kỳ"/màn); người chơi đặt công trình lên ô trống
bằng Vàng + Lương thực đang có; mỗi công trình sinh ra tài nguyên hoặc dân số theo thời gian; đạt mốc dân số mở
khoá thêm loại công trình mới; chơi liên tục không giới hạn (điểm = dân số cao nhất từng đạt, lưu lại tiến trình
toàn bộ bản đồ để chơi tiếp lần sau — không phải "chơi lại từ đầu" như Giữ Nước).

**Hệ thống:**
- Lưới ví dụ 8×6 ô; mỗi ô: trống hoặc có đúng 1 công trình `{ kind, lvl }`.
- `BUILDING_DEFS = { house: { cost, pop, ... }, farm: { cost, foodPerSec }, market: { cost, goldPerSec }, ... }`
  — nhà tăng dân số tối đa, ruộng/chợ sinh tài nguyên, một vài loại chỉ mở khi đủ mốc dân số
  (`unlockAt: popMilestone`).
- `S = { grid: [{plot, kind, lvl}], gold, food, pop, maxPop, lastSeen }` — lưu toàn bộ, tải lại chơi tiếp (có thể
  dùng cùng cơ chế cộng dồn tài nguyên khi vắng mặt như Làng Nghề, dùng chung ý tưởng nhưng code riêng vì
  `STORE_KEY` và dữ liệu khác nhau).
- Không có "thua" — đây là sandbox phát triển liên tục; thành tựu = các mốc dân số đạt được, hiển thị trên HUD.

**Kiểm thử trọng tâm:** đặt công trình trừ đúng tài nguyên, chặn khi không đủ hoặc ô đã có công trình; tài
nguyên sinh ra đúng theo thời gian và đúng theo loại công trình đã đặt; đạt mốc dân số mở khoá đúng loại công
trình mới; tải lại trang giữ nguyên bản đồ đã xây (không mất tiến trình).

---

## 7. Mở Cõi (`mo-coi`) — dựng quân & chinh phục bản đồ, độ sâu vừa

**Lấy cảm hứng:** chiến thuật chiếm vùng kiểu Risk rút gọn, kèm dựng quân.

**Vòng lặp:** một bản đồ lưới cố định gồm N vùng (ví dụ 3×4 = 12 vùng), người chơi bắt đầu kiểm soát 1 vùng gốc;
vùng đang kiểm soát tự sinh quân theo thời gian (giới hạn quân tối đa mỗi vùng); người chơi chọn một vùng mình
đang kiểm soát kề với một vùng chưa chiếm, ra lệnh tấn công — toàn bộ quân tại vùng xuất phát (trừ số quân giữ
lại tối thiểu) so sánh với quân phòng thủ của vùng mục tiêu: quân tấn công nhiều hơn thì chiếm được vùng đó
(quân phòng thủ bị xoá, quân tấn công còn lại trừ phần hao hụt đóng vào vùng mới); quân phòng thủ tại vùng chưa
chiếm tăng dần theo thời gian (áp lực phải chiếm trước khi quá mạnh); chiếm hết toàn bộ bản đồ thì thắng.

**Hệ thống:**
- Bản đồ lưới cố định `REGIONS = [{ id, x, y, w, h }]` với quan hệ kề theo lưới (trên/dưới/trái/phải).
- `S = { owner: [playerId|null, ...], troops: [n, ...], lastSeen }` — vùng chưa chiếm có `owner = null` và quân
  phòng thủ tăng dần (mô phỏng khi tải lại trang bằng cộng dồn theo thời gian vắng mặt, có trần, giống Làng
  Nghề/Dựng Nước).
- Tấn công: so sánh số đơn giản `quânTấnCông > quânPhòngThủ` → thắng (không có yếu tố ngẫu nhiên ở v1, giữ đơn
  giản/dễ kiểm thử); thua thì quân tấn công bị xoá hết, vùng mục tiêu giữ nguyên.
- Thắng toàn cục: `owner` của mọi vùng đều là người chơi.

**Kiểm thử trọng tâm:** quân tự sinh đúng tốc độ tại vùng đang kiểm soát, không vượt trần; tấn công vùng kề
thắng/thua đúng theo so sánh quân số; chiếm được vùng thì `owner` đổi đúng và quân phòng thủ cũ bị xoá; không
tấn công được vùng không kề; chiếm hết bản đồ → thắng.

---

## Rủi ro / câu hỏi mở

- Vật lý của Bắn Ná và va chạm của Bắn Bóng là phần kỹ thuật mới nhất so với 3 game đã có (chưa có tiền lệ
  trong `platform/`) — giảm rủi ro bằng cách giữ mô hình va chạm đơn giản (AABB/khoảng cách tâm, không mô phỏng
  vật lý thật), đã nêu rõ trong từng mục.
- "Cộng dồn khi vắng mặt" (Làng Nghề, Dựng Nước, Mở Cõi) lặp lại cùng một ý tưởng 3 lần — chấp nhận trùng lặp
  nhỏ giữa 3 game độc lập thay vì tạo thêm một module dùng chung trong `platform/` (mỗi game vẫn tự quản lý
  `STORE_KEY`/schema riêng theo đúng quy ước "game không phụ thuộc game khác").
