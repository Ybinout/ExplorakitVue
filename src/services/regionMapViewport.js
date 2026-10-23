export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 4;
export const clampMapZoom = value => Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, Number(value) || 1));
export function mapLayout(atlas, viewport, zoom = 1) {
  const width = Math.max(1, viewport.width), height = Math.max(1, viewport.height);
  const fit = Math.min(width / atlas.width, height / atlas.height);
  const mapWidth = atlas.width * fit * clampMapZoom(zoom), mapHeight = atlas.height * fit * clampMapZoom(zoom);
  return { mapWidth, mapHeight, width, height, offsetX: Math.max(0, (width-mapWidth)/2), offsetY: Math.max(0, (height-mapHeight)/2) };
}
export function anchoredMapScroll(before, after, scroll, anchor, nextAnchor = anchor) {
  const x = (scroll.x + anchor.x - before.offsetX) / before.mapWidth;
  const y = (scroll.y + anchor.y - before.offsetY) / before.mapHeight;
  return {
    x: Math.max(0, Math.min(Math.max(0,after.mapWidth-after.width), after.offsetX + x*after.mapWidth - nextAnchor.x)),
    y: Math.max(0, Math.min(Math.max(0,after.mapHeight-after.height), after.offsetY + y*after.mapHeight - nextAnchor.y))
  };
}
