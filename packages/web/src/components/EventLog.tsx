// EventLog: the notebook-margin log — one coloured line per GameEvent. Suit
// symbols render in their colour, player names and high-signal keywords stand
// out. Attack/combat lines name the monster via the session's uid resolver.

import { useEffect, useRef } from 'react';
import type { GameEvent } from '@house-rules/engine';
import { describeEvent, segmentize, type UidResolver } from '../session/describeEvent.js';

export function EventLog({ events, resolveUid }: { events: GameEvent[]; resolveUid: UidResolver }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);
  return (
    <div className="event-log" ref={ref}>
      <div className="marker" style={{ fontSize: 15, color: 'var(--red)', marginBottom: 4 }}>
        ✎ what happened
      </div>
      {events.map((e, i) => (
        <div key={i} className={e.type === 'TurnStarted' ? 'turn-line' : undefined}>
          {segmentize(describeEvent(e, resolveUid)).map((seg, j) =>
            seg.cls ? (
              <span key={j} className={seg.cls}>
                {seg.text}
              </span>
            ) : (
              <span key={j}>{seg.text}</span>
            ),
          )}
        </div>
      ))}
    </div>
  );
}
