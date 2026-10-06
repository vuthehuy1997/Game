#!/usr/bin/env python3
"""Kiểm thử Làng Nghề. Chạy: python3 tests/test_lang_nghe.py [lọc tên]"""
from harness import run, root

URL = 'games/lang-nghe/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_click_adds_wealth_and_buy_spends_and_scales_cost(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("click()")
    assert pg.evaluate("S.wealth") == 1
    pg.evaluate("S.wealth = 1000")
    cost0 = pg.evaluate("costOf(UPGRADES[1])")  # 'tho' (auto)
    ok = pg.evaluate("buy(UPGRADES[1])")
    cost1 = pg.evaluate("costOf(UPGRADES[1])")
    assert ok and cost1 > cost0, 'giá nâng cấp phải tăng sau khi mua'


@test
def test_auto_income_accrues_over_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.wealth = 1000; buy(UPGRADES[1])")  # có 1 'tho' (+1/giây)
    w0 = pg.evaluate("S.wealth")
    pg.evaluate("for (let i = 0; i < 180; i++) update(1/60)")  # 3 giây
    assert pg.evaluate("S.wealth") > w0, 'thu nhập tự động không cộng dồn theo thời gian'


@test
def test_offline_earnings_are_capped(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    gain = pg.evaluate("""() => {
      S.wealth = 0; S.owned = { tho: 10 };  // +10/giây
      S.lastSeen = Date.now() - 100 * 3600 * 1000;  // vắng mặt 100 giờ, vượt xa trần 4 giờ
      return collectOffline();
    }""")
    assert gain == 10 * 4 * 3600, ('thu nhập khi vắng mặt phải bị chặn ở trần MAX_OFFLINE_SEC', gain)


@test
def test_reload_keeps_wealth_and_upgrades(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.wealth = 500; S.owned = { tho: 2 }; save()")
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("S.wealth") >= 500, 'tải lại trang phải giữ nguyên của cải đã lưu'
    assert pg.evaluate("S.owned.tho") == 2, 'tải lại trang phải giữ nguyên số nâng cấp đã mua'


@test
def test_old_save_is_migrated_with_total_and_achievements(pg, browser, base):
    # Đặt save cũ ở trang chủ: trang game đang mở sẽ tự lưu lại khi bị rời đi, làm đè dữ liệu vừa đặt
    pg.goto(root(base)); pg.wait_for_timeout(200)
    pg.evaluate("localStorage.setItem('lang-nghe-v1', JSON.stringify({wealth: 500, owned: {tho: 2}}))")
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("S.wealth") >= 500 and pg.evaluate("S.owned.tho") == 2
    assert pg.evaluate("S.total") >= 500, 'save cũ phải được suy ra tổng xu kiếm được'
    assert pg.evaluate("Array.isArray(S.achv)"), 'save cũ phải có danh sách thành tựu'


@test
def test_upgrade_locked_until_total_reached(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    ok = pg.evaluate("() => { S.wealth = 1e6; S.total = 0; return buy(UPGRADES[2]); }")  # 'xuong' cần 150 tổng
    assert ok is False, 'nâng cấp chưa mở khoá không được mua dù đủ tiền'
    ok = pg.evaluate("() => { S.total = 150; return buy(UPGRADES[2]); }")
    assert ok is True


@test
def test_mouse_click_on_village_adds_wealth(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    box = pg.locator('#cv').bounding_box()
    pg.mouse.click(box['x'] + box['width'] * .5, box['y'] + box['height'] * .25)
    assert pg.evaluate("S.wealth") == 1, 'bấm vào làng phải cộng xu'


@test
def test_festival_doubles_auto_income(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
      S.owned = { tho: 10 }; S.wealth = 0; G.festival = 20; tickAuto(1); const a = S.wealth;
      S.wealth = 0; G.festival = 0; tickAuto(1); return [a, S.wealth];
    }""")
    assert r == [20, 10], ('hội làng phải nhân đôi thu nhập tự động', r)


@test
def test_festival_starts_when_timer_runs_out(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("() => { G.festival = 0; G.nextFestival = 0; updateEvents(0.01); return G.festival; }")
    assert r == 20, 'hết thời gian chờ thì hội làng phải khai mạc'


@test
def test_workers_follow_auto_upgrades_and_are_capped(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
      S.owned = { tho: 3, xuong: 2 }; const a = workerCount();
      S.owned = { tho: 20, xuong: 20, lo_gom: 5 }; const b = workerCount();
      S.owned = { tho: 2 }; updateScene(1/60);
      return [a, b, G.workers.length];
    }""")
    assert r == [5, 6, 2], r


@test
def test_building_rises_after_purchase(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("(G.appear.house || 0)") == 0
    pg.evaluate("() => { S.wealth = 1e6; S.total = 1e6; S.owned = {}; buy(UPGRADES[1]); }")
    pg.wait_for_timeout(1500)
    assert pg.evaluate("G.appear.house") >= .99, 'nhà thợ mộc phải hiện dần sau khi mua'


@test
def test_milestone_grants_achievement_and_log(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    r = pg.evaluate("() => { S.total = 120; S.achv = []; update(1/60); return [S.achv.slice(), G.log.at(-1).txt]; }")
    assert 'khoi-nghiep' in r[0], r
    assert 'Khởi nghiệp' in r[1], r


@test
def test_purchase_is_logged_in_village_diary(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    txt = pg.evaluate("() => { S.wealth = 1e6; S.total = 1e6; buy(UPGRADES[1]); return G.log.at(-1).txt; }")
    assert 'Thợ mộc' in txt


@test
def test_shop_marks_locked_upgrades(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('.upBtn').count() == 7
    pg.evaluate("S.total = 0")
    pg.wait_for_timeout(150)
    assert 'locked' in pg.locator('.upBtn[data-id="xuong"]').get_attribute('class')
    pg.evaluate("S.total = 200")
    pg.wait_for_timeout(150)
    assert 'locked' not in pg.locator('.upBtn[data-id="xuong"]').get_attribute('class')


run(TESTS)
