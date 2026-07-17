// PileModal: browse a public pile (graveyard / removed), or pick a ♥ revive
// target across both graveyards (only engine-offered cards are clickable).

import type { GameCard } from '@house-rules/engine';
import { Card } from './Card.js';

export interface PileSection {
  title: string;
  cards: GameCard[];
}

export interface PileModalProps {
  title: string;
  subtitle?: string;
  sections: PileSection[];
  clickableIds?: Set<string>;
  onCardClick?: (card: GameCard) => void;
  onClose: () => void;
}

export function PileModal({ title, subtitle, sections, clickableIds, onCardClick, onClose }: PileModalProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="paper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="marker" style={{ fontSize: 20, color: 'var(--brown)', marginBottom: 2 }}>
          {title}
        </div>
        {subtitle && (
          <div className="gochi" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
            {subtitle}
          </div>
        )}
        {sections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: 12 }}>
            <div className="marker" style={{ fontSize: 13, color: 'var(--ballpoint)', marginBottom: 6 }}>
              {sec.title} · {sec.cards.length}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 540 }}>
              {sec.cards.length === 0 && (
                <span className="gochi" style={{ color: 'var(--muted)' }}>
                  (empty)
                </span>
              )}
              {sec.cards.map((c) => {
                const clickable = clickableIds?.has(c.id) ?? false;
                return (
                  <Card
                    key={c.id}
                    rank={c.rank}
                    suit={c.suit}
                    w={52}
                    h={72}
                    highlight={clickable ? 'target' : null}
                    onClick={clickable && onCardClick ? () => onCardClick(c) : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <button className="note-btn red" onClick={onClose} style={{ marginTop: 6 }}>
          close ✕
        </button>
      </div>
    </div>
  );
}
