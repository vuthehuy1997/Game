// Đưa trạng thái và hàm luật chơi ra window để Playwright gọi trực tiếp, chỉ khi có ?debug. Dùng
// `import * as module` (không phải object literal) để tránh chụp giá trị cũ của các export `let` có
// thể gán lại (grid/gridW/gridH/exitPos trong state.js) — xem ghi chú trong platform/core/debug.js.
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import * as state from './state.js';
import * as logic from './logic.js';
import * as flow from './flow.js';
import * as data from './data.js';
import * as mapMod from './map.js';
import * as input from '../../../platform/core/input.js';

if (debugOn()) exposeGlobals([state, logic, flow, data, mapMod, input]);
