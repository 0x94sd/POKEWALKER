// Règles du jeu, 100 % pures : aucun affichage, aucun stockage.
// Le hasard passe par un paramètre `alea` (par défaut Math.random) pour pouvoir tester.
import { POKEDEX } from './pokemon';
import type { Buisson, EspecePokemon, Oeuf, Palier, Rencontre, ResultatLancer } from './types';

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

/** Espèces forcées en "très rare" (starters, Évoli, fossiles, dragons...) malgré leur taux de capture. */
export const FORCES_TRES_RARE = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, // starters et évolutions
  131, // Lokhlass
  133, 134, 135, 136, // Évoli et évolutions
  138, 139, 140, 141, 142, // fossiles
  147, 148, 149, // Minidraco, Draco, Dracolosse
]);

/** Palier d'une espèce, déduit de son taux de capture PokéAPI. */
export function palierDe(e: EspecePokemon): Palier {
  if (e.legendaire) return 'legendaire';
  if (FORCES_TRES_RARE.has(e.id)) return 'tresRare';
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

/** Options qui modifient un tirage (chaîne radar, météo, lieu, debug). */
export type OptionsTirage = {
  forcerShiny?: boolean;
  /** Multiplie la chance de shiny (1 = normal). */
  multShiny?: number;
  /** Multiplie le poids des paliers rare, très rare et légendaire (1 = normal). */
  multRare?: number;
  /** Types favorisés (météo, lieu) : leurs espèces pèsent POIDS_TYPE_FAVORI fois plus dans leur palier. */
  typesFavoris?: string[];
};

export const POIDS_TYPE_FAVORI = 3;

function poidsPalier(p: Palier, multRare: number): number {
  const base = INFOS_PALIER[p].poids;
  return p === 'commun' || p === 'peuCommun' ? base : base * multRare;
}

/** Étape 1 du tirage : quel palier ? (pondéré par INFOS_PALIER.poids) */
export function tirerPalier(alea: Alea = Math.random, multRare = 1): Palier {
  const dispo = PALIERS.filter((p) => PAR_PALIER[p].length > 0);
  const total = dispo.reduce((s, p) => s + poidsPalier(p, multRare), 0);
  let x = alea() * total;
  for (const p of dispo) {
    x -= poidsPalier(p, multRare);
    if (x < 0) return p;
  }
  return dispo[0];
}

/** Étape 2 : une espèce du palier, les types favorisés pèsent plus lourd. */
export function tirerEspece(liste: EspecePokemon[], typesFavoris: string[] = [], alea: Alea = Math.random): EspecePokemon {
  const poids = liste.map((e) => (e.types.some((t) => typesFavoris.includes(t)) ? POIDS_TYPE_FAVORI : 1));
  const total = poids.reduce((a, b) => a + b, 0);
  let x = alea() * total;
  for (let i = 0; i < liste.length; i++) {
    x -= poids[i];
    if (x < 0) return liste[i];
  }
  return liste[liste.length - 1];
}

/** Tirage complet en 2 temps : palier, puis Pokémon dans ce palier. */
export function tirerRencontre(opts: OptionsTirage = {}, alea: Alea = Math.random): Rencontre {
  const palier = tirerPalier(alea, opts.multRare ?? 1);
  const espece = tirerEspece(PAR_PALIER[palier], opts.typesFavoris, alea);
  return {
    especeId: espece.id,
    palier,
    shiny: opts.forcerShiny === true || alea() < CHANCE_SHINY * (opts.multShiny ?? 1),
    lancers: 0,
    source: 'herbes',
  };
}

// ---------- Poké Radar (3 buissons) ----------

export const CHAINE_MAX = 40;

/** Bonus de la chaîne radar : jusqu'à x6 shiny (≈1/85) et x3 rares à 40 captures d'affilée. */
export function bonusChaine(chaine: number): { multShiny: number; multRare: number } {
  const c = Math.min(Math.max(0, chaine), CHAINE_MAX);
  return { multShiny: 1 + c / 8, multRare: 1 + c * 0.05 };
}

export function intensiteDe(p: Palier): 1 | 2 | 3 {
  if (p === 'commun' || p === 'peuCommun') return 1;
  if (p === 'rare') return 2;
  return 3;
}

export function tirerBuissons(chaine: number, opts: OptionsTirage = {}, alea: Alea = Math.random): Buisson[] {
  const bonus = bonusChaine(chaine);
  return [0, 1, 2].map(() => {
    const r = tirerRencontre(
      { ...opts, multShiny: (opts.multShiny ?? 1) * bonus.multShiny, multRare: (opts.multRare ?? 1) * bonus.multRare },
      alea,
    );
    return { rencontre: { ...r, source: 'radar' as const }, intensite: intensiteDe(r.palier), brille: r.shiny };
  });
}

// ---------- Œufs ----------

/** Chance de trouver un œuf à chaque fouille (en plus de la rencontre). */
export const CHANCE_OEUF = 0.1;
/** Pas par cycle d'éclosion PokéAPI (Magicarpe 5 cycles = 640 pas, Bulbizarre 20 = 2 560, Ronflex 40 = 5 120). */
export const PAS_PAR_CYCLE = 128;

/** Espèces qui peuvent sortir d'un œuf : formes de base non légendaires. */
export const ESPECES_OEUF = POKEDEX.filter((e) => e.evolueDe === null && !e.legendaire);

export function creerOeuf(opts: { forcerShiny?: boolean } = {}, alea: Alea = Math.random): Oeuf {
  const e = ESPECES_OEUF[Math.floor(alea() * ESPECES_OEUF.length)];
  return {
    uid: nouvelUid(),
    especeId: e.id,
    shiny: opts.forcerShiny === true || alea() < CHANCE_SHINY,
    pasRequis: Math.max(1, e.eclosion) * PAS_PAR_CYCLE,
    pasFaits: 0,
    trouveLe: Date.now(),
  };
}

/** Avance tous les œufs (ils incubent tous en même temps, sans limite). */
export function avancerOeufs(oeufs: Oeuf[], pas: number): { restants: Oeuf[]; eclos: Oeuf[] } {
  const restants: Oeuf[] = [];
  const eclos: Oeuf[] = [];
  for (const o of oeufs) {
    const n = { ...o, pasFaits: o.pasFaits + pas };
    (n.pasFaits >= n.pasRequis ? eclos : restants).push(n);
  }
  return { restants, eclos };
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
