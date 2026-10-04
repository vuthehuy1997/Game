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
      P.lane = 1; obstacles.push({ lane: 1, x: 160, kind: 'duck' });
      doJump();  // né sai hành động cho chướng ngại 'duck' (phải trượt, không phải nhảy)
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'over', 'né sai hành động vẫn phải va chạm'


@test
def test_correct_dodge_avoids_collision(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startRun()")
    pg.evaluate("""() => {
      P.lane = 1; obstacles.push({ lane: 1, x: 160, kind: 'jump' });
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
      obstacles.push({ lane: P.lane, x: 160, kind: 'block' });
      update(1/60);
    }""")
    assert pg.evaluate("G.mode") == 'over'
    assert pg.evaluate("S.best") == pg.evaluate("G.score") and pg.evaluate("G.score") > 0


run(TESTS)
