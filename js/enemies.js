'use strict';
// Quân địch, AI boss (2 giai đoạn) và đồng đội đánh cùng. Địch tự đổi làn để đuổi theo Tiểu Hổ.

const hurtbox = e => { const s = e.sc || 1; return { x: e.x - 17 * s, y: e.y - 100 * s, w: 34 * s, h: 100 * s }; };
const scaleOf = e => e.sc || 1;
// Sát thương và tốc độ thực tế: theo cấp bậc, cộng thêm 20% nếu đứng gần lính trống hoặc chỉ huy
const edmg = e => e.dmg * (e.buff ? 1.2 : 1);
const espd = e => e.d.spd * (e.buff ? 1.2 : 1);

// spec: 'soldier' (lính thường), 'soldier:cap' (đội trưởng), 'soldier:cmd' (chỉ huy), hoặc tên boss
function spawnEnemy(spec, side, lane) {
  const [type, rk = 'n'] = spec.split(':'), d = EDEF[type], R = RANKS[rk] || RANKS.n;
  const mul = (d.boss ? 1 : (1 + G.stage * .16)) * DIFF[CFG.diff].hp * R.hp;
  if (lane == null) lane = d.boss ? P.lane : (Math.random() * 3) | 0;
  const x = side > 0 ? G.camX + W + 50 : G.camX - 50;
  const e = {
    id: ++uid, type, d, rank: rk, R, sc: (LOOKS[type].scale || 1) * R.sc, dmg: d.dmg * R.dmg,
    x, lane, gy: LANES[lane], y: LANES[lane], vx: 0, vy: 0, face: -side, air: false, state: 'approach', st: 0, t: rand(0, 5),
    cd: rand(.6, 1.4), laneCd: rand(.4, 1.2), hp: d.hp * mul, maxHp: d.hp * mul, flash: 0, walk: 0, hitDone: false, shieldRot: 0, entering: true, summons: 0, comboLeft: 0, buff: false,
  };
  if (d.boss) { G.boss = e; e.cd = 1.4; banner(`${d.rank} ${d.name}`, d.grand ? 'Đại tướng giặc xuất trận' : 'Tướng giặc xuất hiện', 2); SFX.gong(); }
  else if (rk !== 'n') floatText(x + (side > 0 ? -80 : 80), e.y - 150, `${R.label} ${d.name}`, rk === 'cmd' ? '#ffd35a' : '#ffb4a6', 18);
  enemies.push(e); return e;
}
function enemyStrike(e, reach, dmg, h = 70) {
  const s = scaleOf(e);
  const hb = { x: e.face > 0 ? e.x : e.x - reach, y: e.y - 90 * s, w: reach, h: h * s };
  if (sameLane(e, P) && overlap(hb, hurtbox(P))) hurtPlayer(dmg, e.face);
}
// Bắn tên dọc theo một làn (mặc định làn của cung thủ)
function fireArrow(e, lane = e.lane, poison = false) {
  const s = scaleOf(e), gy = LANES[lane];
  const sx = e.x + e.face * 26 * s, sy = gy - 58 * s;
  const aimY = lane === P.lane ? P.y - 55 : gy - 55;
  const ang = Math.atan2(aimY - sy, Math.abs(P.x - sx)) * .6, sp = 560;
  projs.push({ kind: 'arrow', from: 'e', x: sx, y: sy, gy, vx: e.face * Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg: poison ? edmg(e) * .6 : edmg(e), life: 2, poison });
  SFX.arrow();
}
// Ném hũ lửa theo đường cong rơi đúng vị trí tx, làn lane sau khoảng thời gian t
function throwPot(e, tx, t = .9, lane = P.lane) {
  const gy = LANES[lane], sx = e.x + e.face * 20, sy = e.y - 70 * scaleOf(e);
  projs.push({ kind: 'pot', from: 'e', x: sx, y: sy, gy, vx: (tx - sx) / t, vy: ((gy - 6 - sy) - .5 * GRAV * t * t) / t, dmg: e.d.boss ? 10 : edmg(e), life: 3, t: 0 });
  SFX.swing();
}
// Địch đổi dần sang làn của Tiểu Hổ (mỗi lần một làn, có độ trễ để người chơi né được)
function chaseLane(e, dt) {
  e.laneCd -= dt;
  if (e.lane !== P.lane && e.laneCd <= 0) { e.lane += Math.sign(P.lane - e.lane); e.laneCd = e.d.boss ? rand(.35, .7) : rand(.8, 1.6); }
}
const inLane = e => e.lane === P.lane && Math.abs(e.gy - LANES[e.lane]) < 4;

