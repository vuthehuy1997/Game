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
    assert pg.evaluate("checkHouse(G.tiles, 20, 40)") == 'merchant'
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


@test
def test_biome_bands_match_expected(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("biomeAt(0)") == 'plains'
    assert pg.evaluate("biomeAt(50)") == 'bamboo_forest'
    assert pg.evaluate("biomeAt(90)") == 'swamp'
    assert pg.evaluate("biomeAt(150)") == 'mountain'


@test
def test_water_reduces_move_speed_and_jump(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const col = Math.floor(G.px / TS), row = Math.floor((G.py - 1) / TS);
      setTile(G.tiles, col, row, TILE.AIR);
    }""")
    pg.evaluate("held.add('right')")
    pg.evaluate("physicsStep(1 / 60)")
    vx_normal = pg.evaluate("G.vx")
    pg.evaluate("""() => {
      const col = Math.floor(G.px / TS), row = Math.floor((G.py - 1) / TS);
      setTile(G.tiles, col, row, TILE.WATER);
    }""")
    pg.evaluate("physicsStep(1 / 60)")
    vx_water = pg.evaluate("G.vx")
    pg.evaluate("held.delete('right')")
    assert abs(vx_water) < abs(vx_normal) * .7, (vx_normal, vx_water)

    pg.evaluate("G.grounded = true; pressed.add('jump')")
    pg.evaluate("physicsStep(1 / 60)")
    vy_water = pg.evaluate("G.vy")
    pg.evaluate("pressed.delete('jump')")
    pg.evaluate("""() => {
      const col = Math.floor(G.px / TS), row = Math.floor((G.py - 1) / TS);
      setTile(G.tiles, col, row, TILE.AIR);
    }""")
    pg.evaluate("G.grounded = true; pressed.add('jump')")
    pg.evaluate("physicsStep(1 / 60)")
    vy_normal = pg.evaluate("G.vy")
    pg.evaluate("pressed.delete('jump')")
    assert abs(vy_water) < abs(vy_normal) * .85, (vy_normal, vy_water)


@test
def test_swamp_biome_has_water(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    has_water = pg.evaluate("""() => {
      for (let c = 0; c < COLS; c++) {
        if (biomeAt(c) !== 'swamp') continue;
        for (let r = 0; r < ROWS; r++) if (getTile(G.tiles, c, r) === TILE.WATER) return true;
      }
      return false;
    }""")
    assert has_water is True


@test
def test_boss_spawns_on_fifth_night_once(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.day = 5; G.time = 0.5; G.mobs.length = 0; G.bossSpawnedDay = 0")
    assert pg.evaluate("maybeSpawnBoss()") is True
    assert pg.evaluate("G.mobs.filter(m => m.kind === 'boss_vua_quai').length") == 1
    assert pg.evaluate("maybeSpawnBoss()") is False
    assert pg.evaluate("G.mobs.filter(m => m.kind === 'boss_vua_quai').length") == 1


@test
def test_boss_does_not_spawn_on_non_multiple_day(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.day = 6; G.time = 0.5; G.mobs.length = 0; G.bossSpawnedDay = 0")
    assert pg.evaluate("maybeSpawnBoss()") is False
    assert pg.evaluate("G.mobs.length") == 0


@test
def test_boss_lunge_deals_double_damage(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp0 = pg.evaluate("G.hp = 200; G.hurt = 0; 200")
    pg.evaluate("""() => {
      G.mobs.push({ kind: 'boss_vua_quai', hp: 220, x: G.px, y: G.py, baseY: G.py, atkCd: 0, lungeT: 0 });
      updateMobs(0.016);
    }""")
    assert pg.evaluate("G.hp") == hp0 - 36


@test
def test_boss_normal_contact_deals_normal_damage_outside_lunge_window(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp0 = pg.evaluate("G.hp = 200; G.hurt = 0; 200")
    pg.evaluate("""() => {
      G.mobs.push({ kind: 'boss_vua_quai', hp: 220, x: G.px, y: G.py, baseY: G.py, atkCd: 0, lungeT: 3 });
      updateMobs(0.016);
    }""")
    assert pg.evaluate("G.hp") == hp0 - 18


@test
def test_kill_boss_grants_gold_and_rare_gem(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    gold0 = pg.evaluate("G.gold")
    pg.evaluate("G.mobs.push({ kind: 'boss_vua_quai', hp: 1, x: G.px, y: G.py, baseY: G.py, atkCd: 0, lungeT: 3 })")
    assert pg.evaluate("attackMobs()") is True
    assert pg.evaluate("G.mobs.length") == 0
    assert pg.evaluate("G.gold") == gold0 + 150
    assert pg.evaluate("invCount(G.inv, 'ngoc_quy')") == 1


@test
def test_kiem_ngoc_recipe_needs_gem_and_bench(pg, browser, base):
    # kiem_ngoc giờ chỉ chế được qua thợ rèn (BLACKSMITH_RECIPES, xem Task 7), không còn trong
    # bảng Chế tạo thường (RECIPES) — craft('kiem_ngoc') mặc định (RECIPES) luôn False.
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.inv = freshInventory(); invAdd(G.inv, 'ngoc_quy', 1); invAdd(G.inv, 'sat', 2)")
    assert pg.evaluate("craft('kiem_ngoc')") is False
    assert pg.evaluate("craft('kiem_ngoc', BLACKSMITH_RECIPES)") is False  # chưa có bàn chế tác
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) - 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.BENCH)")
    assert pg.evaluate("craft('kiem_ngoc', BLACKSMITH_RECIPES)") is True
    assert pg.evaluate("invCount(G.inv, 'kiem_ngoc')") == 1
    assert pg.evaluate("WEAPON_DMG.kiem_ngoc") == 36


@test
def test_tilling_converts_dirt_to_farmland(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) + 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.DIRT); setTile(G.tiles, {col}, {row - 1}, TILE.AIR)")
    pg.evaluate("G.inv = freshInventory(); invAdd(G.inv, 'cuoc_tre', 1); G.sel = 0")
    assert pg.evaluate(f"tillSoil({col}, {row})") is True
    assert pg.evaluate(f"getTile(G.tiles, {col}, {row})") == pg.evaluate("TILE.FARMLAND")


@test
def test_tilling_fails_without_hoe(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) + 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.DIRT); setTile(G.tiles, {col}, {row - 1}, TILE.AIR)")
    pg.evaluate("G.inv = freshInventory(); G.sel = 0")
    assert pg.evaluate(f"tillSoil({col}, {row})") is False


@test
def test_planting_consumes_one_seed(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) + 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.FARMLAND)")
    pg.evaluate("G.inv = freshInventory(); invAdd(G.inv, 'hat_lua', 3); G.crops.length = 0")
    assert pg.evaluate(f"plantCrop({col}, {row}, 'hat_lua')") is True
    assert pg.evaluate("invCount(G.inv, 'hat_lua')") == 2
    assert pg.evaluate("G.crops.length") == 1


@test
def test_cannot_plant_on_occupied_farmland(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) + 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.FARMLAND)")
    pg.evaluate("G.inv = freshInventory(); invAdd(G.inv, 'hat_rau', 3); G.crops.length = 0")
    assert pg.evaluate(f"plantCrop({col}, {row}, 'hat_rau')") is True
    assert pg.evaluate(f"plantCrop({col}, {row}, 'hat_rau')") is False
    assert pg.evaluate("G.crops.length") == 1


@test
def test_crop_grows_through_stages_by_day(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.crops.length = 0; G.crops.push({c: 10, r: 10, kind: 'lua', plantedDay: 2}); G.day = 2")
    assert pg.evaluate("cropStage(G.crops[0])") == 0
    pg.evaluate("G.day = 3")
    assert pg.evaluate("cropStage(G.crops[0])") == 1
    pg.evaluate("G.day = 5")
    assert pg.evaluate("cropStage(G.crops[0])") == 3


@test
def test_harvest_before_maturity_fails(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) + 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.FARMLAND)")
    pg.evaluate(f"G.crops.length = 0; G.crops.push({{c: {col}, r: {row}, kind: 'lua', plantedDay: G.day}})")
    assert pg.evaluate(f"harvestCrop({col}, {row})") is False
    assert pg.evaluate("G.crops.length") == 1


@test
def test_harvest_at_maturity_grants_produce_and_clears_crop(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) + 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.FARMLAND)")
    pg.evaluate(f"G.inv = freshInventory(); G.crops.length = 0; G.crops.push({{c: {col}, r: {row}, kind: 'dua', plantedDay: G.day - 3}})")
    assert pg.evaluate(f"harvestCrop({col}, {row})") is True
    assert pg.evaluate("G.crops.length") == 0
    assert pg.evaluate("invCount(G.inv, 'dua')") >= 2
    assert pg.evaluate(f"getTile(G.tiles, {col}, {row})") == pg.evaluate("TILE.FARMLAND")


@test
def test_save_and_load_keeps_crops(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.crops.length = 0; G.crops.push({c: 12, r: 30, kind: 'rau', plantedDay: 1})")
    pg.evaluate("saveGame()")
    pg.evaluate("newGame(1)")
    assert pg.evaluate("loadGame()") is True
    assert pg.evaluate("G.crops.length") == 1
    assert pg.evaluate("G.crops[0].kind") == 'rau'


@test
def test_shop_buys_seeds_and_sells_produce(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.gold = 20; G.inv = freshInventory()")
    assert pg.evaluate("SHOP_BUY.some(x => x.item === 'hat_lua')") is True
    assert pg.evaluate("buy('hat_lua', 2)") is True
    assert pg.evaluate("invCount(G.inv, 'hat_lua')") == 1
    pg.evaluate("invAdd(G.inv, 'lua', 2)")
    assert pg.evaluate("SHOP_SELL.lua") == 2
    assert pg.evaluate("sell('lua', 2, 2)") is True
    assert pg.evaluate("invCount(G.inv, 'lua')") == 0


@test
def test_animals_spawn_only_day_and_plains_biome(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.time = 0.2; G.animals.length = 0; G.animalSpawnT = 999")
    pg.evaluate("spawnAnimalsIfNeeded(0.1)")
    assert pg.evaluate("G.animals.length") > 0
    assert pg.evaluate("biomeAt(Math.floor(G.animals[0].x / TS))") == 'plains'
    pg.evaluate("G.time = 0.5; G.animals.length = 0; G.animalSpawnT = 999")
    pg.evaluate("spawnAnimalsIfNeeded(0.1)")
    assert pg.evaluate("G.animals.length") == 0


@test
def test_taming_consumes_feed_and_marks_tamed(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.animals.length = 0; G.pets.length = 0")
    pg.evaluate("G.animals.push({kind: 'ga', x: G.px, y: G.py, dir: 1, wanderT: 1})")
    pg.evaluate("G.inv = freshInventory(); G.sel = 0")
    assert pg.evaluate("tameAnimal(BENCH_RADIUS)") is False  # chưa có thức ăn
    pg.evaluate("invAdd(G.inv, 'lua', 2); G.sel = 0")
    assert pg.evaluate("heldItem()") == 'lua'
    assert pg.evaluate("tameAnimal(BENCH_RADIUS)") is True
    assert pg.evaluate("G.animals.length") == 0
    assert pg.evaluate("G.pets.length") == 1
    assert pg.evaluate("G.pets[0].kind") == 'ga'
    assert pg.evaluate("G.pets[0].tamed") is True
    assert pg.evaluate("invCount(G.inv, 'lua')") == 1


@test
def test_tamed_chicken_produces_egg_over_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.pets.length = 0; G.pets.push({kind: 'ga', x: G.px, y: G.py, tamed: true, prodT: 0})")
    pg.evaluate("G.inv = freshInventory()")
    pg.evaluate("updateAnimals(19)")
    assert pg.evaluate("invCount(G.inv, 'trung')") == 0
    pg.evaluate("updateAnimals(2)")
    assert pg.evaluate("invCount(G.inv, 'trung')") == 1


@test
def test_tamed_pig_produces_pork_over_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.pets.length = 0; G.pets.push({kind: 'lon', x: G.px, y: G.py, tamed: true, prodT: 0})")
    pg.evaluate("G.inv = freshInventory()")
    pg.evaluate("updateAnimals(29)")
    assert pg.evaluate("invCount(G.inv, 'thit_lon')") == 0
    pg.evaluate("updateAnimals(2)")
    assert pg.evaluate("invCount(G.inv, 'thit_lon')") == 1


@test
def test_riding_buffalo_increases_speed_and_jump_dismounts(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.pets.length = 0; G.pets.push({kind: 'trau', x: G.px, y: G.py, tamed: true})")
    pg.evaluate("G.riding = false")
    assert pg.evaluate("tryMountNearbyTrau(BENCH_RADIUS)") is True
    assert pg.evaluate("G.riding") is True
    pg.evaluate("held.add('right'); physicsStep(1 / 60)")
    vx_riding = pg.evaluate("G.vx")
    pg.evaluate("G.riding = false; physicsStep(1 / 60)")
    vx_normal = pg.evaluate("G.vx")
    pg.evaluate("held.delete('right')")
    assert abs(vx_riding) > abs(vx_normal) * 1.3, (vx_riding, vx_normal)
    pg.evaluate("G.riding = true; G.grounded = true; pressed.add('jump')")
    pg.evaluate("tick(1 / 60)")
    assert pg.evaluate("G.riding") is False


@test
def test_save_and_load_keeps_pets_and_tamed_state(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.pets.length = 0; G.pets.push({kind: 'ga', x: 240, y: 480, tamed: true, prodT: 5})")
    pg.evaluate("saveGame()")
    pg.evaluate("newGame(1)")
    assert pg.evaluate("loadGame()") is True
    assert pg.evaluate("G.pets.length") == 1
    assert pg.evaluate("G.pets[0].kind") == 'ga'
    assert pg.evaluate("G.pets[0].tamed") is True


@test
def test_boss2_spawns_on_fifteenth_night_and_blocks_boss1_same_night(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("pause(true)")
    pg.evaluate("G.day = 15; G.time = 0.5; G.mobs.length = 0; G.bossSpawnedDay = 0; G.boss2SpawnedDay = 0")
    assert pg.evaluate("maybeSpawnBoss2()") is True
    assert pg.evaluate("G.mobs.filter(m => m.kind === 'boss_than_dam').length") == 1
    assert pg.evaluate("maybeSpawnBoss2()") is False
    # ngày 15 chia hết cho 5 -> Vua Quái Rừng phải bị chặn, không spawn chung đêm
    assert pg.evaluate("maybeSpawnBoss()") is False
    assert pg.evaluate("G.mobs.filter(m => m.kind === 'boss_vua_quai').length") == 0
    pg.evaluate("pause(false)")


@test
def test_boss1_still_spawns_on_fifth_day_not_multiple_of_fifteen(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("pause(true)")
    pg.evaluate("G.day = 10; G.time = 0.5; G.mobs.length = 0; G.bossSpawnedDay = 0; G.boss2SpawnedDay = 0")
    assert pg.evaluate("maybeSpawnBoss2()") is False
    assert pg.evaluate("maybeSpawnBoss()") is True
    assert pg.evaluate("G.mobs.filter(m => m.kind === 'boss_vua_quai').length") == 1
    pg.evaluate("pause(false)")


@test
def test_boss2_summons_minions_up_to_cap(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("pause(true)")
    pg.evaluate("""
      G.time = 0.5;
      G.mobs.length = 0;
      G.mobs.push({ kind: 'boss_than_dam', hp: 350, x: G.px, y: G.py, baseY: G.py, atkCd: 0, summonT: 8 });
    """)
    # chạy đủ lâu để vượt quá 3 lần triệu hồi (8s/lần) nhưng giới hạn tối đa 3 lính
    pg.evaluate("for (let i = 0; i < 2400; i++) updateMobs(1/60)")
    assert pg.evaluate("G.mobs.filter(m => m.summonedByBoss).length") == 3
    pg.evaluate("pause(false)")


@test
def test_kill_boss2_grants_gold_and_two_swamp_gems(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("pause(true)")
    pg.evaluate("G.mobs.length = 0; G.gold = 0")
    pg.evaluate("G.mobs.push({ kind: 'boss_than_dam', hp: 1, x: G.px, y: G.py, baseY: G.py, atkCd: 0, summonT: 8 })")
    pg.evaluate("G.inv[0] = { item: 'kiem_sat', count: 1 }; G.sel = 0")
    assert pg.evaluate("attackMobs()") is True
    assert pg.evaluate("G.gold") == 250
    assert pg.evaluate("invCount(G.inv, 'ngoc_dam_lay')") == 2
    pg.evaluate("pause(false)")


@test
def test_mining_ore_grants_xp_by_type(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.xp = 0; G.inv[0] = { item: 'cuoc_sat', count: 1 }; G.sel = 0")
    col = pg.evaluate("Math.floor(G.px / TS)")
    row = pg.evaluate("Math.floor(G.py / TS) - 1")
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.GOLD)")
    pg.evaluate(f"while (!hitTile({col}, {row})) {{}}")
    assert pg.evaluate("G.xp") == 6  # vàng = +6 XP
    pg.evaluate(f"setTile(G.tiles, {col}, {row}, TILE.DIRT)")
    pg.evaluate(f"while (!hitTile({col}, {row})) {{}}")
    assert pg.evaluate("G.xp") == 6  # đất không cộng XP


@test
def test_enough_xp_levels_up_and_keeps_remainder(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.xp = 0; G.level = 1; G.skillPoints = 0")
    pg.evaluate("gainXp(130)")  # ngưỡng cấp 1->2 là 100, dư 30
    assert pg.evaluate("G.level") == 2
    assert pg.evaluate("G.skillPoints") == 1
    assert pg.evaluate("G.xp") == 30


@test
def test_unlock_skill_consumes_point_and_applies_warrior_tier1(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.skillPoints = 1; G.skills = { warrior: [false,false,false], miner: [false,false,false] }")
    pg.evaluate("G.inv[0] = { item: 'kiem_sat', count: 1 }; G.sel = 0")
    before = pg.evaluate("weaponDmg()")
    assert pg.evaluate("unlockSkill('warrior', 0)") is True
    assert pg.evaluate("G.skillPoints") == 0
    after = pg.evaluate("weaponDmg()")
    assert abs(after - before * 1.10) < 1e-6, (before, after)


@test
def test_cannot_unlock_tier2_without_tier1(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.skillPoints = 3; G.skills = { warrior: [false,false,false], miner: [false,false,false] }")
    assert pg.evaluate("unlockSkill('warrior', 1)") is False
    assert pg.evaluate("G.skills.warrior[1]") is False
    assert pg.evaluate("G.skillPoints") == 3


@test
def test_save_and_load_keeps_skills_state(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.skillPoints = 2; G.skills = { warrior: [false,false,false], miner: [false,false,false] }")
    pg.evaluate("unlockSkill('warrior', 0)")
    pg.evaluate("G.xp = 42; G.level = 3")
    pg.evaluate("saveGame()")
    pg.evaluate("newGame(1)")
    assert pg.evaluate("loadGame()") is True
    assert pg.evaluate("G.xp") == 42
    assert pg.evaluate("G.level") == 3
    assert pg.evaluate("G.skillPoints") == 1
    assert pg.evaluate("G.skills.warrior[0]") is True
    assert pg.evaluate("G.maxHp") == 100  # chỉ bậc1 đã mở, bậc2 (+20hp) chưa


@test
def test_wearing_armor_reduces_damage_taken(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("pause(true)")
    pg.evaluate("G.hp = 100; G.maxHp = 100; G.hurt = 0")
    pg.evaluate("G.inv[0] = { item: 'giap_sat', count: 1 }; G.sel = 0")
    assert pg.evaluate("toggleArmor()") is True
    assert pg.evaluate("G.armor") == 'giap_sat'
    pg.evaluate("damagePlayer(20)")
    hp = pg.evaluate("G.hp")
    pg.evaluate("pause(false)")
    # giáp sắt giảm 22% sát thương: dmg thực = 20*(1-.22) = 15.6
    assert abs(hp - (100 - 20 * (1 - .22))) < 1e-6, hp


@test
def test_removing_armor_returns_item_to_inventory(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.inv = new Array(8).fill(null); G.armor = null")
    pg.evaluate("G.inv[0] = { item: 'giap_tre', count: 1 }; G.sel = 0")
    assert pg.evaluate("toggleArmor()") is True
    assert pg.evaluate("G.armor") == 'giap_tre'
    assert pg.evaluate("invCount(G.inv, 'giap_tre')") == 0  # đã mặc, rời khỏi túi đồ
    pg.evaluate("G.inv[0] = { item: 'tre', count: 1 }; G.sel = 0")  # chọn vật phẩm không phải giáp
    assert pg.evaluate("toggleArmor()") is True  # cởi giáp đang mặc
    assert pg.evaluate("G.armor") is None
    assert pg.evaluate("invCount(G.inv, 'giap_tre')") == 1


@test
def test_swapping_armor_returns_old_armor_to_inventory(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.inv = new Array(8).fill(null); G.armor = null")
    pg.evaluate("G.inv[0] = { item: 'giap_tre', count: 1 }; G.sel = 0")
    pg.evaluate("toggleArmor()")
    assert pg.evaluate("G.armor") == 'giap_tre'
    pg.evaluate("G.inv[1] = { item: 'giap_sat', count: 1 }; G.sel = 1")
    assert pg.evaluate("toggleArmor()") is True
    assert pg.evaluate("G.armor") == 'giap_sat'
    assert pg.evaluate("invCount(G.inv, 'giap_tre')") == 1  # giáp cũ trả lại túi đồ
    assert pg.evaluate("invCount(G.inv, 'giap_sat')") == 0  # giáp mới đang mặc


@test
def test_save_and_load_keeps_armor(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.armor = 'giap_dong'")
    pg.evaluate("saveGame()")
    pg.evaluate("newGame(1)")
    assert pg.evaluate("G.armor") is None
    assert pg.evaluate("loadGame()") is True
    assert pg.evaluate("G.armor") == 'giap_dong'


@test
def test_house_with_anvil_spawns_blacksmith_not_merchant(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const fx = 20, fy = 40;
      setTile(G.tiles, fx, fy, TILE.ANVIL);
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
    assert pg.evaluate("checkHouse(G.tiles, 20, 40)") == 'blacksmith'
    assert pg.evaluate("maybeSpawnNpc()") is True
    assert pg.evaluate("G.blacksmith.active") is True
    assert pg.evaluate("G.npc.active") is False


@test
def test_house_with_torch_and_anvil_spawns_only_blacksmith(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const fx = 20, fy = 40;
      setTile(G.tiles, fx, fy, TILE.ANVIL);
      setTile(G.tiles, fx, fy - 1, TILE.TORCH);
      setTile(G.tiles, fx, fy + 1, TILE.STONE);
      setTile(G.tiles, fx - 1, fy, TILE.WALL);
      setTile(G.tiles, fx - 1, fy - 1, TILE.WALL);
      setTile(G.tiles, fx + 1, fy, TILE.DOOR);
      setTile(G.tiles, fx + 1, fy - 1, TILE.WALL);
      setTile(G.tiles, fx - 1, fy - 2, TILE.ROOF);
      setTile(G.tiles, fx, fy - 2, TILE.ROOF);
      setTile(G.tiles, fx + 1, fy - 2, TILE.ROOF);
    }""")
    assert pg.evaluate("checkHouse(G.tiles, 20, 40)") == 'blacksmith'
    assert pg.evaluate("maybeSpawnNpc()") is True
    assert pg.evaluate("G.blacksmith.active") is True
    assert pg.evaluate("G.npc.active") is False
    assert pg.evaluate("maybeSpawnNpc()") is False  # không tự nâng cấp/spawn thêm


