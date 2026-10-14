import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { held, pressed, bindKeys, bindTouch } from '../../../platform/core/input.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import * as D from './data.js';
import { TS, ITEMS, RECIPES, BLACKSMITH_RECIPES, QUESTS, SHOP_BUY, SHOP_SELL, BENCH_RADIUS } from './data.js';
import * as WLD from './world.js';
import * as ST from './state.js';
import { G, newGame, saveGame, loadGame, invCount } from './state.js';
import * as PL from './player.js';
import { heldItem, hitTile, placeTile, craft, nearBench, nearNpc, nearBlacksmith, claimQuest, buy, sell, tillSoil, plantCrop, harvestCrop, unlockSkill, toggleArmor } from './player.js';
import * as MB from './mobs.js';
import { attackMobs } from './mobs.js';
import * as AN from './animals.js';
import { tameAnimal, tryMountNearbyTrau } from './animals.js';
import * as FL from './flow.js';
import { tick } from './flow.js';
import * as RD from './render.js';
import { render, getCamera, W, H } from './render.js';
import { drawItemIcon } from './art.js';

const cv = $('cv'), stage = $('stage');
const hotbarEl = $('hotbar'), craftPanel = $('craftPanel'), craftList = $('craftList');
const shopPanel = $('shopPanel'), shopList = $('shopList');
const skillPanel = $('skillPanel'), skillList = $('skillList');
const blacksmithPanel = $('blacksmithPanel'), blacksmithList = $('blacksmithList');
const btnCraft = $('btnCraft'), btnTrade = $('btnTrade'), btnPlaceMode = $('btnPlaceMode'), btnNew = $('btnNew');
const btnSkills = $('btnSkills'), btnBlacksmith = $('btnBlacksmith');

let placeMode = false;
cv.addEventListener('pointerdown', () => ac(), { once: true });
cv.addEventListener('contextmenu', e => e.preventDefault());

function screenToWorld(e) {
  const rect = cv.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * W, sy = (e.clientY - rect.top) / rect.height * H;
  const cam = getCamera();
  return { wx: sx + cam.x, wy: sy + cam.y };
}
cv.addEventListener('pointerdown', e => {
  const { wx, wy } = screenToWorld(e);
  const c = Math.floor(wx / TS), r = Math.floor(wy / TS);
  if (e.button === 2 || placeMode) {
    const item = heldItem();
    if (D.SEED_TO_CROP[item]) { plantCrop(c, r, item); return; }
    placeTile(c, r, item); return;
  }
  if (G.npc.active && Math.hypot(G.npc.x - wx, G.npc.y - wy) < 28) { openShop(); return; }
  if (G.blacksmith.active && Math.hypot(G.blacksmith.x - wx, G.blacksmith.y - wy) < 28) { openBlacksmith(); return; }
  const mob = G.mobs.find(m => Math.hypot(m.x - wx, m.y - wy) < 24);
  if (mob) { attackMobs(); return; }
  if (harvestCrop(c, r)) return;
  hitTile(c, r);
});

btnPlaceMode.addEventListener('click', () => { placeMode = !placeMode; btnPlaceMode.classList.toggle('act', placeMode); });
btnNew.addEventListener('click', () => { newGame(); closePanels(); });
btnCraft.addEventListener('click', () => toggle(craftPanel, renderCraftList));
btnTrade.addEventListener('click', () => openShop());
btnSkills.addEventListener('click', () => toggle(skillPanel, renderSkillList));
btnBlacksmith.addEventListener('click', () => openBlacksmith());
function openShop() { closePanels(); shopPanel.hidden = false; renderShopList(); }
function openBlacksmith() { closePanels(); blacksmithPanel.hidden = false; renderBlacksmithList(); }
function closePanels() { craftPanel.hidden = true; shopPanel.hidden = true; skillPanel.hidden = true; blacksmithPanel.hidden = true; }
function toggle(panel, fill) {
  const open = panel.hidden;
  closePanels();
  if (open) { panel.hidden = false; fill(); }
}

function iconCanvas(itemId, size = 28) {
  const cv = document.createElement('canvas'); cv.className = 'icon'; cv.width = size; cv.height = size;
  if (itemId) drawItemIcon(cv.getContext('2d'), itemId, size / 2, size / 2, size * .92);
  return cv;
}

