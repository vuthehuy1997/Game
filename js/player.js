'use strict';
// Tiểu Hổ: chỉ số, điều khiển (A/D đi, W/S đổi làn, Space nhảy, Shift lướt), đòn đánh, 5 kỹ năng, tuyệt kỹ,
// kinh nghiệm và lên cấp. Cùng hàm gây sát thương lên địch. Mọi đòn chỉ trúng khi cùng làn (sameLane),
// trừ Địa Chấn Quyền và tuyệt kỹ Sát Thát.

function stats() {
  return { maxHp: 100 + 25 * S.up.hp, maxMp: 60 + 15 * S.up.mp, dmg: 1 + .2 * S.up.atk, regen: 6 + 2.5 * S.up.mp };
}
function newPlayer() {
  const st = stats();
  return {
    x: 140, lane: 1, gy: LANES[1], y: LANES[1], vx: 0, vy: 0, face: 1, air: false, airJumps: 0, state: 'idle', st: 0, t: 0,
    hp: st.maxHp, maxHp: st.maxHp, mp: st.maxMp, maxMp: st.maxMp, dmg: st.dmg, regen: st.regen,
    rage: ms('rage') ? 40 : 0, inv: 0, dashCd: 0, combo: 0, comboT: 0, buffer: false, hitSet: new Set(), walk: 0, shot: 0, poison: 0, ultDone: false,
    cds: Object.fromEntries(ACTIVE.map(id => [id, 0])), tick: 0,
  };
}

/* ---------------- Kinh nghiệm ---------------- */
function gainXp(n) {
  if (S.lv >= 30) return;
  S.xp += n;
  while (S.xp >= xpNeed(S.lv) && S.lv < 30) {
    S.xp -= xpNeed(S.lv); S.lv++; S.sp++;
    P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .25); P.mp = P.maxMp;
    floatText(P.x, P.y - 150, `Lên cấp ${S.lv}! +1 điểm kỹ năng`, '#8fe07a', 22);
    spark(P.x, P.y - 60, 20, '#8fe07a', 300); SFX.heal();
  }
}

