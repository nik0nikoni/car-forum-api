(() => {
    const fallbackOrigin = window.location.origin || '';
    const configuredBase = window.APP_CONFIG?.apiBaseUrl;
    const baseUrl = (configuredBase || fallbackOrigin || '').replace(/\/+$/, '');

    window.API_URL = baseUrl;
})();

const API_URL = window.API_URL;

