"use strict";
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../..');
const SCENES = ['index.html', 'desert.html', 'underground.html', 'jungle.html'];

// Load real ES modules with Node 22. VM is used only for existing concise
// mutation-test snippets, never to strip imports or concatenate production code.
function loadScene(entry, root = ROOT) {
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  const match = html.match(/<script\b[^>]*data-planner-entry="\.\/([^"]+)"/);
  if (!match) throw new Error(`Missing native module entry: ${entry}`);
  const entryModule = require(path.join(root, match[1]));
  const { createPlanner } = require(path.join(root, 'js/runtime/start.js'));
  const planner = createPlanner(entryModule.createScene(), entryModule.registerRenderers);
  const sandbox = { console, structuredClone };
  for (const key of Object.keys(planner)) Object.defineProperty(sandbox, key, {
    configurable: true, enumerable: true, get: () => planner[key], set: value => { planner[key] = value; },
  });
  // Non-browser unit tests never execute a scheduled Canvas frame. Individual
  // tests can replace this window with observable scheduling stubs.
  planner.window = {requestAnimationFrame: () => 1, cancelAnimationFrame() {}};
  const context = vm.createContext(sandbox);
  const run = code => vm.runInContext(code, context);
  const runFile = file => {
    const namespace = require(path.join(root, file));
    for (const [name, value] of Object.entries(namespace)) {
      if (Object.hasOwn(planner, name)) continue;
      const needsState = typeof value === 'function' && /^function\s+\w+\(planner(?:[,\)])/u.test(value.toString());
      sandbox[name] = needsState ? value.bind(null, planner) : value;
    }
    return namespace;
  };
  runFile('js/runtime/state.js');
  return {context, run, runFile, planner, entryModule};
}
module.exports = {loadScene, SCENES, ROOT};
