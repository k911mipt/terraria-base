// Browser-tab icon. Kept local so the page does not depend on wiki.gg assets.
const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/svg+xml";
favicon.href = "./favicon.svg";
favicon.sizes = "any";
document.head.append(favicon);

// Cache construction, table population and initial arena focus.
buildBaseCaches();

buildObjectCache();

populate();

document.getElementById("mode").value = "arena";

focusRect(-34, 40, 169, 71, 2, false);
