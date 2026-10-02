# Game Hub: chuyển repo thành nền tảng nhiều game

Ngày 2026-10-02.

## Mục tiêu

Repo đang chứa một game (Hào Khí Việt Nam). Chuyển thành một web chứa nhiều game, trong đó các game dùng chung
mã nguồn về nhân vật, hành động, cơ chế. Chủ repo sẽ tự viết thêm game, nên cấu trúc và quy ước phải rõ.

## Quyết định

| Câu hỏi | Chọn | Lý do |
|---|---|---|
| Công cụ | ES modules, không build | Giữ cách chạy bằng máy chủ tĩnh và GitHub Pages; ranh giới dùng chung rõ ràng |
| Mức tách lần này | Lớp nền + đồ hoạ | Luật chiến đấu, AI, ải chỉ đưa lên khi game thứ hai thật sự cần, tránh đoán sai |
| Ghép game vào web | Mỗi game một trang riêng | Game này lỗi không ảnh hưởng game khác; có link trực tiếp; không phải viết mã dọn dẹp khi thoát game |
| Trang chủ | Thẻ game, cài đặt chung, tiến độ trên thẻ, đường về trang chủ trong game | Theo yêu cầu |

## Kiến trúc

- `index.html` + `platform/home.js`: trang chủ. Đọc `platform/games.js`, mỗi game cung cấp `meta.js`
  (`id`, `title`, `tagline`, `desc`, `tags`, `url`, `progress()`, `cover(canvas)`).
- `platform/core`, `platform/art`, `platform/ui`: mã dùng chung, không phụ thuộc game nào.
- `games/<id>/`: một trang độc lập. Chỉ import từ `platform/` và từ chính nó.
- `games/_template/`: game tối thiểu dùng gần hết API nền tảng, để chép khi làm game mới.

## Ràng buộc đã giữ

- Hào Khí chơi như cũ: bộ kiểm thử 34 bài của game vẫn qua sau khi chuyển.
- Bản lưu cũ không mất: khoá `haokhi-dong-a-v3` và mã `HKDA1:` giữ nguyên.
- Cài đặt âm lượng, rung, nút cảm ứng người chơi đã đặt trong Hào Khí được lấy làm cài đặt chung ở lần chạy đầu
  (`adoptSettings`), sau đó chỉ lưu ở khoá `game-hub-settings-v1`.

## Thay đổi trong mã Hào Khí

- Script toàn cục thành module: mọi khai báo cấp cao nhất được `export`, mỗi file `import` thứ nó dùng.
- `util.js` tách thành `state.js` (trạng thái trận) và `save.js` (bản lưu, cài đặt riêng); `art.js` chuyển lên
  `platform/art`, bảng ngoại hình ở lại `looks.js`.
- Biến bị gán lại từ file khác đổi thành mảng `const` sửa tại chỗ (`prune`, `refill`) hoặc hàm gán (`setP`, `setAlly`).
- Mã gắn sự kiện ở cấp cao nhất gom vào `initInput()`, `initFlow()`.
- Biến toàn cục cho kiểm thử chỉ có khi mở với `?debug`.

## Kiểm thử

`tests/harness.py` (bộ chạy chung), `tests/test_hao_khi.py` (game), `tests/test_platform.py` (trang chủ, cài đặt
chung hai chiều, chuyển cài đặt cũ, tiến độ trên thẻ, `meta.js` khớp dữ liệu game, mọi game trong danh sách mở
được và có đường về trang chủ, game mẫu chạy, bố cục điện thoại).

## Chưa làm

- Cơ chế chiến đấu, AI địch, hệ đợt quân vẫn nằm trong Hào Khí.
- `dist/hao-khi-viet-nam.zip` và artifact đã xuất bản là bản cũ trước khi chuyển.
