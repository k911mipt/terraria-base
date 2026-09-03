// Surface Jungle scene rendering extensions.
// The shared runtime knows the data model; this file supplies the actual
// mahogany, foliage, bamboo and painted-wall textures used by this scene.

const sharedJungleTileMaterial = tileMaterial;
tileMaterial = function drawSurfaceJungleTile(ctx, mat, wx, wy) {
  const x = cp(wx);
  const y = cy(wy);
  const t = CACHE_TILE;
  const p = MAT[mat];

  if (mat === "rich_mahogany_platform") {
    drawPlatformTile(ctx, wx, wy, mat);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 2, y + 8, 5, 1);
    ctx.fillRect(x + 10, y + 8, 3, 1);
    return;
  }

  if (mat === "rich_mahogany") {
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    ctx.fillStyle = p.dark;
    ctx.fillRect(x + 4, y, 2, t);
    ctx.fillRect(x + 11, y, 1, t);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, 2, t - 2);
    if (seeded(wx, wy, 1) > 0.42) {
      ctx.fillStyle = p.dark;
      ctx.fillRect(x + 7, y + 6, 4, 2);
      ctx.fillStyle = p.light;
      ctx.fillRect(x + 8, y + 6, 1, 1);
    }
    return;
  }

  if (mat === "living_mahogany") {
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    ctx.strokeStyle = p.light;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y);
    ctx.bezierCurveTo(x + 7, y + 4, x + 1, y + 10, x + 6, y + t);
    ctx.moveTo(x + 12, y);
    ctx.bezierCurveTo(x + 8, y + 5, x + 14, y + 11, x + 10, y + t);
    ctx.stroke();
    ctx.fillStyle = p.dark;
    if (seeded(wx, wy, 3) > 0.5) {
      ctx.fillRect(x + 7, y + 7, 3, 3);
      ctx.fillStyle = p.light;
      ctx.fillRect(x + 8, y + 8, 1, 1);
    }
    return;
  }

  if (mat === "leaf_block") {
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    for (let i = 0; i < 7; i += 1) {
      const qx = x + 1 + Math.floor(seeded(wx, wy, i) * 13);
      const qy = y + 1 + Math.floor(seeded(wy, wx, i + 11) * 13);
      ctx.fillStyle = i % 3 === 0 ? p.dark : p.light;
      ctx.fillRect(qx, qy, i % 2 ? 3 : 2, 2);
    }
    ctx.fillStyle = "rgba(220,255,176,.28)";
    ctx.fillRect(x + 3, y + 2, 3, 2);
    return;
  }

  if (mat === "jungle_grass") {
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    ctx.fillStyle = MAT.mud?.base || "#674934";
    ctx.fillRect(x, y + 6, t, t - 6);
    ctx.fillStyle = p.light;
    ctx.fillRect(x, y, t, 5);
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 4, t, 2);
    for (let i = 0; i < 5; i += 1) {
      const bx = x + 1 + Math.floor(seeded(wx, wy, i + 30) * 13);
      const height = 2 + Math.floor(seeded(wy, wx, i + 40) * 4);
      ctx.fillStyle = i % 2 ? p.light : p.dark;
      ctx.fillRect(bx, y + 5 - height, 1, height);
    }
    return;
  }

  if (mat === "bamboo_block") {
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    for (const bx of [2, 7, 12]) {
      ctx.fillStyle = p.light;
      ctx.fillRect(x + bx, y + 1, 2, t - 2);
      ctx.fillStyle = p.dark;
      ctx.fillRect(x + bx + 2, y + 1, 1, t - 2);
      const node = 5 + ((wy + bx) % 6);
      ctx.fillRect(x + bx - 1, y + node, 4, 2);
    }
    return;
  }

  sharedJungleTileMaterial(ctx, mat, wx, wy);
};

const JUNGLE_WOOD_WALLS = new Set([
  "rich_mahogany_wall",
  "jungle_leaf_wall",
  "painter_yellow_wall",
  "painter_teal_wall",
  "painter_magenta_wall",
]);

