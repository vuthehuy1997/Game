# Giữ Nước Qua Ngàn Năm — Design Spec

> Thư mục game: `games/giu-nuoc-qua-ngan-nam/` (tên hiển thị có thể đổi sau, slug giữ nguyên).

## Mục tiêu

Thêm một game xây dựng + phòng thủ theo đợt, góc nhìn ngang, xuyên suốt các thời kỳ chống ngoại xâm trong lịch sử Việt Nam. Người chơi chỉ xây dựng/quản lý (nâng cấp nhà chính, xây trại lính, tháp canh, trụ cọc); lính và tháp tự hành quân/chiến đấu — không điều khiển trực tiếp nhân vật trên chiến trường (khác với game Đối Kháng Anh Hùng). Có giai đoạn chuẩn bị giữa các đợt giặc để xây/nâng cấp không bị hấp tấp.

## Ngoài phạm vi (v1)

- Xây dựng tự do/kéo-thả (dùng lô đất cố định).
- Nhiều loại tài nguyên (chỉ Vàng).
- Tiến trình/điểm nâng cấp cộng dồn giữa các màn (mỗi thời kỳ là một màn độc lập).
- PvP hoặc multiplayer.
- Điều khiển trực tiếp một tướng trên chiến trường.

## Vòng lặp chính (mỗi màn = 1 thời kỳ)

**Giai đoạn chuẩn bị** (không giới hạn giờ, hoặc đếm ngược ngắn trước đợt đầu) → xây/nâng cấp công trình trên các lô cố định bằng Vàng đang có → bấm "Bắt đầu đợt" (hoặc tự động sau đếm ngược) → **giai đoạn chiến đấu**: giặc hành quân từ phải sang trái, lính/tháp/trụ cọc tự động chống trả → hết giặc trong đợt → về giai đoạn chuẩn bị (vàng được cộng thêm, có thể xây tiếp) cho đợt kế → hết toàn bộ đợt (đợt cuối có tướng giặc mạnh hơn) → thắng màn, mở thời kỳ kế tiếp; thua nếu máu Nhà chính về 0 bất kỳ lúc nào.

## Hệ thống

1. **Lô đất xây dựng cố định (4–6 lô cạnh Nhà chính):** mỗi lô trống hoặc có đúng 1 trong {Trại lính, Tháp canh, Trụ cọc}. Bấm lô trống → chọn loại công trình từ menu → trả Vàng → công trình xuất hiện ngay (không có thời gian xây chờ ở v1, giữ thao tác đơn giản).
2. **Nhà chính (HQ):** máu riêng, thua màn nếu về 0. Nâng cấp 3 cấp: mỗi cấp tăng máu tối đa và tăng thu nhập Vàng mỗi giây.
3. **Trại lính:** cứ N giây tự "xuất quân" 1 lính (loại lính theo cấp trại đã nâng, tối đa X lính sống cùng lúc để tránh tràn màn hình); lính hành quân sang phải, va chạm cận chiến với giặc gần nhất cùng làn — tái dùng mô hình va chạm/reach đã có ở `enemies.js` của hao-khi.
4. **Tháp canh:** đứng cố định tại lô, tự bắn giặc trong tầm (tái dùng khái niệm "ranged"/projectile đã có ở hao-khi).
5. **Trụ cọc:** gây sát thương diện 1 lần cho mỗi đợt khi giặc đi qua lô đó, nạp lại vào giai đoạn chuẩn bị tiếp theo — callback trực tiếp cơ chế bãi cọc Bạch Đằng đã có.
6. **Dữ liệu thời kỳ (6 màn):** Hai Bà Trưng (chống Hán) → Ngô Quyền, Bạch Đằng 938 (chống Nam Hán) → Lý Thường Kiệt (chống Tống) → Hưng Đạo Vương (chống Nguyên Mông) → Lê Lợi (chống Minh) → Quang Trung (chống Thanh). Mở dần theo thứ tự, giống `unlocked(i)` của hao-khi.
7. **Vẽ (render.js):** Nhà chính bên trái, các lô công trình, làn hành quân bên phải; lính/giặc vẽ bằng `drawChibi` ở tỉ lệ nhỏ (`scale` thấp) để phân biệt quân số đông mà vẫn tái dùng art có sẵn, không cần vẽ riêng.
8. **Luồng màn hình (flow.js):** menu → chọn thời kỳ (bản đồ các màn, khoá/mở theo tiến trình) → màn chơi (chuẩn bị ⇄ chiến đấu lặp lại) → kết quả thắng/thua → về chọn thời kỳ.
9. **Điều khiển:** chủ yếu bấm/chạm (chọn lô, chọn công trình, bấm "Bắt đầu đợt"), phím tắt tạm dừng. Không cần bộ phím di chuyển phức tạp; vẫn dùng `adoptSettings`/touch chung của platform để nhất quán.

## Dữ liệu

```
ERAS = [{
  id, name, year, bg,
  hq: { hp },
  troopTypes: [{ id, name, hp, dmg, reach, spawnCost, spawnEvery }],
  towerDef: { dmg, range, cost },
  stakeDef: { dmg, cost },
  waves: [{ mix: [{ type, count }], bossFinal? }],
}]
```

Trạng thái chạy: `B = [{ plot, kind, lvl }]` (công trình đã xây), `troops = [{ side: 'ally'|'enemy', x, lane, hp, ... }]` (đối xứng hai phía, tái dùng kiểu dữ liệu enemy của hao-khi).

## Bố cục file

```
games/giu-nuoc-qua-ngan-nam/
  index.html
  css/style.css
  js/
    state.js     // G (match state: giai đoạn, vàng, đợt hiện tại), hq, B, troops
    save.js      // adoptSettings + tiến trình mở thời kỳ (localStorage)
    data.js      // ERAS
    buildings.js // xây/nâng cấp công trình, trừ vàng, thu nhập theo thời gian
    troops.js    // xuất lính, hành quân, va chạm cận chiến
    towers.js    // tự bắn giặc trong tầm, quản lý projectile
    waves.js     // chuyển giai đoạn chuẩn bị/chiến đấu, spawn giặc theo đợt
    render.js    // vẽ Nhà chính, lô đất, lính/giặc, HUD vàng/máu HQ
    flow.js      // menu, chọn thời kỳ, kết quả, mở thời kỳ kế
    main.js       // khởi tạo, startLoop
```

## Kiểm thử

`tests/test_giu_nuoc.py` theo khuôn Playwright của `tests/test_game.py`: xây/nâng cấp trừ đúng số Vàng và chặn khi không đủ; trại lính xuất lính đúng nhịp và đúng giới hạn số lính sống; tháp bắn đúng tầm; trụ cọc gây sát thương diện đúng 1 lần/đợt rồi nạp lại ở giai đoạn chuẩn bị sau; thắng/thua đúng theo máu Nhà chính và việc dọn hết các đợt; mở thời kỳ kế tiếp đúng sau khi thắng màn trước.

## Rủi ro / câu hỏi mở

- Cân bằng kinh tế (Vàng thu vào vs chi phí xây/nâng cấp/tuyển lính) theo từng thời kỳ: giảm rủi ro bằng cách mỗi màn độc lập, không cộng dồn chỉ số từ màn trước nên không bị lệch số theo thời gian chơi của người dùng.
- Số lính sống tối đa cần đủ thấp để không làm chậm máy khi nhiều lính + giặc va chạm cùng lúc — xử lý bằng giới hạn cứng mỗi trại và dùng vòng lặp va chạm đơn giản (O(n²) nhỏ, số thực thể mỗi màn không lớn).
