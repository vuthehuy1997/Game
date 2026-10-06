export const G = { t: 0, log: [], festival: 0, nextFestival: 90, appear: {}, workers: [] };
export function pushLog(txt) { G.log.push({ txt }); if (G.log.length > 3) G.log.shift(); }
