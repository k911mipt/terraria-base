// Text-only formatting shared by the inspector, audit and tables.
function biName(s) {
  return `${s.itemRu} (${s.itemEn})`;
}

function paintName(s) {
  return s.paintEn === "None" ? s.paintRu : `${s.paintRu} (${s.paintEn})`;
}

function escHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}
