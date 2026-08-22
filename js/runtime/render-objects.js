// Foreground objects, furniture and museum rendering.
function drawChest(ctx, o) {
  const b = objectBox(o),
    p = chestPalette(o),
    x = b.x + 2,
    y = b.y + 5,
    w = b.w - 4,
    h = b.h - 7,
    f = o.chestFamily || "boreal";
  pxRect(ctx, x, y, w, h, p.dark);
  pxRect(ctx, x + 1, y + 3, w - 2, h - 4, p.base);
  pxRect(ctx, x + 1, y, w - 2, 5, p.light);
  pxRect(ctx, x + 3, y + 5, w - 6, 2, p.dark);
  if (f === "wooden") {
    for (let xx = x + 5; xx < x + w - 3; xx += 7)
      pxRect(ctx, xx, y + 3, 1, h - 5, p.dark);
    pxRect(ctx, x + 2, y + h - 5, w - 4, 2, p.light);
  } else if (f === "boreal") {
    pxRect(ctx, x + 3, y + 4, w - 6, 1, p.light);
    pxRect(ctx, x + 5, y + 9, w - 10, 1, p.dark);
    pxRect(ctx, x + 3, y + 13, w - 6, 1, p.dark);
  } else if (f === "dynasty") {
    pxRect(ctx, x + 1, y + 1, w - 2, 2, "#f4e5a8");
    pxRect(ctx, x + 2, y + h - 4, w - 4, 2, "#c89f48");
    pxRect(ctx, x + 2, y + 3, 2, h - 7, "#e8d6aa");
    pxRect(ctx, x + w - 4, y + 3, 2, h - 7, "#e8d6aa");
  } else if (f === "steampunk") {
    pxRect(ctx, x + 3, y + 4, 5, 2, "#d28a43");
    pxRect(ctx, x + w - 9, y + 3, 5, 2, "#d28a43");
    ctx.strokeStyle = "#f0b34c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.58, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.58, 1.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (f === "glass") {
    ctx.save();
    ctx.globalAlpha = 0.38;
    pxRect(ctx, x + 3, y + 3, w - 6, h - 6, "#d8fbff");
    ctx.restore();
    ctx.strokeStyle = "#bdefff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    pxRect(ctx, x + 5, y + 4, 2, h - 9, "#e7ffff");
  } else if (f === "stone") {
    pxRect(ctx, x + 2, y + 4, w - 4, 2, p.light);
    pxRect(ctx, x + 2, y + 10, w - 4, 2, p.dark);
    for (let xx = x + 5; xx < x + w - 3; xx += 8)
      pxRect(ctx, xx, y + 4, 1, 6, p.dark);
  } else if (f === "gold") {
    pxRect(ctx, x + 1, y + 1, w - 2, 2, "#ffe184");
    pxRect(ctx, x + 2, y + h - 4, w - 4, 2, "#9c6f20");
    pxRect(ctx, x + 2, y + 3, 3, h - 7, "#e7ba45");
    pxRect(ctx, x + w - 5, y + 3, 3, h - 7, "#e7ba45");
    pxRect(ctx, x + 6, y + 5, w - 12, 2, "#f7d96b");
  } else if (f === "living") {
    for (let xx = x + 4; xx < x + w - 3; xx += 7)
      pxRect(ctx, xx, y + 3, 2, h - 6, p.dark);
    pxRect(ctx, x + 2, y + h - 5, w - 4, 2, p.light);
    ctx.fillStyle = "#75b85e";
    ctx.beginPath();
    ctx.moveTo(x + w - 8, y + 5);
    ctx.lineTo(x + w - 3, y + 3);
    ctx.lineTo(x + w - 5, y + 8);
    ctx.closePath();
    ctx.fill();
  } else if (f === "sandstone") {
    pxRect(ctx, x + 2, y + 4, w - 4, 2, p.light);
    pxRect(ctx, x + 2, y + 9, w - 4, 2, p.dark);
    pxRect(ctx, x + 5, y + 4, 1, 5, p.dark);
    pxRect(ctx, x + w - 7, y + 9, 1, 5, p.dark);
  } else if (f === "skyware") {
    pxRect(ctx, x + 2, y + 3, w - 4, 3, "#e7f4f3");
    pxRect(ctx, x + 2, y + h - 5, w - 4, 2, "#caa74b");
    ctx.fillStyle = "#d9f3f7";
    ctx.beginPath();
    ctx.arc(x + 8, y + 9, 4, Math.PI, 0);
    ctx.arc(x + 13, y + 9, 5, Math.PI, 0);
    ctx.arc(x + 18, y + 9, 4, Math.PI, 0);
    ctx.fill();
  } else if (f === "frozen") {
    pxRect(ctx, x + 1, y + 1, w - 2, 3, "#d9f6ff");
    for (let xx = x + 3; xx < x + w - 2; xx += 6) {
      ctx.fillStyle = "#b9eaff";
      ctx.beginPath();
      ctx.moveTo(xx, y + 4);
      ctx.lineTo(xx + 2, y + 9);
      ctx.lineTo(xx + 4, y + 4);
      ctx.closePath();
      ctx.fill();
    }
    pxRect(ctx, x + 3, y + h - 5, w - 6, 2, "#5d8ea9");
  } else if (f === "water") {
    ctx.strokeStyle = "#a9e6ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 8);
    for (let xx = x + 3; xx < x + w - 3; xx += 5) {
      ctx.quadraticCurveTo(xx + 2, y + 5, xx + 5, y + 8);
    }
    ctx.stroke();
    ctx.fillStyle = "#a9e6ff";
    ctx.beginPath();
    ctx.arc(x + w - 7, y + 13, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (f === "shadow") {
    pxRect(ctx, x + 2, y + 3, w - 4, h - 6, "#2a2035");
    pxRect(ctx, x + 4, y + 5, w - 8, 2, "#84518d");
    pxRect(ctx, x + 4, y + h - 7, w - 8, 2, "#5b345f");
  } else if (f === "obsidian") {
    pxRect(ctx, x + 2, y + 3, w - 4, h - 6, "#1d1a24");
    ctx.strokeStyle = "#8a52a3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 4);
    ctx.lineTo(x + 10, y + 9);
    ctx.lineTo(x + 7, y + 14);
    ctx.lineTo(x + 13, y + h - 4);
    ctx.moveTo(x + w - 6, y + 4);
    ctx.lineTo(x + w - 11, y + 10);
    ctx.stroke();
  } else if (f === "honey") {
    pxRect(ctx, x + 2, y + 3, w - 4, h - 6, "#dca641");
    ctx.fillStyle = "#f4c866";
    for (let yy = y + 5; yy < y + h - 4; yy += 6)
      for (let xx = x + 5; xx < x + w - 4; xx += 7) {
        ctx.beginPath();
        ctx.arc(xx + (yy % 12 ? 3 : 0), yy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    pxRect(ctx, x + 2, y + h - 6, w - 4, 3, "#9b6523");
  }
  pxRect(ctx, x + w / 2 - 2, y + 7, 4, 5, "#d7bb62");
  if (["combat", "combat_dark", "weapon_red"].includes(o.style)) {
    pxRect(ctx, x + 2, y - 2, 3, 3, p.light);
    pxRect(ctx, x + w - 5, y - 2, 3, 3, p.light);
  }
  if (o.style === "mechanic" || o.style === "engineer_orange") {
    ctx.strokeStyle = "#f0b34c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.58, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (o.style === "nature" || o.style === "nature_teal") {
    ctx.fillStyle = "#86c66b";
    ctx.fillRect(x + 3, y + 6, 3, 2);
  }
  if (
    [
      "water",
      "water_ice",
      "fishing_blue",
      "tech_cyan",
      "accessory_cyan",
    ].includes(o.style)
  ) {
    ctx.fillStyle = "#8fd7ff";
    ctx.fillRect(x + 3, y + 6, w - 8, 1);
  }
  if (["alchemy", "alchemy_crystal", "alchemy_purple"].includes(o.style)) {
    ctx.fillStyle = "#e3a7ff";
    ctx.fillRect(x + 4, y + 5, 2, 4);
  }
  if (["curator", "collector_white", "decor_white"].includes(o.style)) {
    pxRect(ctx, x + 1, y + 1, w - 2, 2, "#f4e5a8");
  }
}

function drawStation(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    x = b.x + 2,
    y = b.y + 2,
    w = b.w - 4,
    h = b.h - 3;
  pxRect(ctx, x, y, w, h, p.dark);
  pxRect(ctx, x + 2, y + 2, w - 4, h - 4, p.base);
  pxRect(ctx, x + 2, y + 2, w - 4, 3, p.light);
  const kind = o.style;
  if (kind === "core") {
    pxRect(ctx, x + 2, y + h - 6, w - 4, 3, "#c48645");
    pxRect(ctx, x + 4, y + h - 3, 3, 3, p.dark);
    pxRect(ctx, x + w - 7, y + h - 3, 3, 3, p.dark);
  } else if (kind === "alchemy" || kind === "alchemy_crystal") {
    pxRect(ctx, x + 4, y + h - 8, 4, 6, "#c777d9");
    pxRect(ctx, x + 10, y + h - 10, 3, 8, "#7ed0d8");
    pxRect(ctx, x + 3, y + h - 3, w - 6, 2, p.light);
  } else if (kind === "buff") {
    pxRect(ctx, x + 2, y + h - 5, w - 4, 3, "#be7042");
    pxRect(ctx, x + w / 2 - 2, y + 4, 4, h - 10, "#e0a35b");
  } else if (kind === "advanced") {
    pxRect(ctx, x + w / 2 - 3, y + 4, 6, 6, "#d98adc");
    pxRect(ctx, x + 3, y + h - 5, w - 6, 3, "#7c4b8f");
  } else {
    for (let i = 0; i < 3; i++) {
      const xx = x + 4 + i * 6;
      pxRect(ctx, xx, y + 5, 3, h - 10, i % 2 ? p.light : "#6f8798");
    }
    pxRect(ctx, x + 3, y + h - 4, w - 6, 2, p.dark);
  }
}

function drawNpc(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    cx = b.x + b.w / 2;
  ctx.fillStyle = p.dark;
  ctx.fillRect(cx - 5, b.y + 14, 10, b.h - 16);
  ctx.fillStyle = o.style === "mushroom" ? "#86d9ff" : "#e5bf93";
  ctx.fillRect(cx - 5, b.y + 4, 10, 10);
  ctx.fillStyle = p.base;
  ctx.fillRect(cx - 6, b.y + 13, 12, 6);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 3, b.y + 8, 2, 2);
  ctx.fillRect(cx + 2, b.y + 8, 2, 2);
}

function drawDoor(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    x = b.x + 3,
    y = b.y + 1,
    w = b.w - 6,
    h = b.h - 2;
  pxRect(ctx, x, y, w, h, "#69472f");
  pxRect(ctx, x + 2, y + 2, w - 4, h - 4, "#8c6040");
  ctx.strokeStyle = "#c28a59";
  ctx.lineWidth = 1;
  for (let yy = y + 5; yy < y + h; yy += 7) {
    ctx.beginPath();
    ctx.moveTo(x + 2, yy);
    ctx.lineTo(x + w - 2, yy);
    ctx.stroke();
  }
  pxRect(ctx, x + w - 4, y + h / 2, 2, 2, "#e1bd62");
}

function drawHatch(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style);
  pxRect(ctx, b.x + 1, b.y + 6, b.w - 2, 6, p.dark);
  pxRect(ctx, b.x + 2, b.y + 7, b.w - 4, 3, p.base);
  for (let x = b.x + 4; x < b.x + b.w - 3; x += 5)
    pxRect(ctx, x, b.y + 8, 2, 2, p.light);
}

function drawFurniture(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    n = o.name.toLowerCase();
  if (n.includes("стул") || n.includes("chair")) {
    pxRect(ctx, b.x + b.w / 2 - 2, b.y + 5, 4, b.h - 6, p.light);
    pxRect(ctx, b.x + b.w / 2 - 4, b.y + b.h - 6, 8, 3, p.base);
    pxRect(ctx, b.x + b.w / 2 - 3, b.y + b.h - 3, 2, 3, p.dark);
    pxRect(ctx, b.x + b.w / 2 + 1, b.y + b.h - 3, 2, 3, p.dark);
  } else {
    pxRect(ctx, b.x + 2, b.y + b.h - 7, b.w - 4, 4, p.light);
    pxRect(ctx, b.x + 4, b.y + b.h - 3, 3, 3, p.dark);
    pxRect(ctx, b.x + b.w - 7, b.y + b.h - 3, 3, 3, p.dark);
  }
}

function drawPlanter(ctx, o) {
  const b = objectBox(o);
  const palettes = {
    planter_day: {
      tray: "#c4a63c",
      rim: "#f0d66a",
      soil: "#6f4d31",
      plant: "#8fd05b",
    },
    planter_blink: {
      tray: "#94754c",
      rim: "#c8aa75",
      soil: "#67462d",
      plant: "#d9b66d",
    },
    planter_moon: {
      tray: "#5d61a8",
      rim: "#9b9fe0",
      soil: "#55426a",
      plant: "#94a8ff",
    },
    planter_water: {
      tray: "#418aa3",
      rim: "#76c4dd",
      soil: "#526b64",
      plant: "#75cbbd",
    },
    planter_fire: {
      tray: "#b7542e",
      rim: "#e88651",
      soil: "#71402d",
      plant: "#f08b45",
    },
    planter_death: {
      tray: "#5d4865",
      rim: "#9677a0",
      soil: "#55434e",
      plant: "#9a729f",
    },
    planter_shiver: {
      tray: "#5f9eb8",
      rim: "#9bd9ee",
      soil: "#53636b",
      plant: "#a8e7f5",
    },
  };
  const q = palettes[o.style] || palettes.planter_day;
  const y = b.y + b.h - 7;
  pxRect(ctx, b.x + 1, y, b.w - 2, 6, "#4a3426");
  pxRect(ctx, b.x + 2, y, b.w - 4, 2, q.rim);
  pxRect(ctx, b.x + 2, y + 2, b.w - 4, 3, q.tray);
  pxRect(ctx, b.x + 3, y + 1, b.w - 6, 1, q.soil);
  pxRect(ctx, b.x + 1, y + 5, b.w - 2, 2, "#3f2c21");
  for (let x = b.x + 6; x < b.x + b.w - 4; x += 8) {
    ctx.fillStyle = q.plant;
    ctx.beginPath();
    ctx.moveTo(x, b.y + b.h - 8);
    ctx.lineTo(x - 3, b.y + b.h - 13);
    ctx.lineTo(x, b.y + b.h - 11);
    ctx.lineTo(x + 3, b.y + b.h - 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = q.rim;
    ctx.fillRect(x - 1, b.y + b.h - 12, 2, 4);
  }
}

function drawMuseumGlyph(ctx, icon, cx, cy, a, s = 8) {
  ctx.save();
  ctx.fillStyle = a;
  ctx.strokeStyle = a;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const dot = (x, y, r, c = a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = a;
  };
  const poly = (pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) =>
      i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y),
    );
    ctx.closePath();
    ctx.fill();
  };
  if (icon === "slime") {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, s, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    pxRect(ctx, cx - s * 0.6, cy - s, s * 1.2, 3, "#d8bd5d");
  } else if (icon === "eye") {
    dot(cx, cy, s);
    dot(cx, cy, s * 0.62, "#f0ebe2");
    dot(cx + 1, cy, s * 0.25, "#b2373d");
  } else if (icon === "evil") {
    dot(cx - s * 0.45, cy, s * 0.58);
    dot(cx + s * 0.45, cy, s * 0.58);
    ctx.strokeStyle = "#d2a8e0";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
    ctx.lineTo(cx + s * 0.8, cy + s * 0.6);
    ctx.moveTo(cx + s * 0.8, cy - s * 0.6);
    ctx.lineTo(cx - s * 0.8, cy + s * 0.6);
    ctx.stroke();
  } else if (icon === "skull" || icon === "prime") {
    dot(cx, cy - 2, s * 0.72, "#e3e0d5");
    pxRect(ctx, cx - s * 0.7, cy + s * 0.35, s * 1.4, s * 0.55, "#d1cec4");
    dot(cx - s * 0.28, cy - 3, 1.5, "#3b3432");
    dot(cx + s * 0.28, cy - 3, 1.5, "#3b3432");
    if (icon === "prime") {
      ctx.strokeStyle = a;
      for (const [dx, dy] of [
        [-s, -s],
        [s, -s],
        [-s, s],
        [s, s],
      ]) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.sign(dx) * s * 0.6, cy + Math.sign(dy) * s * 0.25);
        ctx.lineTo(cx + dx, cy + dy);
        ctx.stroke();
      }
    }
  } else if (icon === "bee") {
    ctx.globalAlpha = 0.75;
    dot(cx - s * 0.72, cy - s * 0.3, s * 0.45, "#dff3f6");
    dot(cx + s * 0.72, cy - s * 0.3, s * 0.45, "#dff3f6");
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.85, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#42311f";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 4 - 1, cy - s * 0.5);
      ctx.lineTo(cx + i * 4 + 1, cy + s * 0.5);
      ctx.stroke();
    }
  } else if (icon === "deer") {
    poly([
      [-s * 0.6, s * 0.45],
      [0, -s * 0.6],
      [s * 0.6, s * 0.45],
    ]);
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.25, cy - s * 0.45);
    ctx.lineTo(cx - s * 0.7, cy - s);
    ctx.moveTo(cx - s * 0.55, cy - s * 0.75);
    ctx.lineTo(cx - s * 0.9, cy - s * 0.65);
    ctx.moveTo(cx + s * 0.25, cy - s * 0.45);
    ctx.lineTo(cx + s * 0.7, cy - s);
    ctx.moveTo(cx + s * 0.55, cy - s * 0.75);
    ctx.lineTo(cx + s * 0.9, cy - s * 0.65);
    ctx.stroke();
  } else if (icon === "wall") {
    pxRect(ctx, cx - s, cy - s * 0.75, s * 2, s * 1.5, a);
    dot(cx - s * 0.45, cy - s * 0.2, s * 0.18, "#f4d7c9");
    dot(cx + s * 0.45, cy - s * 0.2, s * 0.18, "#f4d7c9");
    ctx.strokeStyle = "#3b2222";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.5, cy + s * 0.3);
    ctx.lineTo(cx + s * 0.5, cy + s * 0.3);
    ctx.stroke();
  } else if (icon === "destroyer") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = cx - s + i * ((2 * s) / 5),
        y = cy + Math.sin(i * 1.2) * s * 0.35;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < 5; i++)
      dot(
        cx - s + i * (s * 0.5),
        cy + Math.sin(i * 1.2) * s * 0.35,
        1.7,
        "#d7dce2",
      );
  } else if (icon === "twins") {
    dot(cx - s * 0.45, cy, s * 0.52);
    dot(cx + s * 0.45, cy, s * 0.52);
    dot(cx - s * 0.45, cy, s * 0.18, "#e7f4ee");
    dot(cx + s * 0.45, cy, s * 0.18, "#f2dede");
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.05, cy);
    ctx.lineTo(cx + s * 0.05, cy);
    ctx.stroke();
  } else if (icon === "plantera") {
    for (let i = 0; i < 6; i++) {
      const q = (i * Math.PI) / 3;
      dot(cx + Math.cos(q) * s * 0.58, cy + Math.sin(q) * s * 0.58, s * 0.38);
    }
    dot(cx, cy, s * 0.35, "#f1c05b");
  } else if (icon === "golem") {
    pxRect(ctx, cx - s * 0.8, cy - s * 0.65, s * 1.6, s * 1.3, a);
    pxRect(ctx, cx - s * 0.55, cy + s * 0.5, s * 1.1, s * 0.35, "#8c693d");
    dot(cx - s * 0.3, cy - s * 0.15, 1.6, "#efc45e");
    dot(cx + s * 0.3, cy - s * 0.15, 1.6, "#efc45e");
  } else if (icon === "fishron") {
    poly([
      [-s, 0],
      [-s * 0.35, -s * 0.55],
      [s * 0.45, -s * 0.35],
      [s, 0],
      [s * 0.45, s * 0.35],
      [-s * 0.35, s * 0.55],
    ]);
    poly([
      [s * 0.35, 0],
      [s * 0.95, -s * 0.55],
      [s * 0.85, s * 0.5],
    ]);
  } else if (icon === "empress") {
    poly([
      [0, 0],
      [-s, -s * 0.75],
      [-s * 0.65, s * 0.15],
      [-s * 0.2, s * 0.65],
    ]);
    poly([
      [0, 0],
      [s, -s * 0.75],
      [s * 0.65, s * 0.15],
      [s * 0.2, s * 0.65],
    ]);
    dot(cx, cy, s * 0.2, "#fff0bf");
  } else if (icon === "cultist") {
    poly([
      [0, -s],
      [-s * 0.7, s * 0.75],
      [s * 0.7, s * 0.75],
    ]);
    dot(cx, cy - s * 0.2, s * 0.28, "#222636");
  } else if (icon === "moon") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.8, -Math.PI * 0.65, Math.PI * 0.65);
    ctx.stroke();
    dot(cx + s * 0.25, cy, s * 0.18, "#e8f2ff");
  } else if (icon === "spore") {
    for (const [dx, dy, r] of [
      [-4, 2, 4],
      [2, -3, 5],
      [6, 3, 3],
    ])
      dot(cx + dx, cy + dy, r);
  } else if (icon === "mandible") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - s * 0.35, cy, s * 0.55, -1.1, 1.1);
    ctx.arc(cx + s * 0.35, cy, s * 0.55, 2.04, 4.24);
    ctx.stroke();
  } else if (icon === "fin") {
    poly([
      [-s * 0.8, s * 0.65],
      [0, -s * 0.9],
      [s * 0.8, s * 0.65],
    ]);
  } else if (icon === "doll") {
    dot(cx, cy - s * 0.5, s * 0.25);
    pxRect(ctx, cx - s * 0.35, cy - s * 0.2, s * 0.7, s * 0.85, a);
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.35, cy);
    ctx.lineTo(cx - s * 0.75, cy + s * 0.25);
    ctx.moveTo(cx + s * 0.35, cy);
    ctx.lineTo(cx + s * 0.75, cy + s * 0.25);
    ctx.stroke();
  } else if (icon === "rose") {
    for (let i = 0; i < 5; i++) {
      const q = (i * Math.PI * 2) / 5;
      dot(cx + Math.cos(q) * s * 0.38, cy + Math.sin(q) * s * 0.38, s * 0.32);
    }
    dot(cx, cy, s * 0.25, "#752b32");
  } else if (icon === "conch") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.75, 0, Math.PI * 2);
    ctx.arc(cx, cy, s * 0.42, 0.4, Math.PI * 2 + 0.4);
    ctx.stroke();
  } else if (icon.startsWith("soul_")) {
    poly([
      [0, -s],
      [-s * 0.55, -s * 0.1],
      [-s * 0.25, s * 0.8],
      [0, s * 0.35],
      [s * 0.25, s * 0.8],
      [s * 0.55, -s * 0.1],
    ]);
  } else if (icon === "crystal" || icon === "luminite") {
    poly([
      [0, -s],
      [s * 0.65, 0],
      [0, s],
      [-s * 0.65, 0],
    ]);
  } else if (icon === "key") {
    dot(cx - s * 0.35, cy, s * 0.35);
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + s * 0.85, cy);
    ctx.lineTo(cx + s * 0.85, cy + s * 0.35);
    ctx.moveTo(cx + s * 0.55, cy);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.3);
    ctx.stroke();
  } else if (icon === "picksaw") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.65, cy + s * 0.65);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.55);
    ctx.moveTo(cx - s * 0.1, cy - s * 0.6);
    ctx.lineTo(cx + s * 0.75, cy - s * 0.25);
    ctx.stroke();
  } else if (icon === "ectoplasm") {
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.15, s * 0.7, Math.PI, 0);
    ctx.lineTo(cx + s * 0.7, cy + s * 0.65);
    ctx.lineTo(cx + s * 0.25, cy + s * 0.3);
    ctx.lineTo(cx, cy + s * 0.65);
    ctx.lineTo(cx - s * 0.25, cy + s * 0.3);
    ctx.lineTo(cx - s * 0.7, cy + s * 0.65);
    ctx.closePath();
    ctx.fill();
  } else if (icon === "sigil") {
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const q = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(q) * s * 0.25, cy + Math.sin(q) * s * 0.25);
      ctx.lineTo(cx + Math.cos(q) * s * 0.75, cy + Math.sin(q) * s * 0.75);
      ctx.stroke();
    }
  } else if (icon === "portal") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx - s * 0.25, cy, s * 0.45, s * 0.75, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + s * 0.4, cy, s * 0.35, s * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    dot(cx, cy, s * 0.7);
  }
  ctx.restore();
}

