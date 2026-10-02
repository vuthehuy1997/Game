#!/usr/bin/env python3
"""Kiểm thử nền tảng: trang chủ, cài đặt chung, tiến độ trên thẻ, đường về trang chủ, game mẫu.

Chạy:  python3 tests/test_platform.py [lọc tên]
"""
import json
from harness import run, root

HK = 'games/hao-khi/?debug'
TESTS = []
def test(fn):
    TESTS.append(fn); return fn

def seed(pg, key, value):
    pg.evaluate("([k, v]) => localStorage.setItem(k, v)", [key, json.dumps(value)])


@test
def test_hub_lists_games(pg):
    assert pg.title() == 'Game Hub'
    cards = pg.locator('.games .card')
    assert cards.count() >= 1
    hk = pg.locator('[data-game="hao-khi"]')
    assert 'Hào Khí Việt Nam' in hk.inner_text() and 'Chưa chơi' in hk.inner_text()
    assert pg.inner_text('#count') == f'{cards.count()} game'
    # ảnh bìa đã được vẽ (không còn trong suốt)
    assert pg.evaluate("document.querySelector('[data-game=\"hao-khi\"] .cover').getContext('2d').getImageData(320, 20, 1, 1).data[3]") == 255


@test
def test_every_game_meta_is_complete_and_loads(pg, browser, base):
    metas = pg.evaluate("import('./platform/games.js').then(m => m.GAMES.map(g => ({ id: g.id, title: g.title, url: g.url, desc: g.desc, tags: g.tags })))")
    assert len({m['id'] for m in metas}) == len(metas), 'id game bị trùng'
    for m in metas:
        assert m['id'] and m['title'] and m['desc'] and m['tags'], m
        assert m['url'].startswith(root(base) + 'games/'), m
        pg.goto(m['url'], wait_until='load'); pg.wait_for_timeout(400)
        assert pg.locator('canvas').count() >= 1, m['id']
        assert pg.locator('a.hub-home').count() == 1, f"{m['id']}: thiếu đường về trang chủ"
    return f'{len(metas)} game'


@test
def test_open_game_and_come_back(pg, browser, base):
    pg.click('[data-game="hao-khi"]'); pg.wait_for_load_state('load'); pg.wait_for_timeout(300)
    assert pg.url == root(base) + 'games/hao-khi/'
    assert pg.is_visible('#menu h1') and pg.inner_text('#menu h1') == 'Hào Khí Việt Nam'
    assert not pg.evaluate("'G' in window"), 'không có ?debug thì game không được đưa biến ra window'
    box, stage = pg.locator('a.hub-home').bounding_box(), pg.locator('#stage').bounding_box()
    assert box['height'] >= 24 and stage['x'] <= box['x'] and box['y'] >= stage['y']
    pg.click('a.hub-home'); pg.wait_for_load_state('load')
    assert pg.url == root(base) and pg.locator('.games .card').count() >= 1
    # vào trận thì lớp menu ẩn đi, đường về trang chủ không che màn chơi
    pg.goto(root(base) + HK); pg.wait_for_timeout(300)
    pg.evaluate("useSlot(0, true); startStage(0); endDialog()")
    assert not pg.is_visible('a.hub-home')


@test
def test_settings_are_shared(pg, browser, base):
    pg.click('#openSettings')
    assert pg.is_visible('#settings')
    pg.fill('#setMusic', '20'); pg.uncheck('#setShake'); pg.select_option('#setTouch', 'on')
    pg.click('#setDone'); assert not pg.is_visible('#settings')
    pg.goto(root(base) + HK); pg.wait_for_timeout(300)
    assert pg.evaluate("[CFG.music, CFG.sfx, CFG.shake, CFG.touch]") == [20, 80, False, 'on']
    assert pg.evaluate("$('touch').classList.contains('on')")
    # đổi trong game thì trang chủ thấy
    pg.click('#bSettings'); pg.fill('#stSfx', '35'); pg.check('#stShake'); pg.click('#stDone')
    pg.goto(root(base)); pg.wait_for_timeout(200); pg.click('#openSettings')
    assert pg.input_value('#setSfx') == '35' and pg.inner_text('#outSfx') == '35'
    assert pg.is_checked('#setShake') and pg.input_value('#setMusic') == '20'
    pg.click('#setReset')
    assert pg.input_value('#setMusic') == '60' and pg.input_value('#setTouch') == 'auto'
    assert json.loads(pg.evaluate("localStorage.getItem('game-hub-settings-v1')")) == {'music': 60, 'sfx': 80, 'shake': True, 'touch': 'auto'}


