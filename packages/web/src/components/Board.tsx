// Board scaffold: opponent mirror-image of player — hand strips, 5+5 zones,
// bank spreads (public, live best-hand label via the ENGINE's bestHand —
// imported, never reimplemented), deck pile with depletion bar, graveyard,
// removed pile. Renders exclusively from PlayerView. All affordances arrive
// as a highlight map + click callback computed in App from legal().

import { bestHand, toHandResult, type GameCard, type PlayerView, type SideView } from '@house-rules/engine';
import { PLAYER_NAMES } from '../session/describeEvent.js';
import { AI, HUMAN } from '../session/GameSession.js';
import { cardTooltip } from '../ui/cardFace.js';
import { Card, type Highlight } from './Card.js';
import { MonsterZone, STZone } from './Zone.js';

export type Cell =
  | { t: 'hand'; i: number }
  | { t: 'myMonster'; zone: number }
  | { t: 'oppMonster'; zone: number }
  | { t: 'myST'; zone: number }
  | { t: 'oppST'; zone: number }
  | { t: 'myBank'; i: number }
  | { t: 'oppBank'; i: number };

export function cellKey(c: Cell): string {
  return `${c.t}:${'i' in c ? c.i : c.zone}`;
}

export type PileId = { side: 'you' | 'opp'; pile: 'graveyard' | 'removed' };

export interface BoardProps {
  view: PlayerView;
  highlights: Map<string, Highlight>;
  onCell: (c: Cell) => void;
  onOpenPile: (p: PileId) => void;
  center: React.ReactNode;
}

const bestHandLabel = (bank: GameCard[]): string =>
  bank.length === 0 ? '—' : toHandResult(bestHand(bank)).name;

function Bank({
  side,
  cards,
  highlights,
  onCell,
}: {
  side: 'you' | 'opp';
  cards: GameCard[];
  highlights: Map<string, Highlight>;
  onCell: (c: Cell) => void;
}) {
  const mine = side === 'you';
  const name = mine ? 'YOUR BANK' : `${PLAYER_NAMES[AI].toUpperCase()}'S BANK`;
  return (
    <div style={{ width: 250 }}>
      <div
        className="marker"
        style={{ fontSize: 11, color: mine ? 'var(--ballpoint)' : 'var(--red)', marginBottom: 2 }}
      >
        {name} <span style={{ fontFamily: "'Patrick Hand'", color: '#7d7150' }}>(public)</span>
      </div>
      <div
        style={{
          background: 'var(--manila)',
          borderRadius: 4,
          padding: '6px 8px',
          display: 'flex',
          flexWrap: 'wrap',
          minHeight: 60,
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.3), 0 2px 3px rgba(0,0,0,.2)',
        }}
      >
        {cards.length === 0 && (
          <span className="gochi" style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>
            (empty — win combats to bank!)
          </span>
        )}
        {cards.map((c, i) => {
          const cell: Cell = mine ? { t: 'myBank', i } : { t: 'oppBank', i };
          const hl = highlights.get(cellKey(cell)) ?? null;
          return (
            <Card
              key={c.id}
              rank={c.rank}
              suit={c.suit}
              w={36}
              h={52}
              highlight={hl}
              onClick={hl ? () => onCell(cell) : undefined}
              style={{ marginRight: -7, transform: `rotate(${((i * 7) % 9) - 4}deg)` }}
            />
          );
        })}
      </div>
      <div className="gochi" style={{ fontSize: 12, color: 'var(--ballpoint)', marginTop: 3 }}>
        🏆 best hand: <b>{bestHandLabel(cards)}</b>
      </div>
    </div>
  );
}

function Piles({
  side,
  sv,
  onOpenPile,
}: {
  side: 'you' | 'opp';
  sv: SideView;
  onOpenPile: (p: PileId) => void;
}) {
  const gyTop = sv.graveyard[sv.graveyard.length - 1];
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: 210 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{ position: 'relative', width: 56, height: 78 }}>
          <Card faceDown w={54} h={76} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="marker" style={{ fontSize: 23, color: '#fff', textShadow: '0 0 3px #000, 2px 2px 0 rgba(0,0,0,.5)' }}>
              {sv.deckCount}
            </span>
          </div>
        </div>
        <div style={{ width: 60, height: 8, background: 'var(--brown)', borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              width: `${(sv.deckCount / 54) * 100}%`,
              height: '100%',
              background: sv.deckCount > 20 ? '#7ba36f' : sv.deckCount > 8 ? '#e0a53c' : 'var(--red)',
            }}
          />
        </div>
        <span className="gochi" style={{ fontSize: 10, color: '#4a3f28' }}>
          DECK {sv.deckCount}/54
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <button
          onClick={() => onOpenPile({ side, pile: 'graveyard' })}
          style={{ position: 'relative', width: 56, height: 78, padding: 0, border: 'none', background: 'none' }}
        >
          <div style={{ position: 'absolute', inset: 0, border: '2px dashed #6b5f45', borderRadius: 6, background: 'rgba(90,78,53,.15)' }} />
          {gyTop && (
            <div style={{ position: 'absolute', top: 2, left: 2 }}>
              <Card rank={gyTop.rank} suit={gyTop.suit} w={52} h={74} />
            </div>
          )}
          <span
            className="marker"
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              fontSize: 11,
              color: '#fff',
              background: 'var(--brown)',
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sv.graveyard.length}
          </span>
        </button>
        <span className="gochi" style={{ fontSize: 10, color: '#4a3f28' }}>
          GRAVE ▸ tap
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <button
          onClick={() => onOpenPile({ side, pile: 'removed' })}
          style={{ position: 'relative', width: 42, height: 60, padding: 0, border: 'none', background: 'none' }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px dotted var(--red)',
              borderRadius: 6,
              background: 'rgba(194,59,46,.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--red)',
              fontSize: 15,
            }}
          >
            ✂
          </div>
          <span
            className="marker"
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              fontSize: 10,
              color: '#fff',
              background: 'var(--red)',
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sv.removed.length}
          </span>
        </button>
        <span className="gochi" style={{ fontSize: 10, color: '#4a3f28' }}>
          REMOVED
        </span>
      </div>
    </div>
  );
}