function drawMuseumTrophy(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2,
    a = o.accent || "#c9a45f";
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#4d3928");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#b88a4e");
  pxRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, "#2d2521");
  drawMuseumGlyph(ctx, o.icon, cx, cy, a, 8);
}

function drawMuseumMannequin(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    a = o.accent || "#8b6a50";
  pxRect(ctx, cx - 1, b.y + 2, 2, 5, "#806044");
  ctx.fillStyle = "#d7b58b";
  ctx.beginPath();
  ctx.arc(cx, b.y + 6, 4, 0, Math.PI * 2);
  ctx.fill();
  pxRect(ctx, cx - 5, b.y + 10, 10, 12, a);
  pxRect(ctx, cx - 7, b.y + 12, 3, 11, a);
  pxRect(ctx, cx + 4, b.y + 12, 3, 11, a);
  pxRect(ctx, cx - 4, b.y + 22, 3, b.h - 25, a);
  pxRect(ctx, cx + 1, b.y + 22, 3, b.h - 25, a);
  pxRect(ctx, b.x + 3, b.y + b.h - 4, b.w - 6, 3, "#6c5136");
}

function drawMuseumWeaponRack(ctx, o) {
  const b = objectBox(o),
    a = o.accent || "#9fc8e5",
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2,
    icon = o.icon || "";
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#6a4a2d");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#2d2723");
  ctx.save();
  ctx.strokeStyle = a;
  ctx.fillStyle = a;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (icon.includes("gun") || icon === "megashark") {
    ctx.beginPath();
    ctx.moveTo(b.x + 7, cy);
    ctx.lineTo(b.x + b.w - 7, cy);
    ctx.stroke();
    pxRect(ctx, b.x + b.w - 14, cy - 4, 8, 7, a);
    pxRect(ctx, cx - 2, cy + 2, 5, 8, "#8a6848");
  } else if (icon === "hammer") {
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y + b.h - 8);
    ctx.lineTo(b.x + b.w - 12, b.y + 12);
    ctx.stroke();
    ctx.save();
    ctx.translate(b.x + b.w - 11, b.y + 11);
    ctx.rotate(-Math.PI / 4);
    pxRect(ctx, -7, -4, 14, 8, a);
    ctx.restore();
  } else if (icon === "sunfury") {
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y + 8);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    for (let i = 0; i < 4; i++)
      drawMuseumGlyph(ctx, "crystal", cx + 8 + i * 3, cy + 8 + i * 2, a, 2);
  } else if (icon.includes("staff") || icon === "last_prism") {
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y + b.h - 8);
    ctx.lineTo(b.x + b.w - 9, b.y + 9);
    ctx.stroke();
    drawMuseumGlyph(
      ctx,
      icon === "last_prism" ? "crystal" : "spore",
      b.x + b.w - 9,
      b.y + 9,
      a,
      5,
    );
  } else {
    ctx.beginPath();
    if (icon === "nights_edge" || icon === "breaker_blade") {
      ctx.moveTo(b.x + 7, b.y + b.h - 8);
      ctx.lineTo(b.x + b.w - 8, b.y + 8);
    } else {
      ctx.moveTo(b.x + 7, b.y + 8);
      ctx.lineTo(b.x + b.w - 8, b.y + b.h - 8);
    }
    ctx.stroke();
    if (
      icon === "star_sword" ||
      icon === "terra_blade" ||
      icon === "excalibur" ||
      icon === "solar_eruption"
    )
      drawMuseumGlyph(
        ctx,
        icon === "solar_eruption" ? "soul_might" : "crystal",
        cx,
        cy,
        a,
        5,
      );
  }
  ctx.restore();
}

