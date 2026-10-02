// Hằng số màn chơi và trạng thái trận đấu dùng chung giữa các file.
import { $, clamp } from '../../../platform/core/util.js';

export const cv = $('cv'), ctx = cv.getContext('2d');
export const W = 960, H = 540, GRAV = 2300;
export const GT = 372;                    // mép trên của mặt đất
export const LANES = [398, 444, 490];     // 3 làn đường: 0 = trong cùng, 2 = ngoài cùng
export const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);

export const G = { mode: 'title', t: 0, camX: 0, shake: 0, hitstop: 0, slow: 0, flashT: 0, lightning: 0, banner: null };
// P và ally bị thay mới mỗi ải: file khác đọc trực tiếp, muốn gán thì gọi setP / setAlly.
// Các mảng giữ nguyên một đối tượng suốt game: làm rỗng bằng refill, lọc bằng prune (platform/core/util.js).
export let P = null, ally = null, uid = 0;
export const enemies = [], projs = [], items = [], props = [];
export function setP(p) { P = p; }
export function setAlly(a) { ally = a; }
export const nextId = () => ++uid;

export const alive = e => e.state !== 'dead';
export const sameLane = (a, b) => Math.abs(a.gy - b.gy) < 24;
// Bám dần về làn đích (đổi làn mượt)
export function followLane(o, dt, spd = 300) { o.gy += clamp(LANES[o.lane] - o.gy, -spd * dt, spd * dt); }
