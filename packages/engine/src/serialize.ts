import type { GameState } from './types.js';

/** Full round-trip serialization. GameState is plain JSON-safe data by design. */
export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(data: string): GameState {
  const parsed: unknown = JSON.parse(data);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as GameState).players) ||
    (parsed as GameState).players.length !== 2 ||
    typeof (parsed as GameState).turn !== 'number' ||
    typeof (parsed as GameState).config !== 'object'
  ) {
    throw new Error('deserialize: not a serialized GameState');
  }
  return parsed as GameState;
}