function fmtNeed(need) { return Object.entries(need).map(([it, q]) => `x${q} ${ITEMS[it].name}`).join(', '); }
function renderCraftList() {
  craftList.innerHTML = '';
  const h = document.createElement('h2'); h.textContent = 'Chế tạo'; craftList.appendChild(h);
  for (const rec of RECIPES) {
    const ok = Object.entries(rec.need).every(([it, q]) => invCount(G.inv, it) >= q) && (!rec.bench || nearBench());
    const row = document.createElement('div'); row.className = 'row';
    row.appendChild(iconCanvas(rec.out));
    const span = document.createElement('span');
    span.innerHTML = `<b>${ITEMS[rec.out].name}</b> x${rec.qty}<small>${fmtNeed(rec.need)}${rec.bench ? ' · cần bàn chế tác' : ''}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Làm'; b.disabled = !ok;
    b.addEventListener('click', () => { craft(rec.id); renderCraftList(); });
    row.appendChild(b); craftList.appendChild(row);
  }
  const close = document.createElement('button'); close.className = 'btn ghost close'; close.textContent = 'Đóng';
  close.addEventListener('click', closePanels); craftList.appendChild(close);
}
function renderBlacksmithList() {
  blacksmithList.innerHTML = '';
  const h = document.createElement('h2'); h.textContent = 'Thợ rèn'; blacksmithList.appendChild(h);
  for (const rec of BLACKSMITH_RECIPES) {
    const ok = Object.entries(rec.need).every(([it, q]) => invCount(G.inv, it) >= q) && (!rec.bench || nearBench());
    const row = document.createElement('div'); row.className = 'row';
    row.appendChild(iconCanvas(rec.out));
    const span = document.createElement('span');
    span.innerHTML = `<b>${ITEMS[rec.out].name}</b> x${rec.qty}<small>${fmtNeed(rec.need)}${rec.bench ? ' · cần bàn chế tác' : ''}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Làm'; b.disabled = !ok;
    b.addEventListener('click', () => { craft(rec.id, BLACKSMITH_RECIPES); renderBlacksmithList(); });
    row.appendChild(b); blacksmithList.appendChild(row);
  }
  const close = document.createElement('button'); close.className = 'btn ghost close'; close.textContent = 'Đóng';
  close.addEventListener('click', closePanels); blacksmithList.appendChild(close);
}
function renderShopList() {
  shopList.innerHTML = '';
  const h = document.createElement('h2'); h.textContent = 'Thương nhân · ' + G.gold + ' vàng'; shopList.appendChild(h);
  for (const it of SHOP_BUY) {
    const row = document.createElement('div'); row.className = 'row';
    row.appendChild(iconCanvas(it.item));
    const span = document.createElement('span'); span.innerHTML = `<b>${ITEMS[it.item].name}</b><small>${it.price} vàng</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Mua'; b.disabled = G.gold < it.price;
    b.addEventListener('click', () => { buy(it.item, it.price); renderShopList(); });
    row.appendChild(b); shopList.appendChild(row);
  }
  for (const [item, price] of Object.entries(SHOP_SELL)) {
    const have = invCount(G.inv, item);
    const row = document.createElement('div'); row.className = 'row';
    row.appendChild(iconCanvas(item));
    const span = document.createElement('span'); span.innerHTML = `<b>${ITEMS[item].name}</b><small>bán ${price} vàng/cái · đang có ${have}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Bán'; b.disabled = have <= 0;
    b.addEventListener('click', () => { sell(item, price, 1); renderShopList(); });
    row.appendChild(b); shopList.appendChild(row);
  }
  for (const q of G.quests) {
    const def = QUESTS.find(x => x.id === q.id);
    const row = document.createElement('div'); row.className = 'row';
    if (def.item) row.appendChild(iconCanvas(def.item));
    const span = document.createElement('span'); span.innerHTML = `<b>${def.text}</b><small>${q.have}/${q.need}${q.claimed ? ' · đã nhận' : ''}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Nhận'; b.disabled = q.claimed || q.have < q.need;
    b.addEventListener('click', () => { claimQuest(q.id); renderShopList(); });
    row.appendChild(b); shopList.appendChild(row);
  }
  const close = document.createElement('button'); close.className = 'btn ghost close'; close.textContent = 'Đóng';
  close.addEventListener('click', closePanels); shopList.appendChild(close);
}

const SKILL_TIERS = {
  warrior: [
    { label: 'Bậc 1: +10% sát thương cận chiến' },
    { label: 'Bậc 2: +20 máu tối đa' },
    { label: 'Bậc 3: -30% thời gian hồi chiêu đánh' },
  ],
  miner: [
    { label: 'Bậc 1: +20% tốc độ đào' },
    { label: 'Bậc 2: +15% cơ hội rơi gấp đôi nguyên liệu' },
    { label: 'Bậc 3: +10% vàng khi bán' },
  ],
};
function renderSkillBranch(branch, title) {
  const col = document.createElement('div'); col.className = 'skillCol';
  const h = document.createElement('h3'); h.textContent = title; col.appendChild(h);
  SKILL_TIERS[branch].forEach((t, tier) => {
    const unlocked = G.skills[branch][tier];
    const locked = tier > 0 && !G.skills[branch][tier - 1];
    const row = document.createElement('div'); row.className = 'row';
    const span = document.createElement('span'); span.innerHTML = `<small>${t.label}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = unlocked ? 'Đã mở' : 'Mở (1 điểm)';
    b.disabled = unlocked || locked || G.skillPoints <= 0;
    b.addEventListener('click', () => { unlockSkill(branch, tier); renderSkillList(); });
    row.appendChild(b); col.appendChild(row);
  });
  return col;
}
function renderSkillList() {
  skillList.innerHTML = '';
  const h = document.createElement('h2'); h.textContent = 'Kỹ năng'; skillList.appendChild(h);
  const info = document.createElement('p');
  info.innerHTML = `Cấp ${G.level} · ${G.xp}/${G.level * 100} XP · Còn ${G.skillPoints} điểm`;
  skillList.appendChild(info);
  const cols = document.createElement('div'); cols.className = 'skillCols';
  cols.appendChild(renderSkillBranch('warrior', 'Chiến Binh'));
  cols.appendChild(renderSkillBranch('miner', 'Thợ Mỏ'));
  skillList.appendChild(cols);
  const close = document.createElement('button'); close.className = 'btn ghost close'; close.textContent = 'Đóng';
  close.addEventListener('click', closePanels); skillList.appendChild(close);
}

