#!/usr/bin/env node
(function lightingCheckerMain() {
  "use strict";

  // Planner heuristic: verifies geometric coverage, not Terraria's exact light engine.
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");

  const root = path.resolve(__dirname, "..");
  const files = [
    "js/data/underground/layout.js",
    "js/data/underground/solids.js",
    "js/data/underground/backgrounds.js",
    "js/data/underground/objects.js",
    "js/data/underground/index.js",
  ];
  const context = vm.createContext({ console });
  for (const relative of files) {
    vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, {
      filename: relative,
    });
  }
  const D = vm.runInContext("JSON.parse(JSON.stringify(D))", context);
  const errors = [];
  const assert = (condition, message) => {
    if (!condition) errors.push(message);
  };

  assert(Array.isArray(D.lightingZones), "Scene must expose D.lightingZones");
  assert(
    D.lightingZones.length === 4,
    "Underground scene must define four lighting zones",
  );
  const lights = D.objects.filter((object) => object.kind === "light");
  for (const light of lights) {
    assert(
      Number.isFinite(light.lightRadius) && light.lightRadius > 0,
      `${light.id} must declare a positive lightRadius`,
    );
  }

  const lightCenter = (light) => ({
    x: light.x + light.w / 2,
    y: light.y + light.h / 2,
  });
  const covers = (light, x, y) => {
    const center = lightCenter(light);
    return Math.hypot(x - center.x, y - center.y) <= light.lightRadius;
  };
  const results = [];
  for (const zone of D.lightingZones) {
    const tiles = [];
    for (let y = zone.y1; y <= zone.y2; y += 1) {
      for (let x = zone.x1; x <= zone.x2; x += 1) {
        tiles.push({ x: x + 0.5, y: y + 0.5, tileX: x, tileY: y });
      }
    }
    const influencingLights = lights.filter((light) =>
      tiles.some((tile) => covers(light, tile.x, tile.y)),
    );
    const uncovered = tiles.filter(
      (tile) => !influencingLights.some((light) => covers(light, tile.x, tile.y)),
    );
    const coverage = tiles.length
      ? (tiles.length - uncovered.length) / tiles.length
      : 0;
    let worstNormalizedDistance = 0;
    let darkestTile = null;
    for (const tile of tiles) {
      const nearest = Math.min(
        ...lights.map((light) => {
          const center = lightCenter(light);
          return (
            Math.hypot(tile.x - center.x, tile.y - center.y) / light.lightRadius
          );
        }),
      );
      if (nearest > worstNormalizedDistance) {
        worstNormalizedDistance = nearest;
        darkestTile = { x: tile.tileX, y: tile.tileY };
      }
    }
    assert(
      coverage >= zone.minCoverage,
      `${zone.name}: coverage ${(coverage * 100).toFixed(1)}% is below ${(zone.minCoverage * 100).toFixed(1)}%; first dark tile ${uncovered[0] ? `x${uncovered[0].tileX} y${uncovered[0].tileY}` : "n/a"}`,
    );
    assert(
      influencingLights.length >= zone.minSources,
      `${zone.name}: expected at least ${zone.minSources} contributing lights, found ${influencingLights.length}`,
    );
    results.push({
      id: zone.id,
      name: zone.name,
      coveragePercent: Number((coverage * 100).toFixed(1)),
      contributingLights: influencingLights.map((light) => light.id),
      darkestTile,
      worstNormalizedDistance: Number(worstNormalizedDistance.toFixed(3)),
    });
  }

  assert(
    D.validation.lightingCoveragePercent === 100 &&
      D.validation.lightingZones === D.lightingZones.length,
    "Lighting validation snapshot mismatch",
  );

  if (errors.length) {
    console.error("LIGHTING CHECK: FAIL");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log("LIGHTING CHECK: PASS");
  console.log(JSON.stringify({ zones: results, lightCount: lights.length }, null, 2));
})();
