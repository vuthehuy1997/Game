#!/usr/bin/env python3
"""Kiểm thử Giữ Nước Qua Ngàn Năm. Chạy: python3 tests/test_giu_nuoc_qua_ngan_nam.py [lọc tên]"""
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
def test_start_era_resets_battlefield_state(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        return {
            phase: G.phase, stance: G.stance,
            hqFull: G.hq.hp === G.hq.maxHp, oppHqFull: G.oppHq.hp === G.oppHq.maxHp,
            minersTotal: G.miners.total, minersAtMine: G.miners.atMine,
            troopsLen: troops.length, trainQueueLen: G.train.queue.length,
        };
    }""")
    assert r["phase"] == "battle"
    assert r["stance"] == "defend"
    assert r["hqFull"] is True
    assert r["oppHqFull"] is True
    assert r["minersTotal"] == 0
    assert r["minersAtMine"] == 0
    assert r["troopsLen"] == 0
    assert r["trainQueueLen"] == 0


run(TESTS)
