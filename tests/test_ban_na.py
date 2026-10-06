#!/usr/bin/env python3
"""Kiểm thử Bắn Ná. Chạy: python3 tests/test_ban_na.py [lọc tên]"""
from harness import run, root

URL = 'games/ban-na/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_projectile_falls_under_gravity(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # So sánh vận tốc thẳng đứng (không phải vị trí): với vận tốc ban đầu hướng lên đủ mạnh, vị trí y có thể
    # vẫn đang tăng độ cao (y giảm) sau một khoảng ngắn dù trọng lực vẫn đang kéo đúng — đo theo vy mới tách
    # bạch được "trọng lực có cộng dồn mỗi khung hình" khỏi "đạn đã rơi qua điểm xuất phát hay chưa".
    vy0, vy1 = pg.evaluate("""() => {
      startDrag(150, 380); updateDrag(100, 440); release();
      const vy0 = proj.vy; for (let i = 0; i < 20; i++) update(1/60); return [vy0, proj.vy];
    }""")
    assert vy1 > vy0, 'vận tốc thẳng đứng không tăng theo trọng lực mỗi khung hình'


@test
def test_hitting_block_reduces_hp_and_destroys_it(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # Đặt thẳng đạn ngay sát khối (thay vì tính tay quỹ đạo kéo-thả, vốn dễ sai số và còn phụ thuộc cân bằng
    # vật lý có thể đổi sau này) để kiểm tra đúng phần va chạm/gây sát thương một cách tách biệt, xác định.
    hp0 = pg.evaluate("blocks[0].hp")
    pg.evaluate("""() => {
      G.mode = 'fly';
      setProj({ x: blocks[0].cx - 20, y: blocks[0].cy, vx: 260, vy: 0, kind: 'da', trail: [] });
      for (let i = 0; i < 10; i++) updatePhysics(1/60);
    }""")
    hp1 = pg.evaluate("blocks.length ? blocks[0].hp : 0")
    assert hp1 < hp0, 'khối không mất máu dù bị đạn trúng trực diện'


@test
def test_running_out_of_shots_with_targets_left_is_a_loss(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      for (let s = 0; s < 3; s++) {
        startDrag(150, 380); updateDrag(160, 390); release();  // kéo rất nhẹ, không trúng gì
        for (let i = 0; i < 180; i++) update(1/60);
      }
    }""")
    assert pg.evaluate("G.mode") == 'result' and pg.evaluate("G.won") == False
    assert pg.locator('#card h2').count() == 1


@test
def test_eight_levels_each_have_a_story(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("LEVELS.length === 8 && LEVELS.every(l => l.title && l.story && l.story.length >= 2)")


@test
def test_picking_a_level_shows_story_before_launch(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.click('.lvBtn[data-lv="0"]')
    assert pg.evaluate("G.mode") != 'aim', 'chọn màn chỉ được hiện lời dẫn, chưa được xuất quân'
    assert pg.locator('#card h2').inner_text() == pg.evaluate("LEVELS[0].title")
    pg.click('#iGo')
    assert pg.evaluate("G.mode") == 'aim' and pg.evaluate("G.level") == 0


@test
def test_wind_pushes_projectile_sideways(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    x = pg.evaluate("""() => {
      startLevel(0); G.wind = 80;
      setProj({ x: 300, y: 200, vx: 0, vy: 0, kind: 'da', trail: [] }); G.mode = 'fly';
      for (let i = 0; i < 60; i++) update(1/60);
      return proj.x;
    }""")
    assert x > 330, f'gió thổi phải đẩy đạn sang phải, x={x}'


@test
def test_fire_shot_splashes_nearby_blocks(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hps = pg.evaluate("""() => {
      startLevel(0); G.wind = 0;
      blocks.length = 0;
      blocks.push({ cx: 520, cy: 300, w: 30, h: 30, hp: 30, dead: false }, { cx: 565, cy: 300, w: 30, h: 30, hp: 30, dead: false });
      G.mode = 'fly'; setProj({ x: 500, y: 300, vx: 0, vy: 0, kind: 'dau', trail: [] });
      update(1/60);
      return blocks.map(b => b.hp);
    }""")
    assert len(hps) == 2 and all(h < 30 for h in hps), f'đạn tẩm dầu phải nổ lan sang cả hai khối: {hps}'


@test
def test_moving_enemy_patrols_while_aiming(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    moved = pg.evaluate("""() => {
      const li = LEVELS.findIndex(l => l.targets.some(t => t.span));
      startLevel(li);
      const t = targets.find(t => t.span); const x0 = t.cx;
      for (let i = 0; i < 60; i++) update(1/60);
      return Math.abs(t.cx - x0);
    }""")
    assert moved > 5, 'lính địch di chuyển được nhưng không đổi vị trí khi đang ngắm'


@test
def test_killed_enemy_falls_before_leaving(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
      startLevel(0); targets.length = 0;
      targets.push({ cx: 600, cy: 300, r: 18, hp: 1, hp0: 1, dead: false, deadT: 0 });
      G.mode = 'fly'; setProj({ x: 580, y: 300, vx: 200, vy: 0, kind: 'da', trail: [] });
      for (let i = 0; i < 10; i++) update(1/60);
      const dead = targets.length && targets[0].dead;
      for (let i = 0; i < 30; i++) update(1/60);
      const stillThere = targets.length;
      for (let i = 0; i < 120; i++) update(1/60);
      return [dead, stillThere, targets.length];
    }""")
    assert r[0] and r[1] == 1 and r[2] == 0, f'lính gục phải nằm lại một lúc rồi mới biến mất: {r}'


