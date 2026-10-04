import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import * as state from './state.js';
import * as data from './data.js';
import * as physics from './physics.js';
import * as flow from './flow.js';
import * as render from './render.js';
import * as main from './main.js';

if (debugOn()) exposeGlobals([state, data, physics, flow, render, main]);
