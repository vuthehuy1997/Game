'use strict';
// Hằng số, hàm tiện ích, hệ thống lưu (3 ô + cài đặt) và trạng thái dùng chung giữa các file.

const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const W = 960, H = 540, GRAV = 2300;
const GT = 372;                    // mép trên của mặt đất
const LANES = [398, 444, 490];     // 3 làn đường: 0 = trong cùng, 2 = ngoài cùng
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[(Math.random() * arr.length) | 0];
const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const FD = "'Pattaya', Georgia, serif", FB = "'Itim', 'Segoe UI', sans-serif";
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- Lưu game ----------------
   STORE = { slots: [save|null ×3], cur: ô đang chơi, cfg: cài đặt }
   S     = bản lưu của ô đang chơi (tiến độ, tiền, luyện công, sao) */
const STORE_KEY = 'haokhi-dong-a-v3';
const newSave = () => ({
  stage: 0, maxStage: 0, coins: 0, up: { atk: 0, hp: 0, mp: 0 }, stars: [], play: 0, updated: 0,
  lv: 1, xp: 0, sp: 1, skills: { chuong: 1 },   // cấp độ, kinh nghiệm, điểm kỹ năng chưa dùng, cấp từng kỹ năng
  ch: [], ms: {},                                // ấn thử thách đã đạt theo ải, phần thưởng mốc sao đã nhận
});
const DEFAULT_CFG = { music: 60, sfx: 80, diff: 1, shake: true, dmgNum: true, textSpeed: 2, touch: 'auto' };
const DIFF = [
  { name: 'Dễ', desc: 'Giặc yếu hơn, đánh nhẹ tay. Mỗi ải tối đa 2★', hp: .8, dmg: .6 },
  { name: 'Thường', desc: 'Như sử sách ghi chép', hp: 1, dmg: 1 },
  { name: 'Khó', desc: 'Giặc lì đòn và hung hãn. Thắng thì được ấn Hổ tướng', hp: 1.25, dmg: 1.4 },
];
const TEXT_SPEED = [{ name: 'Chậm', cps: 28 }, { name: 'Vừa', cps: 45 }, { name: 'Nhanh', cps: 80 }, { name: 'Tức thì', cps: 1e4 }];

let STORE = { slots: [null, null, null], cur: 0, cfg: { ...DEFAULT_CFG } };
try {
  const s = JSON.parse(localStorage.getItem(STORE_KEY));
  if (s && Array.isArray(s.slots)) STORE = { ...STORE, ...s, cfg: { ...DEFAULT_CFG, ...(s.cfg || {}) } };
  else {
    const old = JSON.parse(localStorage.getItem('haokhi-dong-a-v2')); // chuyển bản lưu đời trước vào ô 1
    if (old && old.up) STORE.slots[0] = Object.assign(newSave(), old, { updated: Date.now() });
  }
} catch (e) {}
const CFG = STORE.cfg;
let S = Object.assign(newSave(), STORE.slots[STORE.cur] || {});
const sk = id => (S.skills && S.skills[id]) || 0;   // cấp hiện tại của một kỹ năng

function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); return true; } catch (e) { return false; } }
function save() { S.updated = Date.now(); STORE.slots[STORE.cur] = S; return persist(); }
function useSlot(i, fresh) {
  STORE.cur = i;
  S = (fresh || !STORE.slots[i]) ? newSave() : Object.assign(newSave(), STORE.slots[i]);
  if (!S.skills || !S.skills.chuong) S.skills = Object.assign({ chuong: 1 }, S.skills);
  if (!Array.isArray(S.ch)) S.ch = [];
  if (!S.ms) S.ms = {};
  if (fresh) save(); else persist();
}
// Mã lưu để chuyển sang máy khác
function exportCode(data) { return 'HKDA1:' + btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
function importCode(code) {
  const m = String(code).trim().match(/^HKDA1:([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    if (!d || typeof d.stage !== 'number' || !d.up) return null;
    return Object.assign(newSave(), d);
  } catch (e) { return null; }
}

/* ---------------- Shared world state ---------------- */
const G = { mode: 'title', t: 0, camX: 0, shake: 0, hitstop: 0, slow: 0, flashT: 0, lightning: 0, banner: null };
let P = null, ally = null, enemies = [], projs = [], parts = [], texts = [], items = [], props = [], uid = 0;
let DLG = null;

const alive = e => e.state !== 'dead';
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const sameLane = (a, b) => Math.abs(a.gy - b.gy) < 24;
// Bám dần về làn đích (đổi làn mượt)
function followLane(o, dt, spd = 300) { o.gy += clamp(LANES[o.lane] - o.gy, -spd * dt, spd * dt); }
