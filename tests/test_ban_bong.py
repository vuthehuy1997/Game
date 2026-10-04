#!/usr/bin/env python3
"""Kiểm thử Bắn Bóng. Chạy: python3 tests/test_ban_bong.py [lọc tên]"""
from harness import run, root

URL = 'games/ban-bong/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn


@test
def test_game_loads_with_home_link(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('canvas').count() >= 1
    assert pg.locator('a.hub-home').count() == 1


@test
def test_cluster_of_three_pops(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    popped = pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      grid[8][4] = 1; grid[8][5] = 1;   // 2 bóng màu 1 sẵn ở hàng đáy, cột 4-5
      fire(480, 50);                     // G.cur có thể không phải màu 1 -> ép màu để kiểm thử xác định
      const p = getProj(); p.color = 1; p.x = 480 + (4 - 5) * 44; p.y = 50;  // đưa đạn về đúng cột 4, gần hàng đáy
      for (let i = 0; i < 200; i++) update(1/60);
      return grid[8][4] === 0 && grid[8][5] === 0;
    }""")
    assert popped, 'cụm ≥3 bóng cùng màu phải nổ hết'


@test
def test_floating_bubbles_drop_after_pop(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    remaining = pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      grid[0][0] = 1; grid[0][1] = 1; grid[1][1] = 2;  // bóng màu 2 ở (1,1) chỉ còn bám vào lưới qua (0,1)
      fire(480, 50);
      const p = getProj(); p.color = 1; p.x = 260 + 2 * 44 + 22; p.y = 50;  // nhắm vào cột 2 (trống) -> gắn ở hàng 0
      for (let i = 0; i < 200; i++) update(1/60);
      return grid[1][1];
    }""")
    # Cụm (0,0)-(0,1)-(0,2) cùng màu 1 nổ hết -> (1,1) mất liên kết với hàng trên -> phải tự rơi (bị xoá).
    assert remaining == 0, 'bóng mất liên kết với hàng trên phải tự rơi sau khi cụm nổ'


@test
def test_reaching_lose_row_ends_in_loss(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      // Hàng LOSE_ROW (7) đã có bóng sẵn ngay từ đầu -> bất kỳ lượt bắn nào kết thúc cũng phải phát hiện tràn
      // ngay sau khi gắn xong (hasOverflow() luôn được kiểm tra lại mỗi khi một viên bóng vừa gắn vào lưới).
      for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++) grid[r][c] = (r < 8) ? 1 : 0;
    }""")
    assert pg.evaluate("G.mode") != 'result'  # chưa trigger tới khi có lượt bắn tiếp theo
    pg.evaluate("G.cur = 2; fire(480, 50); for (let i = 0; i < 300; i++) update(1/60)")
    assert pg.evaluate("G.mode") == 'result' and pg.evaluate("G.won") == False, 'lưới tràn qua LOSE_ROW phải báo thua'


@test
def test_shooting_into_a_column_full_to_the_ceiling_does_not_crash(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      for (let r = 0; r < 9; r++) grid[r][4] = 1;  // cột 4 đầy kín từ hàng 0 tới đáy (topRow sẽ là 0)
      fire(480, 50);
      const p = getProj(); p.color = 1; p.x = 260 + 4 * 44 + 22; p.y = 50;  // đặt thẳng đạn vào đúng cột 4, sát trần
      for (let i = 0; i < 200; i++) update(1/60);
    }""")
    # Không có assert đặc biệt: bài test tự fail nếu có lỗi console (harness kiểm tra lỗi console ở mọi bài).
    # Mục đích riêng: trước khi vá, dòng `grid[row][col]` với row=-1 ném TypeError ngay khi đạn chạm đỉnh cột đầy.


run(TESTS)
