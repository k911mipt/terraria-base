// Cache construction, tables and initial full-scene focus.
buildBaseCaches();
buildObjectCache();
populate();
document.getElementById("mode").value = "visual";
fit(false);