@test
def test_old_save_keeps_progress_and_settings(pg, browser, base):
    """Người chơi cũ (bản lưu trước khi có nền tảng): tiến độ còn nguyên, cài đặt âm lượng cũ thành cài đặt chung."""
    old = {'slots': [{'stage': 2, 'maxStage': 2, 'coins': 123, 'up': {'atk': 1, 'hp': 0, 'mp': 0}, 'stars': [3, 2], 'updated': 1750000000000}, None, None],
           'cur': 0, 'cfg': {'music': 15, 'sfx': 45, 'diff': 2, 'shake': False, 'dmgNum': False, 'textSpeed': 3, 'touch': 'off'}}
    pg.evaluate("localStorage.clear()"); seed(pg, 'haokhi-dong-a-v3', old)
    pg.goto(root(base) + HK); pg.wait_for_timeout(300)
    assert pg.evaluate("[S.coins, S.maxStage, S.stars]") == [123, 2, [3, 2]]
    assert pg.evaluate("[CFG.music, CFG.sfx, CFG.shake, CFG.touch, CFG.diff, CFG.dmgNum, CFG.textSpeed]") == [15, 45, False, 'off', 2, False, 3]
    assert json.loads(pg.evaluate("localStorage.getItem('game-hub-settings-v1')")) == {'music': 15, 'sfx': 45, 'shake': False, 'touch': 'off'}
    pg.evaluate("save()")
    cfg = json.loads(pg.evaluate("localStorage.getItem('haokhi-dong-a-v3')"))['cfg']
    assert cfg == {'diff': 2, 'dmgNum': False, 'textSpeed': 3}, cfg
    # đã có cài đặt chung thì cài đặt cũ trong bản lưu game không ghi đè nữa
    seed(pg, 'game-hub-settings-v1', {'music': 70, 'sfx': 45, 'shake': True, 'touch': 'auto'}); seed(pg, 'haokhi-dong-a-v3', old)
    pg.reload(); pg.wait_for_timeout(300)
    assert pg.evaluate("[CFG.music, CFG.shake, CFG.diff]") == [70, True, 2]


@test
def test_progress_on_card(pg):
    store = {'slots': [{'stage': 1, 'maxStage': 1, 'coins': 5, 'up': {'atk': 0, 'hp': 0, 'mp': 0}, 'stars': [1], 'updated': 1000},
                       {'stage': 2, 'maxStage': 2, 'coins': 9, 'up': {'atk': 0, 'hp': 0, 'mp': 0}, 'stars': [3, 2], 'updated': 1759300000000}, None], 'cur': 0, 'cfg': {}}
    seed(pg, 'haokhi-dong-a-v3', store); pg.reload(); pg.wait_for_timeout(200)
    txt = pg.inner_text('[data-game="hao-khi"]')
    assert 'Ải 3/6 · 5/21 ★' in txt and 'chơi lần cuối' in txt and 'Chơi tiếp' in txt, txt
    assert pg.get_attribute('[data-game="hao-khi"] .bar', 'aria-valuenow') == '33'
    store['slots'][1]['stars'] = [3, 3, 3, 3, 3, 3, 2]; store['slots'][1]['maxStage'] = 5
    seed(pg, 'haokhi-dong-a-v3', store); pg.reload(); pg.wait_for_timeout(200)
    assert 'Đã thắng cả 6 ải · 20/21 ★' in pg.inner_text('[data-game="hao-khi"]')
    # bản lưu hỏng không làm sập trang chủ
    pg.evaluate("localStorage.setItem('haokhi-dong-a-v3', '{hỏng')"); pg.reload(); pg.wait_for_timeout(200)
    assert 'Chưa chơi' in pg.inner_text('[data-game="hao-khi"]')


@test
def test_hao_khi_meta_matches_game(pg, browser, base):
    pg.goto(root(base) + HK); pg.wait_for_timeout(300)
    meta = pg.evaluate("import('./meta.js').then(m => [m.MAIN, m.STAR_MAX, m.STORE_KEY])")
    assert meta == pg.evaluate("[MAIN, STAGES.length * 3, STORE_KEY]"), meta


@test
def test_template_game_runs(pg, browser, base):
    pg.goto(root(base) + 'games/_template/?debug'); pg.wait_for_timeout(300)
    x0 = pg.evaluate("P.x")
    pg.keyboard.down('KeyD'); pg.wait_for_timeout(300); pg.keyboard.up('KeyD')
    assert pg.evaluate("P.x") > x0 + 30, 'D không đi sang phải'
    pg.keyboard.press('Space'); pg.wait_for_timeout(120)
    assert pg.evaluate("P.air"), 'Space không nhảy'
    got = pg.evaluate("""() => { coins.length = 0; coins.push({ x: P.x, y: P.y - 55 }); for (let i = 0; i < 5; i++) update(1 / 60); return [G.score, save.best, JSON.parse(localStorage.getItem('game-mau-v1')).best]; }""")
    assert got == [1, 1, 1], got
    assert pg.locator('a.hub-home').get_attribute('href') == root(base)


@test
def test_hub_layout_on_phone(pg):
    for w, h in ((360, 700), (390, 760), (844, 390), (1366, 768)):
        pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(120)
        sw = pg.evaluate("document.documentElement.scrollWidth")
        assert sw <= w, f'{w}px: trang rộng {sw}px'
    pg.set_viewport_size({'width': 360, 'height': 700}); pg.click('#openSettings')
    box = pg.locator('#settings').bounding_box()
    assert box['x'] >= 0 and box['x'] + box['width'] <= 360, box


if __name__ == '__main__':
    run(TESTS)