/* ---------------- Damage ---------------- */
// Chuỗi đòn: mỗi đòn của Tiểu Hổ trúng địch +1; bị đánh trúng hoặc ngừng tay 2,5 giây thì về 0
function comboHit() { G.combo++; G.comboT = 2.5; G.maxCombo = Math.max(G.maxCombo, G.combo); }
// raw = đòn của đồng đội (không nhân sức mạnh của Tiểu Hổ)
function damageEnemy(e, dmg, dir, kb, heavy, raw) {
  if (!alive(e) || (e.state === 'down' && !heavy)) return false;
  const d = e.d, s = e.sc || 1;
  dmg = Math.round(dmg * (raw ? 1 : P.dmg));
  const rageMul = 1 + .25 * sk('haokhi');
  const front = e.face === -dir;
  if (d.block && !heavy && front && e.state !== 'strike' && e.state !== 'windup') {
    const bd = Math.max(1, Math.round(dmg * .15)); e.hp -= bd; e.flash = .06; e.vx = dir * 120; e.shieldRot = -.4;
    floatText(e.x, e.y - 110, 'Đỡ!', '#cfd6e0', 18); spark(e.x + e.face * 18, e.y - 50, 5, '#fff2c0', 200); SFX.block(); G.hitstop = .03;
    if (!raw) { P.rage = Math.min(100, P.rage + rageMul); comboHit(); }
    if (e.hp <= 0) killEnemy(e, dir);
    return true;
  }
  e.hp -= dmg; e.flash = .12;
  if (!raw) { P.rage = Math.min(100, P.rage + (heavy ? 5 : 3) * rageMul); comboHit(); }
  if (CFG.dmgNum) floatText(e.x + rand(-10, 10), e.y - 105 * s, String(dmg), heavy ? '#ffd35a' : raw ? '#bfe3ff' : '#fff', heavy ? 26 : 20);
  spark(e.x - dir * 6, e.y - 55, heavy ? 12 : 7, heavy ? '#ffd35a' : '#fff4d6');
  G.hitstop = Math.max(G.hitstop, heavy ? .08 : raw ? .02 : .045); G.shake = Math.max(G.shake, heavy ? 8 : 3);
  heavy ? SFX.heavy() : SFX.hit();
  if (d.boss) {
    e.stag = (e.stag || 0) + dmg;
    if (e.hp <= 0) { killEnemy(e, dir); return true; }
    if (e.stag >= 50 && (e.state === 'approach' || e.state === 'recover')) { e.stag = 0; e.state = 'hurt'; e.st = .35; e.vx = dir * 160; }
    return true;
  }
  if (e.hp <= 0) { killEnemy(e, dir); return true; }
  // giáp: lính đao lớn và chỉ huy không bị khựng bởi đòn nhẹ; đội trưởng không bị khựng khi đang vung đòn
  const armored = d.armor || e.rank === 'cmd' || (e.rank === 'cap' && e.state === 'windup');
  if (armored && !heavy) { e.vx = dir * 40; return true; }
  if (heavy && (d.armor || e.rank === 'cmd')) { e.state = 'hurt'; e.st = .35; e.vx = dir * kb * .4; return true; }
  if (heavy) { e.state = 'down'; e.st = .8; e.air = true; e.vy = -430; e.vx = dir * kb; }
  else { e.state = 'hurt'; e.st = .26; e.vx = dir * kb; }
  return true;
}
function killEnemy(e, dir) {
  e.state = 'dead'; e.deadT = 0; e.air = true; e.vy = -480; e.vx = dir * 260; e.hp = 0;
  const R = e.R || RANKS.n, [a, b] = e.d.coins, n = Math.round(rand(a, b) * R.coin);
  const coins = e.d.boss ? 10 : Math.min(8, Math.ceil(n / 2));
  for (let i = 0; i < coins; i++) dropItem('coin', e.x, e.gy, Math.max(1, Math.round(n / coins)));
  if (Math.random() < (e.d.boss || e.rank !== 'n' ? 1 : .12)) dropItem('banh', e.x, e.gy);
  gainXp(Math.round((e.d.xp || 8) * R.xp));
  if (e.d.boss) { G.slow = 1.4; G.shake = 14; SFX.boom(); spark(e.x, e.y - 70, 30, '#ffd35a', 500); }
}
function hurtPlayer(dmg, dir, opts = {}) {
  if (P.inv > 0 || P.state === 'dash' || P.state === 'ult' || P.state === 'rush' || P.state === 'dead' || G.mode !== 'play') return false;
  if (P.state === 'guard') { counterAttack(); return false; }
  dmg = Math.max(1, Math.round(dmg * (1 + G.tier * .1) * DIFF[CFG.diff].dmg * (ms('armor') ? .9 : 1)));
  P.hp -= dmg; P.inv = .9; G.combo = 0; P.rage = Math.min(100, P.rage + 8 * (1 + .25 * sk('haokhi'))); G.hits++;
  if (opts.poison) { P.poison = 3.5; floatText(P.x, P.y - 132, 'Trúng độc!', '#8fe07a', 18); }
  if (CFG.dmgNum) floatText(P.x, P.y - 110, '-' + dmg, '#ff6a5a', 22);
  spark(P.x, P.y - 55, 8, '#ff8a70'); G.shake = Math.max(G.shake, 7); G.hitstop = .06; SFX.hurt();
  if (P.hp <= 0) killPlayer(dir);
  else { P.state = 'hurt'; P.st = .3; P.vx = dir * 240; P.buffer = false; }
  return true;
}
function killPlayer(dir) {
  P.hp = 0; P.state = 'dead'; P.st = 0; P.air = true; P.vy = -420; P.vx = (dir || -P.face) * 220; G.overT = 1.6;
}
// Thiết Bố Sam: đỡ trúng thì phản đòn kẻ gần nhất phía trước cùng làn
function counterAttack() {
  const lv = sk('thietbo');
  P.state = 'counter'; P.st = .28; P.inv = .5; P.rage = Math.min(100, P.rage + 12);
  floatText(P.x, P.y - 130, 'Phản đòn!', '#ffd35a', 24); SFX.block(); SFX.heavy(); G.hitstop = .1; G.flashT = .15;
  let tgt = null, best = 160;
  enemies.forEach(e => { const dd = Math.abs(e.x - P.x); if (alive(e) && sameLane(e, P) && dd < best) { best = dd; tgt = e; } });
  if (tgt) { P.face = tgt.x > P.x ? 1 : -1; damageEnemy(tgt, 20 * (lv >= 3 ? 2 : 1), P.face, 400, true); }
  projs.forEach(q => { if (q.from === 'e' && (q.kind === 'arrow' || q.kind === 'pot') && Math.abs(q.x - P.x) < 120) q.dead = true; });
}

