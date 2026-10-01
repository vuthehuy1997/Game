# Mở rộng Hào Khí Việt Nam — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm điểm lưu trước boss, hệ thử thách + sao có ý nghĩa, cơ chế bãi cọc ở Bạch Đằng, và ải ngoại truyện 1258.

**Architecture:** Giữ nguyên kiến trúc script toàn cục không build (`js/*.js` nạp theo thứ tự trong `index.html`). Dữ liệu mới nằm trong `data.js`, luật chơi trong `world.js`/`player.js`/`enemies.js`, giao diện thẻ trong `flow.js`, vẽ trong `render.js`/`background.js`. Bản lưu chỉ thêm trường mới (`ch`, `ms`), không đổi chỉ số ải cũ nên bản lưu `haokhi-dong-a-v3` và mã `HKDA1:` cũ vẫn dùng được.

**Tech Stack:** JavaScript thuần + Canvas 2D, kiểm thử bằng Playwright (Python): `python3 tests/test_game.py [lọc tên]`.

**Spec:** phần "Hướng phát triển" trong cuộc trao đổi ngày 2026-10-01 (mục 1, 3, 4 và kỹ thuật).

## Global Constraints

- Không thêm thư viện, không thêm bước build.
- Chỉ số ải 0–5 và ý nghĩa `S.stage`, `S.maxStage`, `S.stars[i]` giữ nguyên; ải mới nối vào cuối (chỉ số 6) với cờ `side: true`.
- Mọi chữ hiển thị bằng tiếng Việt, cùng giọng với lời thoại hiện có.
- Bộ test hiện có phải vẫn qua (trừ `test_stage1_fair_play` vốn chập chờn do ngẫu nhiên: trước khi sửa đã hỏng 1 lần chạy với 1/3 trận thắng).
- Mỗi task một commit.

## Review Focus

1. Bản lưu cũ thiếu `ch`/`ms` → phải nạp được, không lỗi (test nhập mã cũ).
2. Chết ở boss rồi "Tái chiến" → vào thẳng đợt boss, giữ số lần trúng đòn và thời gian, không phát lại hội thoại boss; chết trước boss → vẫn về đầu ải.
3. Đổi độ khó xuống Dễ giữa trận → không được nhận ấn "Hổ tướng", sao bị chặn ở 2.
4. Ải ngoại truyện không được làm hỏng tiến trình chính: thắng nó không đổi `S.maxStage`, không kích hoạt màn kết.
5. Boss mắc cọc khi còn ít máu → chết đúng cách (qua `killEnemy`), ải vẫn kết thúc.

---

### Task 1: Git, điểm lưu trước boss, sửa hẹn giờ tên độc

**Files:** tạo `.gitignore`; sửa `js/world.js` (`resetWorld`, `updateWaves`), `js/flow.js` (`gameOver`), `js/enemies.js` (`bossAI`, `bossMove` nhánh `poison`), `tests/test_game.py`.

**Interfaces (produces):**
- `G.cp = { wave, time, hits, maxCombo, minDiff, coins, coins0 } | null` — đặt khi khoá màn cho đợt boss.
- `resetWorld(i, cp)` — có `cp` thì đặt `G.wave = cp.wave`, `P.x = waves[cp.wave].at - 120`, khôi phục `time/hits/maxCombo/minDiff`, `G.coinsAtStart = cp.coins0`, `G.cpUsed = true` (bỏ qua `bossTalk`), không rải vò/thùng.
- `e.pend` (giây) — phát tên độc thứ hai của Lý Hằng theo thời gian game thay cho `setTimeout`.

- [ ] `git init`, `.gitignore` (`.ipynb_checkpoints/`, `__pycache__/`), commit hiện trạng.
- [ ] Test `test_checkpoint_before_boss`: vào ải 1, đặt `P.x` qua mốc đợt boss sau khi ép `G.wave = 3`, kết thúc hội thoại, `S.coins += 7`, giết Tiểu Hổ → thẻ thua có nút `#oRe` ghi "trước tướng giặc" và `#oStart`; bấm `#oRe` → `G.wave == 3`, `G.mode == 'play'`, `G.hits` giữ nguyên, chạy vài khung hình không mở hội thoại và boss xuất hiện; bấm `#oStart` (lần chết sau) → `G.wave == 0`.
- [ ] Cài đặt, chạy test mới + `gameover`, commit.

### Task 2: Thử thách, chuỗi đòn, sao có ý nghĩa

**Files:** `js/util.js` (`newSave` thêm `ch: [], ms: {}`), `js/data.js` (`CHALS`, `MILESTONES`, `par`/`combo` cho từng ải), `js/player.js` (đếm chuỗi, thưởng mốc), `js/world.js` (tiền +20%), `js/main.js` (hạ `G.minDiff`, giảm `G.comboT`), `js/flow.js` (`stageCleared`, `historyCard`, `showMap`), `js/render.js` (HUD chuỗi đòn), `css/style.css`, test.

