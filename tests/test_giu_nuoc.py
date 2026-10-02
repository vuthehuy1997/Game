#!/usr/bin/env python3
"""Kiểm thử Giữ Nước Qua Ngàn Năm. Chạy: python3 tests/test_giu_nuoc.py [lọc tên]"""
from harness import run, root

URL = 'games/giu-nuoc-qua-ngan-nam/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_start_era_sets_up_match(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    st = pg.evaluate("[G.phase, G.era.id, G.gold, G.hq.hp, G.hq.maxHp, B.length]")
    assert st[:3] == ['prep', 'hai-ba-trung', 40], st
    assert st[3] == st[4] and st[5] == 0, st


@test
def test_era_select_locks_future_eras(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    n_open = pg.evaluate("() => { showEraSelect(); return document.querySelectorAll('.eraBtn:not([disabled])').length; }")
    assert n_open == 1, n_open


@test
def test_build_blocks_on_occupied_plot_and_when_poor(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    gold0 = pg.evaluate("G.gold")
    assert pg.evaluate("build(0, 'camp')") == True
    assert pg.evaluate("G.gold") == gold0 - 30
    assert pg.evaluate("B.length") == 1
    # lô đã có công trình: không xây đè được, không trừ thêm vàng
    gold1 = pg.evaluate("G.gold")
    assert pg.evaluate("build(0, 'tower')") == False
    assert pg.evaluate("B.length") == 1 and pg.evaluate("G.gold") == gold1
    # hết vàng: không xây lô khác được nữa
    pg.evaluate("G.gold = 0")
    assert pg.evaluate("build(1, 'camp')") == False
    assert pg.evaluate("B.length") == 1 and pg.evaluate("G.gold") == 0


@test
def test_hq_upgrade_increases_max_hp_and_costs_gold(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0); G.gold = 1000")
    maxHp0 = pg.evaluate("G.hq.maxHp")
    ok = pg.evaluate("upgradeHQ()")
    assert ok and pg.evaluate("G.hq.lvl") == 2
    assert pg.evaluate("G.hq.maxHp") > maxHp0
    assert pg.evaluate("G.hq.hp") == pg.evaluate("G.hq.maxHp")


run(TESTS)
