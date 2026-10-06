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
      grid[0][4] = 1; grid[0][5] = 1;   // 2 bóng màu 1 ngay hàng trần (0), cột 4-5
      fire(480, 50);
      const p = getProj(); p.color = 1; p.x = 260 + 4 * 44 + 22; p.y = 480;  // bắn từ dưới lên đúng cột 4
      for (let i = 0; i < 200; i++) update(1/60);
      return grid[0][4] === 0 && grid[0][5] === 0;
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


@test
def test_menu_lists_six_levels(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.locator('.lvBtn').count() == 6


@test
def test_levels_have_names_and_lore(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    assert pg.evaluate("LEVELS.length === 6 && LEVELS.every(l => l.name && l.lore)")


@test
def test_level_start_shows_banner(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(1)")
    assert pg.evaluate("G.banner && G.banner.title === LEVELS[1].name"), 'vào màn phải có lời dẫn tên màn'


@test
def test_pop_scores_points_and_combo(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    r = pg.evaluate("""() => {
      const out = {};
      for (const row of grid) row.fill(0);
      grid[0][0] = 1; grid[0][1] = 1; grid[0][9] = 2;  // (0,9) bám trần, không nằm trong cụm
      fire(480, 50); let p = getProj(); p.color = 1; p.x = 260 + 2 * 44 + 22; p.y = 50;
      for (let i = 0; i < 200; i++) update(1/60);
      out.c1 = G.combo; out.s1 = G.score;
      grid[0][4] = 1; grid[0][5] = 1;
      fire(480, 50); p = getProj(); p.color = 1; p.x = 260 + 6 * 44 + 22; p.y = 50;
      for (let i = 0; i < 200; i++) update(1/60);
      out.c2 = G.combo; out.s2 = G.score;
      return out;
    }""")
    assert r['c1'] == 1 and r['s1'] == 30, f'cụm 3 bóng đầu tiên: 3×10×1 điểm, thực tế {r}'
    assert r['c2'] == 2 and r['s2'] - r['s1'] == 60, f'pop liên tiếp tăng combo: 3×10×2 điểm, thực tế {r}'


@test
def test_dropped_bubbles_fall_and_leave_grid(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    r = pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      grid[0][0] = 1; grid[0][1] = 1; grid[1][1] = 2;  // (1,1) chỉ bám qua (0,1): cụm nổ thì nó rơi
      fire(480, 50); const p = getProj(); p.color = 1; p.x = 260 + 2 * 44 + 22; p.y = 50;
      for (let i = 0; i < 200 && G.mode === 'fly'; i++) update(1/60);  // dừng ngay khi viên bắn vừa gắn vào lưới
      return { cell: grid[1][1], falling: G.falling.map(f => f.color) };
    }""")
    assert r['cell'] == 0, 'bóng bị tách khỏi lưới phải rời khỏi ô lưới'
    assert 2 in r['falling'], f'bóng bị tách phải thành bóng rơi tự do, thực tế {r}'
    pg.evaluate("update(1/60); for (let i = 0; i < 240; i++) update(1/60)")
    assert pg.evaluate("G.falling.length") == 0, 'bóng rơi phải biến mất khi ra khỏi màn hình'


@test
def test_aim_path_bounces_off_wall(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    bounced = pg.evaluate("""() => {
      const pts = aimPath(0, 300);
      const hit = pts.findIndex(p => p.x <= 24);
      return hit >= 0 && pts.slice(hit + 1).some(p => p.x > 30);
    }""")
    assert bounced, 'đường ngắm chạm tường trái phải nảy lại'


@test
def test_fire_triggers_bow_recoil(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("fire(480, 50)")
    assert pg.evaluate("G.recoil") > 0, 'bắn phải kích hoạt động tác kéo-bắn của cung thủ'
    pg.evaluate("for (let i = 0; i < 90; i++) update(1/60)")
    assert pg.evaluate("G.recoil") == 0, 'động tác phải tự kết thúc'


@test
def test_win_records_best_score(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("startLevel(0)")
    pg.evaluate("""() => {
      for (const row of grid) row.fill(0);
      grid[0][0] = 1; grid[0][1] = 1;
      fire(480, 50); const p = getProj(); p.color = 1; p.x = 260 + 2 * 44 + 22; p.y = 50;
      for (let i = 0; i < 200; i++) update(1/60);
    }""")
    assert pg.evaluate("G.won") == True and pg.evaluate("S.maxLevel") == 1
    assert pg.evaluate("S.best") == pg.evaluate("G.score") and pg.evaluate("G.score") > 0


@test
def test_old_save_still_loads(pg, browser, base):
    pg.goto(root(base) + URL); pg.wait_for_timeout(300)
    pg.evaluate("localStorage.setItem('ban-bong-v1', JSON.stringify({ maxLevel: 2 }))")
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate("S.maxLevel") == 2 and pg.evaluate("unlocked(2) && !unlocked(3)")


run(TESTS)