/* ---------------- Kỹ năng ---------------- */
const lvMul = (id, step = .3) => 1 + (sk(id) >= 2 ? step : 0);
function tryCast(id) {
  const def = SKILLS[id], lv = sk(id), p = P;
  if (!lv) { floatText(p.x, p.y - 120, `Chưa học ${def.name}`, '#cfd6e0', 15); return; }
  if (p.cds[id] > 0) { floatText(p.x, p.y - 120, `Hồi chiêu ${p.cds[id].toFixed(1)}s`, '#cfd6e0', 15); return; }
  if (p.mp < def.mp) { floatText(p.x, p.y - 120, 'Cạn nội lực', '#8fd6ff', 16); return; }
  p.mp -= def.mp; p.cds[id] = def.cd[lv - 1]; p.st = 0; p.hitSet = new Set(); p.tick = 0;
  switch (id) {
    case 'chuong': p.state = 'cast'; p.shot = 0; p.vx = 0; break;
    case 'xoay': p.state = 'spin'; SFX.swing(); floatText(p.x, p.y - 140, 'Toàn Phong Cước!', '#ffe6a8', 18); break;
    case 'hoxung': p.state = 'rush'; SFX.dash(); floatText(p.x, p.y - 140, 'Bạch Hổ Xung!', '#ffe6a8', 18); break;
    case 'thietbo': p.state = 'guard'; p.vx = 0; SFX.block(); break;
    case 'diachan': p.state = 'quake'; p.vx = 0; p.vy = -420; p.air = true; floatText(p.x, p.y - 150, 'Địa Chấn Quyền!', '#ffe6a8', 20); break;
  }
}

