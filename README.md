# Game Hub

Một trang web chứa nhiều game chạy trên trình duyệt. Các game dùng chung một bộ mã nền (`platform/`): vòng lặp,
điều khiển, âm thanh, lưu game, hiệu ứng và bộ vẽ nhân vật chibi. Không có bước build, không cần Node: toàn bộ là
HTML, CSS và ES modules.

## Chạy

```
python3 -m http.server 8003
```

Mở `http://localhost:8003/`. Phải mở qua máy chủ (ES modules không chạy khi mở file trực tiếp).
Đẩy lên GitHub Pages là chạy được ngay, vì mọi đường dẫn đều là đường dẫn tương đối.

## Cấu trúc

```
index.html              trang chủ: danh sách game, cài đặt chung
platform/
  games.js              danh sách game hiện trên trang chủ
  home.js               mã của trang chủ
  core/                 util, loop, input, audio, storage, settings, fx, debug
  art/                  draw (hình cơ bản), chibi (nhân vật), poses (tư thế), props (vò, thùng)
  ui/                   theme (phông chữ), bar (đường về trang chủ)
  css/                  hub.css (trang chủ), kit.css (thành phần dùng trong trang game)
games/
  hao-khi/              Hào Khí Việt Nam
  doi-khang-anh-hung/   Đối Kháng Anh Hùng
  giu-nuoc-qua-ngan-nam/ Giữ Nước Qua Ngàn Năm
  _template/            game mẫu để chép khi làm game mới
tests/                  kiểm thử bằng Playwright
```

Mỗi game là một trang riêng trong `games/<id>/`. Game chỉ import từ `platform/` và từ thư mục của chính nó,
không import từ game khác. Thứ gì hai game cùng cần thì chuyển lên `platform/`.

## Thêm game mới

1. Chép `games/_template/` thành `games/<id>/`.
2. Sửa `meta.js`: `id`, `title`, `tagline`, `desc`, `tags` và `STORE_KEY` (khoá lưu riêng, ví dụ `'<id>-v1'`).
3. Thêm game vào `platform/games.js`:
   ```js
   import tenGame from '../games/<id>/meta.js';
   export const GAMES = [haoKhi, tenGame];
   ```
4. Viết game trong `main.js`. Chạy `python3 tests/test_platform.py`: bài `test_every_game_meta_is_complete_and_loads`
   sẽ mở game mới và báo nếu có lỗi console hoặc thiếu đường về trang chủ.

`meta.js` phải nhẹ: trang chủ import nó để vẽ thẻ, nên không import mã chạy game vào đó.

## Bộ mã dùng chung

| Module | Dùng để làm gì | Export chính |
|---|---|---|
| `core/loop.js` | Vòng lặp khung hình | `startLoop(update, render)` |
| `core/input.js` | Bàn phím và nút cảm ứng | `held`, `pressed`, `bindKeys(keymap, opts)`, `bindTouch(el, opts)` |
| `core/audio.js` | Âm thanh tổng hợp, không cần file | `ac()`, `tone()`, `noise()`, `createMusic(playStep)` |
| `core/storage.js` | Lưu vào trình duyệt, mã lưu | `readJSON`, `writeJSON`, `encodeSave`, `decodeSave` |
| `core/settings.js` | Cài đặt chung mọi game | `SETTINGS` (`music`, `sfx`, `shake`, `touch`), `saveSettings()`, `adoptSettings(cfg)` |
| `core/fx.js` | Hạt hiệu ứng, chữ bay | `spark`, `dust`, `floatText`, `updateParticles`, `drawParticles`, `drawTexts` |
| `core/util.js` | Tiện ích | `$`, `rand`, `clamp`, `pick`, `hash`, `overlap`, `prune`, `refill`, `fmtTime`, `esc` |
| `core/debug.js` | Đưa biến ra `window` khi có `?debug` | `debugOn()`, `exposeGlobals(modules, setters)` |
| `art/chibi.js` | Nhân vật vẽ bằng code | `drawChibi(c, x, y, look, pose)`, `drawBust(canvas, look)` |
| `art/poses.js` | Tư thế cơ bản | `POSES.idle/run/air/land/dash/hurt/guard/airkick/dead` |
| `art/draw.js` | Hình cơ bản | `rr`, `ell`, `shade`, `limb`, `outlinedText`, `groundShadow` |
| `art/props.js` | Đồ vật trên sân | `drawProp` |
| `ui/bar.js` | Đường về trang chủ | `mountHomeLink(container)` |
| `ui/theme.js` | Phông chữ canvas | `FD`, `FB` |

Một nhân vật là một "look" (bảng màu, mũ, vũ khí) cộng một tư thế:

```js
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'nonla', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };
drawChibi(ctx, x, y, HERO, { face: 1, t, ...POSES.run({ walk }) });
```

Các giá trị `hat` và `weapon` có sẵn ghi ở đầu `platform/art/chibi.js`. Ví dụ đầy đủ: `games/_template/main.js`.

### Quy ước

- **Lưu game**: mỗi game một khoá `localStorage` riêng. Âm lượng, rung màn hình và nút cảm ứng không lưu trong game
  mà đọc từ `SETTINGS`.
- **Mảng dùng chung giữa các module**: khai báo `const`, làm rỗng bằng `refill(arr)`, lọc bằng `prune(arr, keep)`.
  Module khác không gán lại được biến đã import, nên biến cần thay mới (như nhân vật `P`) phải có hàm `setP`.
- **Không chạy mã ở cấp cao nhất của module** ngoài khai báo. Việc gắn sự kiện đặt trong hàm `init...()` và gọi từ
  `main.js`, vì các module của game import vòng lẫn nhau.
- **Kiểm thử**: trang game mở với `?debug` thì có biến trên `window`; không có thì không lộ gì ra ngoài.

## Kiểm thử

```
python3 tests/test_platform.py     # trang chủ, cài đặt chung, tiến độ, game mẫu
python3 tests/test_hao_khi.py      # Hào Khí Việt Nam (chơi thật bằng bot, mất vài phút)
python3 tests/test_hao_khi.py stage_1   # chỉ các bài có "stage_1" trong tên
```

Cần `pip install playwright` và `playwright install chromium`.