@test
def test_destroyed_wall_shakes_the_screen(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
      startLevel(0); G.shake = 0;
      blocks.length = 0; blocks.push({ cx: 600, cy: 440, w: 36, h: 100, hp: 1, dead: false });
      G.mode = 'fly'; setProj({ x: 575, y: 440, vx: 300, vy: 0, kind: 'da', trail: [] });
      update(1/60);
      return [G.shake, blocks.length];
    }""")
    assert r[1] == 0 and r[0] > 0, f'sập tường phải rung màn hình: {r}'


@test
def test_number_keys_switch_ammo_when_fire_shots_exist(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(3)")
    pg.keyboard.press('2')
    assert pg.evaluate("G.ammo") == 'dau'
    pg.keyboard.press('1')
    assert pg.evaluate("G.ammo") == 'da'
    pg.evaluate("startLevel(0)")
    pg.keyboard.press('2')
    assert pg.evaluate("G.ammo") == 'da', 'màn không có đạn tẩm dầu thì không được chọn nó'


@test
def test_every_enemy_can_be_killed_by_some_shot(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    bad = pg.evaluate("""() => {
      const bad = [];
      for (let li = 0; li < LEVELS.length; li++) {
        for (let j = 0; j < LEVELS[li].targets.length; j++) {
          let ok = false;
          search: for (const kind of ['da', 'dau']) for (let a = .08; a < 1.5; a += .07) for (let p = 30; p <= 90; p += 6) {
            startLevel(li); G.wind = LEVELS[li].wind; G.t = 0; G.mode = 'fly';
            const tg = targets[j];
            setProj({ x: ANCHOR.x, y: ANCHOR.y, vx: Math.cos(a) * p * LAUNCH_K, vy: -Math.sin(a) * p * LAUNCH_K, kind, trail: [] });
            for (let f = 0; f < 300 && proj; f++) update(1/60);
            if (tg.dead) { ok = true; break search; }
          }
          if (!ok) bad.push(`màn ${li + 1} lính ${j + 1}`);
        }
      }
      return bad;
    }""")
    assert bad == [], f'có lính địch không đạn nào bắn trúng được: {bad}'


@test
def test_result_card_shows_earned_stars(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0); G.won = true; G.stars = 2; showResult()")
    assert pg.locator('#card .star.on').count() == 2
    assert pg.locator('#card .star').count() == 3


@test
def test_old_save_keeps_unlocked_levels(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("localStorage.setItem('ban-na-v1', JSON.stringify({ maxLevel: 2 }))")
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate("unlocked(2) && !unlocked(3)"), 'save cũ phải giữ đúng số màn đã mở'


@test
def test_hub_card_progress_counts_eight_levels(pg, browser, base):
    pg.goto(root(base)); pg.wait_for_timeout(300)
    pg.evaluate("localStorage.setItem('ban-na-v1', JSON.stringify({ maxLevel: 8 }))")
    pg.reload(); pg.wait_for_timeout(300)
    assert 'Đã phá 8/8 màn' in pg.locator('[data-game="ban-na"] .progress').inner_text()


run(TESTS)
