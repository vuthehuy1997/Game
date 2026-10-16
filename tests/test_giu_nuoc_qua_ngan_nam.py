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


@test
def test_train_troop_spawns_ally_after_train_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        const goldBefore = G.gold;
        const def = G.era.troopTypes[0];
        const ok = trainTroop(def.id);
        const goldAfterTrain = G.gold;
        updateTrainQueue(def.trainTime + 0.01);
        return {
            ok, goldBefore, goldAfterTrain, cost: def.cost, expectedName: def.name,
            troopsLen: troops.length,
            allyName: troops[0] && troops[0].name,
        };
    }""")
    assert r["ok"] is True
    assert r["goldAfterTrain"] == r["goldBefore"] - r["cost"]
    assert r["troopsLen"] == 1
    assert r["allyName"] == r["expectedName"]


@test
def test_train_troop_fails_without_enough_gold(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.gold = 0;
        return trainTroop(G.era.troopTypes[0].id);
    }""")
    assert r is False


@test
def test_train_troop_respects_max_allies_cap(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.gold = 1000;
        const def = G.era.troopTypes[0];
        const results = [];
        for (let i = 0; i < 9; i++) results.push(trainTroop(def.id));
        return { results, queueLen: G.train.queue.length };
    }""")
    assert r["results"][:8] == [True] * 8
    assert r["results"][8] is False  # vượt MAX_ALLIES (8) phải thất bại
    assert r["queueLen"] == 8


@test
def test_stance_defend_moves_ally_toward_hold_x(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.stance = 'defend';
        spawnTroop('ally', G.era.troopTypes[0]);
        const u = troops[0];
        u.x = 400; // xa ALLY_HOLD_X (230), không có địch nên phải lùi về
        const before = u.x;
        updateTroops(0.1);
        return { before, after: u.x, holdX: ALLY_HOLD_X };
    }""")
    assert r["after"] < r["before"]  # phải di chuyển VỀ hướng ALLY_HOLD_X (giảm x vì 230 < 400)


@test
def test_stance_attack_moves_ally_toward_enemy_hq_and_damages_it(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.stance = 'attack';
        spawnTroop('ally', G.era.troopTypes[0]);
        const u = troops[0];
        u.x = OPP_HQ_FRONT_X; // đã áp sát, không có địch nào chặn
        const hpBefore = G.oppHq.hp;
        updateTroops(0.5);
        return { hpBefore, hpAfter: G.oppHq.hp, dmg: u.dmg };
    }""")
    assert r["hpAfter"] == r["hpBefore"] - r["dmg"] * 0.5


@test
def test_stance_switch_mid_battle_redirects_immediately(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.stance = 'defend';
        spawnTroop('ally', G.era.troopTypes[0]);
        const u = troops[0];
        u.x = ALLY_HOLD_X; // đã ở vị trí giữ
        setStance('attack');
        const before = u.x;
        updateTroops(0.1);
        return { before, after: u.x };
    }""")
    assert r["after"] > r["before"]  # đổi thế trận → tiến về phía địch ngay khung kế tiếp


@test
def test_enemy_spawns_on_schedule_capped_at_max_alive(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        pause(true);
        startEra(0);
        G.era.enemy.maxAlive = 1; // ép giới hạn nhỏ để test nhanh
        updateEnemySpawns(G.era.enemy.spawnEvery + 0.01);
        const afterFirst = troops.filter(u => u.side === 'enemy').length;
        updateEnemySpawns(G.era.enemy.spawnEvery + 0.01); // đã đạt maxAlive, không sinh thêm
        const afterSecond = troops.filter(u => u.side === 'enemy').length;
        pause(false);
        return { afterFirst, afterSecond };
    }""")
    assert r["afterFirst"] == 1
    assert r["afterSecond"] == 1


@test
def test_boss_spawns_once_at_boss_at_mark(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        pause(true);
        startEra(0);
        G.t = G.era.bossAt + 50; // nhảy cóc qua mốc trong 1 bước dt lớn
        updateEnemySpawns(0.016);
        const bossNameAfterFirst = troops.filter(u => u.name === 'Tướng giặc').length;
        updateEnemySpawns(0.016); // vẫn ở sau mốc, không sinh thêm
        const bossNameAfterSecond = troops.filter(u => u.name === 'Tướng giặc').length;
        pause(false);
        return { bossNameAfterFirst, bossNameAfterSecond, bossSpawned: G.bossSpawned };
    }""")
    assert r["bossNameAfterFirst"] == 1
    assert r["bossNameAfterSecond"] == 1
    assert r["bossSpawned"] is True


@test
def test_check_end_win_destroys_opp_hq_and_advances_max_era(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        const maxEraBefore = S.maxEra;
        G.oppHq.hp = 0;
        checkEnd();
        return { phase: G.phase, maxEraAfter: S.maxEra, maxEraBefore };
    }""")
    assert r["phase"] == "win"
    assert r["maxEraAfter"] == max(r["maxEraBefore"], 1)


@test
def test_check_end_lose_when_hq_destroyed(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        G.hq.hp = 0;
        checkEnd();
        return { phase: G.phase };
    }""")
    assert r["phase"] == "lose"


@test
def test_check_end_noop_while_both_hq_alive(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        checkEnd();
        return G.phase;
    }""")
    assert r == "battle"


@test
def test_hud_has_no_leftover_plot_or_wave_elements(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    assert pg.evaluate("document.getElementById('plots')") is None
    assert pg.evaluate("document.getElementById('btnHqUp')") is None
    assert pg.evaluate("document.getElementById('btnStartWave')") is None
    assert pg.evaluate("document.getElementById('btnStance')") is not None


@test
def test_stance_button_click_toggles_label_and_state(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
        startEra(0);
        document.getElementById('btnStance').click();
        return { stance: G.stance, label: document.getElementById('btnStance').textContent };
    }""")
    assert r["stance"] == "attack"
    assert "Tấn công" in r["label"]


run(TESTS)