@test
def test_blacksmith_recipes_not_in_regular_craft_table(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("RECIPES.some(r => r.id === 'kiem_ngoc')") is False
    assert pg.evaluate("RECIPES.some(r => r.id === 'giap_ngoc_dam')") is False
    assert pg.evaluate("BLACKSMITH_RECIPES.some(r => r.id === 'kiem_ngoc')") is True
    assert pg.evaluate("BLACKSMITH_RECIPES.some(r => r.id === 'giap_ngoc_dam')") is True
    assert pg.evaluate("craft('kiem_ngoc')") is False  # danh sách mặc định (RECIPES) không còn công thức này


@test
def test_crafting_blacksmith_recipes_consumes_correct_materials(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const pc = Math.floor(G.px / 24), pr = Math.floor(G.py / 24);
      setTile(G.tiles, pc, pr, TILE.BENCH);
      G.inv = new Array(8).fill(null);
      G.inv[0] = { item: 'ngoc_quy', count: 1 };
      G.inv[1] = { item: 'sat', count: 6 };
      G.inv[2] = { item: 'ngoc_dam_lay', count: 2 };
    }""")
    assert pg.evaluate("craft('kiem_ngoc', BLACKSMITH_RECIPES)") is True
    assert pg.evaluate("invCount(G.inv, 'kiem_ngoc')") == 1
    assert pg.evaluate("invCount(G.inv, 'ngoc_quy')") == 0
    assert pg.evaluate("invCount(G.inv, 'sat')") == 4  # kiem_ngoc tiêu 2 sắt trong 6 đã có
    assert pg.evaluate("craft('giap_ngoc_dam', BLACKSMITH_RECIPES)") is True
    assert pg.evaluate("invCount(G.inv, 'giap_ngoc_dam')") == 1
    assert pg.evaluate("invCount(G.inv, 'ngoc_dam_lay')") == 0
    assert pg.evaluate("invCount(G.inv, 'sat')") == 0  # giáp cần 4 sắt còn lại


run(TESTS)
