#!/usr/bin/env python3
"""Kiểm thử Nam Tiến Đại Việt. Chạy: python3 tests/test_nam_tien.py [lọc tên]"""
from harness import run, root

URL = 'games/nam-tien/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


def open_run(pg):
    pg.goto(root_url(pg)); pg.wait_for_timeout(300)
    pg.evaluate("G.paused = true; startRun(); beginChapter()")


def root_url(pg):
    return pg.url.split('games/')[0] + URL


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_fresh_run_owns_only_capital(pg, browser, base):
    open_run(pg)
    assert pg.evaluate("ownedCount()") == 1
    assert pg.evaluate("G.owned[CAPITAL]") == 1


@test
def test_map_is_one_connected_landmass(pg, browser, base):
    open_run(pg)
    assert pg.evaluate("reachableLand()") == pg.evaluate("landCount()")


@test
def test_expansion_only_next_to_owned_land(pg, browser, base):
    open_run(pg)
    assert pg.evaluate("expandIssue(0)") == 'not_frontier'
    assert pg.evaluate("expandIssue(3)") == 'water'
    assert pg.evaluate("expandIssue(10)") is None


@test
def test_expanding_spends_resources_and_claims_tile(pg, browser, base):
    open_run(pg)
    gold0, food0 = pg.evaluate("G.res.gold"), pg.evaluate("G.res.food")
    assert pg.evaluate("expand(10)") is True
    assert pg.evaluate("G.owned[10]") == 1
    assert pg.evaluate("G.res.gold") == gold0 - 40
    assert pg.evaluate("G.res.food") == food0 - 15


