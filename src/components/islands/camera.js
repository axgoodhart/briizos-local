// Desk camera: pan/zoom applied straight to the world element so panning never re-renders React.
import { clamp } from './util';

// ==== CAMERA ====
const MIN_SCALE = 0.08;
const MAX_SCALE = 2.5;
const FLY_MS = 380;

const SETTLE_MS = 180;                 // after the last pan/zoom frame, let the browser redraw sharp

const cam = { x: 260, y: 160, scale: 1, world: null, stage: null, grid: null, frame: 0, settle: 0 };
const listeners = new Set();

export function attachCamera(stage, world, initial) {
  cam.stage = stage;
  cam.world = world;
  cam.grid = stage.querySelector('.fo-desk__grid');
  if (initial) Object.assign(cam, { x: initial.x, y: initial.y, scale: initial.scale });
  apply();
}

export function detachCamera(world) {
  if (cam.world === world) { cam.world = null; cam.stage = null; cam.grid = null; }
  cancelAnimationFrame(cam.frame);
  clearTimeout(cam.settle);
}

export const getCamera = () => ({ x: cam.x, y: cam.y, scale: cam.scale });
export const getScale = () => cam.scale;

export function onCamera(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ==== GRID ====
const FAR_SCALE = 0.35;                // below this, the fine grid lines drop out

// While moving, the world is one fixed-resolution GPU layer; once still, it redraws sharp at the new zoom.
function apply() {
  const world = cam.world;
  if (world) {
    world.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.scale})`;
    if (world.style.willChange !== 'transform') world.style.willChange = 'transform';
    clearTimeout(cam.settle);
    cam.settle = setTimeout(() => { if (cam.world === world) world.style.willChange = 'auto'; }, SETTLE_MS);
  }
  // Grid variables live on the grid itself so a pan never restyles the islands.
  if (cam.grid) {
    const style = cam.grid.style;
    style.setProperty('--fo-scale', cam.scale);
    style.setProperty('--fo-pan-x', `${cam.x}px`);
    style.setProperty('--fo-pan-y', `${cam.y}px`);
    const zoom = cam.scale < FAR_SCALE ? 'far' : 'near';
    if (cam.grid.dataset.zoom !== zoom) cam.grid.dataset.zoom = zoom;
  }
  listeners.forEach((fn) => fn(cam));
}

export function viewRect(margin = 0) {
  const rect = stageRect();
  const w = rect.width / cam.scale;
  const h = rect.height / cam.scale;
  return { x: -cam.x / cam.scale - w * margin, y: -cam.y / cam.scale - h * margin, w: w * (1 + margin * 2), h: h * (1 + margin * 2) };
}

export function setCamera(next) {
  cam.x = next.x ?? cam.x;
  cam.y = next.y ?? cam.y;
  cam.scale = clamp(next.scale ?? cam.scale, MIN_SCALE, MAX_SCALE);
  apply();
}

export function panBy(dx, dy) {
  cam.x += dx;
  cam.y += dy;
  apply();
}

export function stageRect() {
  return cam.stage?.getBoundingClientRect() || { left: 0, top: 0, width: 1, height: 1 };
}

export function screenToWorld(clientX, clientY) {
  const rect = stageRect();
  return { x: (clientX - rect.left - cam.x) / cam.scale, y: (clientY - rect.top - cam.y) / cam.scale };
}

export function worldToScreen(x, y) {
  const rect = stageRect();
  return { x: rect.left + cam.x + x * cam.scale, y: rect.top + cam.y + y * cam.scale };
}

export function zoomAt(clientX, clientY, factor) {
  const rect = stageRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const scale = clamp(cam.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / cam.scale;
  cam.x = px - (px - cam.x) * ratio;
  cam.y = py - (py - cam.y) * ratio;
  cam.scale = scale;
  apply();
}

export function zoomBy(factor) {
  const rect = stageRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
}

function animateTo(target) {
  cancelAnimationFrame(cam.frame);
  const from = { x: cam.x, y: cam.y, scale: cam.scale };
  const start = performance.now();
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const step = (now) => {
    const t = reduce ? 1 : Math.min(1, (now - start) / FLY_MS);
    const e = 1 - (1 - t) ** 3;
    cam.x = from.x + (target.x - from.x) * e;
    cam.y = from.y + (target.y - from.y) * e;
    cam.scale = from.scale + (target.scale - from.scale) * e;
    apply();
    if (t < 1) cam.frame = requestAnimationFrame(step);
  };
  cam.frame = requestAnimationFrame(step);
}

export function frameRects(rects, { pad = 80, maxScale = 1, animate = true } = {}) {
  if (!rects.length) return;
  const rect = stageRect();
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  const scale = clamp(Math.min((rect.width - pad * 2) / Math.max(1, maxX - minX), (rect.height - pad * 2) / Math.max(1, maxY - minY), maxScale), MIN_SCALE, MAX_SCALE);
  const target = {
    scale,
    x: rect.width / 2 - ((minX + maxX) / 2) * scale,
    y: rect.height / 2 - ((minY + maxY) / 2) * scale,
  };
  if (animate) animateTo(target);
  else setCamera(target);
}

export function centerOn(x, y) {
  const rect = stageRect();
  animateTo({ scale: cam.scale, x: rect.width / 2 - x * cam.scale, y: rect.height / 2 - y * cam.scale });
}
