// Root: top-level mode router (M4 Part C). Account home → run shell (node map
// → duels/events/shops → boss → summary) or the constructed sandbox duel.

import { useState } from 'react';
import { ConstructedApp } from './App.js';
import { IdbStorage } from './run/idbStorage.js';
import { RunSession } from './run/RunSession.js';
import { AccountHome, RunShell } from './run/RunShell.js';

type Mode = 'home' | 'run' | 'constructed';

export function Root() {
  const [mode, setMode] = useState<Mode>('home');
  const [rs] = useState(() => new RunSession(new IdbStorage()));

  if (mode === 'constructed') {
    return (
      <>
        <div style={{ position: 'fixed', left: 10, top: 10, zIndex: 90 }}>
          <button className="note-btn" onClick={() => setMode('home')}>
            ← my room
          </button>
        </div>
        <ConstructedApp />
      </>
    );
  }
  if (mode === 'run') return <RunShell rs={rs} onExit={() => setMode('home')} />;
  return (
    <AccountHome rs={rs} onEnterRun={() => setMode('run')} onQuickDuel={() => setMode('constructed')} />
  );
}
