// EventLog: the notebook-margin log — one human-readable line per GameEvent.

import { useEffect, useRef } from 'react';
import type { GameEvent } from '@house-rules/engine';
import { describeEvent } from '../session/describeEvent.js';

export function EventLog({ events }: { events: GameEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);
  return (
    <div className="event-log" ref={ref}>
      <div className="marker" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 4 }}>
        ✎ what happened
      </div>
      {events.map((e, i) => (
        <div key={i} className={e.type === 'TurnStarted' ? 'turn-line' : undefined}>
          {describeEvent(e)}
        </div>
      ))}
    </div>
  );
}
