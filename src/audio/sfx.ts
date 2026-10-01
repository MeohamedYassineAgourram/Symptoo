/**
 * Sound hooks (README §12). Audio files arrive in Phase 4; until then every call is a no-op
 * that also emits a `semio:sfx` DOM event, so the Howler wrapper can subscribe without
 * touching game code.
 */
export type Sfx =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'combo'
  | 'xp'
  | 'coin'
  | 'rank-up'
  | 'achievement'
  | 'streak'
  | 'unlock'
  | 'flip'
  | 'match'
  | 'garde-end';

export function playSfx(name: Sfx): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('semio:sfx', { detail: name }));
}
