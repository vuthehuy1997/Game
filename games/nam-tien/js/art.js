// Hình vẽ công trình, địa hình và cờ bằng canvas. Gốc (0,0) là chân công trình, đứng giữa.
import { TERRAIN } from './data.js';

const rnd = seed => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export function drawBuilding(c, kind, x, y, s = 1, t = 0) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  shadow(c, 0, 1, 19, 4.5);
  ({ house, farm, outpost, market, temple, workshop, citadel }[kind] || (() => {}))(c, t);
  c.restore();
}

export function drawIcon(c, kind, cx, cy, size, t = 0) {
  c.save();
  c.beginPath(); c.rect(cx - size / 2, cy - size / 2, size, size); c.clip();
  drawBuilding(c, kind, cx, cy + size * .4, size / 40, t);
  c.restore();
}

function shadow(c, x, y, rx, ry) {
  c.fillStyle = 'rgba(0,0,0,.25)';
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
}

function roof(c, cx, y, w, h, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(cx - w - 6, y + 2);
  c.quadraticCurveTo(cx - w * .5, y - h * .4, cx - w * .45, y - h);
  c.lineTo(cx + w * .45, y - h);
  c.quadraticCurveTo(cx + w * .5, y - h * .4, cx + w + 6, y + 2);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(40,20,10,.5)'; c.lineWidth = 1; c.stroke();
}

function house(c) {
  c.fillStyle = '#c8a06a'; c.fillRect(-14, -18, 28, 18);
  c.strokeStyle = '#6b4a2a'; c.lineWidth = 1.2; c.strokeRect(-14, -18, 28, 18);
  c.fillStyle = '#4a2e1a'; c.fillRect(-4, -9, 8, 9);
  c.strokeStyle = 'rgba(107,74,42,.6)';
  for (let x = -10; x <= 10; x += 5) { c.beginPath(); c.moveTo(x, -17); c.lineTo(x, -1); c.stroke(); }
  roof(c, 0, -17, 16, 10, '#7a2e22');
  c.fillStyle = '#e9b949'; c.fillRect(-2, -28, 4, 2);
}

function farm(c, t) {
  c.fillStyle = '#8a7a3a';
  c.beginPath(); c.ellipse(0, -2, 20, 6, 0, 0, Math.PI * 2); c.fill();
  for (let i = -6; i <= 6; i++) {
    const x = i * 2.6, sway = Math.sin(t * 2 + i * .7) * 2;
    c.strokeStyle = '#5f8a3a'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(x, -2); c.quadraticCurveTo(x, -10, x + sway, -17); c.stroke();
    c.fillStyle = '#e9c25a';
    c.beginPath(); c.ellipse(x + sway, -18, 1.6, 3.2, sway * .05, 0, Math.PI * 2); c.fill();
  }
}

function outpost(c, t) {
  c.fillStyle = '#6b4a2a'; c.fillRect(-18, -4, 36, 4);
  for (let x = -17; x <= 17; x += 5) {
    c.fillStyle = x % 10 ? '#9a6d3f' : '#8b5e34';
    c.beginPath(); c.moveTo(x - 2, -4); c.lineTo(x - 2, -15); c.lineTo(x, -18); c.lineTo(x + 2, -15); c.lineTo(x + 2, -4); c.closePath(); c.fill();
  }
  c.fillStyle = '#4a2e1a'; c.fillRect(-1.5, -36, 3, 32);
  flag(c, 1.5, -36, '#b3261e', t);
}

function market(c) {
  c.strokeStyle = '#5a3d22'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-14, -2); c.lineTo(-14, -22); c.moveTo(14, -2); c.lineTo(14, -22); c.stroke();
  for (let k = 0; k < 4; k++) {
    c.fillStyle = k % 2 ? '#f4ead2' : '#b3261e';
    c.fillRect(-18 + k * 9, -23, 9, 7);
  }
  c.fillStyle = '#b3261e';
  c.beginPath(); c.moveTo(-18, -16); c.lineTo(-18, -14); c.lineTo(-13.5, -12); c.lineTo(-9, -14); c.lineTo(-4.5, -12); c.lineTo(0, -14); c.lineTo(0, -16); c.closePath(); c.fill();
  c.fillStyle = '#f4ead2';
  c.beginPath(); c.moveTo(0, -16); c.lineTo(0, -14); c.lineTo(4.5, -12); c.lineTo(9, -14); c.lineTo(13.5, -12); c.lineTo(18, -14); c.lineTo(18, -16); c.closePath(); c.fill();
  c.fillStyle = '#e9b949'; c.beginPath(); c.arc(-8, -6, 3, 0, 7); c.fill();
  c.fillStyle = '#7bd389'; c.beginPath(); c.arc(1, -6, 3, 0, 7); c.fill();
  c.fillStyle = '#e0604e'; c.beginPath(); c.arc(9, -6, 3, 0, 7); c.fill();
}

function workshop(c, t) {
  c.fillStyle = '#7d5a3a'; c.fillRect(-16, -20, 32, 20);
  c.strokeStyle = '#4a3626'; c.lineWidth = 1.2; c.strokeRect(-16, -20, 32, 20);
  c.fillStyle = '#5a4a3a'; c.fillRect(-6, -10, 12, 10);
  roof(c, 0, -20, 17, 6, '#4a3626');
  c.fillStyle = '#6b4a3a'; c.fillRect(8, -36, 6, 16);
  smoke(c, 11, -37, t);
}

