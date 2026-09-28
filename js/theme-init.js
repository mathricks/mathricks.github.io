/* Applies the saved theme before first paint so pages never flash the wrong scheme.
   Runs synchronously in <head>; theme.js (deferred) wires up the toggles. */
(function () {
  try {
    var root = document.documentElement;
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark' && t !== 'bw') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    if (t === 'dark') {
      root.removeAttribute('data-theme');
      root.removeAttribute('data-bw-tone');
    } else {
      root.setAttribute('data-theme', t);
      if (t === 'bw') {
        var tone = localStorage.getItem('standardTheme');
        root.setAttribute('data-bw-tone', tone === 'light' ? 'light' : 'dark');
      }
    }
  } catch (e) { /* storage unavailable: fall back to CSS defaults */ }
})();
