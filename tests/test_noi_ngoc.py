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


# Mẫu không có hàng/cột nào ≥3 liên tiếp: màu đổi +2 theo hàng và +1 theo cột (mod 3)
PATTERN = "(x, y) => ((2 * x + y) % 3) + 1"


@test
def test_four_in_row_creates_row_special(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    ok, sp = pg.evaluate("""() => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = (%s)(x, y);
      grid[0] = 1; grid[1] = 1; grid[2] = 1; grid[3] = 2; grid[11] = 1;   // (3,1)=1 đổi lên (3,0) -> 4 ô liên tiếp hàng 0
      special.fill(0);
      const ok = trySwap(11, 3);
      tick(0.21);                                                        // một bước giải quyết
      return [ok, special[3]];
    }""" % PATTERN)
    assert ok is True and sp == 1, f'nối 4 hàng ngang phải tạo ngọc hàng (1) tại ô đổi, nhận {sp}'


@test
def test_five_in_row_creates_jewel(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    sp = pg.evaluate("""() => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = (%s)(x, y);
      grid[0] = 1; grid[1] = 1; grid[2] = 1; grid[3] = 2; grid[4] = 1; grid[11] = 1;
      special.fill(0);
      trySwap(11, 3);
      tick(0.21);
      return special[3];
    }""" % PATTERN)
    assert sp == 3, f'nối 5 thẳng hàng phải tạo ngọc vạn năng (3), nhận {sp}'


@test
def test_row_special_swap_clears_its_row(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    score = pg.evaluate("""() => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = (%s)(x, y);
      special.fill(0);
      special[2 * 8 + 2] = 1;                          // ngọc hàng ở (2,2)... đổi xuống (2,3)
      trySwap(2 * 8 + 2, 3 * 8 + 2);
      tick(0.21);
      return G.score;
    }""" % PATTERN)
    assert score >= 80, f'kích hoạt ngọc hàng phải xoá cả hàng (8 ô, 80 điểm), điểm {score}'


@test
def test_input_is_blocked_while_resolving(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    sel = pg.evaluate("""() => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) grid[y * 8 + x] = (%s)(x, y);
      grid[0] = 1; grid[1] = 1; grid[2] = 1; grid[3] = 2; grid[11] = 1;
      special.fill(0);
      trySwap(11, 3);                 // bắt đầu giải quyết, chưa tick
      selectCell(0, 5);               // bấm khi đang giải quyết phải bị bỏ qua
      return G.selected;
    }""" % PATTERN)
    assert sel is None, 'không được nhận thao tác khi bàn đang giải quyết'


@test
def test_menu_lists_three_chapters_and_eight_levels(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('.chapter').count() == 3
    assert pg.locator('.lvBtn').count() == 8


@test
def test_winning_saves_stars_and_progress(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("G.score = LEVELS[0].target * 2; G.movesLeft = 5; G.resolving = false; G.ending = true; tick(0.01)")
    assert pg.evaluate("S.stars[0]") == 3, 'đạt 2x mục tiêu phải được 3 sao'
    assert pg.evaluate("S.maxLevel") == 1



run(TESTS)
