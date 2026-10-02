// Hiểm hoạ sân Bạch Đằng: đứng gần mép quá lâu thì mắc cọc, mất máu 1 lần rồi được tha cho tới lần đứng tiếp theo.
import { clamp } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { FIGHTERS, STAGES } from './data.js';
import { W } from './state.js';

export function updateHazard(f, stageId, dt) {
  const st = STAGES[stageId];
  if (!st || st.hazard !== 'stakes') { f.edgeT = 0; return; }
  const nearEdge = f.x < 76 || f.x > W - 76;
  f.edgeT = nearEdge ? (f.edgeT || 0) + dt : 0;
  if (f.edgeT >= 1.5) {
    f.edgeT = 0;
    f.hp = clamp(f.hp - 10, 0, FIGHTERS[f.fid].hp);
    f.x = clamp(f.x + (f.x < W / 2 ? 60 : -60), 36, W - 36); // đẩy vào giữa sân, không để đứng mãi trong bãi cọc
    spark(f.x, f.y - 60, 10, '#6fd06a');
  }
}
