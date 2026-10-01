#!/usr/bin/env python3
"""Bộ kiểm thử Hào Khí Việt Nam: mở game trong Chromium ẩn (Playwright) và chơi thật.

Chạy:  python3 tests/test_game.py            (tất cả)
       python3 tests/test_game.py stage      (chỉ các bài có chữ "stage" trong tên)

Tự bật một máy chủ tĩnh tạm trên cổng trống, không cần chạy server 8003 trước.
Mỗi bài dùng một trang mới với localStorage sạch.
"""
import functools, http.server, json, os, sys, threading, time, traceback
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Bot chơi một ải bằng cách gọi thẳng update()/render() (nhanh hơn thời gian thực).
# god = true: hồi đầy máu, nội lực mỗi khung hình và có đủ kỹ năng → kiểm tra ải có "đi hết được" không.
# god = false: chơi công bằng với bản lưu hiện có → đo độ khó.
BOT = """
([maxSteps, god]) => {
  const log = [], seen = new Set(); let steps = 0, minHp = P.hp;
  if (god) Object.keys(SKILLS).forEach(k => S.skills[k] = 3);
  while (steps < maxSteps) {
    steps++;
    if (G.mode === 'dialog') { endDialog(); continue; }
    if (G.mode !== 'play' && G.mode !== 'clear') break;
    if (god) { P.hp = P.maxHp; P.mp = P.maxMp; }
    held.clear(); pressed.clear();
    const live = enemies.filter(e => !e.remove && e.hp > 0);
    live.forEach(e => seen.add(e.type));
    let tgt = null, best = 1e9;
    live.forEach(e => { const d = Math.abs(e.x - P.x) + Math.abs((e.lane ?? P.lane) - P.lane) * 120; if (d < best) { best = d; tgt = e; } });
    if (tgt) {
      if (tgt.x > P.x + 50) held.add('right'); else if (tgt.x < P.x - 50) held.add('left'); else P.face = tgt.x >= P.x ? 1 : -1;
      if (steps % 20 === 0 && tgt.lane !== undefined && tgt.lane !== P.lane) pressed.add(tgt.lane > P.lane ? 'down' : 'up');
      if (steps % 6 === 0) pressed.add('atk');
      if (steps % 90 === 10) pressed.add('s1');
      if (steps % 90 === 30) pressed.add('s2');
      if (steps % 90 === 50) pressed.add('s3');
      if (steps % 90 === 70) pressed.add('s4');
      if (steps % 200 === 99) pressed.add('s5');
      if (steps % 300 === 150) pressed.add('jump');
      if (steps % 300 === 160) pressed.add('atk');
      if (steps % 400 === 250) pressed.add('dash');
      if (P.rage >= 100) pressed.add('ult');
    } else held.add('right');
    try { update(1 / 60); if (steps % 3 === 0) render(); }
    catch (e) { log.push('EXC ' + e.message + ' @ ' + (e.stack || '').split('\\n').slice(1, 3).join(' | ')); break; }
    minHp = Math.min(minHp, P.hp);
    for (const k of ['x', 'y', 'hp', 'mp', 'gy']) if (!isFinite(P[k])) { log.push('NaN P.' + k); steps = maxSteps; }
    for (const e of enemies) for (const k of ['x', 'y', 'hp']) if (!isFinite(e[k])) { log.push('NaN ' + e.type + '.' + k); steps = maxSteps; }
    if (P.x < 0 || P.x > G.st.len) { log.push('P ra ngoài ải: x=' + P.x); break; }
  }
  held.clear(); pressed.clear();
  return { steps, mode: G.mode, wave: G.wave, waves: G.st.waves.length, result: G.result, dead: P.state === 'dead',
           hp: Math.round(P.hp), minHp: Math.round(minHp), lv: S.lv, seen: [...seen], log };
}
"""

TESTS = []
def test(fn):
    TESTS.append(fn); return fn

def card_text(pg):
    return pg.evaluate("$('cardWrap').hidden ? '' : $('card').innerText")

def new_game(pg, stage=0):
    """Tạo bản lưu mới ở ô 1 và vào thẳng ải `stage` (bỏ qua hội thoại)."""
    pg.evaluate(f"useSlot(0, true); S.maxStage = {stage}; startStage({stage}); endDialog()")
    assert pg.evaluate("G.mode") == 'play'


# ---------------------------------------------------------------- khởi động
@test
def test_loads_with_new_name(pg):
    assert pg.title() == 'Hào Khí Việt Nam', pg.title()
    assert pg.inner_text('#menu h1') == 'Hào Khí Việt Nam'
    assert pg.evaluate("G.mode") == 'title'
    assert pg.evaluate("STAGES.length") == 6
    assert 'Đông A' not in pg.inner_text('#menu')

