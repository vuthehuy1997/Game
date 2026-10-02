// Trạng thái runtime: 1 fighter, 1 trận. W/H là kích thước sàn dùng chung cho mọi module.
import { FIGHTERS } from './data.js';

export const W = 960, H = 540, GROUND = 440;

export function newFighter(fid, side, x) {
  const d = FIGHTERS[fid];
  return {
    fid, side, x, y: GROUND, vx: 0, vy: 0, face: side === 'p1' ? 1 : -1,
    hp: d.hp, maxHp: d.hp, meter: 0, t: 0, walk: 0, st: 0,
    state: 'idle', atk: null, guard: false, dashT: 0, dashCd: 0, counterT: 0, hitstun: 0,
  };
}

export function newMatch(f1id, f2id, stageId, p2cpu, diff) {
  return {
    mode: 'fight', stageId, p1id: f1id, p2id: f2id, p2cpu, diff,
    f1: newFighter(f1id, 'p1', 260), f2: newFighter(f2id, 'p2', 700),
    round: 1, wins: [0, 0], timer: 60, t: 0, shake: 0, banner: null,
  };
}
