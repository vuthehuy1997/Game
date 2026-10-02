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


if __name__ == '__main__':
    run(TESTS)