function updateEnemy(e, dt) {
  const d = e.d; e.t += dt; e.flash -= dt; e.shieldRot *= .85;
  followLane(e, dt, 220);
  if (e.air || e.y < e.gy) {
    e.vy += GRAV * dt; e.y += e.vy * dt;
    if (e.y >= e.gy) {
      e.y = e.gy; e.vy = 0;
      if (e.air) { e.air = false; dust(e.x, e.gy, 5); if (e.state === 'slamUp') slamLand(e); }
    }
  } else e.y = e.gy;
  e.x += e.vx * dt;
  if (e.entering) { if (e.x > G.camX + 30 && e.x < G.camX + W - 30) e.entering = false; }
  else if (G.lock) e.x = clamp(e.x, G.camX + 20, G.camX + W - 20);

  if (e.state === 'dead') { e.vx *= .95; e.deadT += dt; if (e.deadT > 1.2) e.remove = true; return; }
  if (e.state === 'down') { if (!e.air) { e.vx *= .8; e.st -= dt; if (e.st <= 0) { e.state = 'approach'; e.cd = Math.max(e.cd, .6); } } return; }
  if (e.state === 'hurt') { e.vx *= .85; e.st -= dt; if (e.st <= 0) e.state = 'approach'; return; }
  if (G.ultT > 0) { e.vx = 0; return; }
  if (P.state === 'dead') { e.vx = 0; if (e.state !== 'approach') e.state = 'approach'; return; }
  e.buff = enemies.some(o => o !== e && alive(o) && !o.entering && (o.d.support || o.rank === 'cmd') && Math.abs(o.x - e.x) < 320);
  if (d.boss) return bossAI(e, dt);
  // chỉ huy còn nửa máu thì gọi tiếp viện một lần
  if (e.rank === 'cmd' && !e.called && e.hp < e.maxHp * .5) {
    e.called = true; floatText(e.x, e.y - 175, 'Tiếp viện!', '#ffd35a', 24); SFX.gong();
    spawnEnemy(e.type === 'potter' ? 'potter' : 'soldier', 1); spawnEnemy('sword', -1);
  }
  // lính trống: đứng xa đánh trống thúc quân, không trực tiếp đánh
  if (d.support) {
    e.face = P.x > e.x ? 1 : -1;
    if (e.entering) { const dir = e.x < G.camX + W / 2 ? 1 : -1; e.face = dir; e.vx = dir * espd(e); e.walk += dt * 11; return; }
    let target = clamp(P.x - e.face * 360, G.camX + 50, G.camX + W - 50);
    const diff = target - e.x; e.vx = Math.abs(diff) > 12 ? Math.sign(diff) * espd(e) : 0; if (e.vx) e.walk += dt * 11;
    e.cd -= dt; if (e.cd <= 0) { e.cd = rand(2.5, 4); floatText(e.x, e.y - 130, pick(['Thùng! Thùng!', 'Xông lên!', 'Tiến!']), '#ffb4a6', 15); tone(90, .25, 'sine', .08); }
    return;
  }

  const dx = P.x - e.x, dist = Math.abs(dx);
  e.cd -= dt;
  switch (e.state) {
    case 'approach': {
      e.face = dx > 0 ? 1 : -1;
      // vừa xuất hiện: đi hẳn vào trong màn hình trước đã
      if (e.entering) { const dir = e.x < G.camX + W / 2 ? 1 : -1; e.face = dir; e.vx = dir * espd(e); e.walk += dt * 11; break; }
      chaseLane(e, dt);
      const want = d.ranged ? (d.pot ? 250 : 300) + (e.id % 3) * 30 : d.reach * .8 + (e.id % 3) * 10;
      let target = P.x - e.face * want;
      // cung thủ lùi lại giữ khoảng cách nhưng không được lùi ra ngoài khung hình
      if (G.lock) target = clamp(target, G.camX + 50, G.camX + W - 50);
      const diff = target - e.x;
      if (Math.abs(diff) > 10) { e.vx = Math.sign(diff) * espd(e); e.walk += dt * 11; } else { e.vx = 0; if (e.lane !== P.lane) e.walk += dt * 11; }
      const busy = enemies.filter(o => o !== e && !o.d.ranged && o.lane === e.lane && (o.state === 'windup' || o.state === 'strike' || o.state === 'lunge')).length;
      if (e.cd <= 0 && inLane(e)) {
        if (d.pot && dist < 560) { e.state = 'windup'; e.st = d.wind; e.vx = 0; }
        else if (d.ranged && dist < 560) { e.state = 'windup'; e.st = d.wind; e.vx = 0; }
        else if (d.lunge && dist > 130 && dist < 380 && busy < 2) { e.state = 'windup'; e.st = .55; e.vx = 0; e.move = 'lunge'; }
        else if (!d.ranged && dist < d.reach + 16 && Math.abs(P.y - e.y) < 90 && busy < 2) { e.state = 'windup'; e.st = d.wind; e.vx = 0; e.move = 'strike'; e.comboLeft = (d.combo || 1) - 1 + (e.rank !== 'n' ? 1 : 0); }
      } else if (d.pot && e.cd <= 0 && dist < 560) { e.state = 'windup'; e.st = d.wind; e.vx = 0; } // hũ lửa ném được sang làn khác
      break;
    }
    case 'windup':
      e.vx = 0; e.st -= dt;
      if (e.st <= 0) {
        if (d.pot) { throwPot(e, P.x + rand(-30, 30)); e.state = 'recover'; e.st = .5; e.cd = rand(2.2, 3.4); }
        else if (d.ranged) { fireArrow(e); e.state = 'recover'; e.st = .45; e.cd = rand(1.8, 3); }
        else if (e.move === 'lunge') { e.state = 'lunge'; e.st = .42; e.hitDone = false; SFX.dash(); }
        else { e.state = 'strike'; e.st = .18; e.hitDone = false; }
      }
      break;
    case 'strike':
      e.st -= dt; e.vx = e.face * 70;
      if (!e.hitDone) { e.hitDone = true; enemyStrike(e, d.reach + 10, edmg(e)); }
      if (e.st <= 0) {
        if (e.comboLeft > 0) { e.comboLeft--; e.state = 'windup'; e.st = .14; e.move = 'strike'; }   // chém tiếp nhát sau
        else { e.state = 'recover'; e.st = .42; e.cd = rand(1.1, 2.2) * (e.rank === 'cmd' ? .7 : 1); }
      }
      break;
    case 'lunge':
      e.st -= dt; e.vx = e.face * 580;
      if (Math.random() < .5) dust(e.x - e.face * 14, e.gy, 1);
      if (!e.hitDone) { const hb = { x: e.face > 0 ? e.x : e.x - 70, y: e.y - 80, w: 70, h: 50 }; if (sameLane(e, P) && overlap(hb, hurtbox(P))) { e.hitDone = true; hurtPlayer(edmg(e), e.face); } }
      if (e.st <= 0) { e.state = 'recover'; e.st = .6; e.cd = rand(2, 3); }
      break;
    case 'recover':
      e.vx = 0; e.st -= dt; if (e.st <= 0) e.state = 'approach';
      break;
  }
}

