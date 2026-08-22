#!/usr/bin/env python3
"""One-time, behavior-preserving split of the original monolithic index.html."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"


def fail(message: str) -> "NoReturn":
    raise RuntimeError(message)


def load_json_without_duplicate_keys(source: str, label: str) -> Any:
    def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                fail(f"{label}: duplicate key {key!r}")
            result[key] = value
        return result

    return json.loads(source, object_pairs_hook=reject_duplicates)


def parse_json_const(statement: str, name: str) -> Any:
    match = re.fullmatch(
        rf"\s*const\s+{re.escape(name)}\s*=\s*(.*?)\s*;\s*",
        statement,
        flags=re.DOTALL,
    )
    if not match:
        fail(f"Could not parse const {name}")
    return load_json_without_duplicate_keys(match.group(1), name)


def format_json_const(name: str, value: Any, description: str) -> str:
    payload = json.dumps(value, ensure_ascii=False, indent=2)
    return (
        f"/**\n"
        f" * {description}\n"
        f" *\n"
        f" * Generated from the original inline data without changing key or array order.\n"
        f" */\n"
        f"const {name} = {payload};\n"
    )


def find_const_statement(source: str, name: str) -> tuple[int, int, str] | None:
    match = re.search(
        rf"(?<![\w$])const\s+{re.escape(name)}\s*=",
        source,
    )
    if not match:
        return None

    start = match.start()
    depth = 0
    quote: str | None = None
    escaped = False
    line_comment = False
    block_comment = False
    index = match.end()

    while index < len(source):
        char = source[index]
        next_char = source[index + 1] if index + 1 < len(source) else ""

        if line_comment:
            if char == "\n":
                line_comment = False
            index += 1
            continue

        if block_comment:
            if char == "*" and next_char == "/":
                block_comment = False
                index += 2
            else:
                index += 1
            continue

        if quote is not None:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue

        if char == "/" and next_char == "/":
            line_comment = True
            index += 2
            continue

        if char == "/" and next_char == "*":
            block_comment = True
            index += 2
            continue

        if char in {'"', "'", "`"}:
            quote = char
            index += 1
            continue

        if char in "([{":
            depth += 1
        elif char in ")]}“:
            depth -= 1
            if depth < 0:
                fail(f"Unbalanced declaration while extracting const {name}")
        elif char == ";" and depth == 0:
            end = index + 1
            return start, end, source[start:end]

        index += 1

    fail(f"Unterminated declaration const {name}")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        fail(f"{label}: expected exactly one occurrence, found {count}")
    return source.replace(old, new, 1)


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")

    if 'href="./styles.css"' in html:
        fail("index.html is already split; refusing to run the migration twice")

    style_open = html.find("<style>")
    style_close = html.find("</style>", style_open)
    if style_open < 0 or style_close < 0:
        fail("Expected one inline <style> block")
    style_end = style_close + len("</style>")
    css = html[style_open + len("<style>") : style_close].strip() + "\n"

    script_open = html.find("<script>", style_end)
    script_close = html.rfind("</script>")
    if script_open < 0 or script_close < 0 or script_close <= script_open:
        fail("Expected one inline <script> block")
    script_end = script_close + len("</script>")
    javascript = html[script_open + len("<script>") : script_close].strip()

    d_start = javascript.find("const D=")
    eng_start = javascript.find("const ENG=", d_start)
    runtime_start = javascript.find("const viewport=", eng_start)
    if min(d_start, eng_start, runtime_start) < 0:
        fail("Could not find D, ENG, and runtime boundaries")
    if javascript[:d_start].strip():
        fail("Unexpected executable code before const D")

    d_statement = javascript[d_start:eng_start].strip()
    eng_statement = javascript[eng_start:runtime_start].strip()
    runtime = javascript[runtime_start:].strip()

    base_data = parse_json_const(d_statement, "D")
    engineering_data = parse_json_const(eng_statement, "ENG")

    material_names = (
        "MAT",
        "WALL",
        "STYLE",
        "BLOCK_SPECS",
        "WALL_SPECS",
        "ENGINEERING_FOREGROUND_SPECS",
        "WIRE_COLORS",
    )
    declarations: list[tuple[int, int, str, str]] = []
    for name in material_names:
        found = find_const_statement(runtime, name)
        if found is not None:
            start, end, statement = found
            declarations.append((start, end, name, statement.strip()))

    required_material_names = {
        "MAT",
        "WALL",
        "STYLE",
        "BLOCK_SPECS",
        "WALL_SPECS",
        "ENGINEERING_FOREGROUND_SPECS",
    }
    extracted_names = {name for _, _, name, _ in declarations}
    missing = required_material_names - extracted_names
    if missing:
        fail(f"Missing material declarations: {sorted(missing)}")

    declarations.sort(key=lambda item: item[0])

    runtime_without_materials = runtime
    for start, end, _, _ in reversed(declarations):
        runtime_without_materials = (
            runtime_without_materials[:start] + runtime_without_materials[end:]
        )
    runtime_without_materials = re.sub(
        r"\n[ \t]*\n(?:[ \t]*\n)+",
        "\n\n",
        runtime_without_materials,
    ).strip()

    material_source = (
        "/**\n"
        " * Rendering palettes and exact Terraria material specifications.\n"
        " *\n"
        " * Duplicate object keys are intentionally preserved during this first,\n"
        " * behavior-preserving refactor. They can be reviewed in a separate change.\n"
        " */\n\n"
        + "\n\n".join(statement for _, _, _, statement in declarations)
        + "\n"
    )

    app_source = (
        "/**\n"
        " * Terraria base planner runtime.\n"
        " *\n"
        " * The large immutable data sets and material catalogues live in js/data/.\n"
        " * This file intentionally keeps the original execution order and globals\n"
        " * so the source split cannot change rendering or interaction behavior.\n"
        " */\n\n"
        + runtime_without_materials
        + "\n"
    )

    script_tags = "\n".join(
        (
            '<script src="./js/data/base.js"></script>',
            '<script src="./js/data/engineering.js"></script>',
            '<script src="./js/data/materials.js"></script>',
            '<script src="./js/app.js"></script>',
        )
    )
    html = html[:script_open] + script_tags + html[script_end:]
    html = (
        html[:style_open]
        + '<link rel="stylesheet" href="./styles.css">'
        + html[style_end:]
    )

    (ROOT / "js" / "data").mkdir(parents=True, exist_ok=True)
    (ROOT / "tools").mkdir(parents=True, exist_ok=True)

    INDEX.write_text(html, encoding="utf-8")
    (ROOT / "styles.css").write_text(css, encoding="utf-8")
    (ROOT / "js" / "data" / "base.js").write_text(
        format_json_const(
            "D",
            base_data,
            "Canonical base geometry, rooms, objects, storage, and validation baseline.",
        ),
        encoding="utf-8",
    )
    (ROOT / "js" / "data" / "engineering.js").write_text(
        format_json_const(
            "ENG",
            engineering_data,
            "Engineering circuits, devices, trap columns, bridges, and wiring metadata.",
        ),
        encoding="utf-8",
    )
    (ROOT / "js" / "data" / "materials.js").write_text(
        material_source,
        encoding="utf-8",
    )
    (ROOT / "js" / "app.js").write_text(app_source, encoding="utf-8")

    def canonical_hash(value: Any) -> str:
        canonical = json.dumps(
            value,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()

    manifest = {
        "baseDataSha256": canonical_hash(base_data),
        "engineeringDataSha256": canonical_hash(engineering_data),
        "rooms": len(base_data.get("rooms", [])),
        "solids": len(base_data.get("solids", [])),
        "backgrounds": len(base_data.get("backgrounds", [])),
        "objects": len(base_data.get("objects", [])),
        "circuits": len(engineering_data.get("circuits", [])),
        "devices": len(engineering_data.get("devices", [])),
    }
    (ROOT / "tools" / "refactor-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    readme = """# Terraria Base Planner

