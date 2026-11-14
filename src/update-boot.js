/* Runs independently of app.js, even when an imported module fails to load.
 * Detects installed-PWA updates on reopen and return from background.
 * Does not touch IndexedDB, localStorage profiles, or nutrition records. */
(function () {
  'use strict';
  var BUILD = '18.1.1-20261115';
  var hadController = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  var reloading = false;
  var currentRegistration = null;
  var throttleKey = 'zenith:reload-stamp';
  function editing() {
    var active = document.activeElement;
    return !!(active && active.matches && active.matches('input,textarea,select,[contenteditable="true"]'));
  }
  function reloadToBuild(build) {
    if (reloading) return;
    if (editing()) {
      window.dispatchEvent(new Event('zenith:update-available'));
      return;
    }
    var token = String(build || BUILD);
    try {
      var previous = JSON.parse(sessionStorage.getItem(throttleKey) || 'null');
      if (previous && previous.token === token && Date.now() - previous.at < 12000) return;
      sessionStorage.setItem(throttleKey, JSON.stringify({ token: token, at: Date.now() }));
    } catch (e) { /* session storage may be disabled */ }
    reloading = true;
    var url = new URL(location.href);
    url.searchParams.set('__zenith_build', token);
    location.replace(url.href);
  }
  async function check() {
    if (navigator.serviceWorker) {
      var reg = currentRegistration || await navigator.serviceWorker.getRegistration('./');
      if (reg) await reg.update();
    }
    // Cache-busted document is the authoritative release signal.
    var url = new URL('./index.html', location.href);
    url.searchParams.set('__zenith_check', String(Date.now()));
    var response = await fetch(url.href, { cache: 'no-store' });
    if (!response.ok) throw new Error('Release check HTTP ' + response.status);
    var html = await response.text();
    var remote = /<meta name="zenith-build" content="([^"]+)"/.exec(html);
    var latest = remote && remote[1];
    if (latest && latest !== BUILD) reloadToBuild(latest);
    return { available: !!latest && latest !== BUILD, current: BUILD, latest: latest || null };
  }
  window.ZenithUpdate = { check: check, build: BUILD };
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }
    reloadToBuild(BUILD);
  });
  function register() {
    navigator.serviceWorker.register('./sw.js?v=18.1.1', {
      scope: './', updateViaCache: 'none'
    }).then(function (reg) {
      currentRegistration = reg;
      reg.update().catch(function () {});
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) check().catch(function () {});
      });
      window.addEventListener('pageshow', function (e) {
        if (e.persisted) check().catch(function () {});
      });
      window.setInterval(function () {
        if (!document.hidden) check().catch(function () {});
      }, 5 * 60 * 1000);
    }).catch(function (error) {
      console.error('[ZENITH] offline update registration', error);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register, { once: true });
  else register();
})();
