// Petits outils réseau : fetch avec délai max + cache AsyncStorage avec durée de validité.
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function fetchJson<T>(url: string, init: RequestInit = {}, delaiMs = 12000): Promise<T> {
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), delaiMs);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(minuteur);
  }
}

type EntreeCache<T> = { t: number; v: T };

export async function lireCache<T>(cle: string, ageMaxMs: number): Promise<T | null> {
  try {
    const txt = await AsyncStorage.getItem(cle);
    if (!txt) return null;
    const e = JSON.parse(txt) as EntreeCache<T>;
    return Date.now() - e.t <= ageMaxMs ? e.v : null;
  } catch {
    return null;
  }
}

export async function ecrireCache<T>(cle: string, v: T): Promise<void> {
  try {
    await AsyncStorage.setItem(cle, JSON.stringify({ t: Date.now(), v } satisfies EntreeCache<T>));
  } catch {
    // ignoré
  }
}