@test
def test_data_is_consistent(pg):
    """Mọi loại địch, người nói, nền, đồng đội mà các ải nhắc tới đều phải tồn tại."""
    bad = pg.evaluate("""() => {
      const bad = [];
      STAGES.forEach((st, i) => {
        if (!GROUNDS[st.bg] && typeof GROUNDS !== 'undefined' && !(st.bg in GROUNDS)) bad.push(`ải ${i + 1}: nền ${st.bg}`);
        if (st.ally && !LOOKS[st.ally]) bad.push(`ải ${i + 1}: đồng đội ${st.ally}`);
        if (!MAP_POINTS[i]) bad.push(`ải ${i + 1}: thiếu điểm bản đồ`);
        if (!st.card || !st.card.title || !st.card.text) bad.push(`ải ${i + 1}: thiếu thẻ sử ký`);
        if (!st.waves.length || !st.waves[st.waves.length - 1].boss) bad.push(`ải ${i + 1}: đợt cuối không có boss`);
        let prev = 0;
        st.waves.forEach((w, j) => {
          if (w.at <= prev || w.at >= st.len) bad.push(`ải ${i + 1} đợt ${j + 1}: vị trí ${w.at}`);
          prev = w.at;
          [...(w.list || []), ...(w.pool || [])].forEach(t => {
            const [type, rank] = t.split(':');
            if (!EDEF[type]) bad.push(`ải ${i + 1}: địch ${type}`);
            if (!LOOKS[type]) bad.push(`ải ${i + 1}: hình ${type}`);
            if (rank && !RANKS[rank]) bad.push(`ải ${i + 1}: cấp bậc ${rank}`);
          });
        });
        [...st.intro, ...st.outro, ...(st.bossTalk || [])].forEach(([who, txt]) => {
          if (!SPK[who]) bad.push(`ải ${i + 1}: người nói ${who}`);
          else if (SPK[who].look && !LOOKS[SPK[who].look]) bad.push(`ải ${i + 1}: chân dung ${who}`);
          if (!txt) bad.push(`ải ${i + 1}: lời thoại trống`);
        });
      });
      ACTIVE.forEach(id => { if (!SKILLS[id] || !SKILLS[id].slot) bad.push('kỹ năng chủ động ' + id); });
      Object.entries(SKILLS).forEach(([id, d]) => { if (d.lv.length !== 3) bad.push('kỹ năng ' + id + ' không đủ 3 tầng'); });
      return bad;
    }""")
    assert not bad, bad

@test
def test_help_and_settings(pg):
    assert pg.is_hidden('#help')
    pg.click('#bHelp'); assert pg.is_visible('#help')
    pg.click('#bHelp'); assert pg.is_hidden('#help')
    pg.click('#bSettings')
    assert 'Cài đặt' in card_text(pg)
    pg.click('#card [data-k="diff"][data-v="2"]')
    assert pg.evaluate("CFG.diff") == 2
    pg.click('#card [data-touch="on"]')
    assert pg.evaluate("$('touch').classList.contains('on')")
    assert pg.is_hidden('#touch'), 'nút cảm ứng che thẻ cài đặt'
    pg.uncheck('#stShake'); assert pg.evaluate("CFG.shake") is False
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate("CFG.diff") == 2 and pg.evaluate("CFG.shake") is False, 'cài đặt không được lưu'
    pg.click('#bSettings'); pg.click('#stReset')
    assert pg.evaluate("CFG.diff") == 1 and pg.evaluate("CFG.shake") is True
    pg.click('#stDone'); assert pg.evaluate("G.mode") == 'title'


# ---------------------------------------------------------------- ô lưu
@test
def test_new_slot_starts_stage_one(pg):
    pg.click('#bPlay')
    assert pg.locator('#card [data-new]').count() == 3
    pg.click('#card [data-new="1"]'); pg.wait_for_timeout(200)
    assert pg.evaluate("STORE.cur") == 1
    assert pg.evaluate("G.mode") == 'dialog' and pg.evaluate("G.stage") == 0
    assert pg.is_visible('#dlg')
    # bấm hội thoại tới hết thì vào trận
    for _ in range(40):
        if pg.evaluate("G.mode") != 'dialog': break
        pg.click('#dlg'); pg.wait_for_timeout(30)
    assert pg.evaluate("G.mode") == 'play'

