// Nhịp cập nhật tổng: vật lý, ngày đêm, quái vật.
import { DAY_LEN } from './data.js';
import { G } from './state.js';
import { physicsStep } from './player.js';
import { spawnMobsIfNeeded, updateMobs } from './mobs.js';
import { spawnAnimalsIfNeeded, updateAnimals } from './animals.js';

export function tick(dt) {
  physicsStep(dt);
  G.time += dt / DAY_LEN;
  if (G.time >= 1) { G.time -= 1; G.day += 1; }
  spawnMobsIfNeeded(dt);
  updateMobs(dt);
  spawnAnimalsIfNeeded(dt);
  updateAnimals(dt);
}
