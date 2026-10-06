// Danh sách game của nền tảng. Thêm game mới: tạo games/<id>/ (chép từ games/_template), rồi thêm một dòng import
// và đưa nó vào mảng GAMES. Thứ tự trong mảng là thứ tự hiện trên trang chủ.
//
// Mỗi meta.js export default:
//   { id, title, tagline, desc, tags: [..], url,
//     progress(): { pct: 0..1, text, updated: ms } | null    (không bắt buộc)
//     cover(canvas)                                          (không bắt buộc: tự vẽ ảnh bìa 16:9) }
import haoKhi from '../games/hao-khi/meta.js';
import doiKhangAnhHung from '../games/doi-khang-anh-hung/meta.js';
import giuNuoc from '../games/giu-nuoc-qua-ngan-nam/meta.js';
import banNa from '../games/ban-na/meta.js';
import chayLang from '../games/chay-lang/meta.js';
import noiNgoc from '../games/noi-ngoc/meta.js';
import banBong from '../games/ban-bong/meta.js';
import langNghe from '../games/lang-nghe/meta.js';
import dungNuoc from '../games/dung-nuoc/meta.js';
import moCoi from '../games/mo-coi/meta.js';
import coThanh from '../games/co-thanh-ngan-nam/meta.js';
import namTien from '../games/nam-tien/meta.js';

export const GAMES = [haoKhi, doiKhangAnhHung, giuNuoc, banNa, chayLang, noiNgoc, banBong, langNghe, dungNuoc, moCoi, coThanh, namTien];