@test
def test_save_code_roundtrip(pg):
    r = pg.evaluate("""() => {
      S.stage = 3; S.maxStage = 4; S.coins = 321; S.lv = 7; S.stars = [3, 2, 1]; S.skills = { chuong: 2, xoay: 1 };
      const code = exportCode(S), back = importCode(code);
      return { prefix: code.startsWith('HKDA1:'), same: JSON.stringify(back) === JSON.stringify(S),
               bad: [importCode(''), importCode('xin chào'), importCode('HKDA1:!!!'), importCode('HKDA1:' + btoa('{"a":1}')), importCode('HKDA1:' + btoa('không phải json'.replace(/[^ -~]/g, '?')))] };
    }""")
    assert r['prefix'] and r['same'], r
    assert all(b is None for b in r['bad']), r['bad']

@test
def test_import_via_ui_and_delete_slot(pg):
    code = pg.evaluate("exportCode(Object.assign(newSave(), { stage: 2, maxStage: 2, coins: 77 }))")
    pg.click('#bPlay'); pg.click('#slImport')
    pg.fill('#codeIn', 'sai mã'); pg.click('#card [data-into="0"]')
    assert 'không hợp lệ' in pg.inner_text('#imMsg')
    pg.fill('#codeIn', code); pg.click('#card [data-into="2"]')
    assert pg.evaluate("STORE.slots[2].coins") == 77
    assert 'Ải 3' in card_text(pg)
    pg.click('#card [data-del="2"]')
    assert pg.evaluate("!!STORE.slots[2]"), 'xoá ngay lần bấm đầu, không hỏi lại'
    pg.click('#card [data-del="2"]')
    assert pg.evaluate("STORE.slots[2]") is None

@test
def test_progress_survives_reload(pg):
    new_game(pg, 0)
    pg.evaluate("S.coins = 55; S.stars = [2]; S.maxStage = 1; S.stage = 1; save()")
    pg.reload(); pg.wait_for_timeout(300)
    s = pg.evaluate("({ c: S.coins, st: S.stars, m: S.maxStage })")
    assert s == {'c': 55, 'st': [2], 'm': 1}, s


# ---------------------------------------------------------------- điều khiển thật
@test
def test_keyboard_controls(pg):
    new_game(pg, 0)
    x0, lane0 = pg.evaluate("P.x"), pg.evaluate("P.lane")
    pg.keyboard.down('KeyD'); pg.wait_for_timeout(400); pg.keyboard.up('KeyD')
    assert pg.evaluate("P.x") > x0 + 40, 'D không đi sang phải'
    pg.keyboard.press('KeyS'); pg.wait_for_timeout(120)
    assert pg.evaluate("P.lane") == lane0 + 1, 'S không đổi làn xuống'
    pg.keyboard.press('KeyW'); pg.wait_for_timeout(120)
    assert pg.evaluate("P.lane") == lane0, 'W không đổi làn lên'
    pg.evaluate("window.__st = new Set(); const u = updatePlayer; updatePlayer = dt => { u(dt); __st.add(P.state); if (P.air) __st.add('AIR'); }")
    pg.keyboard.press('Space'); pg.wait_for_timeout(700)
    pg.keyboard.press('KeyJ'); pg.wait_for_timeout(500)
    pg.keyboard.press('KeyK'); pg.wait_for_timeout(600)
    pg.keyboard.press('ShiftLeft'); pg.wait_for_timeout(400)
    st = set(pg.evaluate("[...__st]"))
    for want in ('AIR', 'attack', 'cast', 'dash'):
        assert want in st, f'thiếu trạng thái {want}: {sorted(st)}'
    pg.keyboard.press('KeyP'); pg.wait_for_timeout(100)
    assert pg.evaluate("G.mode") == 'paused' and 'Tạm nghỉ' in card_text(pg)
    pg.keyboard.press('KeyP'); pg.wait_for_timeout(100)
    assert pg.evaluate("G.mode") == 'play'

