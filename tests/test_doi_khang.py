#!/usr/bin/env python3
"""Kiểm thử Đối Kháng Anh Hùng. Chạy: python3 tests/test_doi_khang.py [lọc tên]"""
from harness import run, root

URL = 'games/doi-khang-anh-hung/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_click_portrait_selects_p1_fighter(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    cx, cy = pg.evaluate("[portraitX(2), ROW1_Y]")
    box = pg.eval_on_selector('canvas', "cv => { const r = cv.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }")
    x = box['x'] + cx / 960 * box['w']; y = box['y'] + cy / 540 * box['h']
    pg.mouse.click(x, y); pg.wait_for_timeout(50)
    assert pg.evaluate("G.cursor1") == 2


@test
def test_click_on_p2_portrait_ignored_while_cpu_controls_p2(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("G.p2cpu") == True
    cursor2_before = pg.evaluate("G.cursor2")
    cx, cy = pg.evaluate("[portraitX(3), ROW2_Y]")
    box = pg.eval_on_selector('canvas', "cv => { const r = cv.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }")
    x = box['x'] + cx / 960 * box['w']; y = box['y'] + cy / 540 * box['h']
    pg.mouse.click(x, y); pg.wait_for_timeout(50)
    assert pg.evaluate("G.cursor2") == cursor2_before, 'bấm vào ảnh P2 khi máy đang điều khiển không được đổi tướng'


@test
def test_two_fighters_spawn_with_correct_hp(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")  # bỏ qua màn chọn, dùng tướng/sân mặc định như Task 2-10
    hp = pg.evaluate("[G.f1.hp, G.f2.hp, G.f1.fid, G.f2.fid]")
    assert hp == [100, 105, 'tieuho', 'hungdao'], hp


@test
def test_movement_and_jump(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false")  # test điều khiển P2 bằng phím thật; máy có kênh phím riêng (Fix 3) nên phải tắt máy ở đây
    x0 = pg.evaluate('G.f1.x')
    pg.keyboard.down('KeyD'); pg.wait_for_timeout(250); pg.keyboard.up('KeyD')
    assert pg.evaluate('G.f1.x') > x0 + 20, 'P1 không đi sang phải'
    pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(50); pg.keyboard.up('ArrowUp'); pg.wait_for_timeout(50)
    assert pg.evaluate('G.f2.air'), 'P2 không nhảy'


@test
def test_light_attack_hits_in_active_window(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false")  # test chạy theo thời gian thực; tắt máy để không lẫn hành vi của AI
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1")
    hp0 = pg.evaluate("G.f2.hp")
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(50)
    assert pg.evaluate("G.f2.hp") == hp0, 'ăn đòn trước khung hình active'
    pg.wait_for_timeout(200)
    assert pg.evaluate("G.f2.hp") < hp0, 'không mất máu sau khi đòn vào khung active'


@test
def test_guard_reduces_damage_and_dash_is_invulnerable(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false")  # kiểm thử tự điều khiển P2 trực tiếp, không để máy tranh phím
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1; G.f2.hp = 100")
    full = pg.evaluate("""() => { const h0 = G.f2.hp; startAttack(G.f1, 'heavy');
      for (let i = 0; i < 40; i++) update(1/60); return h0 - G.f2.hp; }""")
    pg.evaluate("G.f1.atk = null; G.f1.x = 500; G.f2.x = 540; G.f2.hp = 100")
    guarded = pg.evaluate("""() => { const h0 = G.f2.hp; G.f2.guard = true; startAttack(G.f1, 'heavy');
      for (let i = 0; i < 40; i++) { held.add('p2_guard'); update(1/60); } held.delete('p2_guard'); return h0 - G.f2.hp; }""")
    assert guarded < full * .4, (full, guarded)
    pg.evaluate("G.f1.atk = null; G.f1.x = 500; G.f2.x = 540; G.f2.hp = 100")
    dashed = pg.evaluate("""() => { const h0 = G.f2.hp; startDash(G.f2); startAttack(G.f1, 'heavy');
      for (let i = 0; i < 20; i++) update(1/60); return h0 - G.f2.hp; }""")
    assert dashed == 0, dashed


@test
def test_special_requires_full_meter(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1; G.f2.hp = 100; G.f1.meter = 40")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    assert pg.evaluate("[G.f1.meter, G.f2.hp]") == [40, 100], 'chiêu kích hoạt khi chưa đầy nội lực'
    pg.evaluate("G.f1.meter = 100")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    hp, meter = pg.evaluate("[G.f2.hp, G.f1.meter]")
    assert meter == 0 and hp < 100, (hp, meter)


@test
def test_ai_approaches_and_attacks(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.f1.x = 200; G.f2.x = 900; G.diff = 'hard'")
    x0 = pg.evaluate("G.f2.x")
    pg.evaluate("for (let i = 0; i < 90; i++) update(1/60)")
    assert pg.evaluate("G.f2.x") < x0 - 40, 'máy không tiến lại gần'
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.hp = 100")
    # Chỉ mô phỏng 1.5s (90 khung): đủ dư so với đòn đầu tiên (luôn ra trong ~0.3s vì ở cự ly này
    # máy không bao giờ né/giữ chiêu — opp.atk luôn false nên không vào nhánh guard, dist nằm trong
    # reach nên không vào nhánh di chuyển) nhưng NGẮN HƠN NHIỀU so với thời gian máy có thể hạ hết
    # 100 máu của f1 (~5s ở độ khó hard). Trước đây dùng 300 khung (5s) thì đôi khi máy đánh hạ hẳn
    # f1 ngay trong khung đo, round kết thúc -> resetRound() tạo lại f1 mới đầy máu NGAY TRONG vòng
    # lặp, nên hp đo được ở cuối lại trùng hp0 (đều là 100) dù máy đã ra rất nhiều đòn -> test bị FAIL
    # giả dù máy hoàn toàn hoạt động đúng. Rút ngắn khung đo để không bao giờ chạm mốc KO/resetRound.
    hit = pg.evaluate("""() => { const h0 = G.f1.hp; for (let i = 0; i < 90; i++) update(1/60); return h0 - G.f1.hp; }""")
    assert hit > 0, 'máy không ra được đòn nào trong 1.5 giây mô phỏng'


@test
def test_edge_hazard_on_bachdang(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.stageId = 'bachdang'; G.f1.x = 50; G.f1.hp = 100; G.f2.x = 500")
    pg.evaluate("for (let i = 0; i < 80; i++) update(1/60)")  # ~1.33s, chưa đủ 1.5s
    hp1 = pg.evaluate("G.f1.hp")
    assert hp1 == 100, hp1
    pg.evaluate("for (let i = 0; i < 20; i++) update(1/60)")  # thêm ~0.33s, vượt 1.5s
    assert pg.evaluate("G.f1.hp") == 90


@test
def test_round_and_match_flow(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false; G.f2.hp = 0; for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.mode, G.round]") == [[1, 0], 'fight', 2], pg.evaluate("[G.wins, G.mode, G.round]")
    pg.evaluate("G.f2.hp = 0; for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.mode]") == [[2, 0], 'matchEnd']

    pg.evaluate("""() => { G.mode = 'fight'; G.wins = [0, 0]; G.round = 1;
      G.timer = 0.001; G.f1.hp = 50; G.f2.hp = 50; }""")
    pg.evaluate("for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.round, G.mode]") == [[0, 0], 1, 'fight'], 'hoà giờ không được cộng điểm hay sang round mới'


@test
def test_double_ko_is_a_draw(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("""() => { G.mode = 'fight'; G.wins = [0, 0]; G.round = 1;
      G.f1.hp = 0; G.f2.hp = 0; }""")
    pg.evaluate("for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.round, G.mode]") == [[0, 0], 1, 'fight'], 'hai bên cùng hết máu phải là hoà'


@test
def test_hud_renders(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    # Set full health for P1 and force render
    pg.evaluate("G.f1.hp = FIGHTERS[G.f1.fid].hp; for (let i = 0; i < 5; i++) update(1/60)")
    pg.evaluate("render()")
    # Check pixel at absolute (30, 26) - inside P1's green health bar at full HP
    # P1's bar: healthBar(ctx, 20, 'l', G.f1) with fill at local (2, 20), width 296, height 12
    # At full HP: fill x 22-318, y 20-32; pixel (30, 26) inside, color green #5fae4a
    full = pg.evaluate("document.getElementById('cv').getContext('2d').getImageData(30, 26, 1, 1).data")
    assert list(full[:3]) == [95, 174, 74], f"Expected #5fae4a green at full HP, got RGB{tuple(full[:3])}"
    # Set hp to 1 (nearly empty bar) and force render
    pg.evaluate("G.f1.hp = 1; for (let i = 0; i < 5; i++) update(1/60)")
    pg.evaluate("render()")
    # Same pixel should no longer show the green fill color
    low = pg.evaluate("document.getElementById('cv').getContext('2d').getImageData(30, 26, 1, 1).data")
    assert list(low[:3]) != [95, 174, 74], f"At low HP, expected non-green, got RGB{tuple(low[:3])}"


@test
def test_select_screen_then_start_match(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("G.mode") == 'select'
    pg.keyboard.press('KeyD'); pg.wait_for_timeout(50)  # p1_right: di chuyển con trỏ chọn tướng P1
    assert pg.evaluate("G.cursor1") == 1
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(100)  # p1_light: xác nhận, vào trận
    assert pg.evaluate("G.mode") == 'fight'
    assert pg.evaluate("G.p1id") == pg.evaluate("Object.keys({tieuho:1,hungdao:1,quoctoan:1,ngulao:1,binhtrong:1,khanhdu:1})[1]")


@test
def test_match_end_rematch_and_back_to_menu(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false; G.wins = [1, 0]; G.f2.hp = 0; for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("[G.wins, G.mode]") == [[2, 0], 'matchEnd'], 'chưa vào matchEnd'
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(50)
    assert pg.evaluate("[G.mode, G.wins]") == ['fight', [0, 0]], 'đấu lại (rematch) không hoạt động'

    pg.evaluate("G.p2cpu = false; G.wins = [1, 0]; G.f2.hp = 0; for (let i = 0; i < 5; i++) update(1/60)")
    assert pg.evaluate("G.mode") == 'matchEnd', 'chưa vào matchEnd lần 2'
    pg.keyboard.press('KeyH'); pg.wait_for_timeout(50)
    assert pg.evaluate("G.mode") == 'select', 'về menu không hoạt động'


@test
def test_counter_reflects_only_once(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false")
    pg.evaluate("G.f1.fid = 'binhtrong'; G.f1.hp = FIGHTERS.binhtrong.hp; G.f1.counterT = 2")
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1; G.f2.face = -1")
    hp0 = pg.evaluate("G.f2.hp")
    counter_dmg = pg.evaluate("FIGHTERS.binhtrong.special.counterDmg")
    # Đòn nhẹ thứ nhất của f2 trúng f1 đang ở thế phản đòn -> phản sát thương vào f2, và tiêu thế phản
    pg.evaluate("startAttack(G.f2, 'light'); for (let i = 0; i < 20; i++) update(1/60)")
    after1 = pg.evaluate("G.f2.hp")
    assert hp0 - after1 == counter_dmg, (hp0, after1, counter_dmg)
    assert pg.evaluate("G.f1.counterT") == 0, 'counterT chưa bị tiêu sau khi phản đòn 1 lần'
    # Đòn nhẹ thứ hai: thế phản đã hết (counterT=0) -> không phản thêm, f2 không mất máu nữa
    pg.evaluate("G.f1.atk = null; G.f2.atk = null; G.f1.x = 500; G.f2.x = 540")
    pg.evaluate("startAttack(G.f2, 'light'); for (let i = 0; i < 20; i++) update(1/60)")
    after2 = pg.evaluate("G.f2.hp")
    assert after2 == after1, 'phản đòn lại xảy ra lần 2 dù thế phản đã hết (counterT=0)'


@test
def test_ranged_special_hits_multiple_times(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false")
    pg.evaluate("G.f1.fid = 'khanhdu'; G.f1.meter = 100; G.f1.x = 500; G.f2.x = 700; G.f2.hp = 100")
    hp0 = pg.evaluate("G.f2.hp")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    hp1 = pg.evaluate("G.f2.hp")
    dmg, hits = pg.evaluate("[FIGHTERS.khanhdu.special.dmg, FIGHTERS.khanhdu.special.hits]")
    assert hp0 - hp1 == dmg * hits, (hp0, hp1, dmg, hits)


@test
def test_dash_special_hits_only_once(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    pg.evaluate("G.p2cpu = false")
    pg.evaluate("G.f1.fid = 'quoctoan'; G.f1.meter = 100; G.f1.x = 500; G.f2.x = 520; G.f1.face = 1; G.f2.hp = 100")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    pg.evaluate("for (let i = 0; i < 20; i++) update(1/60)")  # 0.333s, dài hơn thời gian xông .22s
    hp1 = pg.evaluate("G.f2.hp")
    dmg = pg.evaluate("FIGHTERS.quoctoan.special.dmg")
    assert 100 - hp1 == dmg, (100, hp1, dmg)


@test
def test_ai_channel_isolated_from_shared_input(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startMatch(G, G)")
    # Máy (P2) điều khiển f2, ở xa f1 để máy luôn chọn tiến sang TRÁI (về phía f1).
    pg.evaluate("G.p2cpu = true; G.diff = 'hard'; G.f1.x = 200; G.f2.x = 700")
    # Giả lập người chơi thứ hai bấm giữ phím P2 (sang phải) trực tiếp vào Set dùng chung của platform —
    # đây là đường mà 1 người chơi thật ở cùng bàn phím sẽ tác động, KHÔNG phải đường của máy (aiHeld).
    pg.evaluate("held.add('p2_right')")
    x0 = pg.evaluate("G.f2.x")
    pg.evaluate("for (let i = 0; i < 30; i++) update(1/60)")
    x1 = pg.evaluate("G.f2.x")
    pg.evaluate("held.delete('p2_right')")
    # Nếu kênh phím của máy bị cô lập đúng cách, f2 di chuyển theo quyết định của máy (tiến về f1, x giảm)
    # và hoàn toàn không bị phím giả 'p2_right' (held dùng chung) ép sang phải.
    assert x1 < x0, ('người chơi giả lập đã can thiệp được vào P2 khi máy đang điều khiển', x0, x1)


if __name__ == '__main__':
    run(TESTS)
