'use strict';
// Âm thanh tổng hợp bằng Web Audio: hiệu ứng và nhạc nền ngũ cung.

let AC = null, musicTimer = null, musicStep = 0, nextNote = 0;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
// ch = 'sfx' hoặc 'music': nhân âm lượng theo cài đặt
function tone(f, dur, type = 'square', vol = .06, slide = 0, at = 0, ch = 'sfx') {
  vol *= (ch === 'music' ? CFG.music : CFG.sfx) / 100;
  if (vol <= 0) return; const a = ac(); if (!a) return;
  const t = (at || a.currentTime), o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .08, freq = 1200) {
  vol *= CFG.sfx / 100;
  if (vol <= 0) return; const a = ac(); if (!a) return;
  const len = (a.sampleRate * dur) | 0, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  s.buffer = buf; s.connect(f).connect(g).connect(a.destination); s.start();
}
const SFX = {
  swing: () => noise(.07, .05, 2600),
  hit: () => { noise(.09, .14, 700); tone(150, .08, 'square', .05, -70); },
  heavy: () => { noise(.16, .2, 400); tone(110, .16, 'square', .07, -60); },
  block: () => { tone(1250, .05, 'square', .04); tone(900, .06, 'triangle', .04); },
  jump: () => tone(330, .12, 'triangle', .05, 260),
  coin: () => { tone(988, .05, 'square', .03); setTimeout(() => tone(1480, .09, 'square', .03), 55); },
  chuong: () => { tone(180, .4, 'sawtooth', .05, 420); noise(.3, .06, 500); },
  hurt: () => tone(240, .22, 'sawtooth', .07, -150),
  dash: () => noise(.12, .06, 3200),
  arrow: () => tone(1800, .09, 'triangle', .02, -900),
  boom: () => { noise(.35, .22, 180); tone(70, .35, 'sine', .12, -30); },
  crack: () => { noise(.12, .12, 1500); tone(300, .06, 'square', .03, -150); },
  thunder: () => { noise(.6, .25, 120); tone(55, .6, 'sine', .1, -20); },
  splash: () => { noise(.5, .15, 600); },
  gong: () => { tone(196, 1.6, 'sine', .12); tone(293, 1.2, 'sine', .05); tone(392, .9, 'triangle', .03); },
  ult: () => { [0, 90, 180, 270].forEach((d, i) => setTimeout(() => tone(392 * [1, 1.125, 1.5, 2][i], .35, 'square', .05), d)); setTimeout(() => SFX.boom(), 800); },
  heal: () => { tone(660, .1, 'triangle', .05); setTimeout(() => tone(880, .15, 'triangle', .05), 90); },
};

// Nhạc nền ngũ cung (Cung – Thương – Giốc – Chủy – Vũ)
const PENTA = [262, 294, 349, 392, 440, 523, 587, 698, 784];
const MEL = [4, 3, 4, 5, 4, 3, 1, 2, 3, -1, 3, 4, 2, 1, 0, -1, 4, 5, 7, 5, 4, 3, 4, -1, 3, 2, 1, 2, 0, -1, 0, -1];
function musicTick() {
  const a = AC; if (!a) return;
  const fast = G.boss && alive(G.boss);
  if (CFG.music <= 0) { nextNote = a.currentTime; return; }
  while (nextNote < a.currentTime + .3) {
    const n = MEL[musicStep % MEL.length], t = Math.max(nextNote, a.currentTime);
    if (n >= 0) tone(PENTA[n], .32, 'triangle', .022, 0, t, 'music');
    if (musicStep % 4 === 0) tone(PENTA[[0, 3, 4, 3][(musicStep / 4 | 0) % 4]] / 2, .6, 'sine', .03, 0, t, 'music');
    if (musicStep % 8 === 4 || (fast && musicStep % 2 === 0)) tone(1400, .04, 'square', .012, -600, t, 'music'); // mõ / trống trận
    nextNote = t + (fast ? .19 : .24); musicStep++;
  }
}
function startMusic() { if (!ac()) return; if (!musicTimer) { nextNote = AC.currentTime + .1; musicTimer = setInterval(musicTick, 100); } }