@test
def test_touch_controls(pg, browser, base):
    ctx = browser.new_context(viewport={'width': 844, 'height': 390}, has_touch=True, is_mobile=True)
    tp = ctx.new_page(); tp.goto(base); tp.wait_for_timeout(500)
    try:
        tp.tap('#bPlay'); tp.tap('#card [data-new="0"]'); tp.evaluate("endDialog()")
        assert tp.evaluate("$('touch').classList.contains('on')"), 'nút cảm ứng không tự hiện trên máy cảm ứng'
        for k in ('left', 'right', 'up', 'down', 'atk', 'jump', 'dash', 's1', 'ult', 'pause'):
            box = tp.locator(f'#touch [data-k="{k}"]').bounding_box()
            assert box and box['width'] >= 24 and box['height'] >= 24, f'nút {k} quá nhỏ: {box}'
            assert box['x'] >= 0 and box['x'] + box['width'] <= 844 and box['y'] >= 0 and box['y'] + box['height'] <= 390, f'nút {k} tràn màn hình: {box}'
        tp.evaluate("window.__st = new Set(); const u = updatePlayer; updatePlayer = dt => { u(dt); __st.add(P.state); }")
        x0 = tp.evaluate("P.x")
        tp.dispatch_event('#touch [data-k="right"]', 'pointerdown', {'pointerId': 1}); tp.wait_for_timeout(400)
        assert tp.evaluate("held.has('right')")
        tp.dispatch_event('#touch [data-k="right"]', 'pointerup', {'pointerId': 1})
        assert not tp.evaluate("held.has('right')") and tp.evaluate("P.x") > x0 + 40, 'nút ▶ không di chuyển'
        tp.tap('#touch [data-k="atk"]'); tp.wait_for_timeout(300)
        assert 'attack' in tp.evaluate("[...__st]"), 'nút Đánh không ra đòn'
        tp.tap('#touch [data-k="pause"]'); tp.wait_for_timeout(150)
        assert tp.evaluate("G.mode") == 'paused'
        assert tp.is_hidden('#touch'), 'nút cảm ứng che thẻ tạm dừng'
        tp.tap('#pGo'); assert tp.evaluate("G.mode") == 'play' and tp.is_visible('#touch')
    finally:
        ctx.close()


# ---------------------------------------------------------------- luật chiến đấu
@test
def test_lane_rule_and_damage(pg):
    new_game(pg, 0)
    r = pg.evaluate("""() => {
      const far = spawnEnemy('bandit', 1, 0), near = spawnEnemy('bandit', 1, 1);
      [far, near].forEach(e => { e.x = P.x + 50; e.entering = false; e.gy = e.y = LANES[e.lane]; });
      P.lane = 1; P.gy = P.y = LANES[1]; P.face = 1;
      const hp0 = [far.hp, near.hp];
      pressed.add('atk');
      for (let i = 0; i < 20; i++) { update(1 / 60); pressed.clear(); }
      return { far: far.hp - hp0[0], near: near.hp - hp0[1] };
    }""")
    assert r['near'] < 0, f'đòn cùng làn không trúng: {r}'
    assert r['far'] == 0, f'đòn trúng cả địch khác làn: {r}'

@test
def test_player_damage_invulnerability_and_death(pg):
    new_game(pg, 0)
    r = pg.evaluate("""() => {
      const hp0 = P.hp, a = hurtPlayer(10, 1), hp1 = P.hp, b = hurtPlayer(10, 1), hp2 = P.hp;
      P.inv = 0; P.state = 'idle'; const hits = G.hits;
      hurtPlayer(9999, 1);
      for (let i = 0; i < 300 && G.mode === 'play'; i++) update(1 / 60);
      return { a, b, lost: hp0 - hp1, again: hp1 - hp2, hits, state: P.state, mode: G.mode };
    }""")
    assert r['a'] is True and r['lost'] > 0
    assert r['b'] is False and r['again'] == 0, 'bị đánh lần hai trong lúc bất tử tạm thời'
    assert r['hits'] == 1 and r['state'] == 'dead' and r['mode'] == 'card', r
    assert 'ngã xuống' in card_text(pg)

@test
def test_gameover_retry_restores_coins(pg):
    new_game(pg, 0)
    pg.evaluate("S.coins += 40; hurtPlayer(9999, 1); for (let i = 0; i < 300 && G.mode === 'play'; i++) update(1 / 60);")
    assert pg.evaluate("S.coins") == 0, 'tiền nhặt trong trận thua phải bị thu lại'
    pg.click('#oRe')
    assert pg.evaluate("G.mode") == 'play' and pg.evaluate("P.hp") == pg.evaluate("P.maxHp")
    assert pg.evaluate("enemies.length") == 0 and pg.evaluate("G.wave") == 0

