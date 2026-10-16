// Hằng số hình học + trạng thái dùng chung cho mọi module. Mảng dùng chung: làm rỗng bằng refill(), không gán lại biến.
// Chiến trường 1 làn đối xứng 2 căn cứ (kiểu Stick War): ta trái, địch phải, không còn hệ 3 làn/6 lô đất.
import { refill } from '../../../platform/core/util.js';
import { ERAS } from './data.js';

export const W = 960, H = 540, LANE_Y = 360;
export const HQ_X = 70, HQ_FRONT_X = 130;
export const OPP_HQ_X = 890, OPP_HQ_FRONT_X = 830;
export const ALLY_HOLD_X = 230;
export const MINE_X = 170, HOUSE_X = 110, BARRACKS_X = 230;
export const MAX_ALLIES = 8;

// phase: 'menu' | 'battle' | 'win' | 'lose'   stance: 'defend' | 'attack'
export const G = {
  eraIdx: -1, era: null, phase: 'menu', stance: 'defend', gold: 0, t: 0, shake: 0,
  hq: { hp: 0, maxHp: 0 }, oppHq: { hp: 0, maxHp: 0 },
  miners: { total: 0, atMine: 0 }, train: { queue: [] },
  enemySpawnT: 0, bossSpawned: false,
};
export const troops = [];  // { side:'ally'|'enemy', x, hp, maxHp, dmg, reach, spd, name, look, walk }

export function startEra(i) {
  if (!ERAS[i]) return; // chỉ số thời kỳ không hợp lệ: bỏ qua thay vì crash
  G.eraIdx = i; G.era = ERAS[i]; G.phase = 'battle'; G.stance = 'defend';
  G.gold = 40; G.t = 0; G.shake = 0;
  G.hq = { hp: G.era.hq.hp, maxHp: G.era.hq.hp };
  G.oppHq = { hp: G.era.oppHq.hp, maxHp: G.era.oppHq.hp };
  G.miners = { total: 0, atMine: 0 };
  G.train = { queue: [] };
  G.enemySpawnT = 0; G.bossSpawned = false;
  refill(troops);
}
