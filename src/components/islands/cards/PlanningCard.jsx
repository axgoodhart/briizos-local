import { useEffect, useRef, useState } from 'react';
import { updateCardData } from '../store';
import { getScale } from '../camera';
import { trackPointer } from '../gestures';
import { snap, uid } from '../util';

// ==== PLANNING ====
const NODE_W = 128;
const NODE_H = 44;

function anchor(node, toward) {
  const cx = node.x + node.w / 2;
  const cy = node.y + node.h / 2;
  const tx = toward.x;
  const ty = toward.y;
  const dx = tx - cx;
  const dy = ty - cy;
  if (Math.abs(dx) * node.h > Math.abs(dy) * node.w) return { x: cx + Math.sign(dx) * node.w / 2, y: cy + (dy * (node.w / 2)) / Math.max(1, Math.abs(dx)) };
  return { x: cx + (dx * (node.h / 2)) / Math.max(1, Math.abs(dy)), y: cy + Math.sign(dy) * node.h / 2 };
}

export default function PlanningCard({ island, card, selected }) {
  const boardRef = useRef(null);
  const [nodes, setNodes] = useState(card.data.nodes || []);
  const [edges, setEdges] = useState(card.data.edges || []);
  const [picked, setPicked] = useState(null);       // { type: 'node' | 'edge', id }
  const [editing, setEditing] = useState(null);
  const [link, setLink] = useState(null);           // { from, x, y } while drawing a connection

  useEffect(() => { setNodes(card.data.nodes || []); setEdges(card.data.edges || []); }, [card.data.nodes, card.data.edges]);

  const commit = (nextNodes, nextEdges) => updateCardData(island.id, card.id, { nodes: nextNodes, edges: nextEdges });

  const local = (clientX, clientY) => {
    const rect = boardRef.current.getBoundingClientRect();
    const scale = getScale();
    return { x: (clientX - rect.left + boardRef.current.scrollLeft * scale) / scale, y: (clientY - rect.top + boardRef.current.scrollTop * scale) / scale };
  };

  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => {
      if (!picked || editing || !['Backspace', 'Delete'].includes(e.key)) return;
      if (/input|textarea/i.test(document.activeElement?.tagName || '')) return;
      e.preventDefault();
      if (picked.type === 'node') {
        const n = nodes.filter((x) => x.id !== picked.id);
        const ed = edges.filter((x) => x.from !== picked.id && x.to !== picked.id);
        setNodes(n); setEdges(ed); commit(n, ed);
      } else {
        const ed = edges.filter((x) => `${x.from}>${x.to}` !== picked.id);
        setEdges(ed); commit(nodes, ed);
      }
      setPicked(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const addNode = (event) => {
    if (event.target !== boardRef.current && !event.target.classList.contains('fo-plan__svg')) return;
    const at = local(event.clientX, event.clientY);
    const node = { id: uid('n'), x: snap(at.x - NODE_W / 2), y: snap(at.y - NODE_H / 2), w: NODE_W, h: NODE_H, text: '' };
    const n = [...nodes, node];
    setNodes(n);
    commit(n, edges);
    setEditing(node.id);
  };

  const dragNode = (event, node) => {
    if (event.button !== 0 || editing === node.id) return;
    setPicked({ type: 'node', id: node.id });
    let moved = nodes;
    trackPointer(event, {
      threshold: 2,
      onMove: (dx, dy) => {
        const scale = getScale();
        moved = nodes.map((n) => (n.id === node.id ? { ...n, x: Math.max(0, node.x + dx / scale), y: Math.max(0, node.y + dy / scale) } : n));
        setNodes(moved);
      },
      onEnd: (dx, dy, e, clicked) => {
        if (clicked) return;
        moved = moved.map((n) => (n.id === node.id ? { ...n, x: snap(n.x), y: snap(n.y) } : n));
        setNodes(moved);
        commit(moved, edges);
      },
    });
  };

  const drawLink = (event, node) => {
    trackPointer(event, {
      onMove: (dx, dy, e) => setLink({ from: node.id, ...local(e.clientX, e.clientY) }),
      onEnd: (dx, dy, e) => {
        setLink(null);
        if (!e) return;
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-plan-node]')?.dataset.planNode;
        if (!target || target === node.id || edges.some((x) => x.from === node.id && x.to === target)) return;
        const ed = [...edges, { from: node.id, to: target }];
        setEdges(ed);
        commit(nodes, ed);
      },
    });
  };

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const width = Math.max(...nodes.map((n) => n.x + n.w + 40), 0);
  const height = Math.max(...nodes.map((n) => n.y + n.h + 40), 0);

  return (
    <div ref={boardRef} className="fo-plan" onDoubleClick={addNode} onPointerDown={(e) => { if (e.target === boardRef.current) setPicked(null); }}>
      <svg className="fo-plan__svg" style={{ width: Math.max(width, 10), height: Math.max(height, 10) }}>
        <defs>
          <marker id={`fo-arrow-${card.id}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L8,4 L0,8 z" className="fo-plan__arrow" />
          </marker>
        </defs>
        {edges.map((edge) => {
          const a = byId.get(edge.from);
          const b = byId.get(edge.to);
          if (!a || !b) return null;
          const start = anchor(a, { x: b.x + b.w / 2, y: b.y + b.h / 2 });
          const end = anchor(b, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
          const id = `${edge.from}>${edge.to}`;
          return (
            <g key={id} className="fo-plan__edge" data-picked={picked?.id === id ? 'true' : undefined} onPointerDown={(e) => { e.stopPropagation(); setPicked({ type: 'edge', id }); }}>
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="fo-plan__hit" />
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} markerEnd={`url(#fo-arrow-${card.id})`} />
            </g>
          );
        })}
        {link && byId.get(link.from) && (() => {
          const a = byId.get(link.from);
          const start = anchor(a, link);
          return <line x1={start.x} y1={start.y} x2={link.x} y2={link.y} className="fo-plan__drawing" />;
        })()}
      </svg>
      {nodes.map((node) => (
        <div
          key={node.id}
          className="fo-plan__node"
          data-plan-node={node.id}
          data-picked={picked?.id === node.id ? 'true' : undefined}
          style={{ left: node.x, top: node.y, width: node.w, minHeight: node.h }}
          onPointerDown={(e) => { e.stopPropagation(); dragNode(e, node); }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(node.id); }}
        >
          {editing === node.id ? (
            <textarea
              autoFocus
              defaultValue={node.text}
              onPointerDown={(e) => e.stopPropagation()}
              onBlur={(e) => {
                setEditing(null);
                const n = nodes.map((x) => (x.id === node.id ? { ...x, text: e.target.value } : x));
                setNodes(n);
                commit(n, edges);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
            />
          ) : (
            <span>{node.text || ' '}</span>
          )}
          <span className="fo-plan__handle" onPointerDown={(e) => { e.stopPropagation(); drawLink(e, node); }} title="Drag to connect" />
        </div>
      ))}
    </div>
  );
}