@test
def test_checkpoint_before_boss(pg):
    """Chết ở boss: tái chiến vào thẳng đợt boss, giữ số lần trúng đòn, không phát lại hội thoại."""
    new_game(pg, 0)
    die = "P.inv = 0; P.state = 'idle'; hurtPlayer(9999, 1); for (let i = 0; i < 300 && G.mode === 'play'; i++) update(1 / 60);"
    r = pg.evaluate("""() => {
      G.wave = 3; G.hits = 4; G.time = 50; S.coins = 7; P.x = STAGES[0].waves[3].at + 5;
      update(1 / 60); const talk = G.mode; endDialog();
      for (let i = 0; i < 120; i++) update(1 / 60);
      return { talk, cp: G.cp && G.cp.wave, boss: !!G.boss };
    }""")
    assert r == {'talk': 'dialog', 'cp': 3, 'boss': True}, r
    pg.evaluate("S.coins += 5;" + die)
    assert pg.evaluate("S.coins") == 7, 'tiền nhặt trước điểm lưu phải còn, tiền nhặt sau đó thì mất'
    assert 'trước tướng giặc' in pg.inner_text('#oRe') and pg.locator('#oStart').count() == 1
    pg.click('#oRe')
    s = pg.evaluate("({ mode: G.mode, wave: G.wave, hits: G.hits, hp: P.hp === P.maxHp, foes: enemies.length, near: STAGES[0].waves[3].at - P.x })")
    assert s['mode'] == 'play' and s['wave'] == 3 and s['hits'] == 4 and s['hp'] and s['foes'] == 0 and 0 < s['near'] < 200, s
    r = pg.evaluate("""() => {
      held.add('right'); let talked = false;
      for (let i = 0; i < 240; i++) { update(1 / 60); if (G.mode === 'dialog') talked = true; }
      held.clear();
      return { talked, boss: !!G.boss, time: G.time > 50 };
    }""")
    assert r == {'talked': False, 'boss': True, 'time': True}, r
    pg.evaluate(die); pg.click('#oStart')
    s = pg.evaluate("({ wave: G.wave, hits: G.hits, coins: S.coins, cp: G.cp, x: P.x })")
    assert s == {'wave': 0, 'hits': 0, 'coins': 0, 'cp': None, 'x': 140}, s

@test
def test_combo_counter(pg):
    new_game(pg, 0)
    r = pg.evaluate("""() => {
      const e = spawnEnemy('heavy', 1, 1); e.x = P.x + 50; e.entering = false; e.hp = e.maxHp = 9999;
      P.lane = 1; P.gy = P.y = LANES[1];
      const out = {};
      damageEnemy(e, 1, 1, 0, false); damageEnemy(e, 1, 1, 0, false); damageEnemy(e, 1, 1, 0, false, true);
      out.afterHits = G.combo;                       // đòn của đồng đội (raw) không tính
      enemies = []; for (let i = 0; i < 60; i++) update(1 / 60); out.held = G.combo;
      for (let i = 0; i < 120; i++) update(1 / 60); out.expired = G.combo;
      enemies = [e]; damageEnemy(e, 1, 1, 0, false); enemies = []; hurtPlayer(1, 1); out.afterHurt = G.combo; out.max = G.maxCombo;
      return out;
    }""")
    assert r == {'afterHits': 2, 'held': 2, 'expired': 0, 'afterHurt': 0, 'max': 2}, r

@test
def test_challenges_and_milestones(pg):
    new_game(pg, 0)
    r = pg.evaluate("""() => {
      const out = {};
      const win = (time, combo, diff, hits) => { resetWorld(0); G.time = time; G.maxCombo = combo; G.minDiff = diff; G.hits = hits; const c0 = S.coins; stageCleared(); return { ...G.result, got: S.coins - c0 }; };
      out.a = win(STAGES[0].par + 1, STAGES[0].combo, 1, 0);       // chỉ đạt Liên hoàn
      out.ch1 = S.ch[0].slice();
      out.b = win(10, 999, 2, 0);                                   // thêm Thần tốc + Hổ tướng, không thưởng lại Liên hoàn
      out.ch2 = S.ch[0].slice();
      out.c = win(10, 999, 2, 0);                                   // không còn ấn mới
      S.stars = []; out.easy = win(10, 0, 0, 0); out.easyStars = S.stars[0];
      S.stars = [3]; out.ms3 = [ms('coin'), ms('rage')];
      S.stars = [3, 3, 3]; out.ms9 = [ms('coin'), ms('side'), ms('rage'), ms('sp')];
      // mốc Bí kíp (13★): thắng ải đưa tổng sao từ 12 lên 15 thì +1 điểm, chỉ một lần
      S.stars = [0, 3, 3, 3, 3]; S.sp = 0; S.ms = {}; const w = win(10, 0, 1, 0); out.sp1 = S.sp; out.newMs = w.newMs;
      win(10, 0, 1, 0); out.sp2 = S.sp;
      // túi gấm: 5 đồng 2 văn → 12 văn
      S.coins = 0; resetWorld(0); for (let i = 0; i < 5; i++) items.push({ kind: 'coin', val: 2, x: P.x, gy: P.gy, y: P.gy - 8, vx: 0, vy: 0, t: 1 });
      G.mode = 'play'; update(1 / 60); out.purse = S.coins;
      // bản lưu đời trước không có ch/ms
      const old = newSave(); delete old.ch; delete old.ms; old.stage = 2;
      const back = importCode(exportCode(old)); out.old = [Array.isArray(back.ch), typeof back.ms];
      return out;
    }""")
    assert r['a']['newCh'] == ['combo'] and r['a']['got'] == 45 + 40 and r['ch1'] == ['combo'], r['a']
    assert r['b']['newCh'] == ['speed', 'hard'] and r['b']['got'] == 45 + 80 and r['ch2'] == ['combo', 'speed', 'hard'], r['b']
    assert r['c']['newCh'] == [] and r['c']['got'] == 45, r['c']
    assert r['easy']['stars'] == 2 and r['easy']['capped'] and r['easyStars'] == 2 and 'hard' not in r['easy']['newCh'], r['easy']
    assert r['ms3'] == [False, False] and r['ms9'] == [True, True, True, False], r
    assert r['sp1'] == 1 and r['sp2'] == 1 and 'sp' in r['newMs'], r
    assert r['purse'] == 12, r['purse']
    assert r['old'] == [True, 'object'], r['old']
    # giao diện: thẻ sử ký và bản đồ hiện ấn
    new_game(pg, 0)
    pg.evaluate("G.time = 10; G.maxCombo = 0; stageCleared(); historyCard(STAGES[0], () => showMap(0, 'continue'))")
    txt = card_text(pg)
    assert 'Thần tốc' in txt and '+40 văn' in txt and 'Chuỗi dài nhất' in txt, txt
    pg.click('#cOk')
    assert pg.locator('#mChal li.done').count() == 1 and pg.locator('#mChal li').count() == 3
    assert pg.locator('.miles li').count() == 5

