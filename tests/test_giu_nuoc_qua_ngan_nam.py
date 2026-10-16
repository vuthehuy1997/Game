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


@test
def test_mine_income_only_when_miner_assigned(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        updateMineIncome(1); // 1s, chưa gán thợ nào
        const goldAfterNoMiner = G.gold;
        G.miners.total = 1;
        assignMinerToMine();
        updateMineIncome(1); // 1s, đã gán 1 thợ
        return { goldAfterNoMiner, goldAfterMiner: G.gold, rate: G.era.mine.perMinerRate };
    }""")
    assert r["goldAfterNoMiner"] == 40  # G.gold khởi tạo 40 (hằng số trong startEra), không đổi
    assert abs(r["goldAfterMiner"] - (40 + r["rate"])) < 0.01


@test
def test_train_miner_respects_cost_and_cap(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.gold = 1000;
        const results = [];
        for (let i = 0; i < G.era.maxMiners + 1; i++) results.push(trainMiner());
        return { results, queueLen: G.train.queue.length, maxMiners: G.era.maxMiners };
    }""")
    assert r["results"][:r["maxMiners"]] == [True] * r["maxMiners"]
    assert r["results"][r["maxMiners"]] is False  # vượt maxMiners phải thất bại
    assert r["queueLen"] == r["maxMiners"]


@test
def test_assign_unassign_miner_bounds(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        const noFreeMiner = assignMinerToMine(); // chưa có thợ nào
        G.miners.total = 1;
        const assignOk = assignMinerToMine();
        const assignOverflow = assignMinerToMine(); // đã gán hết thợ rảnh
        const unassignOk = unassignMinerFromMine();
        const unassignUnderflow = unassignMinerFromMine(); // đã rút hết
        return { noFreeMiner, assignOk, assignOverflow, unassignOk, unassignUnderflow };
    }""")
    assert r["noFreeMiner"] is False
    assert r["assignOk"] is True
    assert r["assignOverflow"] is False
    assert r["unassignOk"] is True
    assert r["unassignUnderflow"] is False


@test
def test_train_queue_processes_miner_after_train_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.gold = 1000;
        trainMiner();
        const totalBefore = G.miners.total;
        const queueLenBefore = G.train.queue.length;
        updateTrainQueue(G.era.minerTrainTime + 0.01);
        return { totalBefore, queueLenBefore, totalAfter: G.miners.total, queueLenAfter: G.train.queue.length };
    }""")
    assert r["totalBefore"] == 0
    assert r["queueLenBefore"] == 1
    assert r["totalAfter"] == 1
    assert r["queueLenAfter"] == 0


run(TESTS)
