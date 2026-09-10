# Профиль производительности (#37)

Измерение текущего нативного планировщика; никаких изменений production-кода,
стратегии Canvas-кешей, hit-testing, геометрии или эталона. Результаты времени
не являются CI-порогами: шумный runner не должен блокировать merge из-за скорости.
Ошибки запуска, ресурсов, выполнения жестов и неполный прогон являются ошибками.

```sh
# Из корня checkout, после установки requirements-dev.txt и Chromium:
python tools/profile-planner.py --repeats 5
python tools/check-performance.py
# После merge — повтор на GitHub Actions с текущим main:
gh workflow run profile-planner.yml --repo k911mipt/terraria-base --ref main
# Скачать конкретный завершённый запуск:
gh run download RUN_ID --repo k911mipt/terraria-base \
  --name planner-performance --dir performance-artifacts
```

## Методика

20 отдельных browser contexts: Main и Desert, desktop 1800×1200 и mobile
390×844, DPR 1, по пять повторов, чередующих сцены/viewport. Chromium headless
из закреплённого Playwright, без CPU/network throttling. Browser process и
файловый кеш ОС не перезапускаются: это новый context с холодным браузерным кешем,
**не холодный запуск ОС**. Mobile — эмуляция размеров/касания, не реальный Pixel.

Открываются настоящие HTML, CSS, import maps и ES-модули через loopback HTTP.
Ни маршрутизации ответов, ни замены исходников, ни отключения проверки версии.
Из события `planner-started` тест получает публичный API экземпляра. До загрузки
устанавливается наблюдатель первого `data-ready`: startupReadyMs отсчитывается от
начала навигации и включает загрузку/подготовку/первое рисование.

Desktop выполняет 80 настоящих mousemove; обе конфигурации — pan и zoom
(mouse/wheel либо CDP touch/pinch). Камера обязана сдвинуться/увеличиться,
захваченные указатели — освободиться. Main дополнительно выполняет девять
переключений visual/arena/wiring. Результаты содержат полное время операции
с накладными расходами драйвера/ожидания кадров, CDP TaskDuration/ScriptDuration
и время **исполнения callback rAF**, измеренное тестовой обёрткой. Это не время
GPU/compositor и не input-to-photon latency. Два служебных rAF для ожидания не
включаются в callback-выборку; отсутствие вызовов отмечается null, не нулём.

`objectAt` и `roomAt` измеряются отдельно по десять партий из 10 000 запросов,
после одной прогревочной партии каждой функции. 256 фиксированных координат
чередуют центры реальных объектов и точки по всей области. Возвращаемые ID
участвуют в checksum. Это стоимость изолированной функции в visual, не целого
hover-handler и не замер поиска инженерного overlay. Для результатов времени
публикуются исходные партии, median и nearest-rank p95; при n=5 p95 равен максимуму.

## Три разные величины памяти

1. **Расчёт RGBA:** реальные width×height×4 каждого cache/screen Canvas. Это
   арифметический бюджет RGBA8, не измерение выделенной памяти Chrome/GPU.
2. **V8 heap:** Runtime.getHeapUsage после ready, после ввода до GC и после
   принудительного GC. Изменение heap не равно сумме аллокаций и не доказывает
   утечку. Отдельные `.heapprofile` получены sampling-профилировщиком с интервалом
   4096 байт, включая уже собранные объекты. Профилируется отдельный прогон
   lookups (по 20 000 запросов на функцию, включая прогрев), не смешанный с timing.
   Сумма sample.size — статистическая оценка выборки, не точный счётчик аллокаций;
   стек может включать измерительный код/Playwright.
3. **RSS процессов Chromium:** CDP сообщает PID, Linux `/proc/PID/status` —
   snapshot VmRSS по процессам. Сумма повторно учитывает shared pages, относится
   ко всему браузеру, не выделяет Canvas и не является пиком или PSS/USS. При
   недоступности метода/процесса записывается причина, не выдуманный ноль.

Фактическое отдельное потребление Canvas/GPU и поведение физического телефона
этим инструментом не измеряются. Из этих данных нельзя объявлять утечку памяти.

## Сохранение и интерпретация

`performance-artifacts/summary.json`: ревизия checkout, SHA-256 всех файлов
приложения, окружение, полные профили и сводки. Для каждого повтора отдельные
JSON, PNG, sampled allocation profile. Даже при сбое summary сохраняет FAIL и
уже завершённые повторы; отдельный JSON содержит исходную ошибку. Успех не
подтверждается размером снимка. Измерения не коммитятся автоматически.

Workflow `profile-planner.yml` read-only, запускается вручную или при PR,
меняющем сам profiler; он не заменяет обязательный `validate`. Шесть тестов
агрегации входят в общую `python tools/validate.py`, но timing-порогов нет.

### Источники измерительных API

- [Runtime.getHeapUsage](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage)
- [HeapProfiler.startSampling](https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/#method-startSampling)
- [Performance.getMetrics](https://chromedevtools.github.io/devtools-protocol/tot/Performance/#method-getMetrics)

Конкретные результаты и вывод об оптимизации фиксируются после настоящего
HTTP-прогона, а не выводятся из оценки размера буфера.