function bossAI(e, dt) {
  const d = e.d, dx = P.x - e.x, dist = Math.abs(dx), enr = e.hp < e.maxHp * .5, sp = espd(e) * (enr ? 1.25 : 1);
  if (enr && !e.enraged) {
    e.enraged = true; floatText(e.x, e.y - 170, 'Nổi giận!', '#ff5a3c', 26);
    if (d.phase2) { banner(d.phase2.banner, d.phase2.sub, 2.2); if (d.phase2.tideOut) { G.tideOut = true; raiseStakes(); } SFX.splash(); }
  }
  const p3 = d.grand && e.hp < e.maxHp * .25;
  if (p3 && !e.phase3) { e.phase3 = true; banner(`${d.name} liều chết!`, 'Đại tướng dốc toàn lực', 2.2); floatText(e.x, e.y - 190, 'Giết!!', '#ff5a3c', 32); SFX.gong(); }
  e.cd -= dt * (p3 ? 1.8 : 1);
  if (e.pend > 0) { e.pend -= dt; if (e.pend <= 0) fireArrow(e, P.lane, true); }
  switch (e.state) {
    case 'approach': {
      e.face = dx > 0 ? 1 : -1;
      if (!e.entering) chaseLane(e, dt);
      if (dist > d.reach * .75) { e.vx = e.face * sp; e.walk += dt * 9; } else e.vx = 0;
      if (e.cd > 0 || e.entering) break;
      const minions = enemies.filter(o => o !== e && alive(o)).length;
      const opts = d.moves.concat(enr ? d.moves2 : []).filter(m => !(m === 'summon' && (e.summons >= 2 || minions >= 3)));
      let mv = (dist < d.reach + 20 && inLane(e) && Math.random() < .5) ? 'slash' : pick(opts);
      if (mv === 'slash' && dist > d.reach + 40) mv = 'charge';
      e.move = mv; e.state = 'windup'; e.vx = 0;
      e.st = { slash: .5, charge: .7, slam: .45, volley: .6, summon: .5, poison: .55, pots: .6, tide: .9, fury: .55 }[mv] * (enr ? .8 : 1);
      const shout = { charge: '!', summon: 'Quân đâu!', volley: 'Bắn tên!', poison: 'Tên độc!', pots: 'Hỏa pháo!', tide: 'Sóng triều!', fury: 'Liên hoàn trảm!' }[mv];
      if (shout) floatText(e.x, e.y - 170, shout, mv === 'charge' ? '#ff5a3c' : '#ffd35a', mv === 'charge' ? 40 : 24);
      break;
    }
    case 'windup':
      e.vx = 0; e.st -= dt;
      if (e.move === 'charge' && e.st > .25) { e.lane = P.lane; } // nhắm làn trước khi lao, cuối nhịp thì khoá làn
      if (e.st <= 0) bossMove(e, enr);
      break;
    case 'slash':
      e.st -= dt; e.vx = e.face * 110;
      if (!e.hitDone && e.st < .18) { e.hitDone = true; enemyStrike(e, d.reach * 1.15, edmg(e), 90); spark(e.x + e.face * d.reach * .8, e.y - 70, 5, '#fff'); }
      if (e.st <= 0) recover(e, .55);
      break;
    case 'charge':
      e.st -= dt; e.vx = e.face * 660;
      if (Math.random() < .6) dust(e.x - e.face * 20, e.gy, 1);
      if (!e.hitDone && sameLane(e, P) && overlap(hurtbox(e), hurtbox(P))) { e.hitDone = true; hurtPlayer(edmg(e) * 1.2, e.face); }
      if (e.st <= 0 || (G.lock && (e.x <= G.camX + 22 || e.x >= G.camX + W - 22))) { recover(e, .7); G.shake = Math.max(G.shake, 4); }
      break;
    case 'fury':
      // ba nhát chém lướt tới liên tiếp, mỗi nhát bám theo làn của Tiểu Hổ
      e.st -= dt; e.vx = e.face * 380;
      if (!e.hitDone && e.st < .14) { e.hitDone = true; enemyStrike(e, d.reach * 1.1, edmg(e), 90); spark(e.x + e.face * d.reach * .7, e.y - 70, 6, '#fff'); SFX.swing(); }
      if (e.st <= 0) {
        if (e.furyN > 0) { e.furyN--; e.st = .26; e.hitDone = false; e.face = P.x > e.x ? 1 : -1; e.lane = P.lane; }
        else recover(e, .7);
      }
      break;
    case 'slamUp': break;
    case 'recover':
      e.vx = 0; e.st -= dt;
      if (e.st <= 0) { e.state = 'approach'; e.cd = rand(.5, 1.2) * (enr ? .6 : 1) * (p3 ? .6 : 1); }
      break;
  }
}
function bossMove(e, enr) {
  const d = e.d; e.hitDone = false;
  switch (e.move) {
    case 'slash': e.state = 'slash'; e.st = .28; SFX.swing(); break;
    case 'fury': e.state = 'fury'; e.furyN = 2; e.st = .26; e.lane = P.lane; break;
    case 'charge': e.state = 'charge'; e.st = .8; SFX.dash(); break;
    case 'slam': e.state = 'slamUp'; e.air = true; e.lane = P.lane; e.vy = -980; e.vx = clamp((P.x - e.x) / .85, -620, 620); SFX.jump(); break;
    case 'volley': {
      const n = enr ? 7 : 5;
      for (let i = 0; i < n; i++) projs.push({ kind: 'rain', style: 'arrow', from: 'e', x: clamp(P.x + (i - (n - 1) / 2) * 70 + rand(-15, 15), G.camX + 20, G.camX + W - 20), y: -30, gy: LANES[P.lane], vx: 0, vy: 0, delay: .55 + i * .08, dmg: edmg(e) * .8, life: 3 });
      recover(e, .7); break;
    }
    case 'poison':
      // tên độc rải cả 3 làn: phải nhảy hoặc lướt để né
      e.face = P.x > e.x ? 1 : -1;
      [0, 1, 2].forEach(l => fireArrow(e, l, true));
      if (enr) e.pend = .3;   // phát thứ hai nhắm thẳng làn của Tiểu Hổ
      recover(e, .6); break;
    case 'pots': {
      const n = enr ? 4 : 3;
      for (let i = 0; i < n; i++) throwPot(e, clamp(P.x + (i - (n - 1) / 2) * 95, G.camX + 30, G.camX + W - 30), .8 + i * .1, i % 2 ? P.lane : clamp(P.lane + (i ? 1 : -1), 0, 2));
      recover(e, .75); break;
    }
    case 'tide': {
      const fromLeft = e.x > G.camX + W / 2;
      projs.push({ kind: 'tide', from: 'e', x: fromLeft ? G.camX - 90 : G.camX + W + 90, y: LANES[2], gy: LANES[1], vx: fromLeft ? 420 : -420, vy: 0, dmg: edmg(e) * 1.1, life: 3.6 });
      SFX.splash(); recover(e, .6); break;
    }
    case 'summon':
      e.summons++;
      d.summon.forEach((t, i) => spawnEnemy(t, i % 2 ? 1 : -1));
      recover(e, .6); break;
  }
}
function recover(e, t) { e.state = 'recover'; e.st = t; e.vx = 0; }
function slamLand(e) {
  G.shake = 12; SFX.boom(); dust(e.x, e.gy, 14);
  [-1, 1].forEach(dir => projs.push({ kind: 'wave', from: 'e', x: e.x + dir * 40, y: e.gy, gy: e.gy, vx: dir * 430, vy: 0, dmg: edmg(e), life: 1.4 }));
  if (sameLane(e, P) && Math.abs(P.x - e.x) < 90 && P.y > P.gy - 40) hurtPlayer(edmg(e) * 1.3, P.x > e.x ? 1 : -1);
  recover(e, .6);
}

