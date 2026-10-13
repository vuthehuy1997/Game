#!/usr/bin/env python3
"""Kiểm thử Lũy Tre Làng. Chạy: python3 tests/test_luy_tre_lang.py [lọc tên]"""
from harness import run, root

URL = 'games/luy-tre-lang/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_player_falls_and_stands_on_ground(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("for (let i = 0; i < 60; i++) tick(1 / 60)")
    assert pg.evaluate("G.grounded") is True


@test
def test_wall_blocks_horizontal_movement(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("for (let i = 0; i < 30; i++) tick(1 / 60)")
    x0 = pg.evaluate("G.px")
    col = pg.evaluate("Math.floor(G.px / TS) + 1")
    row = pg.evaluate("Math.floor(G.py / TS) - 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.BEDROCK); setTile(G.tiles, {col}, {row - 1}, TILE.BEDROCK)")
    pg.evaluate("held.add('right')")
    pg.evaluate("for (let i = 0; i < 40; i++) tick(1 / 60)")
    pg.evaluate("held.delete('right')")
    x1 = pg.evaluate("G.px")
    assert x1 < (col) * 24 + 1, (x0, x1, col)


@test
def test_mining_breaks_tile_and_adds_inventory(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) - 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.STONE)")
    before = pg.evaluate("invCount(G.inv, 'da')")
    broke = False
    for _ in range(5):
        if pg.evaluate(f"hitTile({col}, {row})"):
            broke = True
            break
    assert broke
    assert pg.evaluate(f"getTile(G.tiles, {col}, {row})") == 0
    assert pg.evaluate("invCount(G.inv, 'da')") == before + 1


@test
def test_mining_out_of_reach_fails(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS) + 40")
    row = pg.evaluate("Math.floor(G.py / TS)")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.STONE)")
    assert pg.evaluate(f"hitTile({col}, {row})") is False


@test
def test_placing_block_consumes_inventory(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS) + 2")
    row = pg.evaluate("Math.floor(G.py / TS) - 3")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.AIR)")
    pg.evaluate("invAdd(G.inv, 'tuong_tre', 2)")
    assert pg.evaluate(f"placeTile({col}, {row}, 'tuong_tre')") is True
    assert pg.evaluate(f"getTile(G.tiles, {col}, {row})") == 8
    assert pg.evaluate("invCount(G.inv, 'tuong_tre')") == 1


@test
def test_placing_refuses_on_occupied_tile(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS) + 2")
    row = pg.evaluate("Math.floor(G.py / TS) - 3")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.STONE)")
    pg.evaluate("invAdd(G.inv, 'tuong_tre', 2)")
    assert pg.evaluate(f"placeTile({col}, {row}, 'tuong_tre')") is False


@test
def test_crafting_basic_recipe_without_bench(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.inv = freshInventory(); invAdd(G.inv, 'tre', 4)")
    assert pg.evaluate("craft('cuoc_tre')") is True
    assert pg.evaluate("invCount(G.inv, 'cuoc_tre')") == 1
    assert pg.evaluate("invCount(G.inv, 'tre')") == 0


@test
def test_crafting_bench_recipe_requires_bench_nearby(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.inv = freshInventory(); invAdd(G.inv, 'da', 4)")
    assert pg.evaluate("craft('gach_gom')") is False
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) - 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.BENCH)")
    assert pg.evaluate("craft('gach_gom')") is True
    assert pg.evaluate("invCount(G.inv, 'gach_gom')") == 3