/* ---------------- Player update ---------------- */
function startAttack() {
  P.combo = (P.comboT > 0 && P.combo < 3) ? P.combo + 1 : 1;
  P.state = 'attack'; P.st = 0; P.hitSet = new Set(); P.buffer = false; SFX.swing();
}
function hitEnemiesIn(hb, dmg, kb, heavy, onHit) {
  enemies.forEach(e => {
    if (!P.hitSet.has(e.id) && sameLane(e, P) && overlap(hb, hurtbox(e)) && damageEnemy(e, dmg, P.face, kb, heavy)) { P.hitSet.add(e.id); onHit && onHit(e); }
  });
  hitProps(hb, P.gy);
}
function updatePlayer(dt) {
  const p = P; p.t += dt; p.inv = Math.max(0, p.inv - dt); p.dashCd -= dt; p.comboT -= dt;
  for (const id in p.cds) p.cds[id] = Math.max(0, p.cds[id] - dt);
  p.mp = Math.min(p.maxMp, p.mp + p.regen * dt);
  if (p.poison > 0 && p.state !== 'dead') {
    p.poison -= dt; p.hp -= 4 * dt;
    if (Math.random() < dt * 8) parts.push({ x: p.x + rand(-14, 14), y: p.y - rand(60, 100), vx: 0, vy: -40, life: .6, max: .6, col: 'rgba(120,220,110,.7)', size: rand(2, 4), kind: 'dust' });
    if (p.hp <= 0) killPlayer(0);
  }
  const mv = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  const free = p.state === 'idle' || p.state === 'run' || p.state === 'air';
  if (free || p.state === 'dash' || p.state === 'spin') {
    // đổi làn: W lên (vào trong), S xuống (ra ngoài)
    if (pressed.has('up') && p.lane > 0) { p.lane--; dust(p.x, p.gy, 3); }
    if (pressed.has('down') && p.lane < 2) { p.lane++; dust(p.x, p.gy, 3); }
  }
  const lien = sk('lienhoan');
  if (free) {
    if (mv) { p.face = mv; p.vx = mv * 270; p.walk += dt * 14; } else p.vx = p.air ? p.vx * .9 : 0;
    const shifting = Math.abs(p.gy - LANES[p.lane]) > 1;
    if (!mv && shifting) p.walk += dt * 14;
    p.state = p.air ? 'air' : (mv || shifting ? 'run' : 'idle');
    if (pressed.has('jump')) {
      if (!p.air) { p.vy = -780; p.air = true; p.airJumps = sk('phicuoc') >= 2 ? 1 : 0; p.state = 'air'; SFX.jump(); dust(p.x, p.gy, 4); }
      else if (p.airJumps > 0) { p.airJumps--; p.vy = -680; SFX.jump(); spark(p.x, p.y - 10, 8, '#e9b949', 150); }
    }
    const skillKey = ACTIVE.findIndex((id, i) => pressed.has('s' + (i + 1)));
    if (pressed.has('atk')) {
      if (p.air) { p.state = 'airkick'; p.st = 0; p.hitSet = new Set(); p.vx = p.face * 430; p.vy = Math.max(p.vy, 260); SFX.swing(); }
      else startAttack();
    } else if (skillKey >= 0) {
      if (ACTIVE[skillKey] === 'diachan' || !p.air || ACTIVE[skillKey] === 'chuong') tryCast(ACTIVE[skillKey]);
    } else if (pressed.has('dash') && p.dashCd <= 0) {
      if (mv) p.face = mv;
      p.state = 'dash'; p.st = 0; p.dashCd = [.55, .45, .38, .25][sk('thanphap')]; p.hitSet = new Set(); SFX.dash();
    } else if (pressed.has('ult')) {
      if (p.rage >= 100) { p.state = 'ult'; p.st = 0; p.rage = 0; p.vx = 0; p.ultDone = false; G.ultT = 1.25; SFX.ult(); }
      else floatText(p.x, p.y - 120, 'Hào khí chưa đầy', '#ffd35a', 16);
    }
  } else if (p.state === 'attack') {
    const a = ATK[p.combo], spd = lien >= 2 ? 1.18 : 1; p.st += dt * spd;
    if (pressed.has('atk') && p.st > a.dur * .35) p.buffer = true;
    if (mv && p.st < .05) p.face = mv;
    p.vx = p.st < a.a1 ? p.face * a.lunge * (1 - p.st / a.a1) : 0;
    if (p.st >= a.a0 && p.st <= a.a1) {
      const hb = { x: p.face > 0 ? p.x + 6 : p.x - 6 - a.w, y: p.y - 88, w: a.w, h: 70 };
      hitEnemiesIn(hb, a.dmg * (1 + .15 * lien), a.kb, a.heavy);
      projs.forEach(q => { if ((q.kind === 'arrow' || q.kind === 'pot') && sameLane(q, p) && overlap(hb, { x: q.x - 12, y: q.y - 6, w: 24, h: 12 })) { q.dead = true; spark(q.x, q.y, 5, '#fff'); SFX.block(); } });
      // Liên Hoàn Quyền tầng 3: đòn thứ ba tung sóng quyền ngắn
      if (p.combo === 3 && lien >= 3 && !p.shot) { p.shot = 1; projs.push({ kind: 'chuong', small: true, from: 'p', x: p.x + p.face * 50, y: p.y - 58, gy: p.gy, vx: p.face * 700, vy: 0, dmg: 10, life: .3, hit: new Set(), t: 0 }); }
    }
    if (p.st >= a.dur) { p.comboT = .42; p.shot = 0; if (p.buffer) startAttack(); else { p.state = 'idle'; if (p.combo >= 3) p.comboT = 0; } }
  } else if (p.state === 'airkick') {
    p.st += dt;
    const pc = sk('phicuoc'), dmg = 13 * (1 + (pc >= 1 ? .4 : 0) + (pc >= 3 ? .4 : 0));
    hitEnemiesIn({ x: p.face > 0 ? p.x : p.x - 60, y: p.y - 50, w: 60, h: 50 }, dmg, 320, true, () => { p.vy = -380; });
  } else if (p.state === 'land' || p.state === 'counter') {
    p.st -= dt; p.vx *= .8; if (p.st <= 0) p.state = 'idle';
  } else if (p.state === 'cast') {
    // Chưởng Long Biên: tầng 3 phóng hai chưởng
    p.st += dt;
    const lv = sk('chuong'), shots = lv >= 3 ? 2 : 1;
    if (p.shot < shots && p.st >= .13 + p.shot * .17) {
      p.shot++; SFX.chuong();
      projs.push({ kind: 'chuong', from: 'p', x: p.x + p.face * 40, y: p.y - 58, gy: p.gy, vx: p.face * 660, vy: 0, dmg: 22 * lvMul('chuong'), life: .95, hit: new Set(), t: 0 });
    }
    if (p.st >= .2 + shots * .17) p.state = p.air ? 'air' : 'idle';
  } else if (p.state === 'spin') {
    // Toàn Phong Cước: 5 nhịp đá quanh người, đi chậm được
    p.st += dt; p.tick -= dt; p.vx = mv * 120; if (mv) p.face = mv;
    const lv = sk('xoay');
    if (p.tick <= 0) {
      p.tick = .11; p.hitSet = new Set(); SFX.swing();
      const last = p.st > .44;
      enemies.forEach(e => { if (alive(e) && sameLane(e, p) && Math.abs(e.x - p.x) < 90 && damageEnemy(e, 6 * lvMul('xoay'), e.x > p.x ? 1 : -1, last ? 300 : 40, last)) {} });
      hitProps({ x: p.x - 90, y: p.y - 90, w: 180, h: 90 }, p.gy);
    }
    if (lv >= 3) enemies.forEach(e => { if (alive(e) && sameLane(e, p) && !e.d.boss && Math.abs(e.x - p.x) < 220) e.x += Math.sign(p.x - e.x) * 140 * dt; });
    if (Math.random() < .7) parts.push({ x: p.x + rand(-60, 60), y: p.y - rand(20, 80), vx: rand(-60, 60), vy: rand(-30, 30), life: .25, max: .25, col: 'rgba(255,230,168,.6)', size: rand(3, 5), kind: 'dust' });
    if (p.st >= .55) p.state = p.air ? 'air' : 'idle';
  } else if (p.state === 'rush') {
    // Bạch Hổ Xung: lao thẳng, húc văng mọi kẻ cùng làn trên đường
    p.st += dt; const lv = sk('hoxung'), dur = lv >= 3 ? .42 : .32;
    p.vx = p.face * 950; p.inv = Math.max(p.inv, .1);
    hitEnemiesIn({ x: p.x - 40, y: p.y - 95, w: 80, h: 95 }, 18 * lvMul('hoxung'), 420, true);
    if (Math.random() < .9) parts.push({ x: p.x - p.face * 20, y: p.y - rand(20, 90), vx: -p.face * 200, vy: 0, life: .3, max: .3, col: 'rgba(255,255,255,.7)', size: rand(3, 7), kind: 'dust' });
    if (p.st >= dur) { p.state = 'idle'; p.vx = p.face * 100; }
  } else if (p.state === 'guard') {
    p.st += dt; p.vx = 0;
    if (p.st >= [.6, .8, .8][sk('thietbo') - 1]) p.state = 'idle';
  } else if (p.state === 'quake') {
    // Địa Chấn Quyền: bật lên rồi đấm xuống, chấn động cả 3 làn quanh mình
    p.st += dt;
    if (!p.air && p.st > .1 && !p.shot) {
      p.shot = 1; const lv = sk('diachan'), rad = lv >= 3 ? 240 : 170;
      G.shake = 14; G.flashT = .12; SFX.boom();
      for (let i = 0; i < 24; i++) parts.push({ x: p.x + rand(-rad, rad), y: LANES[(Math.random() * 3) | 0], vx: rand(-60, 60), vy: rand(-260, -80), life: .6, max: .6, col: 'rgba(200,170,120,.8)', size: rand(4, 8), kind: 'dust' });
      enemies.forEach(e => { if (alive(e) && Math.abs(e.x - p.x) < rad) damageEnemy(e, 24 * lvMul('diachan'), e.x > p.x ? 1 : -1, 260, true); });
      props.forEach(pr => { if (Math.abs(pr.x - p.x) < rad) breakProp(pr); });
    }
    if (p.shot && p.st > .45) { p.state = 'idle'; p.shot = 0; }
  } else if (p.state === 'dash') {
    p.st += dt; p.vx = p.face * 780; p.inv = Math.max(p.inv, .05);
    if (sk('thanphap') >= 2) hitEnemiesIn({ x: p.x - 30, y: p.y - 90, w: 60, h: 90 }, 6, 120, false);
    if (Math.random() < .8) parts.push({ x: p.x, y: p.y - rand(10, 80), vx: -p.face * 120, vy: 0, life: .25, max: .25, col: 'rgba(233,185,73,.55)', size: rand(3, 6), kind: 'dust' });
    if (p.st >= .2) { p.state = p.air ? 'air' : 'idle'; p.vx = p.face * 120; }
  } else if (p.state === 'hurt') {
    p.st -= dt; p.vx *= .88; if (p.st <= 0) p.state = p.air ? 'air' : 'idle';
  } else if (p.state === 'ult') {
    p.st += dt; p.inv = .2;
    if (p.st >= .95 && !p.ultDone) {
      p.ultDone = true; G.shake = 18; G.flashT = .5; P.poison = 0;
      const dmg = 60 * (1 + .3 * sk('haokhi'));
      enemies.forEach(e => {   // tuyệt kỹ đánh cả 3 làn
        if (!alive(e) || e.x < G.camX - 40 || e.x > G.camX + W + 40) return;
        damageEnemy(e, dmg, e.x >= p.x ? 1 : -1, 420, true);
        if (e.d.boss && alive(e)) { e.state = 'hurt'; e.st = .8; }
      });
      props.forEach(pr => breakProp(pr));
      projs.forEach(q => { if (q.from === 'e') q.dead = true; });
    }
    if (p.st >= 1.25) p.state = 'idle';
  } else if (p.state === 'dead') {
    p.st += dt; p.vx *= .95;
  }

  // vật lý: bám làn + trọng lực
  followLane(p, dt);
  if (p.air) p.vy += GRAV * dt * (p.state === 'dash' || p.state === 'rush' ? 0 : 1);
  if ((p.state === 'dash' || p.state === 'rush') && p.air) p.vy = Math.min(p.vy, 0) * .5;
  p.x += p.vx * dt;
  if (p.air) {
    p.y += p.vy * dt;
    if (p.y >= p.gy) { p.y = p.gy; p.vy = 0; p.air = false; dust(p.x, p.gy, 5); if (p.state === 'airkick') { p.state = 'land'; p.st = .12; } }
  } else p.y = p.gy;
  const lo = Math.max(24, G.camX + 24), hi = G.lock ? G.camX + W - 24 : G.st.len - 24;
  p.x = clamp(p.x, lo, hi);
}
