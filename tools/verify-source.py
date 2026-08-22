#!/usr/bin/env python3
"""Verify the data and geometry invariants that a source-only refactor must preserve."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]


def load_json_const(path: Path, name: str) -> Any:
    source = path.read_text(encoding="utf-8")
    match = re.fullmatch(
        rf"\s*(?:/\*\*.*?\*/\s*)?const\s+{re.escape(name)}\s*=\s*(.*?)\s*;\s*",
        source,
        flags=re.DOTALL,
    )
    if not match:
        raise AssertionError(f"{path}: could not parse const {name}")
    return json.loads(match.group(1))


def canonical_hash(value: Any) -> str:
    canonical = json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def covers(spec: dict[str, Any], x: int, y: int) -> bool:
    return (
        spec["x1"] <= x <= spec["x2"]
        and spec["y1"] <= y <= spec["y2"]
    )


def require_cover(
    solids: list[dict[str, Any]],
    x: int,
    y: int,
    material: str,
) -> None:
    assert any(
        solid.get("mat") == material and covers(solid, x, y)
        for solid in solids
    ), f"Expected {material} at X{x} Y{y}"


def main() -> None:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    styles = (ROOT / "styles.css").read_text(encoding="utf-8")
    app = (ROOT / "js" / "app.js").read_text(encoding="utf-8")
    materials = (ROOT / "js" / "data" / "materials.js").read_text(
        encoding="utf-8",
    )
    base = load_json_const(ROOT / "js" / "data" / "base.js", "D")
    engineering = load_json_const(
        ROOT / "js" / "data" / "engineering.js",
        "ENG",
    )
    manifest = json.loads(
        (ROOT / "tools" / "refactor-manifest.json").read_text(
            encoding="utf-8",
        )
    )

    # Source layout and execution order.
    assert "<style>" not in index
    assert re.search(r"<script(?![^>]*\bsrc=)[^>]*>", index) is None
    expected_sources = (
        "./js/data/base.js",
        "./js/data/engineering.js",
        "./js/data/materials.js",
        "./js/app.js",
    )
    source_positions = [index.index(source) for source in expected_sources]
    assert source_positions == sorted(source_positions)
    assert 'href="./styles.css"' in index
    assert len(styles) > 1_000
    assert "const D" not in app
    assert "const ENG" not in app

    required_material_declarations = (
        "MAT",
        "WALL",
        "STYLE",
        "BLOCK_SPECS",
        "WALL_SPECS",
        "ENGINEERING_FOREGROUND_SPECS",
    )
    for name in required_material_declarations:
        assert re.search(rf"\bconst\s+{name}\s*=", materials), (
            f"Missing material declaration {name}"
        )

    # The duplicate STYLE key is a known pre-existing behavior. Do not silently
    # fix it in a source-only refactor.
    assert len(re.findall(r"(?m)^\s*ice_torch\s*:", materials)) == 2

    # Exact data equality with the objects extracted from the original file.
    assert canonical_hash(base) == manifest["baseDataSha256"]
    assert canonical_hash(engineering) == manifest["engineeringDataSha256"]
    assert len(base["rooms"]) == manifest["rooms"]
    assert len(base["solids"]) == manifest["solids"]
    assert len(base["backgrounds"]) == manifest["backgrounds"]
    assert len(base["objects"]) == manifest["objects"]
    assert len(engineering["circuits"]) == manifest["circuits"]
    assert len(engineering["devices"]) == manifest["devices"]

    # Existing embedded audit baseline.
    validation = base["validation"]
    audit = validation["materialAudit"]
    assert validation["status"] == "PASS"
    assert audit["status"] == "PASS"
    assert audit["tilesExplicit"] == 27_600
    assert audit["tilesTotal"] == 27_600
    assert audit["unknownBlockMaterials"] == 0
    assert audit["unknownWallMaterials"] == 0
    assert audit["effectiveSolidConflicts"] == 0
    assert audit["effectiveWallConflicts"] == 0
    assert validation["craftWidth"] == 46
    assert validation["workingStorageChests"] == 86
    assert validation["allChestsDetailed"] == 93
    assert validation["storageMatrix"] == "86/86"
    assert validation["chestCustomNames"] == "93/93"
    assert validation["storageCustomNames"] == "86/86"

    # IDs and storage descriptions.
    objects = base["objects"]
    object_ids = [item["id"] for item in objects]
    assert len(object_ids) == len(set(object_ids)), "Duplicate object IDs"
    chests = [item for item in objects if item.get("kind") == "chest"]
    storage_chests = [item for item in chests if item.get("storageSide")]
    assert len(chests) == 93
    assert len(storage_chests) == 86
    assert all(item.get("customName") for item in chests)
    assert all(item.get("look") for item in chests)
    assert all(item.get("loot") for item in chests)
    assert all(item.get("avoid") for item in chests)

    # The ten lowered hatches.
    expected_hatches = {
        "H_GREEN": (67, 7, 2, 1),
        "H_TOP_L": (3, 42, 2, 1),
        "H_TOP_C": (67, 42, 2, 1),
        "H_TOP_R": (131, 42, 2, 1),
        "H_MUS_L": (3, 55, 2, 1),
        "H_MUS_C": (67, 55, 2, 1),
        "H_MUS_R": (131, 55, 2, 1),
        "H_P1": (38, 28, 2, 1),
        "H_P2": (95, 28, 2, 1),
        "H_MUSH": (120, 28, 2, 1),
    }
    hatches = {
        item["id"]: (item["x"], item["y"], item["w"], item["h"])
        for item in objects
        if item.get("kind") == "hatch"
    }
    assert hatches == expected_hatches

    # Critical Y54 floor and old hatch openings.
    solids = base["solids"]
    for x in (1, 2, 133, 134):
        require_cover(solids, x, 54, "gray_brick")
    for x in (3, 4, 67, 68, 131, 132):
        require_cover(solids, x, 54, "boreal_platform")

    expected_solid_trap_columns = {
        (-18, "dart_trap_e"),
        (-1, "dart_trap_w"),
        (136, "dart_trap_e"),
        (153, "dart_trap_w"),
    }
    actual_solid_trap_columns = {
        (solid["x1"], solid["mat"])
        for solid in solids
        if (
            solid.get("mat", "").startswith("dart_trap_")
            and solid["x1"] == solid["x2"]
            and solid["y1"] == 56
            and solid["y2"] == 63
        )
    }
    assert actual_solid_trap_columns == expected_solid_trap_columns

    # Engineering trap columns: 4 × 8, exact coordinates and directions.
    devices = engineering["devices"]
    device_ids = [device["id"] for device in devices]
    assert len(device_ids) == len(set(device_ids)), "Duplicate device IDs"
    traps = [device for device in devices if device.get("kind") == "trap"]
    assert len(traps) == 32

    expected_columns = {
        -18: "E",
        -1: "W",
        136: "E",
        153: "W",
    }
    for x, facing in expected_columns.items():
        column = sorted(
            (
                trap
                for trap in traps
                if trap["x"] == x and trap["facing"] == facing
            ),
            key=lambda trap: trap["y"],
        )
        assert [trap["y"] for trap in column] == list(range(56, 64))
        assert all(trap["w"] == 1 and trap["h"] == 1 for trap in column)
        assert all(trap["inactive"] is False for trap in column)
        assert all(trap["actuatorInstalled"] is False for trap in column)

    expected_devices = {
        "L_PIT_BRIDGE": (-17, 54, 16, 1, "bridge"),
        "R_PIT_BRIDGE": (137, 54, 16, 1, "bridge"),
        "L_PIT_LEVER": (1, 56, 2, 2, "lever"),
        "R_PIT_LEVER": (133, 56, 2, 2, "lever"),
        "L_PIT_TIMER": (1, 55, 1, 1, "timer"),
        "R_PIT_TIMER": (134, 55, 1, 1, "timer"),
    }
    by_id = {device["id"]: device for device in devices}
    for device_id, expected in expected_devices.items():
        device = by_id[device_id]
        actual = (
            device["x"],
            device["y"],
            device["w"],
            device["h"],
            device["kind"],
        )
        assert actual == expected

    # Wires remain orthogonal.
    assert len(engineering["circuits"]) == 8
    for circuit in engineering["circuits"]:
        for path in circuit["paths"]:
            for start, end in zip(path, path[1:]):
                assert start[0] == end[0] or start[1] == end[1], (
                    f"Diagonal wire in {circuit['id']}: {start} -> {end}"
                )

    print(
        "PASS:",
        f"{len(base['rooms'])} rooms,",
        f"{len(solids)} solid specs,",
        f"{len(objects)} objects,",
        "93 chests, 32 traps, 10 hatches, 8 circuits.",
    )


if __name__ == "__main__":
    main()