@test
def test_bachdang_stakes(pg):
    """Nước ròng thì cọc nhô lên; tướng giặc lao qua bãi cọc cùng làn thì mắc cọc."""
    new_game(pg, 5)
    r = pg.evaluate("""() => {
      const out = {}, step = n => { for (let i = 0; i < n; i++) { P.hp = P.maxHp; update(1 / 60); } };
      G.wave = 4; G.lock = true; G.lockX = 1000; G.camX = 1000; P.x = 1100; P.lane = 0; P.gy = P.y = LANES[0];
      const b = spawnEnemy('bossOMN', 1, 1); b.entering = false; b.x = 1500; b.cd = 99;
      out.before = G.stakes.length;
      b.hp = b.maxHp * .49; step(60); out.raised = G.stakes.length; out.up = G.stakes.every(s => s.up === 1);
      const s = G.stakes[0], put = (lane, x) => { b.lane = lane; b.gy = b.y = LANES[lane]; b.x = x; b.state = 'charge'; b.st = .8; b.face = -1; b.vx = -660; b.hitDone = true; b.stakeT = 0; };
      let hp = b.hp; put((s.lane + 1) % 3, s.x + 5); step(1); out.otherLane = hp - b.hp;
      hp = b.hp; put(s.lane, s.x + 5); step(1); out.lost = (hp - b.hp) / b.maxHp; out.state = b.state; out.broken = s.dead;
      // Tiểu Hổ đứng trên cọc không sao
      const s2 = G.stakes[1]; P.x = s2.x; P.lane = s2.lane; P.gy = P.y = s2.gy; const hits = G.hits; b.x = 1900; b.state = 'recover'; b.st = 9; step(20); out.heroHurt = G.hits - hits;
      // lính bị hất văng vào cọc
      const m = spawnEnemy('heavy', 1, s2.lane); m.entering = false; m.x = s2.x + 10; m.gy = m.y = s2.gy; m.state = 'hurt'; m.st = .3; m.vx = 300;
      hp = m.hp; step(1); out.minion = [hp - m.hp, m.state, s2.dead];
      // boss sắp chết mắc cọc thì chết hẳn và ải kết thúc
      enemies = enemies.filter(e => e === b); const s3 = G.stakes[2]; b.hp = 1; put(s3.lane, s3.x); step(1); out.killed = b.state;
      step(30); out.mode = G.mode; out.result = !!G.result;
      return out;
    }""")
    assert r['before'] == 0 and r['raised'] == 4 and r['up'], r
    assert r['otherLane'] == 0, r
    assert abs(r['lost'] - .08) < 1e-6 and r['state'] == 'hurt' and r['broken'], r
    assert r['heroHurt'] == 0, r
    assert r['minion'] == [30, 'down', False], r
    assert r['killed'] == 'dead' and r['mode'] == 'clear' and r['result'], r

