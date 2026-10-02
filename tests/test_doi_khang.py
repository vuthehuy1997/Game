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
def test_two_fighters_spawn_with_correct_hp(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    hp = pg.evaluate("[G.f1.hp, G.f2.hp, G.f1.fid, G.f2.fid]")
    assert hp == [100, 105, 'tieuho', 'hungdao'], hp


@test
def test_movement_and_jump(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    x0 = pg.evaluate('G.f1.x')
    pg.keyboard.down('KeyD'); pg.wait_for_timeout(250); pg.keyboard.up('KeyD')
    assert pg.evaluate('G.f1.x') > x0 + 20, 'P1 không đi sang phải'
    pg.keyboard.down('ArrowUp'); pg.wait_for_timeout(50); pg.keyboard.up('ArrowUp'); pg.wait_for_timeout(50)
    assert pg.evaluate('G.f2.air'), 'P2 không nhảy'


@test
def test_light_attack_hits_in_active_window(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1")
    hp0 = pg.evaluate("G.f2.hp")
    pg.keyboard.press('KeyF'); pg.wait_for_timeout(50)
    assert pg.evaluate("G.f2.hp") == hp0, 'ăn đòn trước khung hình active'
    pg.wait_for_timeout(200)
    assert pg.evaluate("G.f2.hp") < hp0, 'không mất máu sau khi đòn vào khung active'


@test
def test_guard_reduces_damage_and_dash_is_invulnerable(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
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
    pg.evaluate("G.f1.x = 500; G.f2.x = 540; G.f1.face = 1; G.f2.hp = 100; G.f1.meter = 40")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    assert pg.evaluate("[G.f1.meter, G.f2.hp]") == [40, 100], 'chiêu kích hoạt khi chưa đầy nội lực'
    pg.evaluate("G.f1.meter = 100")
    pg.evaluate("tryUseSpecial(G.f1, G.f2)")
    hp, meter = pg.evaluate("[G.f2.hp, G.f1.meter]")
    assert meter == 0 and hp < 100, (hp, meter)


if __name__ == '__main__':
    run(TESTS)
