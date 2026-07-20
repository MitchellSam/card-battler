// NodeMap screen: the run DAG (mirrors mockups/NodeMap.dc.html's component
// role). Columns flow bottom → top, boss on top; SVG edges; reachable-next
// nodes highlighted; click = pickNode. Ugly-but-navigable per the M4 brief.

import { useMemo } from 'react';
import { reachableNodes, type NodeMap as RunNodeMap, type NodeType } from '@house-rules/run';

const NODE_ICON: Record<NodeType, string> = {
  duel: '⚔',
  elite: '💀',
  event: '?',
  shop: '🛒',
  treasure: '🎁',
  boss: '👔',
};

const NODE_LABEL: Record<NodeType, string> = {
  duel: 'duel',
  elite: 'ELITE',
  event: 'event',
  shop: 'shop',
  treasure: 'treasure',
  boss: 'THE GROWN-UP',
};

export interface NodeMapProps {
  map: RunNodeMap;
  position: string | null;
  visited: string[];
  onPick: (nodeId: string) => void;
}

const CELL_W = 108;
const CELL_H = 74;
const PAD = 24;

export function NodeMapView({ map, position, visited, onPick }: NodeMapProps) {
  const layout = useMemo(() => {
    const widths = new Map<number, number>();
    for (const n of map.nodes) widths.set(n.column, Math.max(widths.get(n.column) ?? 0, n.index + 1));
    const maxWidth = Math.max(...widths.values());
    const totalCols = map.columns + 1;
    const pos = new Map<string, { x: number; y: number }>();
    for (const n of map.nodes) {
      const w = widths.get(n.column)!;
      const x = PAD + ((n.index + 0.5) / w) * (maxWidth * CELL_W);
      const y = PAD + (totalCols - 1 - n.column) * CELL_H + CELL_H / 2;
      pos.set(n.id, { x, y });
    }
    return { pos, width: maxWidth * CELL_W + PAD * 2, height: totalCols * CELL_H + PAD * 2 };
  }, [map]);

  const reachable = new Set(reachableNodes(map, position).map((n) => n.id));
  const visitedSet = new Set(visited);

  return (
    <div style={{ overflow: 'auto', maxHeight: '78vh', padding: 4 }}>
      <div style={{ position: 'relative', width: layout.width, height: layout.height, margin: '0 auto' }}>
        <svg width={layout.width} height={layout.height} style={{ position: 'absolute', inset: 0 }}>
          {map.nodes.flatMap((n) =>
            n.next.map((id) => {
              const a = layout.pos.get(n.id)!;
              const b = layout.pos.get(id)!;
              const walked = visitedSet.has(n.id) && visitedSet.has(id);
              return (
                <line
                  key={`${n.id}-${id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={walked ? 'var(--red)' : '#8b8b83'}
                  strokeWidth={walked ? 3 : 2}
                  strokeDasharray={walked ? undefined : '6 5'}
                  opacity={walked ? 0.9 : 0.55}
                />
              );
            }),
          )}
        </svg>
        {map.nodes.map((n) => {
          const p = layout.pos.get(n.id)!;
          const canPick = reachable.has(n.id);
          const here = position === n.id;
          const seen = visitedSet.has(n.id);
          return (
            <button
              key={n.id}
              onClick={canPick ? () => onPick(n.id) : undefined}
              className={canPick ? 'hl-act' : ''}
              title={`${NODE_LABEL[n.type]}${canPick ? ' — click to go' : ''}`}
              style={{
                position: 'absolute',
                left: p.x - 30,
                top: p.y - 26,
                width: 60,
                height: 52,
                borderRadius: 10,
                border: `2.5px solid ${here ? 'var(--red)' : n.type === 'boss' ? '#5a2d82' : '#2b2b2b'}`,
                background: here ? 'var(--yellow)' : seen ? '#d9d4c2' : '#fbfaf3',
                opacity: canPick || here || seen ? 1 : 0.45,
                cursor: canPick ? 'pointer' : 'default',
                fontFamily: "'Gochi Hand', cursive",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: canPick ? '0 3px 8px rgba(0,0,0,.3)' : '0 1px 2px rgba(0,0,0,.2)',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{NODE_ICON[n.type]}</span>
              <span style={{ fontSize: 11 }}>{NODE_LABEL[n.type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
