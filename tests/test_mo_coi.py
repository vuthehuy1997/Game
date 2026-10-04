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
    far = pg.evaluate("N - 1")
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


run(TESTS)
