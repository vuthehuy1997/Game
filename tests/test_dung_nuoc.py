#!/usr/bin/env python3
"""Kiểm thử Dựng Nước. Chạy: python3 tests/test_dung_nuoc.py [lọc tên]"""
from harness import run, root

URL = 'games/dung-nuoc/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_build_deducts_cost_and_blocks_on_occupied_plot(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.gold = 100; S.food = 50")
    ok, gold1 = pg.evaluate("() => { const ok = build('0', 'house'); return [ok, S.gold]; }")
    assert ok and gold1 == 80
    ok2 = pg.evaluate("build('0', 'farm')")
    assert ok2 == False, 'không xây đè lên ô đã có công trình được'


@test
def test_population_unlocks_new_building_kind(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("unlockedKinds().includes('market')") == False
    pg.evaluate("S.pop = 10")  # đặt tay dân số để kiểm tra ngưỡng mở khoá, độc lập với việc xây công trình thật
    assert pg.evaluate("unlockedKinds().includes('market')") == True


@test
def test_income_accrues_and_offline_income_is_capped(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.gold = 1000; S.food = 1000; build('0', 'farm')")
    food0 = pg.evaluate("S.food")
    pg.evaluate("for (let i = 0; i < 180; i++) update(1/60)")  # 3 giây, farm +2/giây
    assert pg.evaluate("S.food") > food0
    gained = pg.evaluate("""() => {
      S.lastSeen = Date.now() - 100 * 3600 * 1000;
      const g0 = S.food; collectOffline(); return S.food - g0;
    }""")
    assert gained == 2 * 4 * 3600, ('thu nhập offline phải bị chặn ở trần 4 giờ', gained)


@test
def test_reload_keeps_the_built_grid(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.gold = 1000; build('5', 'house'); save()")
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("S.grid['5']") == 'house', 'tải lại trang phải giữ nguyên bản đồ đã xây'


@test
def test_fresh_save_can_eventually_afford_and_build_market(pg, browser, base):
    # Từ save mới (50 vàng), chỉ đủ xây 2 nhà dân (20 vàng/nhà) ngay lập tức; phải CHỜ nhà dân sinh
    # thêm vàng (0.5/giây/nhà) mới đủ tiền xây nhà thứ 3 — không set tay S.gold/S.pop.
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      build('0', 'house'); build('1', 'house');  // 2 nhà đầu: hết 40/50 vàng, dân số 8
      for (let i = 0; i < 2400; i++) update(1/60);  // 40 giây: 2 nhà x 0.5 vàng/giây đủ tích thêm 20 vàng
      build('2', 'house');  // nhà thứ 3: dân số 12, đủ mở Chợ (cần 10)
      for (let i = 0; i < 6000; i++) update(1/60);  // 100 giây mô phỏng để tích đủ vàng cho Chợ
    }""")
    assert pg.evaluate("unlockedKinds().includes('market')") == True, 'dân số từ nhà dân phải đủ mở Chợ'
    ok = pg.evaluate("build('3', 'market')")
    assert ok == True, 'phải tích đủ vàng để xây Chợ chỉ bằng xây nhà dân và chờ, không cần set tay tài nguyên'


run(TESTS)
