// Shared DOM helpers for the tracker.
// Every converted module imports from here instead of touching `document` directly,
// so the whole app is scoped to its React root and can be embedded in a Drupal page.

// The `.app` element rendered by App.jsx (`window.appRef = appRef`).
export const getRoot = () => window.appRef?.current ?? null;

// Scoped replacements for document.querySelector(All) / getElementById.
export const qs = sel => getRoot()?.querySelector(sel) ?? null;
export const qsa = sel => getRoot()?.querySelectorAll(sel) ?? [];

// Element ids of the original markup are classes here (a few were renamed).
const ID_CLASS = { 'ap-export': 'ap-export-chart', 'ap-import': 'ap-import-chart', 'kpi-scope': 'kpi-scope-value' };
export const idToClass = id => ID_CLASS[id] ?? id;
export const byId = id => qs(`.${CSS.escape(idToClass(String(id)))}`);

// Base URL for data and images. On unctad.org the bundle is loaded from
// storage.unctad.org while the page lives on unctad.org, so page-relative
// './assets/…' would 404 — resolve against the bundle instead (js/<name>.min.js → ../).
// In `vite` dev the modules are served from /src/…, so stay page-relative there.
// Replaces the page-relative './assets/…' paths used before.
const UP = '../';
export const ASSET_BASE = import.meta.env?.PROD ? new URL(UP, import.meta.url).href : './';

// Buttons call App methods through data-shc-call / data-shc-args attributes
// (no inline onclick); one capture-phase listener on the root dispatches them.
let _app = null;
export const setApp = app => {
  _app = app;
};
export const getApp = () => _app;
export function installCallDelegation() {
  const root = getRoot();
  if (!root || root.__shcCalls) return;
  root.__shcCalls = true;
  root.addEventListener(
    'click',
    e => {
      const el = e.target?.closest?.('[data-shc-call]');
      if (!el || !root.contains(el)) return;
      const fn = _app?.[el.dataset.shcCall];
      if (typeof fn !== 'function') {
        console.error(`[shc] unknown action ${el.dataset.shcCall}`);
        return;
      }
      const args = el.dataset.shcArgs ? el.dataset.shcArgs.split('|') : [];
      fn.apply(_app, args);
    },
    true
  );
}

// window 'resize' → also fired for in-app layout changes (instead of dispatching a
// global resize event that every script on the host page would receive).
const _resize = new Set();
export function onResize(handler, opts) {
  _resize.add(handler);
  window.addEventListener('resize', handler, opts);
  getRoot()?.addEventListener('shc:layout-change', handler);
}
export function offResize(handler, opts) {
  _resize.delete(handler);
  window.removeEventListener('resize', handler, opts);
  getRoot()?.removeEventListener('shc:layout-change', handler);
}
export const notifyLayoutChange = () => getRoot()?.dispatchEvent(new CustomEvent('shc:layout-change'));
export function teardownDomHelpers() {
  for (const h of _resize) offResize(h);
}

// External stylesheets added to <head> at runtime (flag icons for the Animate panel).
const EXTERNAL_STYLES = ['https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css'];
export function ensureExternalStyles() {
  for (const href of EXTERNAL_STYLES) {
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}
