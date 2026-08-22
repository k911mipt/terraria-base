// Browser-tab icon. Kept local so the page does not depend on wiki.gg assets.
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/svg+xml";
favicon.href = "./favicon.svg";
favicon.sizes = "any";
document.head.append(favicon);

// Scene navigation. Each scene is a separate static page sharing one Canvas engine.
const sceneTabsCss = document.createElement("link");
sceneTabsCss.rel = "stylesheet";
sceneTabsCss.href = "./scene-tabs.css";
document.head.append(sceneTabsCss);

const sceneTabs = document.createElement("nav");
sceneTabs.className = "scene-tabs";
sceneTabs.setAttribute("aria-label", "Сцены проекта");
sceneTabs.innerHTML =
  '<a class="scene-tab" href="./index.html" aria-current="page">Основная база</a>' +
  '<a class="scene-tab" href="./desert.html">Пустынный аванпост</a>';
document.querySelector(".toolbar").prepend(sceneTabs);

// Cache construction, table population and initial arena focus.
buildBaseCaches();
buildObjectCache();
populate();
document.getElementById("mode").value = "arena";
focusRect(-34, 40, 169, 71, 2, false);
