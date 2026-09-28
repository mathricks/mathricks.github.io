/**
 * Cookie Consent Banner
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'cookie-consent';
    var existingChoice = localStorage.getItem(STORAGE_KEY);

    function clearAnalyticsCookies() {
        var rootDomain = window.location.hostname.replace(/^www\./, '');
        document.cookie.split(';').forEach(function (entry) {
            var name = entry.split('=')[0].trim();
            if (name === '_ga' || name.indexOf('_ga_') === 0) {
                document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
                document.cookie = name + '=; Max-Age=0; path=/; domain=.' + rootDomain + '; SameSite=Lax';
            }
        });
    }

    window.MathricksConsent = {
        choice: function () {
            return localStorage.getItem(STORAGE_KEY);
        },
        reset: function () {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        },
        reject: function () {
            localStorage.setItem(STORAGE_KEY, 'rejected');
            clearAnalyticsCookies();
            window.location.reload();
        }
    };

    if (existingChoice) return;

    /* ── Inline styles: a small corner card with the studio's bracket pair ── */
    var style = document.createElement('style');
    style.textContent = [
        '.cookie-banner{',
        'position:fixed;bottom:20px;right:20px;z-index:1000;',
        'max-width:340px;padding:18px 20px 16px;',
        'display:flex;flex-direction:column;gap:12px;',
        'background:linear-gradient(180deg,',
        'var(--header-start,rgba(20,33,43,.96)),',
        'var(--header-end,rgba(20,33,43,.88)));',
        'backdrop-filter:saturate(140%) blur(10px);',
        '-webkit-backdrop-filter:saturate(140%) blur(10px);',
        'border:1px solid var(--line,rgba(255,255,255,.12));',
        'border-radius:14px;',
        'box-shadow:0 18px 40px rgba(0,0,0,.28);',
        'font-family:var(--font-body,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif);',
        'font-size:.82rem;color:var(--fg,#fff);',
        'transform:translateY(0);opacity:1;',
        'transition:transform .35s ease,opacity .35s ease;',
        '}',
        /* bracket pair: top-left and bottom-right, legs crossing at the junction */
        '.cookie-banner::before,.cookie-banner::after{',
        'content:"";position:absolute;width:22px;height:22px;pointer-events:none;',
        'background-repeat:no-repeat;',
        'background-image:linear-gradient(var(--accent,#D6C19E),var(--accent,#D6C19E)),',
        'linear-gradient(var(--accent,#D6C19E),var(--accent,#D6C19E));',
        'background-size:1px 100%,100% 1px;',
        '}',
        '.cookie-banner::before{top:2px;left:2px;background-position:6px 0,0 6px;}',
        '.cookie-banner::after{bottom:2px;right:2px;background-position:15px 100%,100% 15px;}',
        '.cookie-banner.cookie-hidden{',
        'transform:translateY(12px);opacity:0;pointer-events:none;',
        '}',
        '.cookie-banner__text{',
        'color:var(--muted,#9BA9B6);line-height:1.5;',
        '}',
        '.cookie-banner__text a{color:var(--fg,#fff);}',
        '.cookie-banner__actions{',
        'display:flex;gap:8px;justify-content:flex-end;',
        '}',
        '.cookie-banner__btn{',
        'border:1px solid var(--line-strong,rgba(255,255,255,.28));',
        'padding:7px 13px;border-radius:999px;',
        'font-family:inherit;font-size:.76rem;letter-spacing:.06em;',
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
        'color:var(--accent-contrast,#14212B);font-weight:600;',
        '}',
        '.cookie-banner__btn--accept:hover{filter:brightness(108%);}',
        '@media(max-width:600px){',
        '.cookie-banner{left:12px;right:12px;bottom:12px;max-width:none;padding:16px 18px 14px;}',
        '}'
    ].join('');
    document.head.appendChild(style);

    /* ── Banner markup ── */
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    var privacyHref = window.location.pathname.indexOf('/zweitwohnung/') === 0
        ? '/zweitwohnung/privacy/#website-privacy'
        : '/company/privacy-policy.html';
    banner.innerHTML =
        '<span class="cookie-banner__text">Optional analytics load only after consent. ' +
        '<a href="' + privacyHref + '">Privacy details</a>.</span>' +
        '<div class="cookie-banner__actions">' +
        '<button class="cookie-banner__btn" data-consent="rejected">Opt out</button>' +
        '<button class="cookie-banner__btn cookie-banner__btn--accept" data-consent="accepted">Allow analytics</button>' +
        '</div>';

    function dismiss(choice) {
        localStorage.setItem(STORAGE_KEY, choice);
        if (choice === 'accepted') {
            window.dispatchEvent(new CustomEvent('mathricks:analytics-consent'));
        } else {
            clearAnalyticsCookies();
        }
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