@test
def test_skills_cost_mana_and_cooldown(pg):
    new_game(pg, 0)
    r = pg.evaluate("""() => {
      const out = {};
      S.skills = { chuong: 1 };
      tryCast('xoay'); out.unlearned = P.state;
      const mp0 = P.mp; tryCast('chuong'); out.cost = mp0 - P.mp; out.cd = P.cds.chuong > 0;
      for (let i = 0; i < 40; i++) update(1 / 60);
      P.state = 'idle'; const mp1 = P.mp; P.cds.chuong = 5; tryCast('chuong'); out.onCd = mp1 - P.mp;
      P.cds.chuong = 0; P.mp = 0; tryCast('chuong'); out.noMp = P.mp;
      P.rage = 50; pressed.add('ult'); update(1 / 60); pressed.clear(); out.ultEarly = P.state;
      P.state = 'idle'; P.rage = 100; pressed.add('ult'); update(1 / 60); pressed.clear(); out.ult = P.state; out.rage = P.rage;
      return out;
    }""")
    assert r['unlearned'] != 'spin' and r['cost'] == 20 and r['cd'], r
    assert r['onCd'] == 0 and r['noMp'] == 0, r
    assert r['ultEarly'] != 'ult' and r['ult'] == 'ult' and r['rage'] == 0, r

@test
def test_level_up_gives_skill_point(pg):
    new_game(pg, 0)
    r = pg.evaluate("(() => { const need = xpNeed(1); gainXp(need - 1); const a = [S.lv, S.sp]; gainXp(1); return [a, [S.lv, S.sp, S.xp]]; })()")
    assert r == [[1, 1], [2, 2, 0]], r


# ---------------------------------------------------------------- võ đường
@test
def test_skill_tree_rules(pg):
    new_game(pg, 0)
    pg.evaluate("S.coins = 500; S.sp = 4; openShop(() => { window.__done = true; })")
    assert pg.is_disabled('[data-learn="xoay"]'), 'học được tầng 2 khi chưa có tầng 1'
    pg.click('[data-learn="lienhoan"]')
    assert pg.is_enabled('[data-learn="xoay"]')
    pg.click('[data-learn="xoay"]'); pg.click('[data-learn="chuong"]'); pg.click('[data-learn="chuong"]')
    assert pg.evaluate("S.sp") == 0 and pg.evaluate("S.skills") == {'chuong': 3, 'lienhoan': 1, 'xoay': 1}
    assert pg.locator('[data-learn="chuong"]').count() == 0, 'kỹ năng đã đủ 3 tầng vẫn còn nút nâng'
    assert pg.is_disabled('[data-learn="thanphap"]'), 'hết điểm vẫn học được'
    # tẩy tủy: hoàn đúng số điểm đã tiêu, phải bấm hai lần
    assert '4 điểm' in pg.inner_text('#tReset')
    pg.click('#tReset'); assert pg.evaluate("S.sp") == 0
    pg.click('#tReset')
    assert pg.evaluate("S.sp") == 4 and pg.evaluate("S.coins") == 450 and pg.evaluate("S.skills") == {'chuong': 1}
    assert pg.locator('#tReset').count() == 0
    pg.click('[data-learn="thanphap"]'); assert '1 điểm' in pg.inner_text('#tReset')
    pg.click('#sGo'); assert pg.evaluate("window.__done") is True

@test
def test_training_shop(pg):
    new_game(pg, 0)
    pg.evaluate("S.coins = 60; S.sp = 0; openShop(() => {})")
    pg.click('[data-up="hp"]')
    assert pg.evaluate("S.coins") == 30 and pg.evaluate("S.up.hp") == 1
    assert pg.is_disabled('[data-up="hp"]'), 'không đủ tiền vẫn bấm được'      # tầng 2 giá 55
    pg.evaluate("S.up.atk = 8; S.coins = 9999; openShop(() => {})")
    assert pg.is_disabled('[data-up="atk"]') and 'viên mãn' in pg.inner_text('[data-up="atk"]')
    pg.evaluate("resetWorld(0)")
    assert pg.evaluate("P.maxHp") == 125 and abs(pg.evaluate("P.dmg") - 2.6) < 1e-9


# ---------------------------------------------------------------- chơi hết từng ải
def play_stage(pg, i):
    new_game(pg, i)
    r = pg.evaluate(BOT, [60 * 900, True])
    assert not r['log'], r['log']
    assert r['mode'] not in ('play', 'clear'), f"bot kẹt ở đợt {r['wave'] + 1}/{r['waves']} sau {r['steps']} bước"
    assert r['wave'] == r['waves'] and r['result'] and 1 <= r['result']['stars'] <= 3, r
    boss = pg.evaluate(f"STAGES[{i}].waves.at(-1).list[0]")
    assert boss in r['seen'], f'không gặp boss {boss}'
    for _ in range(60):
        if pg.evaluate("G.mode") != 'dialog': break
        pg.evaluate("endDialog()")
    txt = card_text(pg)
    assert pg.evaluate(f"STAGES[{i}].card.title") in txt and 'Đã lưu' in txt, txt[:80]
    assert pg.evaluate(f"S.stars[{i}]") == r['result']['stars']
    pg.click('#cOk'); pg.wait_for_timeout(100)
    return r

