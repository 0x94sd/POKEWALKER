// Lecture / écriture de la sauvegarde sur le téléphone (AsyncStorage = stockage local, hors ligne).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sauvegarde } from './types';

const CLE = 'pokewalker.sauvegarde.v1';

export function sauvegardeVierge(): Sauvegarde {
  return {
    version: 1,
    pasTotal: 0,
    pasDepenses: 0,
    dernierReleve: null,
    compagnonUid: null,
    collection: [],
    vus: {},
    rencontreEnCours: null,
    stats: { fouilles: 0, captures: 0, fuites: 0, shinies: 0 },
    debug: { forcerShiny: false },
  };
}

/** Complète une sauvegarde éventuellement ancienne / partielle avec les valeurs par défaut. */
export function normaliser(brut: unknown): Sauvegarde {
  const base = sauvegardeVierge();
  if (!brut || typeof brut !== 'object') return base;
  const s = brut as Partial<Sauvegarde>;
  return {
    ...base,
    ...s,
    version: 1,
    stats: { ...base.stats, ...(s.stats ?? {}) },
    debug: { ...base.debug, ...(s.debug ?? {}) },
    collection: Array.isArray(s.collection) ? s.collection : [],
    vus: s.vus && typeof s.vus === 'object' ? s.vus : {},
  };
}

export async function charger(): Promise<Sauvegarde> {
  try {
    const txt = await AsyncStorage.getItem(CLE);
    return txt ? normaliser(JSON.parse(txt)) : sauvegardeVierge();
  } catch {
    return sauvegardeVierge();
  }
}

export async function enregistrer(s: Sauvegarde): Promise<void> {
  try {
    await AsyncStorage.setItem(CLE, JSON.stringify(s));
  } catch {
    // Stockage plein ou indisponible : on ignore, l'état reste en mémoire.
  }
}

export async function effacer(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
