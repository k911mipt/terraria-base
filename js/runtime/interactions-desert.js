// Replace only scene-navigation handlers; pointer, wheel, history and search
// remain provided by the shared interactions.js.
document.getElementById("upper").onclick = () => focusRect(12, 1, 70, 28, 2);
document.getElementById("greenhouse").onclick = () => focusRect(16, 6, 66, 21, 2);
document.getElementById("craft").onclick = () => focusRect(12, 19, 49, 29, 2);
document.getElementById("arena").onclick = () => focusRect(25, 19, 50, 46, 2);
document.getElementById("pitsBtn").onclick = () => focusRect(46, 19, 57, 71, 2);