/* ---------------- Đồng đội ---------------- */
function makeAlly(look) {
  const lane = P.lane === 0 ? 1 : P.lane - 1;
  return { look, x: P.x - 70, lane, gy: LANES[lane], y: LANES[lane], vx: 0, face: 1, state: 'idle', st: 0, t: 0, walk: 0, cd: 1, laneCd: 0, combo: 0, hit: false, talkT: rand(5, 9) };
}
function updateAlly(a, dt) {
  a.t += dt; a.cd -= dt; a.talkT -= dt; a.laneCd -= dt;
  followLane(a, dt, 260); a.y = a.gy;
  if (P.state === 'dead' || G.ultT > 0) { a.vx = 0; a.state = 'idle'; return; }
  const foes = enemies.filter(e => alive(e) && !e.entering && e.state !== 'down');
  let tgt = null, best = 1e9;
  foes.forEach(e => { const dd = Math.abs(e.x - a.x) + Math.abs(e.gy - a.gy) * 2; if (dd < best && Math.abs(e.x - a.x) < 520) { best = dd; tgt = e; } });
  const wantLane = tgt ? tgt.lane : (P.lane === 0 ? 1 : P.lane - 1);
  if (a.lane !== wantLane && a.laneCd <= 0) { a.lane += Math.sign(wantLane - a.lane); a.laneCd = .4; }
  if (a.state === 'attack') {
    a.st -= dt; a.vx = 0;
    if (!a.hit && a.st < .16) {
      a.hit = true;
      if (tgt && sameLane(tgt, a) && Math.abs(tgt.x - a.x) < 90) damageEnemy(tgt, a.combo === 3 ? 11 : 6, a.face, 200, a.combo === 3, true);
    }
    if (a.st <= 0) a.state = 'idle';
  } else {
    const tx = tgt ? tgt.x - Math.sign(tgt.x - a.x || 1) * 60 : P.x - P.face * 80;
    const diff = tx - a.x, moving = Math.abs(diff) > 14 || Math.abs(a.gy - LANES[a.lane]) > 2;
    a.vx = Math.abs(diff) > 14 ? Math.sign(diff) * 250 : 0;
    a.state = moving ? 'run' : 'idle'; if (moving) a.walk += dt * 13;
    a.face = tgt ? (Math.sign(tgt.x - a.x) || 1) : (Math.abs(diff) > 14 ? Math.sign(diff) : P.face);
    if (tgt && sameLane(tgt, a) && Math.abs(tgt.x - a.x) < 85 && a.cd <= 0) { a.state = 'attack'; a.st = .32; a.hit = false; a.combo = a.combo % 3 + 1; a.cd = rand(.7, 1.2); SFX.swing(); }
  }
  a.x = clamp(a.x + a.vx * dt, G.camX + 20, G.camX + W - 20);
  if (a.talkT <= 0) { a.talkT = rand(9, 15); if (foes.length && ALLY_LINES[a.look]) floatText(a.x, a.y - 128, pick(ALLY_LINES[a.look]), '#f4e7c9', 16); }
}
