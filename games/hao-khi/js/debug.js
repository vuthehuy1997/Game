// Với ?debug trên địa chỉ: đưa trạng thái và hàm của game ra window (bộ kiểm thử tests/test_hao_khi.py dùng).
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { refill } from '../../../platform/core/util.js';
import * as util from '../../../platform/core/util.js';
import * as input from '../../../platform/core/input.js';
import * as fx from '../../../platform/core/fx.js';
import * as settings from '../../../platform/core/settings.js';
import * as state from './state.js';
import * as save from './save.js';
import * as data from './data.js';
import * as looks from './looks.js';
import * as audio from './audio.js';
import * as player from './player.js';
import * as enemies from './enemies.js';
import * as world from './world.js';
import * as background from './background.js';
import * as render from './render.js';
import * as flow from './flow.js';
import * as keys from './input.js';
import * as main from './main.js';

if (debugOn()) exposeGlobals([util, input, fx, settings, state, save, data, looks, audio, player, enemies, world, background, render, flow, keys, main], {
  P: state.setP, ally: state.setAlly,
  enemies: v => refill(state.enemies, v), projs: v => refill(state.projs, v), items: v => refill(state.items, v),
});
