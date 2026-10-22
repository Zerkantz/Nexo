// Controla qué carta del tutorial se muestra. Guarda las cartas ya vistas en el teléfono
// para que no se repitan en cada partida.
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionPlayer, SessionState } from '../lib/types';
import { TIPS, TIPS_BY_ID, type Tip, type TipContext } from '../tutorial/tips';

const STORAGE_KEY = 'nexo_tutorial_seen';

export async function resetTutorialProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function useTutorial(state: SessionState | null, me: SessionPlayer | undefined) {
  const [seen, setSeen] = useState<Set<string> | null>(null); // null = cargando
  const [queue, setQueue] = useState<string[]>([]);
  const prevState = useRef<SessionState | null>(null);

  // Cargar las cartas ya vistas
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSeen(new Set<string>(raw ? JSON.parse(raw) : [])))
      .catch(() => setSeen(new Set()));
  }, []);

  // Revisar en cada nuevo estado si alguna mecánica nueva debe explicarse
  useEffect(() => {
    if (!state || !seen) return;
    if (state.status !== 'PLAYING') {
      prevState.current = state;
      return;
    }
    const ctx: TipContext = { state, me, prev: prevState.current };
    const triggered = TIPS.filter((t) => !seen.has(t.id) && t.trigger(ctx)).map((t) => t.id);
    prevState.current = state;
    if (triggered.length > 0) {
      setQueue((q) => [...q, ...triggered.filter((id) => !q.includes(id))]);
    }
  }, [state, me, seen]);

  const persist = (next: Set<string>) => {
    setSeen(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
  };

  const current: Tip | null =
    queue.length > 0 && state?.status === 'PLAYING' ? TIPS_BY_ID[queue[0]] ?? null : null;

  /** Cerrar la carta actual ("Entendido" / "Siguiente") */
  const dismiss = useCallback(() => {
    if (!seen || queue.length === 0) return;
    const next = new Set(seen);
    next.add(queue[0]);
    persist(next);
    setQueue((q) => q.slice(1));
  }, [seen, queue]);

  /** "Saltar tutorial": no volver a mostrar ninguna carta */
  const skipAll = useCallback(() => {
    persist(new Set(TIPS.map((t) => t.id)));
    setQueue([]);
  }, []);

  /** Volver a ver el tutorial desde el principio */
  const reset = useCallback(async () => {
    await resetTutorialProgress();
    prevState.current = null;
    setQueue([]);
    setSeen(new Set());
  }, []);

  const ctx: TipContext | null = state ? { state, me, prev: prevState.current } : null;
  const highlightTiles = current && ctx && current.highlight ? current.highlight(ctx) : [];

  return { current, highlightTiles, dismiss, skipAll, reset, pendingCount: queue.length };
}
