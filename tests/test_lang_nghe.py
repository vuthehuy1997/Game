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


run(TESTS)
