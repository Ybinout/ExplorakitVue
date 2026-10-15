// Decode both layers before publishing a scene. Cache a small number of visited
// maps; rejected loads are evicted so the player can retry a network failure.
export function createMapSceneLoader(resolveAsset, createImage = () => new Image()) {
  const cache = new Map();
  function image(url) {
    return new Promise((resolve, reject) => {
      const img = createImage();
      const timer = setTimeout(() => fail(), 15000);
      const finish = () => { clearTimeout(timer); img.onload = null; img.onerror = null; };
      const fail = () => { finish(); reject(new Error('Carte indisponible')); };
      img.onerror = fail;
      img.onload = async () => {
        try {
          if (typeof img.decode === 'function') await img.decode();
          if (!img.naturalWidth) throw new Error('Image vide');
          finish(); resolve(img);
        } catch (_) { fail(); }
      };
      img.src = url;
    });
  }
  return {
    load(name) {
      if (cache.has(name)) return cache.get(name);
      const pending = Promise.resolve().then(async () => {
        const background = resolveAsset(name);
        let foreground = null;
        try { foreground = resolveAsset(name, true); } catch (_) { /* Optional layer. */ }
        const [base, front] = await Promise.all([image(background), foreground ? image(foreground) : null]);
        return { name, background: base, foreground: front };
      }).catch(error => { cache.delete(name); throw error; });
      cache.set(name, pending);
      if (cache.size > 6) cache.delete(cache.keys().next().value);
      return pending;
    },
    clear() { cache.clear(); }
  };
}
