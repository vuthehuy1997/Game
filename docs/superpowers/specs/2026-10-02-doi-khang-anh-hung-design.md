# Đối Kháng Anh Hùng — Design Spec

> Thư mục game: `games/doi-khang-anh-hung/` (tên hiển thị có thể đổi sau, slug giữ nguyên).

## Mục tiêu

Thêm một game đối kháng 1v1 góc nhìn ngang vào platform: 2 người chơi cùng bàn phím, hoặc 1 người đấu với máy, dùng các danh tướng lịch sử Việt Nam (mở rộng từ dàn tướng nhà Trần đã có trong `games/hao-khi`). Độ sâu cơ chế ở mức arcade (né/đỡ/đòn thường/đòn mạnh + 1 chiêu riêng mỗi tướng), không làm hệ combo sâu kiểu fighting-game chuyên.

## Ngoài phạm vi (v1)

- Multiplayer qua mạng.
- Hệ combo hướng bấm, cancel chiêu, parry khung hình chính xác.
- Hệ thống mở khoá tướng (v1 mở hết 6 tướng ngay).
- Nhiều hơn 3 sân đấu.

## Vòng lặp chính

Menu → chọn tướng P1 (và P2 hoặc máy + độ khó) → chọn sân → đấu **best-of-3 round** (mỗi round: HP một bên về 0 hoặc hết giờ thì bên máu cao hơn thắng round) → màn kết trận (ai thắng 2 round trước) → đấu lại / đổi tướng / về menu.

## Hệ thống

1. **Di chuyển & giao chiến (fighter.js, dùng chung cho P1/P2/AI):** một mặt phẳng ngang duy nhất (không đổi làn như hao-khi). Hành động: đi trái/phải, nhảy, đòn nhẹ, đòn mạnh, đỡ (giảm % sát thương + đẩy lùi), lướt né (bất tử ngắn). Đòn dùng khung thời gian đơn giản `wind` (vươn người) → `active` (có hitbox) → `recover`, tái dùng kiểu dữ liệu đã có ở `enemies.js` của hao-khi.
2. **Nội lực (meter):** tích dần khi đánh trúng hoặc đỡ đòn; đầy thì có thể tung **chiêu đặc biệt** riêng theo tướng (sát thương cao hoặc hiệu ứng khống chế ngắn). Dùng hết sau khi tung.
3. **AI (fighter do máy điều khiển):** máy trạng thái theo khoảng cách tới đối thủ + hồi chiêu, 3 mức độ khó (Dễ/Thường/Khó) chỉnh độ trễ phản ứng, xác suất đỡ/né đúng lúc, tần suất tung chiêu — theo đúng cách `bossAI` của hao-khi đang làm, không cần thuật toán mới.
4. **Hiểm hoạ sân đấu:** mỗi sân 1 cơ chế nhẹ (ví dụ sân Bạch Đằng: đứng gần viền sân quá 1.5 giây thì bị cọc gây sát thương nhỏ, đẩy vào giữa) — gợi lại cơ chế bãi cọc đã có, không thêm hệ vật lý mới.
5. **Dàn tướng v1 (6):** tái dùng `LOOKS`/art chibi có sẵn, mở rộng nếu cần thêm biến thể vũ khí:
   - Tiểu Hổ (tay không/côn ngắn) — tướng mở đầu, quen thuộc với người chơi hao-khi.
   - Hưng Đạo Vương Trần Quốc Tuấn (giáo) — chiêu: đòn chấn động diện rộng.
   - Trần Quốc Toản (kiếm) — chiêu: lướt xuyên chém 2 nhịp.
   - Phạm Ngũ Lão (glaive) — chiêu: đâm xa + đẩy lùi mạnh.
   - Trần Bình Trọng (côn/club) — chiêu: thế phòng thủ phản đòn ("Ta thà làm quỷ nước Nam") trong X giây, đỡ được là phản sát thương lớn.
   - Trần Khánh Dư (cung) — chiêu: loạt tên tầm xa.
