'use strict';
const {loadScene, SCENES, ROOT} = require('./load-scene.cjs');
function loadAudit(entry, root = ROOT) {
  const loaded = loadScene(entry, root);
  for (const file of ['core', 'placement-contract', 'validation', 'model', 'render-tiles', 'render-cache', 'inspector', 'render-base', 'render-objects',
    ...(entry === 'index.html' ? [] : [entry.replace('.html', '') + '-extensions']),
    'building-audit', 'lighting-audit', 'scene-audit']) loaded.runFile(`js/runtime/${file}.js`);
  const compute = () => loaded.run(`computeSceneAudit(D, {blockSpecs:BLOCK_SPECS,
    wallSpecs:WALL_SPECS,materials:MAT,wallColors:WALL,rendererErrors:[...validateObjectRenderers(D), ...validateTileRenderers(D)]})`);
  return {...loaded, compute};
}
module.exports = {loadAudit, SCENES};
