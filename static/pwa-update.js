(async () => {
  await import('https://cdn.jsdelivr.net/npm/@pwabuilder/pwaupdate/dist/pwa-update.js');
  const el = document.createElement('pwa-update');
  document.body.appendChild(el);
})();