function smoke(c, x, y, t) {
  for (let k = 0; k < 3; k++) {
    const p = (t * .5 + k / 3) % 1;
    c.fillStyle = `rgba(235,232,225,${(1 - p) * .45})`;
    c.beginPath(); c.arc(x + p * 7, y - p * 22, 2.5 + p * 4, 0, Math.PI * 2); c.fill();
  }
}

function temple(c) {
  c.fillStyle = '#9c8060'; c.fillRect(-18, -4, 36, 4);
  c.fillStyle = '#e0c48a'; c.fillRect(-14, -12, 28, 8);
  roof(c, 0, -12, 15, 4, '#7a2e22');
  c.fillStyle = '#e0c48a'; c.fillRect(-10, -20, 20, 7);
  roof(c, 0, -20, 11, 4, '#7a2e22');
  c.fillStyle = '#e0c48a'; c.fillRect(-6, -27, 12, 6);
  roof(c, 0, -27, 7, 3.5, '#7a2e22');
  c.fillStyle = '#e9b949'; c.beginPath(); c.ellipse(0, -33, 2.5, 3.5, 0, 0, Math.PI * 2); c.fill();
}

function citadel(c, t) {
  c.fillStyle = '#8f8a7e'; c.fillRect(-20, -16, 40, 16);
  c.fillStyle = '#7a756a';
  for (let x = -20; x <= 15; x += 8) c.fillRect(x, -20, 5, 5);
  c.fillStyle = '#9d978a'; c.fillRect(-7, -34, 14, 18);
  c.fillStyle = '#7a756a';
  for (let x = -7; x <= 4; x += 4) c.fillRect(x, -38, 3, 4);
  c.fillStyle = '#3a2a1a';
  c.beginPath(); c.arc(0, -8, 3, Math.PI, 0); c.fill(); c.fillRect(-3, -8, 6, 8);
  c.fillStyle = '#4a2e1a'; c.fillRect(-1, -48, 2, 14);
  flag(c, 1, -48, '#e9b949', t);
}

function flag(c, x, y, color, t) {
  const w = Math.sin(t * 5) * 2;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + 7 + w, y + 2, x + 14 + w, y + 3);
  c.lineTo(x + 12 + w * .6, y + 7);
  c.quadraticCurveTo(x + 7 - w, y + 8, x, y + 9);
  c.closePath(); c.fill();
}

export function drawTerrain(c, t, x, y, w, h, seed, time = 0) {
  const T = TERRAIN[t];
  c.fillStyle = T.color;
  c.fillRect(x, y, w, h);
  if (t === 'p') {
    for (let k = 1; k < 5; k++) {
      c.fillStyle = k % 2 ? 'rgba(255,255,220,.08)' : 'rgba(0,0,0,.07)';
      c.fillRect(x, y + k * h / 5, w, h / 5);
    }
    c.strokeStyle = 'rgba(40,70,20,.18)'; c.lineWidth = 1;
    for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + k * w / 4, y + h * .55); c.lineTo(x + k * w / 4 + 3, y + h); c.stroke(); }
  } else if (t === 'h') {
    for (let k = 0; k < 3; k++) {
      const bx = x + w * (.2 + .3 * rnd(seed + k)), by = y + h * (.35 + .4 * rnd(seed + k + 9));
      c.fillStyle = 'rgba(255,255,220,.22)'; c.beginPath(); c.ellipse(bx, by, 16, 9, 0, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(40,40,20,.16)'; c.beginPath(); c.ellipse(bx, by, 16, 6, 0, 0, Math.PI); c.fill();
    }
  } else if (t === 'f') {
    for (let k = 0; k < 5; k++) {
      const tx = x + w * (.12 + .18 * k + .05 * rnd(seed + k)), ty = y + h * (.45 + .3 * rnd(seed * 3 + k));
      c.fillStyle = '#4a3320'; c.fillRect(tx - 1, ty, 2, 6);
      c.fillStyle = k % 2 ? '#2c5a33' : '#33693b';
      c.beginPath(); c.arc(tx, ty - 2, 6 + rnd(k + seed) * 2, 0, Math.PI * 2); c.fill();
    }
  } else if (t === 'm') {
    for (let k = 0; k < 2; k++) {
      const px = x + w * (.3 + .4 * k), py = y + h * .3;
      c.fillStyle = k ? '#5e5b57' : '#6f6c66';
      c.beginPath(); c.moveTo(px - 18, y + h); c.lineTo(px, py); c.lineTo(px + 18, y + h); c.closePath(); c.fill();
      c.fillStyle = '#f2f0ea';
      c.beginPath(); c.moveTo(px - 6, py + 6); c.lineTo(px, py); c.lineTo(px + 6, py + 6); c.lineTo(px + 2, py + 5); c.lineTo(px, py + 8); c.lineTo(px - 2, py + 5); c.closePath(); c.fill();
    }
  } else if (t === 'w') {
    c.strokeStyle = 'rgba(220,240,255,.45)'; c.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) {
      const wy = y + h * (.25 + .27 * k), wx = x + 10 + ((time * 14 + k * 27) % (w - 20));
      c.beginPath(); c.moveTo(wx - 8, wy); c.quadraticCurveTo(wx - 4, wy - 2.5, wx, wy); c.quadraticCurveTo(wx + 4, wy + 2.5, wx + 8, wy); c.stroke();
    }
  }
}

export function drawLock(c, cx, cy, s = 1) {
  c.save(); c.translate(cx, cy); c.scale(s, s);
  c.strokeStyle = '#8a7e66'; c.lineWidth = 2.5;
  c.beginPath(); c.arc(0, -4, 5, Math.PI, 0); c.stroke();
  c.fillStyle = '#8a7e66'; c.fillRect(-7, -4, 14, 11);
  c.restore();
}
