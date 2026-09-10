
// Text-only formatting shared by the inspector, audit and tables.
export function biName(s) {
  return `${s.itemRu} (${s.itemEn})`;
}

export function paintName(s) {
  return s.paintEn === "None" ? s.paintRu : `${s.paintRu} (${s.paintEn})`;
}

export function escHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}