Интерактивная схема базы для совместного прохождения Terraria.

## Открыть схему

https://k911mipt.github.io/terraria-base/

## Структура проекта

`index.html` — тонкая точка входа и семантическая разметка страницы.

`styles.css` — оформление интерфейса.

`js/data/base.js` — геометрия базы, комнаты, блоки, стены, объекты, сундуки и
зафиксированный результат аудита.

`js/data/engineering.js` — цепи, устройства, ловушки, мосты и проводка.

`js/data/materials.js` — палитры рендера и точные спецификации материалов
Terraria.

`js/app.js` — Canvas-рендерер, инспектор, таблицы, поиск, навигация и
обработчики ввода.

`tools/verify-source.py` — проверка ключевых инвариантов после рефакторинга.

Источником истины является совокупность файлов репозитория. `index.html`
остаётся точкой входа GitHub Pages, но больше не содержит весь проект внутри
себя.

## Локальный запуск

Из корня репозитория:

```bash
python3 -m http.server 8000
```

После этого открыть `http://localhost:8000/`.

## Проверка инвариантов

```bash
python3 tools/verify-source.py
node --check js/data/base.js
node --check js/data/engineering.js
node --check js/data/materials.js
node --check js/app.js
```

## Правила изменений

- Один логически законченный набор изменений — один коммит.
- Перед изменением нужно брать актуальное состояние рабочей ветки.
- Чистый рефакторинг не должен менять геометрию, материалы, координаты и
  порядок объектов.
- Не добавлять фреймворк, сборщик или runtime-зависимости без реальной
  необходимости.
- После изменения данных обязательно запускать `tools/verify-source.py`.
"""
    (ROOT / "README.md").write_text(readme, encoding="utf-8")

    print(
        "Split complete:",
        f"{len(base_data.get('rooms', []))} rooms,",
        f"{len(base_data.get('solids', []))} solid specifications,",
        f"{len(base_data.get('objects', []))} objects,",
        f"{len(engineering_data.get('devices', []))} engineering devices.",
    )


if __name__ == "__main__":
    main()
