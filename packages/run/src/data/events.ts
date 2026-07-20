// The 12 demo-act events (ratified working set, recommendations §4).
// Outcomes are a closed union — NOT a scripting language. Text/choices/amounts
// are data; the reducer implements each outcome kind exactly once.
// Amounts are provisional economy numbers.

import type { EventDef } from '../types.js';

export const EVENTS: EventDef[] = [
  {
    id: 'lemonade-stand',
    name: 'Lemonade Stand',
    text: 'Your stand actually made money this week. The till is right there.',
    choices: [
      { id: 'take', label: 'Pocket the till (+15)', outcomes: [{ kind: 'gainCurrency', amount: 15 }] },
      { id: 'leave', label: 'Leave it for next week', outcomes: [] },
    ],
  },
  {
    id: 'found-a-pack',
    name: 'Found a Pack',
    text: 'A Corner Store pack, still sealed, under the porch. Finders keepers.',
    choices: [
      { id: 'open', label: 'Rip it open now', outcomes: [{ kind: 'grantPack', pack: 'cornerStore' }] },
      { id: 'walk', label: 'Too suspicious. Walk away.', outcomes: [] },
    ],
  },
  {
    id: 'yard-sale',
    name: 'Yard Sale',
    text: 'A shoebox of loose stickers, 10 coins for a rummage. Some are good.',
    choices: [
      {
        id: 'rummage',
        label: 'Pay 10, pick one of three',
        cost: 10,
        outcomes: [{ kind: 'pickSticker', count: 3 }],
      },
      { id: 'pass', label: 'Not today', outcomes: [] },
    ],
  },
  {
    id: 'swap-meet',
    name: 'Swap Meet',
    text: 'Everyone is re-slotting their decks on the gym floor. Yours could use it.',
    choices: [
      {
        id: 'swap',
        label: 'Move one sticker to another card',
        requires: ['hasAnySticker'],
        outcomes: [{ kind: 'moveSticker' }],
      },
      { id: 'watch', label: 'Just watch', outcomes: [] },
    ],
  },
  {
    id: 'trim-a-card',
    name: 'Trim a Card',
    text: 'Scissors, a steady hand, and one card you never wanted anyway.',
    choices: [
      {
        id: 'trim',
        label: 'Remove 1 card from your deck',
        requires: ['deckAboveFloor'],
        outcomes: [{ kind: 'removeCard', count: 1 }],
      },
      { id: 'keep', label: 'Keep the deck whole', outcomes: [] },
    ],
  },
  {
    id: 'double-down',
    name: 'Double Down',
    text: 'The copier in the library works if you kick it. Commons only — rares smudge.',
    choices: [
      {
        id: 'copy',
        label: 'Copy one of your common stickers onto another card',
        requires: ['hasCommonSticker'],
        outcomes: [{ kind: 'duplicateSticker' }],
      },
      { id: 'no', label: 'The librarian is watching', outcomes: [] },
    ],
  },
  {
    id: 'the-dare',
    name: 'The Dare',
    text: '"Flip for it. Heads, my best sticker. Tails, your lunch money." Everyone is watching.',
    choices: [
      {
        id: 'flip',
        label: 'Take the dare (50/50)',
        outcomes: [
          {
            kind: 'random',
            chance: 0.5,
            win: [{ kind: 'grantSticker', tier: 'rare' }],
            lose: [{ kind: 'loseCurrency', amount: 25 }],
          },
        ],
      },
      { id: 'refuse', label: 'Walk away', outcomes: [] },
    ],
  },
  {
    id: 'mystery-box',
    name: 'Mystery Box',
    text: 'A shoebox labeled "DO NOT OPEN". It rattles. It might be great.',
    choices: [
      {
        id: 'open',
        label: 'Open it',
        outcomes: [
          {
            kind: 'random',
            chance: 0.5,
            win: [{ kind: 'grantSticker', tier: 'uncommon' }],
            lose: [
              {
                kind: 'tempMod',
                patch: { handLimit: 4 },
                label: 'CURSED: hand limit 4, next duel only',
              },
            ],
          },
        ],
      },
      { id: 'obey', label: 'It says do not open', outcomes: [] },
    ],
  },
  {
    id: 'the-bully',
    name: 'The Bully',
    text: 'He is standing in the only hallway. "Toll is 15. Or we play for it — my rules."',
    choices: [
      { id: 'pay', label: 'Pay the 15', cost: 15, outcomes: [] },
      {
        id: 'fight',
        label: 'Play him (handicapped, big reward)',
        outcomes: [{ kind: 'eliteDuel', encounterId: 'bully' }],
      },
    ],
  },
  {
    id: 'overtrim',
    name: 'Overtrim',
    text: 'Two cards at once. The deck gets faster — and your poker odds get thinner.',
    choices: [
      {
        id: 'trim2',
        label: 'Remove 2 cards',
        requires: ['deckAboveFloor'],
        outcomes: [{ kind: 'removeCard', count: 2 }],
      },
      { id: 'no', label: 'One goal at a time', outcomes: [] },
    ],
  },
  {
    id: 'recess',
    name: 'Recess',
    text: 'Twenty whole minutes. Nobody wants to play cards. It is glorious.',
    choices: [
      {
        id: 'rest',
        label: 'Recover a strike',
        requires: ['strikesBelowMax'],
        outcomes: [{ kind: 'restoreStrike', amount: 1 }],
      },
      { id: 'skip', label: 'Keep moving', outcomes: [] },
    ],
  },
  {
    id: 'rival-riley',
    name: 'Rival Riley',
    text: 'Riley, again. "Best sticker in my binder says you will not." It is a good sticker.',
    choices: [
      {
        id: 'duel',
        label: 'Play Riley (tougher, rare reward)',
        outcomes: [{ kind: 'eliteDuel', encounterId: 'rival-riley' }],
      },
      { id: 'later', label: '"Later, Riley."', outcomes: [] },
    ],
  },
];
