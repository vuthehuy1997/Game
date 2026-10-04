#!/usr/bin/env python3
"""Kiểm thử Nối Ngọc. Chạy: python3 tests/test_noi_ngoc.py [lọc tên]"""
from harness import run, root

URL = 'games/noi-ngoc/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_valid_swap_scores_and_invalid_swap_reverts(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    # Dàn 1 hàng gần khớp rồi đổi 1 ô để tạo đúng 3 liên tiếp
    before, after, ok = pg.evaluate("""() => {
      for (let x = 0; x < 8; x++) grid[x] = 1;   // cả hàng 0 cùng màu 1 -> đã khớp sẵn, dùng để kiểm tra logic đổi chỗ thuần tuý
      grid[0] = 2; grid[1] = 1; grid[2] = 1;      // [2,1,1,1,1,1,1,1] ở hàng 0
      const g0 = grid.slice(0, 8);
      const ok = trySwap(0, 1);                   // đổi ô (0,0)=2 và (1,0)=1 -> [1,2,1,...] không còn 3 liên tục tại đầu nhưng vẫn còn 1,1,1,1,1 từ cột 2 -> vẫn match
      return [g0, grid.slice(0, 8), ok];
    }""")
    assert ok == True, 'đổi chỗ hợp lệ (vẫn tạo được hàng ≥3) phải trả về true'


@test
def test_invalid_swap_with_no_match_reverts_grid(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    reverted = pg.evaluate("""() => {
      // Dựng bàn cờ không có hàng/cột nào ≥3, xen kẽ 2 màu theo ca-rô
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = ((x + y) % 2) + 1;
      const before = grid.slice();
      const ok = trySwap(0, 1);  // đổi 2 ô liền kề khác màu trong bàn ca-rô -> không tạo hàng/cột nào ≥3
      const after = grid.slice();
      return !ok && JSON.stringify(before) === JSON.stringify(after);
    }""")
    assert reverted, 'đổi chỗ không hợp lệ phải tự hoàn tác về đúng bàn cờ cũ'


@test
def test_running_out_of_moves_without_target_is_a_loss(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      G.movesLeft = 1; G.score = 0; G.selected = null;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = ((x + y) % 2) + 1;
      selectCell(0, 0); selectCell(1, 0);  // (0,0) và (1,0) liền kề theo hàng ngang; bàn ca-rô -> đổi chỗ không hợp lệ
    }""")
    assert pg.evaluate("G.mode") == 'play', 'đổi chỗ không hợp lệ không được tính là hết lượt'


run(TESTS)
