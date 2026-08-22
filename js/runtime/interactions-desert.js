// Replace only scene-navigation handlers; pointer, wheel, history and search
// remain provided by the shared interactions.js.
document.getElementById("upper").onclick = () => focusRect(12, 1, 70, 27, 2);
document.getElementById("greenhouse").onclick = () => focusRect(16, 6, 66, 21, 2);
document.getElementById("craft").onclick = () => focusRect(25, 25, 56, 36, 2);
document.getElementById("arena").onclick = () => focusRect(25, 25, 56, 53, 2);
document.getElementById("pitsBtn").onclick = () => focusRect(51, 25, 64, 71, 2);