**Interfaces (produces):**
- `G.combo`, `G.comboT`, `G.maxCombo`, `G.minDiff`.
- `CHALS = [{ id: 'speed'|'combo'|'hard', name, desc(st), ok(r, st) }]`; kết quả trận `G.result = { stars, bonus, time, hits, maxCombo, diff, newCh: [id], capped }`.
- `S.ch[i] = [id,…]` các ấn đã đạt ở ải `i`; mỗi ấn mới thưởng 40 văn.
- `MILESTONES = [{ need, id: 'coin'|'side'|'rage'|'sp'|'armor', name, desc }]`, `ms(id)` = đã đạt mốc theo `totalStars(S)`. `sp` cấp một lần, ghi `S.ms.sp = true`.
- Sao: như cũ theo số lần trúng đòn, nhưng chơi Dễ (kể cả hạ xuống Dễ giữa trận) thì tối đa 2★.

- [ ] Test `test_challenges_and_milestones`: gọi `stageCleared()` với `G.time/G.maxCombo/G.minDiff` dựng sẵn → kiểm `S.ch[0]`, tiền thưởng, không thưởng lại lần hai; Dễ → sao ≤ 2 và không có `hard`; `ms()` theo tổng sao; mốc `sp` chỉ cộng một lần; mã lưu cũ không có `ch`/`ms` vẫn nhập được.
- [ ] Test `test_combo_counter`: đánh trúng tăng `G.combo`, bị đánh về 0, hết 2,5 giây về 0.
- [ ] Cài đặt, chạy toàn bộ test, commit.

### Task 3: Bãi cọc Bạch Đằng

**Files:** `js/world.js` (`raiseStakes`, `updateStakes`), `js/enemies.js` (gọi `raiseStakes` khi `phase2.tideOut`), `js/main.js`, `js/render.js` (`drawStakes` theo chiều sâu), `js/data.js` (lời phụ đề giai đoạn 2), test.

**Interfaces (produces):**
- `G.stakes = [{ x, lane, gy, up, dead }]` — 4 bãi trong khung khoá.
- `updateStakes(dt)`: địch cùng làn, cách bãi < 36px và đang `charge`/`fury`/`lunge` hoặc bị hất văng (`hurt`/`down` với `|vx| > 120`) thì mắc cọc. Boss: mất 8% máu tối đa, choáng 1,5 giây, bãi đó gãy. Lính: mất 30 máu, ngã, bãi còn nguyên (mỗi lính 1 giây mới mắc lại). Tiểu Hổ và đồng đội không bị cọc làm hại.

- [ ] Test `test_bachdang_stakes`: ải 6, sinh `bossOMN`, ép máu < 50% rồi chạy 1 khung hình → `G.stakes.length == 4`; đặt boss ở trạng thái `charge` ngay trên một bãi → máu giảm ≥ 8%, trạng thái `hurt`, bãi `dead`; boss còn 1 máu mắc cọc → chết, ải kết thúc bình thường.
- [ ] Cài đặt, chạy test mới + `stage_6`, commit.

### Task 4: Ngoại truyện Đông Bộ Đầu (1258)

**Files:** `js/data.js` (ải thứ 7 `side: true, needStars: 6, tier: 1, hero: 'master'`, `SPK`, `EDEF.bossAju`, `MAP_POINTS`, `ALLY_LINES`), `js/art.js` (`LOOKS`: `master`, `ttt`, `ttd`, `letan`, `bossAju`), `js/background.js` (nền `dongbodau`), `js/world.js` (hiệu ứng nền), `js/enemies.js` + `js/player.js` (dùng `G.tier` thay `G.stage` khi tính độ khó), `js/flow.js` (`MAIN`, `unlocked`, `stageLabel`, bản đồ, `startStage`, `afterClear`), `js/render.js` (hình người chơi theo `G.st.hero`, nhãn HUD), test.

**Interfaces (produces):**
- `MAIN` = số ải chính (6); `unlocked(i)`; `stageLabel(i)` → `'Ải n'` hoặc `'Ngoại truyện'`.
- Ải phụ: không đổi `S.stage`/`S.maxStage`; thắng xong về bản đồ; sao và ấn tính vào tổng.

- [ ] Sửa test: `STAGES.length == 7`; thêm `test_side_stage`: dưới 6★ thì nút ải 7 bị khoá, đủ 6★ thì mở; bot chơi hết ải; sau thẻ sử ký về bản đồ, `S.maxStage` không đổi, không hiện màn kết.
- [ ] Cài đặt, chạy toàn bộ test, commit.
