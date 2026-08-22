// Replace only scene-navigation handlers; pointer, wheel, history and search
// remain provided by the shared interactions.js.
document.getElementById("upper").onclick = () => focusRect(12, 1, 83, 22, 2);
document.getElementById("greenhouse").onclick = () => focusRect(16, 6, 79, 21, 2);
document.getElementById("craft").onclick = () => focusRect(18, 27, 78, 36, 2);
document.getElementById("arena").onclick = () => focusRect(18, 27, 78, 53, 2);
document.getElementById("pitsBtn").onclick = () => focusRect(73, 26, 95, 38, 2);