function drawMuseumItemFrame(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2,
    a = o.accent || "#d9d0a0";
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#795b32");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#d5b667");
  pxRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, "#25282b");
  if (o.icon === "shield") {
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 6, cy - 3);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 4, cy + 5);
    ctx.lineTo(cx - 6, cy - 3);
    ctx.closePath();
    ctx.fill();
  } else if (o.icon === "mirror") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy + 4);
    ctx.lineTo(cx + 8, cy + 8);
    ctx.stroke();
  } else if (o.icon === "cloud") {
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 1, 5, 0, Math.PI * 2);
    ctx.arc(cx, cy - 2, 6, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy + 1, 5, 0, Math.PI * 2);
    ctx.fill();
  } else drawMuseumGlyph(ctx, o.icon, cx, cy, a, 6);
}

function drawObjectSprite(ctx, o) {
  if (o.kind === "zone") return drawZone(ctx, o);
  if (o.kind === "chest") return drawChest(ctx, o);
  if (o.kind === "station") return drawStation(ctx, o);
  if (o.kind === "npc") return drawNpc(ctx, o);
  if (o.kind === "door") return drawDoor(ctx, o);
  if (o.kind === "hatch") return drawHatch(ctx, o);
  if (o.kind === "furniture") return drawFurniture(ctx, o);
  if (o.kind === "bed") return drawBed(ctx, o);
  if (o.kind === "personal_storage") return drawPersonal(ctx, o);
  if (o.kind === "pylon") return drawPylon(ctx, o);
  if (o.kind === "teleporter") return drawTeleporter(ctx, o);
  if (o.kind === "planter") return drawPlanter(ctx, o);
  if (o.kind === "light") return drawLight(ctx, o);
  if (o.kind === "museum_trophy") return drawMuseumTrophy(ctx, o);
  if (o.kind === "museum_mannequin") return drawMuseumMannequin(ctx, o);
  if (o.kind === "museum_weapon_rack") return drawMuseumWeaponRack(ctx, o);
  if (o.kind === "museum_item_frame") return drawMuseumItemFrame(ctx, o);
  if (o.kind === "display") return drawDisplay(ctx, o);
  if (o.kind === "panel") return drawPanel(ctx, o);
  if (o.kind === "honey") return drawHoney(ctx, o);
  if (o.kind === "lava") return drawLava(ctx, o);
  if (o.kind === "honey_bubble") return drawHoneyBubble(ctx, o);
  if (o.kind === "star_bottle") return drawStarBottle(ctx, o);
  if (o.kind === "statue") return drawStatue(ctx, o);
  if (o.kind === "campfire") return drawCampfire(ctx, o);
  if (o.kind === "heart_lantern") return drawHeart(ctx, o);
  return drawDisplay(ctx, o);
}

function drawObjects() {
  clearCtx(octx);
  const mode = document.getElementById("mode").value;
  if (mode === "backgrounds") return;
  drawCached(
    octx,
    caches.objects,
    mode === "structure" ? 0.18 : mode === "wiring" ? 0.72 : 1,
  );
}
