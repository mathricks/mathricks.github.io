/* Shared page behaviour: scroll reveal for elements marked .reveal. */
(function () {
  var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!els.length) return;
  function show(el) { el.classList.add('in'); }
  function vh() { return window.innerHeight || document.documentElement.clientHeight; }
  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top < vh() * 0.92 && r.bottom > 0;
  }
  // Anything already in view is shown at once; the rest reveal on scroll.
  function sweep() {
    els = els.filter(function (el) {
      if (inView(el)) { show(el); return false; }
      return true;
    });
    if (!els.length) {
      window.removeEventListener('scroll', sweep);
      window.removeEventListener('resize', sweep);
    }
  }
  sweep();
  if (!els.length) return;
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep);
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { obs.observe(el); });
  }
})();
