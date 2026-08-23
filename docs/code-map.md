# Карта исходного кода

Исходник разделён без фреймворка и сборщика. Порядок массивов `solids`,
`backgrounds`, `objects` и `ENG.devices` является частью модели и
фиксируется файлами-сборщиками `index.js`.

## Данные

- `js/data/layout.js` — границы мира, комнаты, резервы и главы музея.
- `js/data/solids/` — верхний комплекс, улица/Y54 и нижний музейно-ловушечный слой.
- `js/data/backgrounds/` — база, левая босс-арена, музей и технические проходы.
- `js/data/objects/` — маршруты, станции, комнаты, склад, теплица, красители, арены, отдельная разметка Этерии, музей и ямы.
- `js/data/engineering/` — цепи, органы управления и 32 отдельные Dart Trap.
- `js/data/materials.js` — палитры и точные Terraria-спецификации.
- `js/data/index.js` — только сборка объекта `D`; больших массивов в нём намеренно нет.

## Исполняемый код

### `js/runtime/core.js`

Small shared helpers.

- `cp()`
- `cy()`
- `seeded()`
- `pstyle()`
- `shade()`
- `objectBox()`
- `chestPalette()`
- `saveCam()`
- `engKey()`
- `expandOrthPath()`
- `schedule()`
- `roomAt()`

### `js/runtime/validation.js`

Runtime audits and engineering invariant checks.

- `validatePitConfiguration()`

### `js/runtime/model.js`

Tile model, lookups, caches and geometry helpers.

- `rect()`
- `tileMaterial()`
- `tileWall()`
- `applyTileShape()`
- `buildBaseCaches()`
- `pxRect()`
- `buildObjectCache()`
- `world()`
- `objectAt()`
- `rectAt()`
- `objectsAtTile()`
- `inspect()`

### `js/runtime/render-base.js`

Base-layer and structural Canvas rendering.

- `drawPlatformTile()`
- `drawGlassPlatformTile()`
- `drawBed()`
- `drawPersonal()`
- `drawPylon()`
- `drawTeleporter()`
- `drawLight()`
- `drawDisplay()`
- `drawPanel()`
- `drawZone()`
- `drawHoney()`
- `drawLava()`
- `drawHoneyBubble()`
- `drawStarBottle()`
- `drawStatue()`
- `drawCampfire()`
- `drawHeart()`
- `drawCached()`
- `drawBase()`
- `draw()`

### `js/runtime/render-objects.js`

Foreground objects, furniture and museum rendering.

- `drawChest()`
- `drawStation()`
- `drawNpc()`
- `drawDoor()`
- `drawHatch()`
- `drawFurniture()`
- `drawPlanter()`
- `drawMuseumGlyph()`
- `drawMuseumTrophy()`
- `drawMuseumMannequin()`
- `drawMuseumWeaponRack()`
- `drawMuseumItemFrame()`
- `drawObjectSprite()`
- `drawObjects()`

### `js/runtime/overlay.js`

Grid, labels, engineering devices and wiring overlay.

- `prepareEngineering()`
- `validateHeartWireTargets()`
- `engWireAt()`
- `engineeringAt()`
- `engineeringDeviceAtTile()`
- `engineeringForegroundSpec()`
- `directionLabel()`
- `wireOffset()`
- `drawWirePath()`
- `drawEngDevice()`
- `drawEngLabels()`
- `drawEngineeringLayer()`
- `drawOverlay()`

### `js/runtime/inspector.js`

Tile inspector and tooltip presentation.

- `showTip()`
- `hideTip()`

### `js/runtime/tables.js`

Status badges and specification tables.

- `biName()`
- `paintName()`
- `escHtml()`
- `populate()`

### `js/runtime/camera.js`

Camera transforms, viewport fitting and render scheduling.

- `resize()`
- `viewRect()`
- `clearCtx()`
- `sx()`
- `sy()`
- `textLabel()`
- `focusRect()`
- `fit()`

### Упорядоченный запуск

- `js/runtime/state.js` — DOM/Canvas-ссылки, камера, кэши и UI-константы.
- `js/runtime/prepare.js` — подготовка инженерных индексов и проверки.
- `js/runtime/interactions.js` — все обработчики мыши, колеса, кнопок и поиска.
- `js/runtime/start.js` — построение кэшей, таблиц и начальный фокус.

Эти четыре файла загружаются именно в таком порядке. Внутри каждого сохранён
исходный порядок исполняемых выражений.

## Проверка

```bash
node tools/check-data.cjs
node tools/check-eternia.cjs
python3 -m http.server 8000
```

После запуска сервера схема открывается на `http://localhost:8000/`.
