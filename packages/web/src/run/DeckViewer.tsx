// DeckViewer: browse the stickered run deck; doubles as the pick-a-card
// surface for sticker application / trims / swaps (clickable filter provided
// by the caller from legalRunActions — the UI never decides legality).

import { describeEffect, getEffectSpec, type GameCard } from '@house-rules/engine';
import { Card } from '../components/Card.js';
import { cardTooltip, type SuitOverrides } from '../ui/cardFace.js';

export interface DeckViewerProps {
  deck: GameCard[];
  /** Card ids that may be clicked (from legalRunActions). Others render dim. */
  clickableIds?: Set<string>;
  /** The run's Cheat Sheet sticker state — keeps suit tooltips honest. */
  suitOverrides?: SuitOverrides;
  onCardClick?: (card: GameCard) => void;
}

function stickerBadge(card: GameCard): string | null {
  const top = card.stickerStack[card.stickerStack.length - 1];
  if (!top) return null;
  return getEffectSpec(top)?.name ?? describeEffect(top).name;
}

export function DeckViewer({ deck, clickableIds, suitOverrides, onCardClick }: DeckViewerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        maxHeight: '56vh',
        overflow: 'auto',
        padding: 6,
        justifyContent: 'center',
      }}
    >
      {deck.map((c) => {
        const clickable = clickableIds?.has(c.id) ?? false;
        const badge = stickerBadge(c);
        return (
          <div key={c.id} style={{ position: 'relative', opacity: clickableIds && !clickable ? 0.35 : 1 }}>
            <Card
              rank={c.rank}
              suit={c.suit}
              w={52}
              h={74}
              highlight={clickable ? 'target' : null}
              title={cardTooltip(c, suitOverrides)}
              onClick={clickable && onCardClick ? () => onCardClick(c) : undefined}
            />
            {badge && (
              <span
                className="marker"
                title={describeEffect(c.stickerStack[c.stickerStack.length - 1]!).text}
                style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(-3deg)',
                  background: 'var(--yellow)',
                  border: '1.5px solid #2b2b2b',
                  borderRadius: 4,
                  fontSize: 9,
                  padding: '0 4px',
                  whiteSpace: 'nowrap',
                  maxWidth: 70,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
