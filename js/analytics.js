/**
 * Mathricks Analytics
 */

(function () {
    'use strict';

    var GA_ID = 'G-PR5KGVZHLM';
    var CONSENT_KEY = 'cookie-consent';
    var hasLoaded = false;

    function hasAnalyticsConsent() {
        try {
            return localStorage.getItem(CONSENT_KEY) === 'accepted';
        } catch (_) {
            return false;
        }
    }

    function loadAnalytics() {
        if (hasLoaded || !hasAnalyticsConsent()) return;
        hasLoaded = true;

        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;

        gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        gtag('js', new Date());
        gtag('config', GA_ID, { anonymize_ip: true });

        document.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (!a) return;

            var href = a.href || '';

            if (/apps\.apple\.com|itunes\.apple\.com/i.test(href)) {
                gtag('event', 'app_store_click', {
                    link_url: href,
                    link_text: (a.textContent || '').trim().substring(0, 80),
                    page_path: location.pathname
                });
                return;
            }

            if (a.classList.contains('read-more')) {
                gtag('event', 'learn_more_click', {
                    link_url: href,
                    link_text: (a.textContent || '').trim().substring(0, 80),
                    page_path: location.pathname
                });
                return;
            }

            try {
                var linkHost = new URL(href, location.href).hostname;
                if (linkHost && linkHost !== location.hostname) {
                    gtag('event', 'outbound_click', {
                        link_url: href,
                        link_text: (a.textContent || '').trim().substring(0, 80),
                        page_path: location.pathname
                    });
                }
            } catch (_) { /* Ignore malformed URLs. */ }
        });
    }

    window.addEventListener('mathricks:analytics-consent', loadAnalytics);
    loadAnalytics();
})();
