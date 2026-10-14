import Vue from 'vue';

export const installation = Vue.observable({ prompt: null, installed: false });
let initialized = false;
export function initializePwa() {
  if (initialized) return;
  initialized = true;
  const display = window.matchMedia('(display-mode: standalone)');
  const sync = () => { installation.installed = display.matches || window.navigator.standalone === true; };
  sync();
  if (display.addEventListener) display.addEventListener('change', sync);
  else if (display.addListener) display.addListener(sync);
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installation.prompt = event; });
  window.addEventListener('appinstalled', () => { installation.installed = true; installation.prompt = null; });
  if (process.env.NODE_ENV === 'production' && window.isSecureContext && 'serviceWorker' in navigator) {
    const register = () => navigator.serviceWorker.register(`${process.env.BASE_URL}service-worker.js`, {
      scope: process.env.BASE_URL, updateViaCache: 'none'
    }).catch(() => { /* Installation can be retried on the next visit; online play remains available. */ });
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
}
