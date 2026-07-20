// Cheat Sheet modal — M3 ships a visibly-placeholder page plus the canon
// corrections list from the M3 brief. Real content is a design-session task.
// M4: run-mode scrawls (sheet mods, boss cheats, curses) render as crayon
// lines at the top — config-driven, never hardcoded copy (exit criterion 6).

export function CheatSheet({ scrawls = [], onClose }: { scrawls?: string[]; onClose: () => void }) {
  return (
    <div className="overlay" style={{ zIndex: 60 }} onClick={onClose}>
      <div className="paper-modal" onClick={(e) => e.stopPropagation()} style={{ width: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="marker" style={{ fontSize: 26, color: 'var(--red)', transform: 'rotate(-1.5deg)' }}>
            MY GAME — RULES!!!
          </div>
          <button className="note-btn red" onClick={onClose}>
            close ✕
          </button>
        </div>
        {scrawls.length > 0 && (
          <div style={{ margin: '10px 0 0' }}>
            {scrawls.map((s, i) => (
              <div
                key={s}
                className="marker"
                style={{ fontSize: 18, color: 'var(--red)', transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)`, marginBottom: 4 }}
              >
                ✎ {s}
              </div>
            ))}
          </div>
        )}
        <div
          className="marker"
          style={{
            margin: '14px 0',
            padding: '10px 12px',
            border: '3px dashed var(--red)',
            color: 'var(--red)',
            fontSize: 16,
            transform: 'rotate(.6deg)',
          }}
        >
          ⚠ PLACEHOLDER — the real Cheat Sheet is TBD (design session). Until then, the corrections
          that matter:
        </div>
        <ul style={{ fontSize: 16, lineHeight: 1.5, paddingLeft: 20, margin: 0 }}>
          <li>
            Draw is <b>2 per turn</b>. The first player <b>skips the turn-1 draw</b>, and turn 1 has{' '}
            <b>no Battle Phase</b>.
          </li>
          <li>
            The game ends <b>only at a failed draw phase</b> — running out of cards mid-turn does
            not end anything.
          </li>
          <li>
            Partial banks score <b>real poker categories</b> (a 2-card KK is a pair and beats a
            4-card ace-high).
          </li>
          <li>
            Poly's blackjack total <b>starts at the target monster's card value</b>; drawn Jokers
            reshuffle; an Ace drawn (or discarded as Q/K fuel) is a 1-or-11 choice at that moment.
          </li>
          <li>
            Jokers are <b>never bankable</b>. Wall-punish removal is random. Bank-trigger removal
            and wall-punish cards are <b>removed from the game</b> (not graveyard).
          </li>
        </ul>
      </div>
    </div>
  );
}
