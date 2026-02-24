/**
 * Mathricks Analytics
 */

(function () {
    'use strict';

    var GA_ID = 'G-PR5KGVZHLM';

    /* ── 1. Load gtag.js ──────────────────────────────── */
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;                       // expose globally if needed
    gtag('js', new Date());
    gtag('config', GA_ID);

    /* ── 2. Click tracking (event delegation) ─────────── */
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (!a) return;                          // not a link click

        var href = a.href || '';

        // App Store downloads
        if (/apps\.apple\.com|itunes\.apple\.com/i.test(href)) {
            gtag('event', 'app_store_click', {
                link_url: href,
                link_text: (a.textContent || '').trim().substring(0, 80),
                page_path: location.pathname
            });
            return;                                // don't prevent navigation
        }

        // "Learn more" / "read more" internal links
        if (a.classList.contains('read-more')) {
            gtag('event', 'learn_more_click', {
                link_url: href,
                link_text: (a.textContent || '').trim().substring(0, 80),
                page_path: location.pathname
            });
            return;
        }

        // Any other outbound link (different host)
        try {
            var linkHost = new URL(href, location.href).hostname;
            if (linkHost && linkHost !== location.hostname) {
                gtag('event', 'outbound_click', {
                    link_url: href,
                    link_text: (a.textContent || '').trim().substring(0, 80),
                    page_path: location.pathname
                });
            }
        } catch (_) { /* ignore malformed URLs */ }
    });
})();