@test
def test_day_night_cycle_advances(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("isNight()") is False
    pg.evaluate("for (let i = 0; i < 2000; i++) tick(0.05)")
    assert pg.evaluate("G.day") > 1


@test
def test_mobs_spawn_at_night_and_despawn_at_day(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.time = 0.5; G.mobs.length = 0; G.spawnT = 999")
    pg.evaluate("spawnMobsIfNeeded(0.1)")
    assert pg.evaluate("G.mobs.length") > 0
    pg.evaluate("G.time = 0.1")
    pg.evaluate("updateMobs(0.1)")
    assert pg.evaluate("G.mobs.length") == 0


@test
def test_mob_damages_player_on_contact(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp0 = pg.evaluate("G.hp")
    pg.evaluate("""() => {
      G.time = 0.5;
      G.mobs.push({ kind: 'quai_rung', hp: 24, x: G.px, y: G.py, baseY: G.py, atkCd: 0 });
      updateMobs(0.1);
    }""")
    assert pg.evaluate("G.hp") < hp0


@test
def test_attack_kills_mob_and_grants_gold(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    gold0 = pg.evaluate("G.gold")
    pg.evaluate("G.mobs.push({ kind: 'quai_rung', hp: 1, x: G.px, y: G.py, baseY: G.py, atkCd: 0 })")
    assert pg.evaluate("attackMobs()") is True
    assert pg.evaluate("G.mobs.length") == 0
    assert pg.evaluate("G.gold") == gold0 + 3


@test
def test_valid_house_spawns_npc(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const fx = 20, fy = 40;
      setTile(G.tiles, fx, fy, TILE.TORCH);
      setTile(G.tiles, fx, fy - 1, TILE.AIR);
      setTile(G.tiles, fx, fy + 1, TILE.STONE);
      setTile(G.tiles, fx - 1, fy, TILE.WALL);
      setTile(G.tiles, fx - 1, fy - 1, TILE.WALL);
      setTile(G.tiles, fx + 1, fy, TILE.DOOR);
      setTile(G.tiles, fx + 1, fy - 1, TILE.WALL);
      setTile(G.tiles, fx - 1, fy - 2, TILE.ROOF);
      setTile(G.tiles, fx, fy - 2, TILE.ROOF);
      setTile(G.tiles, fx + 1, fy - 2, TILE.ROOF);
    }""")
    assert pg.evaluate("checkHouse(G.tiles, 20, 40)") is True
    assert pg.evaluate("maybeSpawnNpc()") is True
    assert pg.evaluate("G.npc.active") is True


@test
def test_incomplete_house_does_not_spawn_npc(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const fx = 20, fy = 40;
      setTile(G.tiles, fx, fy, TILE.AIR);
      setTile(G.tiles, fx, fy - 1, TILE.AIR);
      setTile(G.tiles, fx, fy + 1, TILE.STONE);
      setTile(G.tiles, fx - 1, fy, TILE.WALL);
      setTile(G.tiles, fx - 1, fy - 1, TILE.WALL);
      setTile(G.tiles, fx + 1, fy, TILE.DOOR);
      setTile(G.tiles, fx + 1, fy - 1, TILE.WALL);
      // thiếu mái
    }""")
    assert pg.evaluate("checkHouse(G.tiles, 20, 40)") is False
    assert pg.evaluate("findHouse(G.tiles)") is None


@test
def test_quest_claim_grants_reward(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    gold0 = pg.evaluate("G.gold")
    pg.evaluate("G.quests.find(q => q.id === 'q1').have = 5")
    assert pg.evaluate("claimQuest('q1')") is True
    assert pg.evaluate("G.gold") == gold0 + 30
    assert pg.evaluate("claimQuest('q1')") is False


@test
def test_mining_ore_progresses_matching_quest(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) - 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.COPPER)")
    for _ in range(5):
        if pg.evaluate(f"hitTile({col}, {row})"):
            break
    assert pg.evaluate("G.quests.find(q => q.id === 'q1').have") >= 1


@test
def test_shop_buy_and_sell(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.gold = 20")
    assert pg.evaluate("buy('duoc', 3)") is True
    assert pg.evaluate("G.gold") == 17
    pg.evaluate("invAdd(G.inv, 'dong', 2)")
    assert pg.evaluate("sell('dong', 2, 2)") is True
    assert pg.evaluate("G.gold") == 21
    assert pg.evaluate("invCount(G.inv, 'dong')") == 0


@test
def test_save_and_load_roundtrip(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.inv = freshInventory(); invAdd(G.inv, 'vang', 3); G.gold = 77; G.day = 4; G.px = 500; G.py = 300")
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) + 2")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.BRICK)")
    pg.evaluate("saveGame()")
    pg.evaluate("newGame(1)")
    assert pg.evaluate("loadGame()") is True
    assert pg.evaluate("G.gold") == 77
    assert pg.evaluate("G.day") == 4
    assert pg.evaluate("invCount(G.inv, 'vang')") == 3
    assert pg.evaluate(f"getTile(G.tiles, {col}, {row})") == 10


@test
def test_bad_save_fails_gracefully(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("localStorage.setItem('luy-tre-lang-v1', JSON.stringify({v: 2}))")
    assert pg.evaluate("loadGame()") is False


@test
def test_mobile_viewport_layout(pg, browser, base):
    pg.set_viewport_size({'width': 360, 'height': 720})
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('#hotbar').count() == 1


run(TESTS)
