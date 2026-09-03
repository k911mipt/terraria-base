// Detect a newer GitHub Pages deployment even when the browser reused a cached tab.
function reloadIfDeploymentChanged() {
  const probeUrl = new URL(window.location.href);
  probeUrl.searchParams.set("_cache_check", Date.now().toString());

  fetch(probeUrl, {
    method: "HEAD",
    cache: "no-store",
    credentials: "same-origin",
  })
    .then((response) => {
      if (!response.ok) return;

      const remoteModifiedHeader = response.headers.get("last-modified");
      const remoteVersion = response.headers.get("etag") || remoteModifiedHeader;
      if (!remoteVersion) return;

      const storageKey = `terraria-base:page-version:${window.location.pathname}`;
      let previousVersion = null;
      try {
        previousVersion = window.localStorage.getItem(storageKey);
        window.localStorage.setItem(storageKey, remoteVersion);
      } catch {
        // Storage can be unavailable in strict privacy modes; timestamp comparison remains.
      }

      const currentModified = Date.parse(document.lastModified);
      const remoteModified = Date.parse(remoteModifiedHeader || "");
      const staleByTimestamp =
        Number.isFinite(currentModified) &&
        Number.isFinite(remoteModified) &&
        remoteModified > currentModified + 1000;
      const staleByStoredVersion =
        previousVersion !== null && previousVersion !== remoteVersion;

      if (!staleByTimestamp && !staleByStoredVersion) return;

      const token = remoteVersion.replace(/[^a-z0-9]/gi, "").slice(-24);
      const freshUrl = new URL(window.location.href);
      if (freshUrl.searchParams.get("_v") === token) return;

      freshUrl.searchParams.delete("_cache_check");
      freshUrl.searchParams.set("_v", token || Date.now().toString());
      window.location.replace(freshUrl);
    })
    .catch(() => {
      // Offline use and transient Pages errors must not block the planner.
    });
}

reloadIfDeploymentChanged();

// Browser-tab icon. Kept local so the page does not depend on wiki.gg assets.
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/svg+xml";
favicon.href = "./favicon.svg";
favicon.sizes = "any";
document.head.append(favicon);

// Scene navigation is present in HTML so a cached JavaScript file cannot hide
// a newly deployed scene. The fallback keeps standalone/local copies resilient.
let sceneTabs = document.querySelector(".scene-tabs");
if (!sceneTabs) {
  const sceneTabsCss = document.createElement("link");
  sceneTabsCss.rel = "stylesheet";
  sceneTabsCss.href = "./scene-tabs.css";
  document.head.append(sceneTabsCss);

  sceneTabs = document.createElement("nav");
  sceneTabs.className = "scene-tabs";
  sceneTabs.setAttribute("aria-label", "Сцены проекта");
  document.querySelector(".toolbar").prepend(sceneTabs);
}

const sceneLinks = [
  ["./index.html", "Основная база"],
  ["./desert.html", "Пустынный аванпост"],
  ["./underground.html", "Мастерская Гоблина"],
  ["./jungle.html", "Джунглевый аванпост"],
];
for (const [href, label] of sceneLinks) {
  if (sceneTabs.querySelector('a[href="' + href + '"]')) continue;
  sceneTabs.insertAdjacentHTML(
    "beforeend",
    '<a class="scene-tab" href="' + href + '">' + label + '</a>',
  );
}

// Cache construction, table population and initial arena focus.
buildBaseCaches();
buildObjectCache();
populate();
document.getElementById("mode").value = "arena";
focusRect(-34, 40, 169, 71, 2, false);
