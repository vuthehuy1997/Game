#!/usr/bin/env python3
"""Kiểm thử Giữ Nước Qua Ngàn Năm. Chạy: python3 tests/test_giu_nuoc.py [lọc tên]"""
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
def test_start_era_sets_up_match(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    st = pg.evaluate("[G.phase, G.era.id, G.gold, G.hq.hp, G.hq.maxHp, B.length]")
    # gold bắt đầu ở 40 nhưng tăng dần ngay khi vào 'prep' (thu nhập Nhà chính chạy nền), nên chỉ chặn dưới chứ không so bằng tuyệt đối
    assert st[0] == 'prep' and st[1] == 'hai-ba-trung' and 40 <= st[2] < 41, st
    assert st[3] == st[4] and st[5] == 0, st


@test
def test_era_select_locks_future_eras(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    n_open = pg.evaluate("() => { showEraSelect(); return document.querySelectorAll('.eraBtn:not([disabled])').length; }")
    assert n_open == 1, n_open


@test
def test_build_blocks_on_occupied_plot_and_when_poor(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    # Vàng tăng liên tục khi ở 'prep' (thu nhập Nhà chính chạy nền) nên đo trước/sau trong CÙNG một evaluate
    # để tránh sai lệch do thời gian trôi giữa hai lượt gọi riêng.
    ok1, spent1, blen1 = pg.evaluate("() => { const g0 = G.gold; const ok = build(0, 'camp'); return [ok, g0 - G.gold, B.length]; }")
    assert ok1 == True and abs(spent1 - 30) < 0.5 and blen1 == 1, (ok1, spent1, blen1)
    # lô đã có công trình: không xây đè được, không trừ thêm vàng
    ok2, delta2, blen2 = pg.evaluate("() => { const g0 = G.gold; const ok = build(0, 'tower'); return [ok, G.gold - g0, B.length]; }")
    assert ok2 == False and delta2 == 0 and blen2 == 1, (ok2, delta2, blen2)
    # hết vàng: không xây lô khác được nữa
    ok3, gold3, blen3 = pg.evaluate("() => { G.gold = 0; const ok = build(1, 'camp'); return [ok, G.gold, B.length]; }")
    assert ok3 == False and gold3 < 0.5 and blen3 == 1, (ok3, gold3, blen3)


@test
def test_hq_upgrade_increases_max_hp_and_costs_gold(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0); G.gold = 1000")
    maxHp0 = pg.evaluate("G.hq.maxHp")
    ok = pg.evaluate("upgradeHQ()")
    assert ok and pg.evaluate("G.hq.lvl") == 2
    assert pg.evaluate("G.hq.maxHp") > maxHp0
    assert pg.evaluate("G.hq.hp") == pg.evaluate("G.hq.maxHp")


@test
def test_camp_spawns_troop_up_to_lane_limit(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("build(0, 'camp'); G.gold = 1000")
    pg.evaluate("for (let i = 0; i < 300; i++) update(1/60)")  # 5 giây mô phỏng
    n = pg.evaluate("troops.filter(u => u.side === 'ally' && u.lane === 0).length")
    assert 1 <= n <= 3, n


@test
def test_hq_loses_when_health_reaches_zero(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("G.phase = 'battle'; G.hq.hp = 1")
    pg.evaluate("troops.push({side:'enemy', lane:0, x:100, hp:40, maxHp:40, dmg:50, reach:0, spd:40, name:'t', walk:0})")
    pg.evaluate("for (let i = 0; i < 10; i++) update(1/60)")
    assert pg.evaluate("G.phase") == 'lose'
    assert pg.locator('#card h2').count() == 1


@test
def test_tower_fires_only_within_range(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("build(2, 'tower')")  # lô 2 = làn 1, x 190, tầm 170
    pg.evaluate("G.phase = 'battle'")
    pg.evaluate("troops.push({side:'enemy', lane:1, x:900, hp:30, maxHp:30, dmg:0, reach:0, spd:0, name:'t', walk:0})")
    pg.evaluate("for (let i = 0; i < 30; i++) update(1/60)")
    assert pg.evaluate("projs.length") == 0, 'bắn khi địch còn ngoài tầm'
    pg.evaluate("troops.find(u => u.side === 'enemy').x = 260")
    pg.evaluate("for (let i = 0; i < 30; i++) update(1/60)")
    hit = pg.evaluate("projs.length >= 1 || troops.find(u => u.side === 'enemy').hp < 30")
    assert hit, 'không bắn khi địch vào tầm'


@test
def test_stake_damages_once_per_wave_then_recharges(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    pg.evaluate("build(2, 'stake')")  # lô 2 = làn 1, x 190
    # Gộp vào một evaluate: nếu tách rời, một khung hình nền có thể chạy giữa lúc dọn queue (0 địch)
    # và lúc thêm địch thử nghiệm, khiến updateWaveSpawns tưởng đợt đã xong và tự finishWave() mất.
    hp1 = pg.evaluate("""() => {
      startWave(); G.queue = [];
      troops.push({side:'enemy', lane:1, x:190, hp:200, maxHp:200, dmg:0, reach:0, spd:0, name:'t', walk:0});
      update(1/60);
      return troops[0].hp;
    }""")
    assert hp1 < 200, 'trụ cọc không gây sát thương'
    pg.evaluate("update(1/60)")
    assert pg.evaluate("troops[0].hp") == hp1, 'trụ cọc đánh quá 1 lần trong cùng đợt'


@test
def test_winning_all_waves_unlocks_next_era(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startEra(0)")
    n = pg.evaluate("ERAS[0].waves.length")
    for _ in range(n):
        pg.evaluate("startWave(); G.queue = []; troops.length = 0; update(1/60)")
    assert pg.evaluate("G.phase") == 'win'
    assert pg.evaluate("S.maxEra") >= 1
    assert pg.evaluate("unlocked(1)") == True


@test
def test_full_flow_menu_to_win_via_real_building(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # Từ menu, bấm thật vào nút để vào bản đồ rồi chọn thời kỳ đầu
    pg.click('#mPlay'); pg.wait_for_timeout(100)
    pg.click('.eraBtn[data-era="0"]'); pg.wait_for_timeout(100)
    assert pg.evaluate("G.phase") == 'prep'
    # Xây 1 trại lính + 1 tháp canh bằng thao tác bấm thật (bơm vàng giữa 2 lần để đủ chi phí)
    pg.click('.plot[data-plot="0"]'); pg.wait_for_timeout(50)
    pg.click('[data-k="camp"]'); pg.wait_for_timeout(50)
    pg.evaluate("G.gold = 1000")
    pg.click('.plot[data-plot="2"]'); pg.wait_for_timeout(50)
    pg.click('[data-k="tower"]'); pg.wait_for_timeout(50)
    assert pg.evaluate("B.length") == 2
    # Bơm vàng để không bị kẹt kinh tế, rồi đánh hết các đợt bằng cách giả lập dọn sạch giặc mỗi đợt
    n = pg.evaluate("ERAS[0].waves.length")
    for _ in range(n):
        pg.evaluate("G.gold = 1000")
        pg.click('#btnStartWave'); pg.wait_for_timeout(50)
        pg.evaluate("G.queue = []; troops.filter(u => u.side === 'enemy').forEach(u => u.hp = 0); update(1/60)")
    assert pg.evaluate("G.phase") == 'win'
    assert pg.locator('#card h2').count() == 1
    # Bấm "Thời kỳ kế" quay lại trạng thái prep của thời kỳ 2
    pg.click('#rGo'); pg.wait_for_timeout(100)
    assert pg.evaluate("G.eraIdx") == 1 and pg.evaluate("G.phase") == 'prep'


run(TESTS)
