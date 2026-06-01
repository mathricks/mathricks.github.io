(function () {
  const THEME_KEY = 'theme';
  const STANDARD_THEME_KEY = 'standardTheme';
  const BW_STYLE_ID = 'mathricks-bw-theme-style';

  const BW_CSS = `
.bw-toggle {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  padding: 0;
  border-radius: 50%;
  overflow: hidden;
  font-size: 0 !important;
  line-height: 1;
}

.bw-toggle::before {
  content: "";
  width: 22px;
  height: 22px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 25%, #000 0 3px, transparent 3.5px),
    radial-gradient(circle at 50% 75%, #fff 0 3px, transparent 3.5px),
    radial-gradient(circle at 50% 25%, #fff 0 6.5px, transparent 7px),
    radial-gradient(circle at 50% 75%, #000 0 6.5px, transparent 7px),
    linear-gradient(90deg, #fff 0 50%, #000 50% 100%);
  box-shadow: 0 0 0 1px rgba(128, 128, 128, .28);
}

html[data-theme="bw"] {
  color-scheme: dark;
  --bg: #000;
  --fg: #fff;
  --muted: #a7a7a7;
  --line: rgba(255, 255, 255, .12);
  --line-strong: rgba(255, 255, 255, .34);
  --accent: #fff;
  --accent-2: #cfcfcf;
  --accent-3: #8f8f8f;
  --accent-grad-start: #fff;
  --accent-grad-end: #777;
  --ice: #dcdcdc;
  --cyan: #fff;
  --magenta: #bcbcbc;
  --lime: #f2f2f2;
  --tint: rgba(255, 255, 255, .035);
  --header-start: rgba(0, 0, 0, .96);
  --header-end: rgba(0, 0, 0, .78);
  --band-radial: radial-gradient(80% 100% at 50% 0%, rgba(255, 255, 255, .04), rgba(255, 255, 255, 0));
  --card-bg: rgba(4, 4, 4, .86);
  --bw-surface: rgba(4, 4, 4, .88);
  --bw-card-solid: #030303;
  --bw-card-start: #050505;
  --bw-card-end: #000;
  --bw-card-glow-main: rgba(255, 255, 255, .05);
  --bw-card-glow-alt: rgba(255, 255, 255, .03);
  --bw-card-muted: #aaa;
  --bw-frame-shadow: rgba(255, 255, 255, .38);
  --app-qr-border: var(--line-strong);
  --app-qr-border-hover: var(--fg);
  --app-qr-card-bg: rgba(4, 4, 4, .88);
  --app-qr-card-shadow: none;
  --app-qr-label-color: var(--muted);
  --app-qr-card-filter: none;
}

html[data-theme="bw"][data-bw-tone="light"] {
  color-scheme: light;
  --bg: #fff;
  --fg: #000;
  --muted: #565656;
  --line: rgba(0, 0, 0, .12);
  --line-strong: rgba(0, 0, 0, .34);
  --accent: #000;
  --accent-2: #303030;
  --accent-3: #707070;
  --accent-grad-start: #000;
  --accent-grad-end: #777;
  --ice: #202020;
  --cyan: #000;
  --magenta: #444;
  --lime: #111;
  --tint: rgba(0, 0, 0, .035);
  --header-start: rgba(255, 255, 255, .96);
  --header-end: rgba(255, 255, 255, .78);
  --band-radial: radial-gradient(80% 100% at 50% 0%, rgba(0, 0, 0, .04), rgba(0, 0, 0, 0));
  --card-bg: rgba(255, 255, 255, .86);
  --bw-surface: rgba(255, 255, 255, .92);
  --bw-card-solid: #fbfbfb;
  --bw-card-start: #fff;
  --bw-card-end: #f4f4f4;
  --bw-card-glow-main: rgba(0, 0, 0, .04);
  --bw-card-glow-alt: rgba(0, 0, 0, .025);
  --bw-card-muted: #555;
  --bw-frame-shadow: rgba(0, 0, 0, .24);
  --app-qr-card-bg: rgba(255, 255, 255, .92);
}

html[data-theme="bw"],
html[data-theme="bw"] body {
  background: var(--bg) !important;
  color: var(--fg);
}

html[data-theme="bw"] body {
  background-image: none !important;
}

html[data-theme="bw"] header,
html[data-theme="bw"] .slider-dots {
  background: linear-gradient(180deg, var(--header-start), var(--header-end)) !important;
  border-color: var(--line) !important;
}

html[data-theme="bw"] .toggle,
html[data-theme="bw"] .theme-toggle {
  background: var(--bg);
  color: var(--fg);
  border-color: var(--line-strong);
}

html[data-theme="bw"] .bw-toggle,
html[data-theme="bw"] .bw-toggle.is-active {
  background: var(--fg);
  color: var(--bg);
  border-color: var(--fg);
}

html[data-theme="bw"] .btn:hover,
html[data-theme="bw"] .toggle:hover,
html[data-theme="bw"] .theme-toggle:hover {
  border-color: var(--fg);
  filter: none;
}

html[data-theme="bw"] .cta:hover,
html[data-theme="bw"] button[type="submit"]:hover {
  background: var(--fg) !important;
  color: var(--bg) !important;
  filter: none;
}

html[data-theme="bw"] .hero,
html[data-theme="bw"] .section,
html[data-theme="bw"] .band,
html[data-theme="bw"] footer {
  background-image: none !important;
  border-color: var(--line) !important;
}

html[data-theme="bw"] .corner,
html[data-theme="bw"] .corner-r {
  filter: drop-shadow(0 0 5px var(--bw-frame-shadow)) !important;
}

html[data-theme="bw"] .corner::before,
html[data-theme="bw"] .corner::after,
html[data-theme="bw"] .corner-r::before,
html[data-theme="bw"] .corner-r::after {
  background: var(--line-strong) !important;
}

html[data-theme="bw"] .card,
html[data-theme="bw"] .step,
html[data-theme="bw"] .hero-card,
html[data-theme="bw"] .score-card,
html[data-theme="bw"] .support-form input,
html[data-theme="bw"] .support-form textarea,
html[data-theme="bw"] input,
html[data-theme="bw"] textarea {
  background: var(--bw-surface) !important;
  border-color: var(--line) !important;
  box-shadow: none !important;
}

html[data-theme="bw"] .card.app-card,
html[data-theme="bw"] .card.game-card,
html[data-theme="bw"] .card.support-card,
html[data-theme="bw"] .card.resource-card {
  --app-card-bg-start: var(--bw-card-start);
  --app-card-bg-end: var(--bw-card-end);
  --app-card-glow-main: var(--bw-card-glow-main);
  --app-card-glow-alt: var(--bw-card-glow-alt);
  --app-card-line: var(--line);
  --app-card-line-strong: var(--line-strong);
  --app-card-text: var(--fg);
  --app-card-muted: var(--bw-card-muted);
  --app-card-link: var(--fg);
  --game-card-bg-start: var(--bw-card-start);
  --game-card-bg-end: var(--bw-card-end);
  --game-card-glow-main: var(--bw-card-glow-main);
  --game-card-glow-alt: var(--bw-card-glow-alt);
  --game-card-line-strong: var(--line-strong);
  --game-card-title: var(--fg);
  --game-card-muted: var(--bw-card-muted);
  --game-card-hover: var(--fg);
  --support-card-bg-start: var(--bw-card-start);
  --support-card-bg-end: var(--bw-card-end);
  --support-card-glow-main: var(--bw-card-glow-main);
  --support-card-glow-alt: var(--bw-card-glow-alt);
  --support-card-line-strong: var(--line-strong);
  --support-card-title: var(--fg);
  --support-card-muted: var(--bw-card-muted);
  --support-card-hover: var(--fg);
  --res-card-bg-start: var(--bw-card-start);
  --res-card-bg-end: var(--bw-card-end);
  --res-card-line-strong: var(--line-strong);
  --res-card-title: var(--fg);
  --res-card-muted: var(--bw-card-muted);
  --res-card-hover: var(--fg);
}

html[data-theme="bw"] .card.app-card,
html[data-theme="bw"] .card.game-card,
html[data-theme="bw"] .card.support-card,
html[data-theme="bw"] .card.resource-card {
  background: var(--bw-card-solid) !important;
  border-color: var(--line-strong) !important;
}

html[data-theme="bw"] .read-more,
html[data-theme="bw"] a:hover {
  color: var(--fg);
}

html[data-theme="bw"] .geo-cluster,
html[data-theme="bw"] .geo-panel,
html[data-theme="bw"] .hero-card .glow,
html[data-theme="bw"] .bg-grad,
html[data-theme="bw"] .particles {
  display: none !important;
}

html[data-theme="bw"] img,
html[data-theme="bw"] video {
  filter: grayscale(1) contrast(1.08);
}

html[data-theme="bw"] .qr-wrap img,
html[data-theme="bw"] .qr-card img,
html[data-theme="bw"] canvas {
  filter: none;
}
`;

  function ensureBwStyles() {
    if (document.getElementById(BW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = BW_STYLE_ID;
    style.textContent = BW_CSS;
    document.head.appendChild(style);
  }

  function normalizeTheme(theme) {
    return theme === 'light' || theme === 'dark' || theme === 'bw' ? theme : null;
  }

  function prefersLight() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  }

  function getStandardTheme() {
    const storedStandard = normalizeTheme(localStorage.getItem(STANDARD_THEME_KEY));
    if (storedStandard && storedStandard !== 'bw') return storedStandard;

    const storedTheme = normalizeTheme(localStorage.getItem(THEME_KEY));
    if (storedTheme && storedTheme !== 'bw') return storedTheme;

    return prefersLight() ? 'light' : 'dark';
  }

  function getCurrentTheme(root) {
    return root.getAttribute('data-theme') === 'bw'
      ? 'bw'
      : root.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark';
  }

  function ensureBwToggle(toggle) {
    let bwToggle = document.getElementById('bwThemeToggle');
    if (!bwToggle && toggle) {
      bwToggle = document.createElement('button');
      bwToggle.id = 'bwThemeToggle';
      bwToggle.type = 'button';
      bwToggle.className = `${toggle.className || 'toggle'} bw-toggle`.trim();
      bwToggle.setAttribute('aria-label', 'Toggle black and white theme');
      bwToggle.setAttribute('aria-pressed', 'false');
      bwToggle.title = 'Black and white theme';
      bwToggle.textContent = '';
      toggle.insertAdjacentElement('afterend', bwToggle);
    }
    return bwToggle;
  }

  function initTheme() {
    const root = document.documentElement;
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    ensureBwStyles();
    toggle.type = 'button';

    const bwToggle = ensureBwToggle(toggle);

    function getBwTone(root) {
      return root.getAttribute('data-bw-tone') === 'light' ? 'light' : 'dark';
    }

    function applyTheme(theme, options = {}) {
      const normalized = normalizeTheme(theme) || getStandardTheme();
      const requestedStandardTheme = normalizeTheme(options.standardTheme);
      const standardTheme = normalized === 'bw'
        ? requestedStandardTheme && requestedStandardTheme !== 'bw'
          ? requestedStandardTheme
          : getStandardTheme()
        : normalized;

      if (normalized === 'dark') {
        root.removeAttribute('data-theme');
        root.removeAttribute('data-bw-tone');
      } else if (normalized === 'bw') {
        root.setAttribute('data-theme', 'bw');
        root.setAttribute('data-bw-tone', standardTheme);
      } else {
        root.setAttribute('data-theme', normalized);
        root.removeAttribute('data-bw-tone');
      }

      toggle.textContent = standardTheme === 'light' ? '🌙' : '☀️';
      toggle.setAttribute('aria-label', normalized === 'bw'
        ? standardTheme === 'light'
          ? 'Switch black and white theme to dark mode'
          : 'Switch black and white theme to light mode'
        : standardTheme === 'light'
          ? 'Switch to dark theme'
          : 'Switch to light theme');

      if (bwToggle) {
        bwToggle.classList.toggle('is-active', normalized === 'bw');
        bwToggle.setAttribute('aria-pressed', normalized === 'bw' ? 'true' : 'false');
        bwToggle.setAttribute('aria-label', normalized === 'bw' ? 'Turn off black and white theme' : 'Turn on black and white theme');
        bwToggle.title = normalized === 'bw' ? 'Turn off black and white theme' : 'Black and white theme';
      }

      localStorage.setItem(THEME_KEY, normalized);
      if (normalized !== 'bw') {
        localStorage.setItem(STANDARD_THEME_KEY, normalized);
      }
      if (normalized === 'bw') {
        localStorage.setItem(STANDARD_THEME_KEY, standardTheme);
      }

      document.dispatchEvent(new CustomEvent('mathricks:themechange', {
        detail: { theme: normalized, standardTheme, bwTone: normalized === 'bw' ? standardTheme : null }
      }));
    }

    const savedTheme = normalizeTheme(localStorage.getItem(THEME_KEY));
    applyTheme(savedTheme || getStandardTheme());

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const current = getCurrentTheme(root);
      const baseTheme = current === 'bw' ? getBwTone(root) : current;
      const nextTheme = baseTheme === 'light' ? 'dark' : 'light';
      applyTheme(current === 'bw' ? 'bw' : nextTheme, current === 'bw' ? { standardTheme: nextTheme } : {});
    }, true);

    if (bwToggle) {
      bwToggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const current = getCurrentTheme(root);
        applyTheme(current === 'bw' ? getBwTone(root) : 'bw', current === 'bw' ? {} : { standardTheme: current });
      }, true);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme, { once: true });
  } else {
    initTheme();
  }
})();
