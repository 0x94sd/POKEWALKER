// Règles du jeu, 100 % pures : aucun affichage, aucun stockage.
// Le hasard passe par un paramètre `alea` (par défaut Math.random) pour pouvoir tester.
import { POKEDEX } from './pokemon';
import type { EspecePokemon, Palier, Rencontre, ResultatLancer } from './types';

export type Alea = () => number;

// ---------- Pas et fouilles ----------

export const COUT_FOUILLE = 250;

export function fouillesDispo(pasTotal: number, pasDepenses: number): number {
  return Math.max(0, Math.floor((pasTotal - pasDepenses) / COUT_FOUILLE));
}

/** Pas restants avant la prochaine fouille. */
export function pasAvantProchaine(pasTotal: number, pasDepenses: number): number {
  const reste = (pasTotal - pasDepenses) % COUT_FOUILLE;
  return COUT_FOUILLE - Math.max(0, reste);
}

// ---------- Rareté ----------

export const CHANCE_SHINY = 1 / 512;

export const PALIERS: Palier[] = ['commun', 'peuCommun', 'rare', 'tresRare', 'legendaire'];

export const INFOS_PALIER: Record<Palier, { nom: string; poids: number; couleur: string }> = {
  commun: { nom: 'Commun', poids: 60, couleur: '#8a8a8a' },
  peuCommun: { nom: 'Peu commun', poids: 25, couleur: '#3a9d23' },
  rare: { nom: 'Rare', poids: 10, couleur: '#2f6fd6' },
  tresRare: { nom: 'Très rare', poids: 4, couleur: '#9b3fd1' },
  legendaire: { nom: 'Légendaire', poids: 1, couleur: '#e0a100' },
};

/** Palier d'une espèce, déduit de son taux de capture PokéAPI. */
export function palierDe(e: EspecePokemon): Palier {
  if (e.legendaire) return 'legendaire';
  if (e.captureRate >= 150) return 'commun';
  if (e.captureRate >= 75) return 'peuCommun';
  if (e.captureRate >= 45) return 'rare';
  return 'tresRare';
}

const PAR_PALIER: Record<Palier, EspecePokemon[]> = {
  commun: [], peuCommun: [], rare: [], tresRare: [], legendaire: [],
};
for (const e of POKEDEX) PAR_PALIER[palierDe(e)].push(e);

export function especesDuPalier(p: Palier): EspecePokemon[] {
  return PAR_PALIER[p];
}

/** Étape 1 du tirage : quel palier ? (pondéré par INFOS_PALIER.poids) */
export function tirerPalier(alea: Alea = Math.random): Palier {
  const dispo = PALIERS.filter((p) => PAR_PALIER[p].length > 0);
  const total = dispo.reduce((s, p) => s + INFOS_PALIER[p].poids, 0);
  let x = alea() * total;
  for (const p of dispo) {
    x -= INFOS_PALIER[p].poids;
    if (x < 0) return p;
  }
  return dispo[0];
}

/** Tirage complet en 2 temps : palier, puis Pokémon au hasard dans ce palier. */
export function tirerRencontre(opts: { forcerShiny?: boolean } = {}, alea: Alea = Math.random): Rencontre {
  const palier = tirerPalier(alea);
  const liste = PAR_PALIER[palier];
  const espece = liste[Math.floor(alea() * liste.length)];
  return {
    especeId: espece.id,
    palier,
    shiny: opts.forcerShiny === true || alea() < CHANCE_SHINY,
    lancers: 0,
  };
}

// ---------- Capture ----------

/** Chance de capture d'un lancer (0..1). 255 -> 90 %, 45 -> ~28 %, 3 -> ~16 %. */
export function chanceCapture(e: EspecePokemon): number {
  return 0.15 + 0.75 * (e.captureRate / 255);
}

/** Chance que le Pokémon s'enfuie après un lancer raté. */
export function chanceFuite(e: EspecePokemon): number {
  return 0.05 + 0.15 * (1 - e.captureRate / 255);
}

export function resultatLancer(e: EspecePokemon, alea: Alea = Math.random): ResultatLancer {
  if (alea() < chanceCapture(e)) return 'capture';
  if (alea() < chanceFuite(e)) return 'fuite';
  return 'echappe';
}

// ---------- Compagnon ----------

/** XP gagnée par le compagnon : 1 XP pour 10 pas, +bonus à chaque capture. */
export const PAS_PAR_XP = 10;
export const XP_CAPTURE = 25;

/** Niveau (1..100) selon l'XP : courbe simple, le niveau n demande 10*n² XP cumulée. */
export function niveauDepuisXp(xp: number): number {
  return Math.min(100, Math.max(1, Math.floor(Math.sqrt(xp / 10)) + 1));
}

export function xpPourNiveau(niveau: number): number {
  return 10 * (niveau - 1) ** 2;
}

/** Progression (0..1) vers le niveau suivant. */
export function progressionNiveau(xp: number): number {
  const n = niveauDepuisXp(xp);
  if (n >= 100) return 1;
  const bas = xpPourNiveau(n);
  const haut = xpPourNiveau(n + 1);
  return (xp - bas) / (haut - bas);
}

export function nouvelUid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
