#!/usr/bin/env python3
"""Kiểm thử Bắn Ná. Chạy: python3 tests/test_ban_na.py [lọc tên]"""
from harness import run, root

URL = 'games/ban-na/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_projectile_falls_under_gravity(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # So sánh vận tốc thẳng đứng (không phải vị trí): với vận tốc ban đầu hướng lên đủ mạnh, vị trí y có thể
    # vẫn đang tăng độ cao (y giảm) sau một khoảng ngắn dù trọng lực vẫn đang kéo đúng — đo theo vy mới tách
    # bạch được "trọng lực có cộng dồn mỗi khung hình" khỏi "đạn đã rơi qua điểm xuất phát hay chưa".
    vy0, vy1 = pg.evaluate("""() => {
      startDrag(150, 380); updateDrag(100, 440); release();
      const vy0 = proj.vy; for (let i = 0; i < 20; i++) update(1/60); return [vy0, proj.vy];
    }""")
    assert vy1 > vy0, 'vận tốc thẳng đứng không tăng theo trọng lực mỗi khung hình'


@test
def test_hitting_block_reduces_hp_and_destroys_it(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # Đặt thẳng đạn ngay sát khối (thay vì tính tay quỹ đạo kéo-thả, vốn dễ sai số và còn phụ thuộc cân bằng
    # vật lý có thể đổi sau này) để kiểm tra đúng phần va chạm/gây sát thương một cách tách biệt, xác định.
    hp0 = pg.evaluate("blocks[0].hp")
    pg.evaluate("""() => {
      G.mode = 'fly';
      setProj({ x: blocks[0].cx - 20, y: blocks[0].cy, vx: 260, vy: 0 });
      for (let i = 0; i < 10; i++) updatePhysics(1/60);
    }""")
    hp1 = pg.evaluate("blocks.length ? blocks[0].hp : 0")
    assert hp1 < hp0, 'khối không mất máu dù bị đạn trúng trực diện'


@test
def test_running_out_of_shots_with_targets_left_is_a_loss(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      for (let s = 0; s < 3; s++) {
        startDrag(150, 380); updateDrag(160, 390); release();  // kéo rất nhẹ, không trúng gì
        for (let i = 0; i < 180; i++) update(1/60);
      }
    }""")
    assert pg.evaluate("G.mode") == 'result' and pg.evaluate("G.won") == False
    assert pg.locator('#card h2').count() == 1


run(TESTS)
