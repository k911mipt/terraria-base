// Cache construction, table population and initial arena focus.
buildBaseCaches();

buildObjectCache();

populate();

document.getElementById("mode").value = "arena";

focusRect(-34, 40, 169, 71, 2, false);
