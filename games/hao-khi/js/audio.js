// Hiệu ứng âm thanh và nhạc nền ngũ cung của Hào Khí Việt Nam (bộ tổng hợp nằm ở platform/core/audio.js).
import { tone, noise, createMusic } from '../../../platform/core/audio.js';
import { G, alive } from './state.js';

export const SFX = {
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

// Nhạc nền ngũ cung (Cung – Thương – Giốc – Chủy – Vũ); gặp tướng giặc thì dồn nhịp
export const PENTA = [262, 294, 349, 392, 440, 523, 587, 698, 784];
export const MEL = [4, 3, 4, 5, 4, 3, 1, 2, 3, -1, 3, 4, 2, 1, 0, -1, 4, 5, 7, 5, 4, 3, 4, -1, 3, 2, 1, 2, 0, -1, 0, -1];
export const music = createMusic((step, t) => {
  const fast = G.boss && alive(G.boss), n = MEL[step % MEL.length];
  if (n >= 0) tone(PENTA[n], .32, 'triangle', .022, 0, t, 'music');
  if (step % 4 === 0) tone(PENTA[[0, 3, 4, 3][(step / 4 | 0) % 4]] / 2, .6, 'sine', .03, 0, t, 'music');
  if (step % 8 === 4 || (fast && step % 2 === 0)) tone(1400, .04, 'square', .012, -600, t, 'music'); // mõ / trống trận
  return fast ? .19 : .24;
});
export function startMusic() { music.start(); }
