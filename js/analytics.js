const GA_MEASUREMENT_ID = 'G-1LXDJ249V6';

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () { dataLayer.push(arguments); };
gtag('js', new Date());
gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true, send_page_view: true });

(function loadGoogleTag() {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
})();

window.trackAnalyticsEvent = function trackAnalyticsEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
};

window.setAnalyticsContext = function setAnalyticsContext(context) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('set', 'user_properties', { page_context: context });
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href) return;

  const isExternal = /^https?:\/\//i.test(href);
  const eventName = isExternal ? 'outbound_link_click' : 'internal_link_click';
  window.trackAnalyticsEvent(eventName, {
    link_url: href,
    link_text: (link.textContent || '').trim().slice(0, 100),
  });
});
