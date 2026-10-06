#!/usr/bin/env python3
"""Kiểm thử Mở Cõi. Chạy: python3 tests/test_mo_coi.py [lọc tên]"""
from harness import run, root

URL = 'games/mo-coi/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_owned_region_spawns_troops_over_time(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    t0 = pg.evaluate("S.troops[HOME]")
    pg.evaluate("for (let i = 0; i < 180; i++) update(1/60)")  # 3 giây
    assert pg.evaluate("S.troops[HOME]") > t0, 'vùng của người chơi không tự sinh quân'


@test
def test_attack_wins_when_stronger_and_captures_region(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    ok, owner1, nb = pg.evaluate("""() => {
      const to = neighbors(HOME)[0];
      S.troops[HOME] = 50; S.troops[to] = 5;
      const ok = attack(HOME, to);
      return [ok, S.owner[to], to];
    }""")
    assert ok == True and owner1 == 1, 'tấn công mạnh hơn phải chiếm được vùng'


@test
def test_attack_loses_when_weaker_and_target_unchanged(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # attack() trả về true hễ cuộc tấn công được THỰC HIỆN (đủ quân xuất phát), bất kể thắng hay thua trận —
    # thắng/thua được phản ánh qua S.owner/S.troops của vùng mục tiêu, không phải qua giá trị trả về.
    result = pg.evaluate("""() => {
      const to = neighbors(HOME)[0];
      S.troops[HOME] = 5; S.troops[to] = 50; S.owner[to] = 0;
      const defBefore = S.troops[to];
      attack(HOME, to);
      return [S.owner[to], S.troops[to] === defBefore];
    }""")
    assert result[0] == 0 and result[1] == True, 'thua trận thì vùng mục tiêu phải giữ nguyên, không đổi chủ'


@test
def test_cannot_attack_non_adjacent_region(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    far = pg.evaluate("S.owner.length - 1")
    pg.evaluate("S.troops[HOME] = 50")
    ok = pg.evaluate(f"canAttack(HOME, {far})")
    assert ok == False, 'không được tấn công vùng không kề'


@test
def test_offline_elapsed_time_is_capped(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # MAX_TROOPS/DEFENSE_CAP tự nó cũng chặn số quân rất sớm (trong vài chục giây) nên không dùng được để suy ra
    # trần thời gian offline — kiểm tra thẳng giá trị `elapsed` mà collectOffline() trả về mới cô lập đúng trần.
    elapsed = pg.evaluate("""() => {
      S.lastSeen = Date.now() - 100 * 3600 * 1000;  // vắng mặt 100 giờ, vượt xa trần 4 giờ
      return collectOffline();
    }""")
    assert elapsed == 4 * 3600, ('thời gian cộng dồn khi vắng mặt phải bị chặn ở trần 4 giờ', elapsed)


@test
def test_reload_keeps_conquered_regions(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("""() => { const to = neighbors(HOME)[0]; S.troops[HOME] = 50; S.troops[to] = 5; attack(HOME, to); }""")
    owner_before = pg.evaluate("S.owner.slice()")
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("S.owner") == owner_before, 'tải lại trang phải giữ nguyên các vùng đã chiếm'


@test
def test_three_maps_grow_in_size(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    sizes = pg.evaluate("MAPS.map(m => m.cols * m.rows)")
    assert len(sizes) == 3 and all(a < b for a, b in zip(sizes, sizes[1:])), sizes


@test
def test_river_tiles_block_attacks(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # Ải 1: ô 5 là sông (cùng cột, kề ô 1)
    pg.evaluate("S.owner[1] = 1; S.troops[1] = 50")
    assert pg.evaluate("canAttack(1, 5)") == False, 'không được tấn công vào ô sông'


@test
def test_win_does_not_require_river_tiles(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    cleared = pg.evaluate("""() => {
      S.owner = S.owner.map((o, i) => MAPS[S.stage].terrain[i] === 'r' ? 0 : 1);
      return stageCleared();
    }""")
    assert cleared == True, 'chiếm hết đất liền là đủ, sông không bắt buộc'


@test
def test_fog_hides_tiles_far_from_owned_land(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    vis = pg.evaluate("[isVisible(0), isVisible(1), isVisible(11)]")
    assert vis == [True, True, False], vis


@test
def test_hill_tile_resists_capture(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    # Ải 1: ô 2 là đồi. Quân đánh 17 < 12*1.5 = 18 nên không được chiếm.
    pg.evaluate("S.owner[1] = 1; S.troops[1] = 18; S.owner[2] = 0; S.troops[2] = 12")
    pg.evaluate("attack(1, 2)")
    assert pg.evaluate("S.owner[2]") == 0, 'đồi phải khó chiếm hơn đồng bằng'


@test
def test_enemy_counterattack_can_capture_a_region(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.owner[0] = 1; S.troops[0] = 5; S.owner[1] = 0; S.troops[1] = 50")
    ok = pg.evaluate("enemyAttack(1, 0)")
    assert ok and pg.evaluate("S.owner[0]") == 0, 'giặc phản công phải chiếm được vùng yếu'
    assert 'Giặc' in pg.evaluate("G.log[G.log.length - 1].text"), 'mất vùng phải có dòng sự kiện'


@test
def test_capture_writes_event_line_and_march(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("S.owner[0] = 1; S.troops[0] = 50; S.owner[1] = 0; S.troops[1] = 5; attack(0, 1)")
    assert pg.evaluate("G.marches.length") >= 1, 'đường hành quân phải được ghi để vẽ animation'
    assert 'Quân ta' in pg.evaluate("G.log[G.log.length - 1].text"), 'chiếm vùng phải có dòng sự kiện'


@test
def test_clearing_a_map_opens_the_next_one(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    res = pg.evaluate("""() => {
      S.owner = S.owner.map((o, i) => MAPS[S.stage].terrain[i] === 'r' ? 0 : 1);
      advanceIfCleared();
      return [S.stage, S.maxStage, S.owner.length];
    }""")
    assert res == [1, 1, 20], res


@test
def test_old_save_without_stage_keeps_owned_regions(pg, browser, base):
    # Ghi bản lưu cũ TRƯỚC khi script trang chạy: nếu ghi sau khi trang đã mở, lần lưu khi ẩn trang sẽ đè mất nó
    pg.add_init_script("""if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('mo-coi-v1', JSON.stringify({
        owner: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], troops: [5, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], lastSeen: Date.now() }));
      sessionStorage.setItem('seeded', '1'); }""")
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    res = pg.evaluate("[S.stage, S.owner[1], S.owner.length]")
    assert res == [0, 1, 12], ('bản lưu cũ (chưa có ải) phải giữ vùng đã chiếm', res)


@test
def test_fortress_tile_is_drawn_as_stone_not_a_flat_square(pg, browser, base):
    # Ô thành lũy phải có tường đá xám (kênh màu gần nhau), không phải nền gradient màu trơn
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    n = pg.evaluate("""() => {
      S.owner.fill(1); render();
      const b = document.querySelector('.hit[data-r="10"]');
      const x = parseFloat(b.style.left) * 9.6, y = parseFloat(b.style.top) * 5.4;
      const w = parseFloat(b.style.width) * 9.6, h = parseFloat(b.style.height) * 5.4;
      const d = document.getElementById('cv').getContext('2d').getImageData(Math.round(x + w * .2), Math.round(y + h * .3), Math.round(w * .6), Math.round(h * .5)).data;
      let stone = 0;
      for (let k = 0; k < d.length; k += 4) {
        const r = d[k], g = d[k + 1], b2 = d[k + 2];
        if (Math.max(r, g, b2) - Math.min(r, g, b2) <= 12 && r >= 100 && r <= 180) stone++;
      }
      return stone;
    }""")
    assert n >= 60, ('thành lũy phải được vẽ tường đá, số điểm đá =', n)


run(TESTS)