def _stage(i):
    def t(pg):
        r = play_stage(pg, i)
        txt = card_text(pg)
        if i < 5:
            assert 'Bản đồ hành quân'.upper() in txt.upper(), txt[:60]
            assert pg.evaluate("S.maxStage") == i + 1 and pg.evaluate("S.stage") == i + 1
            assert pg.is_enabled(f'#card [data-st="{i + 1}"]')
            if i + 2 < 6: assert pg.is_disabled(f'#card [data-st="{i + 2}"]'), 'ải chưa mở mà chọn được'
            pg.click('#mGo'); pg.wait_for_timeout(100)
            assert 'VÕ ĐƯỜNG' in card_text(pg).upper()
            pg.click('#sGo'); pg.wait_for_timeout(100)
            assert pg.evaluate("G.stage") == i + 1 and pg.evaluate("G.mode") == 'dialog'
        else:
            assert 'Non sông thu về một mối' in txt and 'Hào Khí Việt Nam' in txt
            pg.click('#eOk'); assert pg.evaluate("G.mode") == 'title'
        return f"{r['steps'] / 60:.0f}s mô phỏng, {r['result']['stars']}★, gặp {len(r['seen'])} loại địch"
    t.__name__ = f'test_stage_{i + 1}_completable'
    return t
for _i in range(6): test(_stage(_i))

@test
def test_stage1_fair_play(pg):
    """Không gian lận: bản lưu mới, chỉ có Chưởng. Bot ngây thơ (không né) phải qua được ải 1."""
    wins, notes = 0, []
    for n in range(3):
        new_game(pg, 0)
        r = pg.evaluate(BOT, [60 * 600, False])
        assert not r['log'], r['log']
        ok = r['result'] is not None and not r['dead']
        wins += ok; notes.append(f"{'thắng' if ok else 'thua ở đợt ' + str(r['wave'] + 1)} (máu thấp nhất {r['minHp']})")
    assert wins >= 2, notes
    return '; '.join(notes)


# ---------------------------------------------------------------- bố cục
@test
def test_no_horizontal_scroll_on_phone(pg):
    for w, h in ((390, 760), (844, 390), (1366, 768)):
        pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(150)
        sw = pg.evaluate("document.documentElement.scrollWidth")
        assert sw <= w, f'{w}px: trang rộng {sw}px'
        box = pg.locator('#stage').bounding_box()
        assert abs(box['width'] / box['height'] - 16 / 9) < .03, f'{w}x{h}: khung không còn 16:9 ({box})'
        assert box['height'] <= h, f'{w}x{h}: khung cao hơn màn hình ({box})'


# ---------------------------------------------------------------- chạy
def main():
    only = sys.argv[1:]
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=ROOT)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}/'
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for fn in TESTS:
            if only and not any(o in fn.__name__ for o in only): continue
            ctx = browser.new_context(viewport={'width': 1100, 'height': 720})
            pg = ctx.new_page(); errs = []
            pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('requestfailed', lambda r: errs.append('không tải được ' + r.url) if r.url.startswith(base) else None)
            t0 = time.time(); note = None
            try:
                pg.goto(base, wait_until='load'); pg.wait_for_timeout(300)
                args = (pg, browser, base) if fn.__code__.co_argcount == 3 else (pg,)
                note = fn(*args)
                assert not errs, 'lỗi console: ' + ' | '.join(dict.fromkeys(errs))[:600]
                print(f'PASS  {fn.__name__:42s} {time.time() - t0:5.1f}s' + (f'  ({note})' if note else ''))
            except Exception as e:
                failed += 1
                kind = 'FAIL' if isinstance(e, AssertionError) else 'ERROR'
                tb = traceback.extract_tb(e.__traceback__)[-1]
                msg = f'dòng {tb.lineno}: {tb.line}' + (f'\n      {e}' if str(e) else '')
                print(f'{kind:5s} {fn.__name__:42s} {time.time() - t0:5.1f}s\n      {msg[:700]}')
                if errs: print('      console:', ' | '.join(dict.fromkeys(errs))[:400])
            finally:
                ctx.close()
        browser.close()
    srv.shutdown()
    print(f'\n{len(TESTS) if not only else "đã chọn"} bài, {failed} hỏng')
    sys.exit(1 if failed else 0)

if __name__ == '__main__':
    main()
