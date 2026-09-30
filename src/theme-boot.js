/* ZENITH PRO · theme boot
 * Runs synchronously from <head>, before any stylesheet paints. It reads the
 * theme the family last chose ("light" | "dark"; anything else means "follow the
 * device") from a small localStorage mirror that app.js keeps in step with the
 * real settings store, and sets <html data-theme> so the first frame is already
 * the right theme. It is a classic script (not a module) so it blocks render, and
 * it is a separate file so the Content-Security-Policy can stay `script-src 'self'`.
 */
(function () {
  try {
    var pref = localStorage.getItem('zenith:theme');
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var chosen = pref === 'light' || pref === 'dark' ? pref : 'auto';
    var root = document.documentElement;
    root.setAttribute('data-theme', chosen === 'auto' ? (dark ? 'dark' : 'light') : chosen);
    root.setAttribute('data-theme-pref', chosen);
  } catch (e) { /* storage blocked: the light default in index.html stands */ }
})();
