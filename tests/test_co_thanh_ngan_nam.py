#!/usr/bin/env python3
"""Kiểm thử Cổ Thành Ngàn Năm. Chạy: python3 tests/test_co_thanh_ngan_nam.py [lọc tên]"""
from harness import run, root

URL = 'games/co-thanh-ngan-nam/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


def open_prep(pg, era=0):
    pg.evaluate(f"startEra({era}); beginPrep()")


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_only_first_era_unlocked_on_fresh_save(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("isUnlocked(0)") is True
    assert pg.evaluate("isUnlocked(1)") is False


@test
def test_build_spends_gold_and_fills_slot(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    gold0 = pg.evaluate("G.gold")
    assert pg.evaluate("placeBuild(1, 'wall')") is True
    assert pg.evaluate("G.gold") == gold0 - 30
    assert pg.evaluate("slots[1].b.kind") == 'wall'


@test
def test_build_refused_without_gold_or_on_occupied_slot(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("G.gold = 0")
    assert pg.evaluate("placeBuild(1, 'wall')") is False
    pg.evaluate("G.gold = 500; placeBuild(1, 'wall')")
    assert pg.evaluate("placeBuild(1, 'pit')") is False


@test
def test_build_refused_during_battle(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("G.mode = 'battle'")
    assert pg.evaluate("placeBuild(1, 'wall')") is False


@test
def test_wall_stops_enemy_until_it_breaks(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("placeBuild(1, 'wall'); G.mode = 'battle'; spawnEnemy('bo', 0); enemies[0].x = 600")
    pg.evaluate("for (let i = 0; i < 600; i++) tick(1/60)")
    x = pg.evaluate("enemies[0].x")
    assert 455 <= x <= 475, f'kẻ địch phải dừng sát tường, x={x}'
    assert pg.evaluate("slots[1].b.hp") < 150, 'tường phải bị đánh'


@test
def test_tower_kills_enemy_in_range(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("placeBuild(1, 'tower'); G.mode = 'battle'; spawnEnemy('bo', 0); enemies[0].x = 600")
    pg.evaluate("for (let i = 0; i < 360; i++) tick(1/60)")
    assert pg.evaluate("enemies.length") == 0, 'tháp nỏ phải hạ được giặc trong tầm bắn'


@test
def test_enemy_reaching_gate_damages_gate(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("G.mode = 'battle'; spawnEnemy('bo', 2); enemies[0].x = 300")
    pg.evaluate("for (let i = 0; i < 120; i++) tick(1/60)")
    assert pg.evaluate("G.gateHp") < 100, 'giặc tới cổng phải đánh vào cổng'


@test
def test_pit_hurts_passing_enemy_only_once(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("placeBuild(0, 'pit'); G.mode = 'battle'; spawnEnemy('bo', 0); enemies[0].x = 400")
    pg.evaluate("for (let i = 0; i < 180; i++) tick(1/60)")
    assert pg.evaluate("enemies[0].hp") == 30, 'hố chông chỉ gây sát thương một lần cho mỗi kẻ địch'


@test
def test_fire_pot_hits_only_enemies_in_radius(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("placeBuild(4, 'fire'); G.mode = 'battle'; spawnEnemy('bo', 1); spawnEnemy('bo', 0)")
    pg.evaluate("enemies[0].x = 440; enemies[1].x = 440; tick(1/60)")
    hp = pg.evaluate("enemies.map(e => [e.lane, e.hp])")
    assert [1, 20] in hp, f'kẻ địch trong bán kính phải trúng vạc dầu: {hp}'
    assert [0, 60] in hp, f'kẻ địch ngoài bán kính không được trúng: {hp}'


@test
def test_cavalry_era_pit_kills_horsemen(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(1); beginPrep(); placeBuild(0, 'pit'); G.mode = 'battle'; spawnEnemy('ky', 0); enemies[0].x = 400")
    pg.evaluate("for (let i = 0; i < 120; i++) tick(1/60)")
    assert pg.evaluate("enemies.length") == 0, 'thời Mai Thúc Loan: hố chông gây gấp đôi cho kỵ binh'


@test
def test_trench_enemy_hidden_from_towers(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(5); beginPrep(); placeBuild(1, 'tower'); G.mode = 'battle'; spawnEnemy('hao', 0); enemies[0].x = 800")
    pg.evaluate("for (let i = 0; i < 30; i++) tick(1/60)")
    assert pg.evaluate("enemies[0].hidden") is True
    assert pg.evaluate("enemies[0].hp") == 70, 'giặc trong hào không bị tháp nỏ bắn trúng'


@test
def test_wave_clear_advances_to_next_wave_in_prep(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("G.mode = 'battle'; G.queue.length = 0; enemies.length = 0; tick(1/60)")
    assert pg.evaluate("G.wave") == 1
    assert pg.evaluate("G.mode") == 'prep'


@test
def test_clearing_last_wave_wins_and_saves_progress(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("G.wave = ERAS[0].waves.length - 1; G.mode = 'battle'; G.queue.length = 0; enemies.length = 0; tick(1/60)")
    assert pg.evaluate("G.mode") == 'over'
    assert pg.evaluate("G.result") == 'won'
    assert pg.evaluate("loadSave().cleared") == 1
    assert pg.evaluate("isUnlocked(1)") is True


@test
def test_gate_destroyed_is_defeat(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    open_prep(pg)
    pg.evaluate("G.gateHp = 1; G.mode = 'battle'; spawnEnemy('bo', 2); enemies[0].x = 280")
    pg.evaluate("for (let i = 0; i < 120; i++) tick(1/60)")
    assert pg.evaluate("G.mode") == 'over'
    assert pg.evaluate("G.result") == 'lost'


@test
def test_saved_progress_survives_reload(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("saveProgress(2, 3)")
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate("loadSave().cleared") == 3
    assert pg.evaluate("loadSave().stars[2]") == 3
    assert pg.evaluate("isUnlocked(3)") is True


run(TESTS)