const sharedJungleTileWall = tileWall;
tileWall = function drawSurfaceJungleWall(ctx, mat, wx, wy) {
  if (!WALL[mat]) {
    sharedJungleTileWall(ctx, mat, wx, wy);
    return;
  }

  const p = WALL[mat];
  const x = cp(wx);
  const y = cy(wy);
  const t = CACHE_TILE;

  if (JUNGLE_WOOD_WALLS.has(mat)) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = p[0];
    ctx.fillRect(x, y, t, t);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p[1];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 5, y + t);
    ctx.moveTo(x + 11, y);
    ctx.lineTo(x + 11, y + t);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(x + 1, y + 1, 2, t - 2);
    if (mat === "jungle_leaf_wall") {
      ctx.fillStyle = "rgba(104,173,78,.3)";
      ctx.fillRect(x + 7, y + 3, 4, 2);
      ctx.fillRect(x + 2, y + 10, 3, 2);
    }
    return;
  }

  if (mat === "living_wood_wall") {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = p[0];
    ctx.fillRect(x, y, t, t);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p[1];
    ctx.lineWidth = 1;
    for (const offset of [4, 11]) {
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.bezierCurveTo(
        x + offset - 3,
        y + 5,
        x + offset + 3,
        y + 10,
        x + offset - 1,
        y + t,
      );
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(31,22,16,.45)";
    if (seeded(wx, wy, 71) > 0.45) ctx.fillRect(x + 7, y + 7, 3, 3);
    return;
  }

  if (mat === "bamboo_wall") {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = p[0];
    ctx.fillRect(x, y, t, t);
    ctx.globalAlpha = 1;
    for (const bx of [1, 6, 11]) {
      ctx.fillStyle = p[1];
      ctx.fillRect(x + bx, y, 3, t);
      ctx.fillStyle = p[0];
      ctx.fillRect(x + bx + 2, y, 1, t);
      ctx.fillRect(x + bx - 1, y + 7, 5, 1);
    }
    return;
  }

  if (mat === "jungle_stone_wall") {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = p[0];
    ctx.fillRect(x, y, t, t);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p[1];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + t, y + 8);
    const off = wy % 2 ? 4 : 12;
    ctx.moveTo(x + off, y);
    ctx.lineTo(x + off, y + 8);
    ctx.stroke();
    ctx.fillStyle = "rgba(72,132,68,.28)";
    ctx.fillRect(x + 2, y + 2, 5, 2);
    ctx.fillRect(x + 10, y + 11, 4, 2);
    return;
  }

  sharedJungleTileWall(ctx, mat, wx, wy);
};

function jungleRect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(
    Math.round(x),
    Math.round(y),
    Math.max(1, Math.round(w)),
    Math.max(1, Math.round(h)),
  );
}

function jungleGlow(ctx, cx, cy, radius, fill) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawJungleLanternSprite(ctx, o, colors) {
  const b = objectBox(o);
  const cx = b.x + b.w / 2;
  const top = b.y + 1;
  jungleGlow(ctx, cx, b.y + b.h * 0.62, Math.max(14, b.w * 1.4), colors.glow);
  jungleRect(ctx, cx - 1, top, 2, Math.max(3, b.h * 0.18), colors.chain);
  jungleRect(ctx, b.x + b.w * 0.22, b.y + b.h * 0.32, b.w * 0.56, b.h * 0.55, colors.frame);
  jungleRect(ctx, b.x + b.w * 0.31, b.y + b.h * 0.41, b.w * 0.38, b.h * 0.34, colors.flame);
  jungleRect(ctx, b.x + b.w * 0.38, b.y + b.h * 0.46, b.w * 0.24, b.h * 0.22, colors.core);
}

function drawJungleTorchSprite(ctx, o, colors) {
  const b = objectBox(o);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  jungleGlow(ctx, cx, cy, Math.max(12, b.w * 1.25), colors.glow);
  ctx.strokeStyle = colors.stick;
  ctx.lineWidth = Math.max(2, b.w * 0.12);
  ctx.beginPath();
  ctx.moveTo(cx - 2, b.y + b.h - 2);
  ctx.lineTo(cx + 1, b.y + b.h * 0.42);
  ctx.stroke();
  ctx.fillStyle = colors.flame;
  ctx.beginPath();
  ctx.moveTo(cx + 1, b.y + 1);
  ctx.lineTo(cx - b.w * 0.22, b.y + b.h * 0.43);
  ctx.lineTo(cx + 1, b.y + b.h * 0.58);
  ctx.lineTo(cx + b.w * 0.22, b.y + b.h * 0.43);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.core;
  ctx.beginPath();
  ctx.moveTo(cx + 1, b.y + b.h * 0.18);
  ctx.lineTo(cx - b.w * 0.1, b.y + b.h * 0.43);
  ctx.lineTo(cx + 1, b.y + b.h * 0.5);
  ctx.lineTo(cx + b.w * 0.1, b.y + b.h * 0.43);
  ctx.closePath();
  ctx.fill();
}

