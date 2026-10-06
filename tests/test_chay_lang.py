#!/usr/bin/env python3
"""Kiểm thử Chạy Làng. Chạy: python3 tests/test_chay_lang.py [lọc tên]"""
from harness import run, root

URL = 'games/chay-lang/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_lane_change_moves_player(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("moveLane(-1)")
    assert pg.evaluate("P.lane") == 0


@test
def test_wrong_dodge_still_collides(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      P.lane = 1; obstacles.push({ lane: 1, y: 460, kind: 'duck' });
      doJump();  // né sai hành động cho chướng ngại 'duck' (phải trượt, không phải nhảy)
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'over', 'né sai hành động vẫn phải va chạm'


@test
def test_correct_dodge_avoids_collision(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      P.lane = 1; obstacles.push({ lane: 1, y: 460, kind: 'jump' });
      doJump();
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'run', 'né đúng hành động vẫn bị tính va chạm'


@test
def test_score_saved_as_new_best(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      G.dist = 5000; G.coins = 10;
      obstacles.push({ lane: P.lane, y: 460, kind: 'block' });
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'over'
    assert pg.evaluate("S.best") == pg.evaluate("G.score") and pg.evaluate("G.score") > 0


@test
def test_shield_absorbs_one_hit(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      P.lane = 1; P.fx.shield = 5;
      obstacles.push({ lane: 1, y: 460, kind: 'block' });
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'run', 'khiên phải đỡ được va chạm'
    assert pg.evaluate("P.fx.shield") == 0, 'khiên dùng xong thì mất'
    assert pg.evaluate("obstacles.length") == 0, 'chướng ngại bị đỡ phải được gỡ khỏi màn'


@test
def test_magnet_pulls_coins_from_above(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("() => { P.lane = 1; P.fx.magnet = 5; pickups.push({ lane: 1, y: 330 }); update(1/60); }")
    assert pg.evaluate("G.coins") == 1, 'nam châm phải hút được xu ở phía trên'


@test
def test_coin_above_is_not_collected_without_magnet(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("() => { P.lane = 1; pickups.push({ lane: 1, y: 330 }); update(1/60); }")
    assert pg.evaluate("G.coins") == 0


@test
def test_boots_double_coin_value(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("() => { P.lane = 1; P.fx.boots = 5; pickups.push({ lane: 1, y: 460 }); update(1/60); }")
    assert pg.evaluate("G.coins") == 2


@test
def test_item_pickup_activates_effect(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("() => { P.lane = 2; items.push({ lane: 2, y: 460, kind: 'magnet' }); update(1/60); }")
    assert pg.evaluate("P.fx.magnet") > 0, 'nhặt vật phẩm phải kích hoạt hiệu ứng'


@test
def test_zones_follow_distance(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    got = pg.evaluate("[zoneAt(0), zoneAt(29), zoneAt(30), zoneAt(64), zoneAt(65), zoneAt(500)]")
    assert got == [0, 0, 1, 1, 2, 2], got


@test
def test_story_milestone_fires_once(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("() => { G.dist = 30 * 20; update(1/60); }")
    assert pg.evaluate("G.zone") == 1
    assert pg.evaluate("G.story") == 2
    assert 'rừng tre' in pg.evaluate("banner.txt").lower()
    pg.evaluate("update(1/60)")
    assert pg.evaluate("G.story") == 2, 'mốc cốt truyện không được kích hoạt lại'


@test
def test_running_leaves_dust_footsteps(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("() => { for (let i = 0; i < 60; i++) update(1/60); }")
    assert pg.evaluate("parts.filter(p => p.kind === 'dust').length") > 0


@test
def test_game_over_updates_run_stats(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("() => { G.dist = 400; obstacles.push({ lane: P.lane, y: 460, kind: 'block' }); update(1/60); }")
    assert pg.evaluate("G.mode") == 'over'
    assert pg.evaluate("S.runs") == 1
    assert pg.evaluate("S.bestDist") == 20


run(TESTS)