@test
def test_cannot_expand_beyond_chapter_columns(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.owned[18] = 1")
    assert pg.evaluate("expandIssue(19)") == 'locked'


@test
def test_mountain_needs_an_outpost_first(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.chapter = 3; G.owned[14] = 1; G.res.gold = 500; G.res.food = 100")
    assert pg.evaluate("expandIssue(15)") == 'need_outpost'
    pg.evaluate("G.slots[9 * 3 + 2] = 'outpost'")
    assert pg.evaluate("expandIssue(15)") is None


@test
def test_placing_building_spends_gold_and_fills_slot(pg, browser, base):
    open_run(pg)
    assert pg.evaluate("placeBuild(9, 0, 'house')") is True
    assert pg.evaluate("G.res.gold") == 40
    assert pg.evaluate("buildingAt(9, 0)") == 'house'


@test
def test_refuses_occupied_slot_and_locked_building(pg, browser, base):
    open_run(pg)
    pg.evaluate("placeBuild(9, 0, 'house')")
    assert pg.evaluate("placeBuild(9, 0, 'farm')") is False
    assert pg.evaluate("placeBuild(9, 1, 'workshop')") is False
    assert pg.evaluate("placeBuild(9, 1, 'market')") is False


@test
def test_refuses_building_without_gold(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.res.gold = 0")
    assert pg.evaluate("placeBuild(9, 1, 'house')") is False


@test
def test_removing_building_refunds_half(pg, browser, base):
    open_run(pg)
    pg.evaluate("placeBuild(9, 0, 'house')")
    assert pg.evaluate("removeBuild(9, 0)") is True
    assert pg.evaluate("G.res.gold") == 50
    assert pg.evaluate("buildingAt(9, 0)") is None


@test
def test_farm_output_depends_on_terrain(pg, browser, base):
    open_run(pg)
    pg.evaluate("placeBuild(9, 0, 'farm')")
    plain = pg.evaluate("rates().food")
    pg.evaluate("G.slots[9 * 3] = null; G.owned[18] = 1; G.slots[18 * 3] = 'farm'")
    forest = pg.evaluate("rates().food")
    assert abs((plain - forest) - 0.75) < 1e-9, (plain, forest)


@test
def test_houses_raise_population_cap(pg, browser, base):
    open_run(pg)
    assert pg.evaluate("rates().popCap") == 4
    pg.evaluate("placeBuild(9, 0, 'house')")
    assert pg.evaluate("rates().popCap") == 8


@test
def test_population_grows_when_fed(pg, browser, base):
    open_run(pg)
    pg.evaluate("placeBuild(9, 0, 'house')")
    pg.evaluate("tick(10)")
    assert pg.evaluate("G.res.pop") > 4


@test
def test_starvation_ends_the_run(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.res.pop = 60; G.res.food = 0")
    pg.evaluate("for (let i = 0; i < 26; i++) tick(1)")
    assert pg.evaluate("G.mode") == 'lost'


@test
def test_flood_cuts_farm_next_to_river(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.owned[2] = 1; G.slots[2 * 3] = 'farm'")
    before = pg.evaluate("rates().food")
    pg.evaluate("triggerEvent('lu')")
    after = pg.evaluate("rates().food")
    assert abs((before - after) - 0.63) < 1e-9, (before, after)


@test
def test_raid_breaches_undefended_tile(pg, browser, base):
    open_run(pg)
    pg.evaluate("placeBuild(9, 0, 'house')")
    assert pg.evaluate("raid(9)") == 'breached'
    assert pg.evaluate("buildingAt(9, 0)") is None


@test
def test_outpost_repels_raid(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.owned[10] = 1; G.res.gold = 500; G.res.food = 100")
    pg.evaluate("placeBuild(10, 0, 'outpost'); placeBuild(10, 1, 'house')")
    prestige0 = pg.evaluate("G.res.prestige")
    assert pg.evaluate("raid(10)") == 'repelled'
    assert pg.evaluate("buildingAt(10, 1)") == 'house'
    assert pg.evaluate("G.res.prestige") == prestige0 + 2


@test
def test_completing_goal_then_next_chapter_unlocks_more(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.owned.fill(0); [0, 1, 8, 9, 10, 17].forEach(i => G.owned[i] = 1)")
    pg.evaluate("tick(0.1)")
    assert pg.evaluate("G.mode") == 'done'
    pg.evaluate("nextChapter()")
    assert pg.evaluate("G.chapter") == 1
    assert pg.evaluate("G.mode") == 'intro'
    assert pg.evaluate("unlockedKinds().includes('market')") is True
    assert pg.evaluate("unlockedKinds().includes('workshop')") is False


@test
def test_last_chapter_ends_campaign(pg, browser, base):
    open_run(pg)
    pg.evaluate("G.chapter = 3; nextChapter()")
    assert pg.evaluate("G.mode") == 'final'


@test
def test_restart_chapter_restores_snapshot(pg, browser, base):
    open_run(pg)
    pg.evaluate("placeBuild(9, 0, 'house')")
    pg.evaluate("G.mode = 'lost'; restartChapter()")
    assert pg.evaluate("G.mode") == 'play'
    assert pg.evaluate("buildingAt(9, 0)") is None


@test
def test_tile_visibility_states(pg, browser, base):
    open_run(pg)
    assert pg.evaluate("tileVisibility(9)") == 'owned'
    assert pg.evaluate("tileVisibility(10)") == 'frontier'
    assert pg.evaluate("tileVisibility(0)") == 'fog'
    assert pg.evaluate("tileVisibility(3)") == 'water'
    assert pg.evaluate("tileVisibility(19)") == 'locked'


@test
def test_save_roundtrip_restores_run(pg, browser, base):
    open_run(pg)
    pg.evaluate("placeBuild(9, 0, 'house'); saveProgress(); resetRun()")
    assert pg.evaluate("loadProgress()") is True
    assert pg.evaluate("buildingAt(9, 0)") == 'house'
    assert pg.evaluate("G.owned[9]") == 1


@test
def test_bad_save_starts_fresh(pg, browser, base):
    open_run(pg)
    pg.evaluate("localStorage.setItem('nam-tien-v1', JSON.stringify({v: 2}))")
    assert pg.evaluate("loadProgress()") is False


@test
def test_building_art_draws_for_every_kind(pg, browser, base):
    open_run(pg)
    pg.evaluate("""() => {
      const ctx = document.getElementById('cv').getContext('2d');
      KINDS.forEach((k, i) => { drawBuilding(ctx, k, 60 + i * 60, 300, 1, 1.2); drawIcon(ctx, k, 60 + i * 60, 420, 40, 1.2); });
    }""")


run(TESTS)