6. **Luồng màn hình (flow.js):** menu → lưới chọn tướng (vẽ chân dung bằng `drawBust` có sẵn trong `platform/art/chibi.js`) → chọn sân → đấu → kết quả round/trận → đấu lại.
7. **Điều khiển:** 2 bộ phím cố định qua `bindKeys` của `platform/core/input.js`, map theo action riêng từng bên (`p1_left/p1_jump/p1_light/p1_heavy/p1_guard/p1_special`, tương tự `p2_*`). Hỗ trợ tay cầm cảm ứng sau nếu cần (không bắt buộc v1).
8. **Cài đặt & âm thanh:** dùng `adoptSettings`, `platform/core/audio.js` (tone/noise) như hao-khi đang làm, không thêm hệ âm thanh mới.

## Dữ liệu

```
FIGHTERS = {
  id: { name, look: <LOOKS key>, hp, spd, reach, dmgLight, dmgHeavy,
        special: { name, cost, desc, apply(attacker, defender) } }
}
STAGES = { id: { name, bg, hazard: { kind, ... } } }
```

## Bố cục file

```
games/doi-khang-anh-hung/
  index.html
  css/style.css
  js/
    state.js    // G (match state), F1, F2 (hai fighter), input state
    save.js     // adoptSettings + cấu hình (không cần save tiến trình v1)
    data.js     // FIGHTERS, STAGES
    fighter.js  // logic di chuyển/đòn/đỡ/né dùng chung cho P1 và P2
    ai.js       // quyết định hành động cho fighter do máy điều khiển
    combat.js   // tính hitbox/va chạm, sát thương, nội lực
    render.js   // vẽ sân, 2 fighter (drawChibi), HUD máu/nội lực
    flow.js     // menu, chọn tướng, chọn sân, kết quả, rematch
    main.js     // khởi tạo, startLoop
```

## Kiểm thử

`tests/test_doi_khang.py` theo đúng khuôn Playwright của `tests/test_game.py`: tải trang headless, giả lập phím, kiểm tra hitbox đòn thường/mạnh trúng đúng lúc active frame, nội lực tích đúng, AI không đứng yên/không crash ở cả 3 độ khó, kết quả round/trận đúng điều kiện HP/hết giờ.

## Rủi ro / câu hỏi mở

- Cân bằng 6 tướng: giữ thống kê gốc (hp/spd/reach/dmg) gần giống nhau, chỉ để chiêu đặc biệt tạo khác biệt — giảm rủi ro một tướng áp đảo.
- Không có rủi ro kỹ thuật lớn: toàn bộ hạ tầng cần (loop, input, audio, chibi art, settings) đã có sẵn trong `platform/`.

## Cắt phạm vi ở v1 (ghi lại sau review toàn nhánh)

Review cuối cùng (sau khi cả 12 task đã xong) nêu một số điểm spec ban đầu có nhắc tới nhưng bản v1 không làm, để tránh vội vàng nhồi thêm vào vòng sửa lỗi cuối cùng (không còn vòng review thứ hai). Ghi lại ở đây làm quyết định có chủ ý, không phải bị bỏ sót:

- **Âm thanh:** v1 chỉ mở khoá `ac()` khi bấm lần đầu, chưa phát `tone()`/`noise()` cho đòn trúng/chiêu/thắng thua. Để v2 nếu cần.
- **Quốc Toản — chiêu "Phá Cường Địch":** v1 dùng chung kiểu `'dash'` cho mọi tướng (xông tới, trúng 1 lần), nên chỉ gây 1 đòn thay vì "chém 2 nhịp" như mô tả ban đầu. Giữ nguyên ở v1 để không phải thiết kế thêm một kiểu chiêu riêng chỉ cho một tướng.
- **Chân dung chọn tướng:** màn chọn tướng (menu.js/render.js) hiện chỉ hiện tên, chưa vẽ chân dung bằng `drawBust`. Để v2 nếu cần làm đẹp màn chọn tướng.
- **`adoptSettings`:** game chưa có cài đặt riêng cần đồng bộ với `platform/core/settings.js`, nên chưa gọi `adoptSettings`. Không cần ở v1 vì game không có cấu hình riêng (âm lượng/rung đã dùng chung `SETTINGS` qua các module platform khác).
