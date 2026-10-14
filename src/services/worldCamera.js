export const WORLD_WIDTH = 896;
export const WORLD_HEIGHT = 640;

// Keep world coordinates identical for terrain, characters and foregrounds.
// On a phone, show a native-size window of the map instead of shrinking it all.
export function getWorldCamera(width, height, player, mobile = false) {
  width = Math.max(1, Number(width) || 1);
  height = Math.max(1, Number(height) || 1);
  const scale = mobile
    ? Math.max(1, width / WORLD_WIDTH, height / WORLD_HEIGHT)
    : Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
  const visibleWidth = width / scale;
  const visibleHeight = height / scale;
  const clamp = (value, max) => Math.max(0, Math.min(Math.max(0, max), value));
  return {
    scale,
    x: clamp((player?.x ?? WORLD_WIDTH / 2) - visibleWidth / 2, WORLD_WIDTH - visibleWidth),
    y: clamp((player?.y ?? WORLD_HEIGHT / 2) - visibleHeight / 2, WORLD_HEIGHT - visibleHeight),
    visibleWidth,
    visibleHeight
  };
}
