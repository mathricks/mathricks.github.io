/**
 * Cookie Consent Banner
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'cookie-consent';
    if (localStorage.getItem(STORAGE_KEY)) return; // already answered

    /* ── Inline styles (theme-aware via CSS vars with safe fallbacks) ── */
    var style = document.createElement('style');
    style.textContent = [
        '.cookie-banner{',
        'position:fixed;bottom:0;left:0;right:0;z-index:1000;',
        'display:flex;align-items:center;justify-content:center;gap:18px;',
        'padding:16px 24px;',
        'background:linear-gradient(180deg,',
        'var(--header-start,rgba(20,33,43,.94)),',
        'var(--header-end,rgba(20,33,43,.74)));',
        'backdrop-filter:saturate(140%) blur(8px);',
        '-webkit-backdrop-filter:saturate(140%) blur(8px);',
        'border-top:1px solid var(--accent,#D6C19E);',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;',
        'font-size:.88rem;color:var(--fg,#fff);',
        'transform:translateY(0);opacity:1;',
        'transition:transform .35s ease,opacity .35s ease;',
        '}',
        '.cookie-banner.cookie-hidden{',
        'transform:translateY(100%);opacity:0;pointer-events:none;',
        '}',
        '.cookie-banner__text{',
        'color:var(--muted,#9BA9B6);line-height:1.45;',
        '}',
        '.cookie-banner__actions{',
        'display:flex;gap:10px;flex-shrink:0;',
        '}',
        '.cookie-banner__btn{',
        'border:1px solid var(--line-strong,rgba(255,255,255,.28));',
        'padding:8px 16px;border-radius:999px;',
        'font-size:.82rem;letter-spacing:.06em;',
        'background:transparent;color:var(--fg,#fff);',
        'cursor:pointer;',
        'transition:filter .15s ease,border-color .15s ease;',
        '}',
        '.cookie-banner__btn:hover{',
        'filter:brightness(115%);border-color:var(--accent,#D6C19E);',
        '}',
        '.cookie-banner__btn--accept{',
        'border-color:var(--accent,#D6C19E);',
        'background:linear-gradient(90deg,',
        'var(--accent-grad-start,#E4D4B8),',
        'var(--accent-grad-end,#C4A775));',
        'color:var(--bg,#14212B);font-weight:600;',
        '}',
        '.cookie-banner__btn--accept:hover{filter:brightness(108%);}',
        '@media(max-width:600px){',
        '.cookie-banner{flex-direction:column;text-align:center;gap:12px;padding:14px 18px;}',
        '}'
    ].join('');
    document.head.appendChild(style);

    /* ── Banner markup ── */
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
        '<span class="cookie-banner__text">We use cookies for analytics to improve your experience.</span>' +
        '<div class="cookie-banner__actions">' +
        '<button class="cookie-banner__btn" data-consent="rejected">Reject</button>' +
        '<button class="cookie-banner__btn cookie-banner__btn--accept" data-consent="accepted">Accept</button>' +
        '</div>';

    function dismiss(choice) {
        localStorage.setItem(STORAGE_KEY, choice);
        banner.classList.add('cookie-hidden');
        setTimeout(function () { banner.remove(); }, 400);
    }

    banner.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-consent]');
        if (btn) dismiss(btn.getAttribute('data-consent'));
    });

    /* Inject after DOM is ready */
    if (document.body) {
        document.body.appendChild(banner);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            document.body.appendChild(banner);
        });
    }
})();
