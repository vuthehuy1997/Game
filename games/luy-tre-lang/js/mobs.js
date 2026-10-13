// Quái đêm: sinh ra, di chuyển, cận chiến với người chơi.
import { rand, prune } from '../../../platform/core/util.js';
import { tone } from '../../../platform/core/audio.js';
import { COLS, TS, MOB_DEF, MAX_MOBS, SPAWN_EVERY, PLAYER_H } from './data.js';
import { G, isNight } from './state.js';
import { topSolidRow } from './world.js';
import { weaponDmg } from './player.js';

export function spawnOneMob() {
  const kind = Math.random() < .5 ? 'ma_troi' : 'quai_rung';
  const def = MOB_DEF[kind];
  const side = Math.random() < .5 ? -1 : 1;
  const col = Math.max(2, Math.min(COLS - 3, Math.floor(G.px / TS) + side * (18 + ((Math.random() * 12) | 0))));
  const x = (col + .5) * TS;
  const y = def.fly ? G.py - rand(60, 160) : topSolidRow(G.tiles, col) * TS;
  G.mobs.push({ kind, hp: def.hp, x, y, baseY: y, atkCd: 0 });
}

export function spawnMobsIfNeeded(dt) {
  G.spawnT += dt;
  if (!isNight() || G.mobs.length >= MAX_MOBS) return;
  if (G.spawnT >= SPAWN_EVERY) { G.spawnT = 0; spawnOneMob(); }
}

export function despawnAllMobs() { G.mobs.length = 0; }

export function damagePlayer(dmg) {
  if (G.hurt > 0 || G.hp <= 0) return;
  G.hp -= dmg; G.hurt = .6;
  tone(120, .12, 'sawtooth', .06);
  if (G.hp <= 0) respawnPlayer();
}
export function respawnPlayer() {
  const col = COLS >> 1;
  G.hp = G.maxHp; G.px = (col + .5) * TS; G.py = topSolidRow(G.tiles, col) * TS; G.vx = 0; G.vy = 0;
}

function killMob(mob) {
  G.gold += 3;
  for (const q of G.quests) if (q.type === 'kill' && !q.claimed) q.have = Math.min(q.need, q.have + 1);
}

export function updateMobs(dt) {
  for (const m of G.mobs) {
    const def = MOB_DEF[m.kind];
    const dir = Math.sign(G.px - m.x) || 1;
    m.x += dir * def.speed * dt;
    if (!def.fly) m.y = topSolidRow(G.tiles, Math.max(0, Math.min(COLS - 1, Math.floor(m.x / TS)))) * TS;
    m.atkCd -= dt;
    if (Math.abs(m.x - G.px) < 16 && Math.abs(m.y - G.py) < PLAYER_H && m.atkCd <= 0) {
      damagePlayer(def.dmg); m.atkCd = 1;
    }
  }
  if (!isNight()) despawnAllMobs();
}

export function attackMobs() {
  if (G.atkCd > 0) return false;
  G.atkCd = .35;
  const range = 1.4 * TS, dmg = weaponDmg();
  let hit = false;
  for (const m of G.mobs) {
    if (Math.abs(m.x - G.px) < range && Math.abs(m.y - G.py) < PLAYER_H) { m.hp -= dmg; hit = true; }
  }
  if (hit) tone(880, .08, 'square', .06);
  const dead = G.mobs.filter(m => m.hp <= 0);
  for (const m of dead) killMob(m);
  prune(G.mobs, m => m.hp > 0);
  return hit;
}
