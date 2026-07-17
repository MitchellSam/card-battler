// Card: mirrors mockups/Card.dc.html (rank, suit, faceDown, rotated + size).
// Used everywhere: hand, zones, banks, graveyard, stack, Poly.

import type { CSSProperties } from 'react';

export type Highlight = 'act' | 'sel' | 'target' | null;

export interface CardProps {
  rank?: string;
  suit?: string | null;
  faceDown?: boolean;
  rotated?: boolean;
  w?: number;
  h?: number;
  highlight?: Highlight;
  onClick?: () => void;
  title?: string;
  style?: CSSProperties;
}

const RED_SUITS = new Set(['♥', '♦']);

export function Card({
  rank = 'A',
  suit = '♠',
  faceDown = false,
  rotated = false,
  w = 54,
  h = 76,
  highlight = null,
  onClick,
  title,
  style,
}: CardProps) {
  const joker = rank === 'JOKER';
  const color = joker ? '#7a3fa0' : RED_SUITS.has(suit ?? '') ? '#c0392b' : '#242b3a';
  const cls = highlight === 'act' ? 'hl-act' : highlight === 'sel' ? 'hl-sel' : highlight === 'target' ? 'hl-target' : '';
  return (
    <div
      className={cls}
      onClick={onClick}
      title={title}
      style={{
        width: w,
        height: h,
        position: 'relative',
        borderRadius: 6,
        background: '#fbfaf3',
        border: '1.5px solid #2b2b2b',
        boxShadow: '0 2px 3px rgba(0,0,0,.28)',
        fontFamily: "'Gochi Hand', cursive",
        flex: 'none',
        transform: rotated ? 'rotate(90deg)' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {faceDown ? (
        <div
          style={{
            position: 'absolute',
            inset: 3,
            borderRadius: 4,
            border: '2px solid #f4efe0',
            backgroundColor: '#b8503f',
            backgroundImage:
              'repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 5px,transparent 5px 11px),repeating-linear-gradient(-45deg,rgba(0,0,0,.10) 0 5px,transparent 5px 11px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="marker"
            style={{ color: '#f7f2e2', fontSize: h * 0.26, transform: 'rotate(-9deg)', textShadow: '1px 1px 0 rgba(0,0,0,.25)' }}
          >
            ★
          </span>
        </div>
      ) : (
        <>
          <div style={{ position: 'absolute', top: 2, left: 4, lineHeight: 0.85, color, textAlign: 'center' }}>
            <div style={{ fontSize: Math.max(10, h * 0.19), fontWeight: 700 }}>{joker ? 'JKR' : rank}</div>
            <div style={{ fontSize: Math.max(8, h * 0.15) }}>{suit ?? ''}</div>
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: h * 0.42,
              color,
              opacity: 0.82,
            }}
          >
            {joker ? '🃏' : suit}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 2,
              right: 4,
              transform: 'rotate(180deg)',
              lineHeight: 0.85,
              color,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: Math.max(10, h * 0.19), fontWeight: 700 }}>{joker ? 'JKR' : rank}</div>
            <div style={{ fontSize: Math.max(8, h * 0.15) }}>{suit ?? ''}</div>
          </div>
        </>
      )}
    </div>
  );
}