function renderHotbar() {
  hotbarEl.innerHTML = '';
  G.inv.forEach((s, i) => {
    const b = document.createElement('button'); b.className = 'slot' + (i === G.sel ? ' sel' : '');
    b.appendChild(iconCanvas(s ? s.item : null));
    if (s) { const n = document.createElement('b'); n.textContent = s.count; b.appendChild(n); }
    b.addEventListener('pointerdown', e => { e.preventDefault(); G.sel = i; });
    hotbarEl.appendChild(b);
  });
}

const keymap = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', KeyE: 'craft', KeyF: 'trade', KeyT: 'till', KeyR: 'wear' };
for (let i = 0; i < 8; i++) keymap['Digit' + (i + 1)] = 'slot' + i;
bindKeys(keymap, {
  onPress: k => {
    ac();
    if (k === 'craft') toggle(craftPanel, renderCraftList);
    else if (k === 'trade') {
      if (nearNpc()) openShop();
      else if (nearBlacksmith()) openBlacksmith();
      else if (!tameAnimal(BENCH_RADIUS)) tryMountNearbyTrau(BENCH_RADIUS);
    }
    else if (k.startsWith('slot')) G.sel = Number(k.slice(4));
  },
});
bindTouch($('touch'));
mountHomeLink(stage);

loadGame();

let paused = false;
function update(dt) {
  if (paused) return;
  if (pressed.has('till')) tillSoil(Math.floor(G.px / TS) + G.face, Math.floor(G.py / TS));
  if (pressed.has('wear')) toggleArmor();
  tick(dt);
}
function frame() {
  render(cv.getContext('2d'));
  btnTrade.hidden = !nearNpc();
  btnBlacksmith.hidden = !nearBlacksmith();
  renderHotbar();
}

setInterval(saveGame, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });

if (debugOn()) exposeGlobals([D, WLD, ST, PL, MB, AN, FL, RD, { G, update, held, pressed, pause: v => { paused = v; } }]);
startLoop(update, frame);
