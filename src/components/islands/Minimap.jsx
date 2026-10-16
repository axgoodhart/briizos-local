import { useEffect, useRef } from 'react';
import { centerOn, getCamera, onCamera, stageRect } from './camera';

// ==== MINIMAP ====
const MAP_W = 188;
const MAP_H = 112;
const MAP_PAD = 8;

export default function Minimap({ islands, positions }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const boundsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = MAP_W * dpr;
    canvas.height = MAP_H * dpr;
    const styles = getComputedStyle(canvas);
    const view = styles.getPropertyValue('--fo-map-view').trim() || 'rgba(255,255,255,0.7)';

    const draw = () => {
      const cam = getCamera();
      const stage = stageRect();
      const viewRect = { x: -cam.x / cam.scale, y: -cam.y / cam.scale, w: stage.width / cam.scale, h: stage.height / cam.scale };
      const rects = islands.map((i) => ({ ...positions[i.id], w: i.w, h: i.h, color: i.accent }));
      const all = [...rects, viewRect];
      const minX = Math.min(...all.map((r) => r.x));
      const minY = Math.min(...all.map((r) => r.y));
      const maxX = Math.max(...all.map((r) => r.x + r.w));
      const maxY = Math.max(...all.map((r) => r.y + r.h));
      const scale = Math.min((MAP_W - MAP_PAD * 2) / Math.max(1, maxX - minX), (MAP_H - MAP_PAD * 2) / Math.max(1, maxY - minY));
      boundsRef.current = { minX, minY, scale };
      const tx = (x) => MAP_PAD + (x - minX) * scale;
      const ty = (y) => MAP_PAD + (y - minY) * scale;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, MAP_W, MAP_H);
      rects.forEach((r) => {
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(tx(r.x), ty(r.y), Math.max(2, r.w * scale), Math.max(2, r.h * scale));
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = view;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx(viewRect.x) + 0.5, ty(viewRect.y) + 0.5, viewRect.w * scale, viewRect.h * scale);
    };
    const schedule = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(draw);
    };
    schedule();
    const off = onCamera(schedule);
    return () => { off(); cancelAnimationFrame(frameRef.current); };
  }, [islands, positions]);

  const jump = (event) => {
    const b = boundsRef.current;
    if (!b) return;
    const rect = canvasRef.current.getBoundingClientRect();
    centerOn(b.minX + (event.clientX - rect.left - MAP_PAD) / b.scale, b.minY + (event.clientY - rect.top - MAP_PAD) / b.scale);
  };

  return (
    <canvas
      ref={canvasRef}
      className="fo-minimap"
      style={{ width: MAP_W, height: MAP_H }}
      onPointerDown={(e) => { e.stopPropagation(); jump(e); }}
    />
  );
}
