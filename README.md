# Terraria Base Planner

Интерактивные схемы базы и биомных аванпостов для совместного прохождения Terraria **1.4.5.6**.
Статический сайт на GitHub Pages: HTML, обычный JavaScript и Canvas с процедурными текстурами.
Сборщик, framework и runtime-зависимости не нужны.

## Открыть схемы

| Сцена | GitHub Pages | Локальный путь |
| --- | --- | --- |
| Основная база и арены | [Открыть](https://k911mipt.github.io/terraria-base/) | `/index.html` |
| Пустынный аванпост | [Открыть](https://k911mipt.github.io/terraria-base/desert.html) | `/desert.html` |
| Снежная мастерская Гоблина | [Открыть](https://k911mipt.github.io/terraria-base/underground.html) | `/underground.html` |
| Джунглевый аванпост | [Открыть](https://k911mipt.github.io/terraria-base/jungle.html) | `/jungle.html` |

На каждой странице есть четыре статические вкладки. Карта поддерживает выбор тайла,
перетаскивание, колесо и двухпальцевый zoom; на узком экране панель сворачивается.

## Локальный запуск

Из корня репозитория:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Откройте `http://127.0.0.1:8000/` и переключайтесь вкладками либо добавьте один из
путей таблицы. Используйте HTTP, а не открытие HTML через `file://`.

## Проверки

Для проверок данных нужен современный Node.js (проверено на Node 22).
Все текущие проверки данных, координат и регрессий:

```bash
node tools/check-data.cjs
node tools/check-desert.cjs
node tools/check-eternia.cjs
node tools/check-underground.cjs
node tools/check-lighting.cjs
node tools/check-jungle.cjs
node tools/check-jungle-rendering.cjs
node tools/check-wall-specs.cjs
node tools/check-rooms.cjs
node tools/check-materials.cjs
node tools/check-renderers.cjs
node tools/check-objects.cjs
node tools/check-engineering-metadata.cjs
node tools/check-building.cjs
node tools/check-placement-fixes.cjs
node tools/check-geometry.cjs
node tools/check-audit.cjs
node tools/audit-building.cjs
node tools/audit-scene.cjs
```

Проверка настоящего HTTP-запуска и взаимодействий всех четырёх сцен:

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tools/check-browser.py
```

Playwright нужен только разработчикам; сайт его не загружает. На Linux для установки
системных библиотек может потребоваться `python -m playwright install --with-deps chromium`.
[Описание 96 сценариев, условий снимков, артефактов и ограничений](docs/browser-tests.md).

[Контракт используемых материалов](docs/material-contract.md) и
[явная регистрация рендереров](docs/object-renderers.md) и
[метаданные объектов](docs/object-contract.md) проверяются до рендера и в CLI.

Эти проверки — не доказательство всех строительных правил Terraria. Полный контракт
материалов, общие строительные инварианты и вычисляемый аудит ещё внедряются по
[плану #24](https://github.com/k911mipt/terraria-base/issues/24).
Единая команда и обязательный merge-gate выделены в
[#35](https://github.com/k911mipt/terraria-base/issues/35); до их замены сохранены
рабочие validation-workflow и публикация Pages.

[Вычисляемый аудит](docs/computed-audit.md) одинаков в CLI и интерфейсе.
WARN означает неполные предметные данные, а не полный PASS; цели проекта показаны отдельно.

## Структура и проектные документы

Четыре HTML — самостоятельные точки входа с явным порядком `<script>`.
`styles.css` и `scene-tabs.css` общие. Основная модель живёт в тематических файлах
`js/data/`, остальные — в `js/data/desert/`, `js/data/underground/`, `js/data/jungle/`.
Рендерер, модель тайла, инспектор, камера, контролы и сценические расширения —
в `js/runtime/`. Подробности и границы текущей архитектуры: [карта кода](docs/code-map.md).

Строительные решения: [постоянные правила](docs/building-rules.md),
[босс/Этерия-арена](docs/eternia-arena.md), [пустыня](docs/desert-outpost.md),
[мастерская Гоблина](docs/underground-workshop.md), [джунгли](docs/jungle-outpost.md).
[Инвентаризация старых веток](docs/branch-inventory-2026-09-06.md) сохраняет их SHA
и содержимое уникальных заглушек до удаления.

## Правила изменений

Берите актуальный `main`, работайте в отдельной ветке и делайте обозримые PR.
Один логически законченный набор изменений — один коммит; исправления поведения
и чистый рефакторинг не смешиваются в большой переписанный файл.

Чистый рефакторинг **не меняет геометрию, материалы, цвета, координаты, содержательные
описания и порядок наложения**. Массивы собираются в явном порядке; их нельзя
автоматически сортировать. Сравнивайте данные и снимки всех четырёх сцен в одинаковой
среде, сохраняйте мобильные жесты, инспектор и инженерные режимы основной базы.
Перед строительными изменениями сверяйтесь с постоянными правилами.

Перед merge дождитесь CI и review актуального head, обработайте замечания.
После merge проверьте обсуждение PR и публикацию Pages. Старые ветки удаляйте только
после инвентаризации уникальных изменений и открытых PR; история остаётся в Git.
Не добавляйте сборщик или зависимости без необходимости и не плодите копии
`final`, `fixed`, `latest`, `v2`. Карта кода обновляется вместе с архитектурой.