function FieldRow({
  side,
  view,
  highlights,
  onCell,
  onOpenPile,
}: {
  side: 'you' | 'opp';
  view: PlayerView;
  highlights: Map<string, Highlight>;
  onCell: (c: Cell) => void;
  onOpenPile: (p: PileId) => void;
}) {
  const mine = side === 'you';
  const sv = mine ? view.you : view.opponent;
  const monsterRow = (
    <div style={{ display: 'flex', gap: 7 }}>
      {sv.monsters.map((m, zone) => {
        const cell: Cell = mine ? { t: 'myMonster', zone } : { t: 'oppMonster', zone };
        const hl = highlights.get(cellKey(cell)) ?? null;
        return (
          <MonsterZone
            key={zone}
            zoneIndex={zone}
            mine={mine}
            monster={m}
            highlight={hl}
            peek={mine}
            suitOverrides={view.suitOverrides}
            onClick={hl ? () => onCell(cell) : undefined}
          />
        );
      })}
    </div>
  );
  const stRow = (
    <div style={{ display: 'flex', gap: 7 }}>
      {sv.spellTraps.map((st, zone) => {
        const cell: Cell = mine ? { t: 'myST', zone } : { t: 'oppST', zone };
        const hl = highlights.get(cellKey(cell)) ?? null;
        return (
          <STZone
            key={zone}
            zoneIndex={zone}
            mine={mine}
            slot={st}
            highlight={hl}
            peek={mine}
            suitOverrides={view.suitOverrides}
            onClick={hl ? () => onCell(cell) : undefined}
          />
        );
      })}
    </div>
  );
  return (
    <div style={{ flex: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '3px 0' }}>
      <Bank side={side} cards={sv.bank} highlights={highlights} onCell={onCell} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* monsters toward the center line for both sides */}
        {mine ? (
          <>
            {monsterRow}
            {stRow}
          </>
        ) : (
          <>
            {stRow}
            {monsterRow}
          </>
        )}
      </div>
      <Piles side={side} sv={sv} onOpenPile={onOpenPile} />
    </div>
  );
}

export function Board({ view, highlights, onCell, onOpenPile, center }: BoardProps) {
  const myHand = view.you.hand ?? [];
  const n = myHand.length;
  return (
    <div className="board-col">
      {/* opponent hand */}
      <div style={{ height: 56, flex: 'none', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex' }}>
          {Array.from({ length: view.opponent.handCount }, (_, i) => (
            <div key={i} style={{ margin: '0 -6px', transform: `rotate(${(i - (view.opponent.handCount - 1) / 2) * 5}deg)` }}>
              <Card faceDown w={42} h={56} />
            </div>
          ))}
        </div>
        <span
          className="gochi"
          style={{
            fontSize: 12,
            color: 'var(--cream)',
            background: 'var(--brown)',
            padding: '1px 8px',
            borderRadius: 10,
            marginLeft: 8,
            alignSelf: 'center',
          }}
        >
          {PLAYER_NAMES[AI].toUpperCase()}'S HAND · {view.opponent.handCount}
        </span>
      </div>

      <FieldRow side="opp" view={view} highlights={highlights} onCell={onCell} onOpenPile={onOpenPile} />

      {/* center strip: prompt / stack / priority */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, minHeight: 0, padding: '2px 0' }}>
        {center}
      </div>

      <FieldRow side="you" view={view} highlights={highlights} onCell={onCell} onOpenPile={onOpenPile} />

      {/* player hand fan */}
      <div style={{ flex: 'none', height: 110, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', position: 'relative' }}>
        <span
          className="marker"
          style={{
            position: 'absolute',
            left: 10,
            bottom: 40,
            fontSize: 12,
            color: 'var(--cream)',
            background: 'var(--ballpoint)',
            padding: '2px 10px',
            borderRadius: 10,
            transform: 'rotate(-2deg)',
          }}
        >
          YOUR HAND · {n}
        </span>
        {myHand.map((c, i) => {
          const cell: Cell = { t: 'hand', i };
          const hl = highlights.get(cellKey(cell)) ?? null;
          const mid = (n - 1) / 2;
          return (
            <div
              key={c.id}
              style={{
                margin: '0 -8px',
                transform: `rotate(${(i - mid) * 4.5}deg) translateY(${Math.abs(i - mid) * 4 - 6}px)`,
                zIndex: hl === 'sel' ? 3 : 1,
              }}
            >
              <Card
                rank={c.rank}
                suit={c.suit}
                w={72}
                h={100}
                highlight={hl}
                title={cardTooltip(c, view.suitOverrides)}
                onClick={hl ? () => onCell(cell) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