function drawTikiTorchSprite(ctx, o) {
  const b = objectBox(o);
  const cx = b.x + b.w / 2;
  jungleGlow(ctx, cx, b.y + b.h * 0.18, Math.max(15, b.w * 1.5), "#ffad58");
  jungleRect(ctx, cx - 2, b.y + b.h * 0.28, 4, b.h * 0.69, "#5b3820");
  jungleRect(ctx, cx - 4, b.y + b.h * 0.25, 8, 4, "#9a6431");
  ctx.fillStyle = "#ff8f3e";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 1);
  ctx.lineTo(cx - 5, b.y + b.h * 0.25);
  ctx.lineTo(cx, b.y + b.h * 0.33);
  ctx.lineTo(cx + 5, b.y + b.h * 0.25);
  ctx.closePath();
  ctx.fill();
  jungleRect(ctx, cx - 2, b.y + b.h * 0.12, 4, b.h * 0.12, "#ffe178");
}

function drawJunglePlant(ctx, o) {
  const b = objectBox(o);
  const potW = b.w / 4;
  for (let i = 0; i < 3; i += 1) {
    const cx = b.x + b.w * (0.2 + i * 0.3);
    jungleRect(ctx, cx - potW * 0.35, b.y + b.h * 0.58, potW * 0.7, b.h * 0.28, "#9a5c2f");
    ctx.fillStyle = i === 1 ? "#72b94b" : "#4f9c3d";
    ctx.beginPath();
    ctx.ellipse(cx - 3, b.y + b.h * 0.45, potW * 0.25, b.h * 0.23, -0.6, 0, Math.PI * 2);
    ctx.ellipse(cx + 3, b.y + b.h * 0.42, potW * 0.25, b.h * 0.25, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJungleCanvas(ctx, o) {
  const b = objectBox(o);
  const palette = {
    canvas_yellow: ["#5a3725", "#e9c34e", "#fff1a3"],
    canvas_teal: ["#5a3725", "#36a69e", "#9ee8df"],
    canvas_magenta: ["#5a3725", "#b44e7d", "#f4a4c8"],
  }[o.style] || ["#5a3725", "#aaaaaa", "#eeeeee"];
  jungleRect(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, palette[0]);
  jungleRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, palette[1]);
  ctx.fillStyle = palette[2];
  ctx.beginPath();
  ctx.moveTo(b.x + b.w * 0.22, b.y + b.h * 0.68);
  ctx.lineTo(b.x + b.w * 0.46, b.y + b.h * 0.35);
  ctx.lineTo(b.x + b.w * 0.63, b.y + b.h * 0.58);
  ctx.lineTo(b.x + b.w * 0.79, b.y + b.h * 0.3);
  ctx.lineTo(b.x + b.w * 0.79, b.y + b.h * 0.78);
  ctx.lineTo(b.x + b.w * 0.22, b.y + b.h * 0.78);
  ctx.closePath();
  ctx.fill();
}

function drawJungleTotem(ctx, o) {
  const b = objectBox(o);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h * 0.52;
  jungleRect(ctx, cx - b.w * 0.23, b.y + b.h * 0.2, b.w * 0.46, b.h * 0.67, "#7a4b2b");
  jungleRect(ctx, cx - b.w * 0.16, b.y + b.h * 0.29, b.w * 0.32, b.h * 0.19, "#b98a45");
  jungleRect(ctx, cx - b.w * 0.11, cy - 2, b.w * 0.07, b.h * 0.07, "#b6ea68");
  jungleRect(ctx, cx + b.w * 0.04, cy - 2, b.w * 0.07, b.h * 0.07, "#b6ea68");
  ctx.strokeStyle = "#d8d26b";
  ctx.lineWidth = 3;
  for (const direction of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + direction * b.w * 0.18, b.y + b.h * 0.28);
    ctx.lineTo(cx + direction * b.w * 0.42, b.y + b.h * 0.08);
    ctx.stroke();
  }
}

function drawWitchCauldron(ctx, o) {
  const b = objectBox(o);
  const cx = b.x + b.w / 2;
  jungleRect(ctx, b.x + b.w * 0.16, b.y + b.h * 0.42, b.w * 0.68, b.h * 0.38, "#343832");
  ctx.fillStyle = "#6ebd4b";
  ctx.beginPath();
  ctx.ellipse(cx, b.y + b.h * 0.44, b.w * 0.3, b.h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  jungleRect(ctx, b.x + b.w * 0.24, b.y + b.h * 0.78, 3, b.h * 0.18, "#23251f");
  jungleRect(ctx, b.x + b.w * 0.7, b.y + b.h * 0.78, 3, b.h * 0.18, "#23251f");
  ctx.fillStyle = "#a8e977";
  for (const dx of [-6, 2, 7]) {
    ctx.beginPath();
    ctx.arc(cx + dx, b.y + b.h * 0.28 - Math.abs(dx) * 0.3, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJungleVine(ctx, o) {
  const b = objectBox(o);
  const cx = b.x + b.w / 2;
  ctx.strokeStyle = "#3d7f3b";
  ctx.lineWidth = Math.max(2, b.w * 0.18);
  ctx.beginPath();
  ctx.moveTo(cx, b.y);
  ctx.bezierCurveTo(cx - 4, b.y + b.h * 0.35, cx + 5, b.y + b.h * 0.7, cx - 1, b.y + b.h);
  ctx.stroke();
  ctx.fillStyle = "#62a84b";
  for (let i = 1; i < 6; i += 1) {
    const y = b.y + (b.h * i) / 6;
    const direction = i % 2 ? -1 : 1;
    ctx.beginPath();
    ctx.ellipse(cx + direction * 4, y, 4, 2.5, direction * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawJungleSign(ctx, o) {
  const b = objectBox(o);
  jungleRect(ctx, b.x + 2, b.y + 3, b.w - 4, b.h - 6, "#6e4327");
  jungleRect(ctx, b.x + 4, b.y + 5, b.w - 8, b.h - 10, "#a06d38");
  ctx.fillStyle = "#f0e293";
  ctx.font = `bold ${Math.max(8, Math.min(13, b.h * 0.35))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("→ ХРАМ", b.x + b.w / 2, b.y + b.h / 2);
}

const sharedJungleDrawPylon = drawPylon;
drawPylon = function drawSurfaceJunglePylon(ctx, o) {
  if (o.style !== "jungle_pylon") {
    sharedJungleDrawPylon(ctx, o);
    return;
  }
  const b = objectBox(o);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  jungleGlow(ctx, cx, cy, Math.max(18, b.w * 0.8), "#7df3b0");
  ctx.fillStyle = "#294f3c";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 1);
  ctx.lineTo(b.x + b.w * 0.82, cy);
  ctx.lineTo(cx, b.y + b.h - 2);
  ctx.lineTo(b.x + b.w * 0.18, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#65dca0";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + b.h * 0.14);
  ctx.lineTo(b.x + b.w * 0.66, cy);
  ctx.lineTo(cx, b.y + b.h * 0.82);
  ctx.lineTo(b.x + b.w * 0.34, cy);
  ctx.closePath();
  ctx.fill();
  jungleRect(ctx, cx - 2, b.y + b.h * 0.25, 4, b.h * 0.5, "#d7ef77");
  jungleRect(ctx, b.x + b.w * 0.18, b.y + b.h - 5, b.w * 0.64, 4, "#5a3e28");
};

const sharedJungleDrawLight = drawLight;
drawLight = function drawSurfaceJungleLight(ctx, o) {
  if (o.style === "jungle_lantern") {
    drawJungleLanternSprite(ctx, o, {
      glow: "#a8ef75",
      chain: "#4f3824",
      frame: "#6a4a2c",
      flame: "#94d65f",
      core: "#edffb3",
    });
    return;
  }
  if (o.style === "painter_lantern") {
    drawJungleLanternSprite(ctx, o, {
      glow: "#f1a7dc",
      chain: "#5a382c",
      frame: "#8a4f73",
      flame: "#59cfc2",
      core: "#fff0a0",
    });
    return;
  }
  if (o.style === "tiki_lantern") {
    drawJungleLanternSprite(ctx, o, {
      glow: "#ffb35e",
      chain: "#4f321e",
      frame: "#79512d",
      flame: "#ef8d3a",
      core: "#ffe394",
    });
    return;
  }
  if (o.style === "jungle_torch") {
    drawJungleTorchSprite(ctx, o, {
      glow: "#89df55",
      stick: "#5a3b20",
      flame: "#67bf42",
      core: "#e8ff9d",
    });
    return;
  }
  if (o.style === "painter_torch") {
    drawJungleTorchSprite(ctx, o, {
      glow: "#ec8cc8",
      stick: "#5a3b20",
      flame: "#bd4d94",
      core: "#8de3d6",
    });
    return;
  }
  if (o.style === "tiki_torch") {
    drawTikiTorchSprite(ctx, o);
    return;
  }
  sharedJungleDrawLight(ctx, o);
};

const sharedJungleDrawObjectSprite = drawObjectSprite;
drawObjectSprite = function drawSurfaceJungleObjectSprite(ctx, o) {
  if (o.kind === "jungle_plant") return drawJunglePlant(ctx, o);
  if (o.kind === "jungle_canvas") return drawJungleCanvas(ctx, o);
  if (o.kind === "jungle_totem") return drawJungleTotem(ctx, o);
  if (o.kind === "jungle_vine") return drawJungleVine(ctx, o);
  if (o.kind === "jungle_sign") return drawJungleSign(ctx, o);
  if (o.id === "JG_WITCH_CAULDRON") return drawWitchCauldron(ctx, o);
  return sharedJungleDrawObjectSprite(ctx, o);
};
