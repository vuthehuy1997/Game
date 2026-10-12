#!/usr/bin/env python3
"""Kiểm thử Kháng Chiến Cứu Quốc. Chạy: python3 tests/test_khang_chien_fps.py [lọc tên]"""
from harness import run, root

URL = 'games/khang-chien-fps/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_four_campaigns_defined(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("CAMPAIGNS.length") == 4
    assert pg.evaluate("CAMPAIGNS.every(c => c.levels.length >= 2)")


@test
def test_campaign_menu_shows_four_campaigns(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('#card .lvBtn').count() == 4


@test
def test_second_campaign_locked_initially(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('#card .lvBtn').nth(1).is_disabled()


@test
def test_loading_level_sets_player_and_enemies(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("loadLevel(0, 0)")
    assert pg.evaluate("G.mode") == 'play'
    assert pg.evaluate("enemies.length") == 3
    assert pg.evaluate("Number.isFinite(P.x) && Number.isFinite(P.y)")


@test
def test_moving_forward_changes_position(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    dx = pg.evaluate("""() => {
      loadLevel(0, 0);
      P.angle = 0; const x0 = P.x;
      held.add('up');
      for (let i = 0; i < 60; i++) update(1/60);
      held.delete('up');
      return P.x - x0;
    }""")
    assert dx > 0.3, 'người chơi không tiến lên dù giữ hành động "up"'


@test
def test_cannot_walk_through_wall(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    x = pg.evaluate("""() => {
      loadLevel(0, 0);
      P.x = 1.1; P.y = 7.5; P.angle = Math.PI;  // quay mặt thẳng vào tường biên bên trái
      held.add('up');
      for (let i = 0; i < 60; i++) update(1/60);
      held.delete('up');
      return P.x;
    }""")
    assert x > 0.5, 'người chơi xuyên qua tường'


@test
def test_shoot_hits_enemy_in_view(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp0, hp1 = pg.evaluate("""() => {
      loadLevel(0, 0);
      const e = enemies[0];
      P.x = e.x - 1; P.y = e.y; P.angle = 0; P.ammo = 5; P.fireT = 0;
      const hp0 = e.hp;
      shoot();
      return [hp0, e.hp];
    }""")
    assert hp1 < hp0, 'bắn trúng địch trong tầm ngắm nhưng máu không giảm'


@test
def test_shoot_misses_enemy_outside_aim_cone(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp0, hp1 = pg.evaluate("""() => {
      loadLevel(0, 0);
      const e = enemies[0];
      P.x = e.x - 1; P.y = e.y; P.angle = Math.PI / 2; P.ammo = 5; P.fireT = 0;  // ngắm lệch 90 độ
      const hp0 = e.hp;
      shoot();
      return [hp0, e.hp];
    }""")
    assert hp1 == hp0, 'bắn lệch góc ngắm vẫn trúng địch'


@test
def test_killing_all_enemies_and_reaching_exit_completes_level(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    mode, progress = pg.evaluate("""() => {
      loadLevel(0, 0);
      enemies.forEach(e => hitEnemy(e, 9999));
      P.x = exitPos.x; P.y = exitPos.y;
      checkExit();
      return [G.mode, S.progress[0]];
    }""")
    assert mode == 'result'
    assert progress == 1


@test
def test_exit_blocked_while_enemies_remain(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    mode = pg.evaluate("""() => {
      loadLevel(0, 0);
      P.x = exitPos.x; P.y = exitPos.y;
      checkExit();
      return G.mode;
    }""")
    assert mode == 'play', 'tới điểm thoát khi còn địch vẫn hoàn thành màn'


@test
def test_enemy_damages_player_at_close_range(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp = pg.evaluate("""() => {
      loadLevel(0, 0);
      const e = enemies[0];
      P.x = e.x; P.y = e.y - 0.3; P.hp = 100; e.fireT = 0;
      for (let i = 0; i < 90; i++) update(1/60);
      return P.hp;
    }""")
    assert hp < 100, 'địch kề sát có đường ngắm không gây sát thương cho người chơi'


@test
def test_game_over_on_zero_hp(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    mode = pg.evaluate("""() => {
      loadLevel(0, 0);
      const e = enemies[0];
      P.x = e.x; P.y = e.y - 0.3; P.hp = 1; e.fireT = 0;
      for (let i = 0; i < 30; i++) update(1/60);
      return G.mode;
    }""")
    assert mode == 'result'


@test
def test_reload_refills_ammo(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    ammo = pg.evaluate("""() => {
      loadLevel(0, 0);
      P.ammo = 0;
      reload();
      update(2.0);
      return P.ammo;
    }""")
    assert ammo > 0


@test
def test_pickup_health_restores_hp(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp = pg.evaluate("""() => {
      loadLevel(0, 0);
      P.hp = 50; P.x = 6.5; P.y = 6.5;  // vị trí vật phẩm hồi máu của màn 1
      for (let i = 0; i < 5; i++) update(1/60);
      return P.hp;
    }""")
    assert hp > 50


@test
def test_weapon_unlocks_when_entering_its_campaign(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    has_smg = pg.evaluate("""() => {
      loadLevel(1, 0);  // Biên Giới, mở khoá 'smg'
      return S.weapons.includes('smg');
    }""")
    assert has_smg


@test
def test_setWeapon_refuses_locked_weapon(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    weapon = pg.evaluate("""() => {
      loadLevel(0, 0);  // chỉ có 'rifle'
      setWeapon('smg');
      return P.weapon;
    }""")
    assert weapon == 'rifle'


@test
def test_progress_persists_after_reload(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      loadLevel(0, 0);
      enemies.forEach(e => hitEnemy(e, 9999));
      P.x = exitPos.x; P.y = exitPos.y;
      checkExit();
    }""")
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate("S.progress[0]") == 1


run(TESTS)
