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


@test
def test_milestone_follows_population_and_reigns(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("milestoneFor(0).pop") == 0
    assert pg.evaluate("milestoneFor(10).pop") == 10
    assert pg.evaluate("milestoneFor(25).pop") == 20
    assert pg.evaluate("milestoneFor(9999).pop") == pg.evaluate("MILESTONES[MILESTONES.length - 1].pop")
    assert 'Lý' in pg.evaluate("milestoneFor(0).reign"), 'lời dẫn phải gắn với triều đại'


@test
def test_kiln_unlocks_at_population_15(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("unlockedKinds().includes('kiln')") == False
    pg.evaluate("S.pop = 15")
    assert pg.evaluate("unlockedKinds().includes('kiln')") == True


@test
def test_tooltip_shows_cost_and_output(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    tip = pg.evaluate("tipText('farm')")
    assert 'Giá: 15 vàng' in tip, tip
    assert '+2 lương thực/giây' in tip, tip


@test
def test_flood_warns_then_cuts_food_income(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.gold = 1000; S.food = 1000; build('0', 'farm'); startEvent('flood')")
    assert pg.evaluate("EV.phase") == 'warn'
    assert pg.evaluate("eventMult('food')") == 1, 'pha cảnh báo chưa được tác động lên sản lượng'
    pg.evaluate("for (let i = 0; i < 60 * 10; i++) update(1/60)")
    assert pg.evaluate("EV.phase") == 'active'
    assert pg.evaluate("eventMult('food')") == 0.4
    food0 = pg.evaluate("S.food")
    pg.evaluate("for (let i = 0; i < 60; i++) update(1/60)")
    gain = pg.evaluate("S.food") - food0
    assert abs(gain - 2 * 0.4) < 0.05, ('lũ phải giảm còn 40% lương thực, nhận được', gain)


@test
def test_harvest_boosts_food_and_events_schedule_themselves(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEvent('harvest'); for (let i = 0; i < 60 * 10; i++) update(1/60)")
    assert pg.evaluate("eventMult('food')") == 1.8
    pg.evaluate("EV.phase = 'idle'; EV.next = 0; update(1/60)")
    assert pg.evaluate("EV.phase") != 'idle', 'sự kiện ngẫu nhiên phải tự kích hoạt khi hết thời gian chờ'


@test
def test_old_save_without_new_fields_still_loads(pg, browser, base):
    # seed trước khi trang chạy: trang cũ sẽ ghi đè localStorage khi rời đi (visibilitychange -> save)
    pg.add_init_script("localStorage.setItem('dung-nuoc-v1', JSON.stringify({grid: {'0': 'house'}, gold: 33, food: 7, pop: 4, lastSeen: Date.now()}))")
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("S.grid['0']") == 'house'
    assert pg.evaluate("S.gold") >= 33


@test
def test_new_milestone_shows_lore_once(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.seenMs = 0; S.pop = 10; checkMilestone()")
    assert pg.locator('#cardWrap').is_visible(), 'đạt mốc mới phải hiện lời dẫn'
    assert pg.evaluate("S.seenMs") == 1
    pg.evaluate("showOnly(null); checkMilestone()")
    assert pg.locator('#cardWrap').is_hidden(), 'cùng một mốc không hiện lại'


@test
def test_plots_are_positioned_over_the_map(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('.plot').count() == 48
    assert pg.evaluate("document.querySelector('[data-plot=\"0\"]').style.left") != ''


@test
def test_day_night_palette_changes_over_the_day(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    a = pg.evaluate("skyPalette(0)"); b = pg.evaluate("skyPalette(0.5)")
    assert len(a) == 2 and a != b


run(TESTS)
