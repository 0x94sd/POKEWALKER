// Règles du jeu, 100 % pures : aucun affichage, aucun stockage.
// Le hasard passe par un paramètre `alea` (par défaut Math.random) pour pouvoir tester.
import { POKEDEX } from './pokemon';
import type { Buisson, EspecePokemon, Oeuf, Palier, Rencontre, ResultatLancer, Soins } from './types';

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
  /** Types favorisés par la météo / l'heure : leurs espèces pèsent POIDS_TYPE_FAVORI fois plus dans leur palier. */
  typesFavoris?: string[];
  /** Types favorisés par un lieu spécial (cimetière, centrale...) : POIDS_TYPE_LIEU fois plus. Cumulable. */
  typesLieu?: string[];
};

export const POIDS_TYPE_FAVORI = 3;
export const POIDS_TYPE_LIEU = 5;

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

/** Poids d'une espèce dans son palier selon les types favorisés. */
export function poidsEspece(e: EspecePokemon, typesFavoris: string[] = [], typesLieu: string[] = []): number {
  const meteo = e.types.some((t) => typesFavoris.includes(t)) ? POIDS_TYPE_FAVORI : 1;
  const lieu = e.types.some((t) => typesLieu.includes(t)) ? POIDS_TYPE_LIEU : 1;
  return meteo * lieu;
}

/** Étape 2 : une espèce du palier, les types favorisés pèsent plus lourd. */
export function tirerEspece(
  liste: EspecePokemon[], typesFavoris: string[] = [], typesLieu: string[] = [], alea: Alea = Math.random,
): EspecePokemon {
  const poids = liste.map((e) => poidsEspece(e, typesFavoris, typesLieu));
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
  const espece = tirerEspece(PAR_PALIER[palier], opts.typesFavoris, opts.typesLieu, alea);
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
export function chanceCapture(e: EspecePokemon, bonus = 0): number {
  return Math.min(0.95, 0.15 + 0.75 * (e.captureRate / 255) + bonus);
}

/** Chance que le Pokémon s'enfuie après un lancer raté. */
export function chanceFuite(e: EspecePokemon): number {
  return 0.05 + 0.15 * (1 - e.captureRate / 255);
}

export function resultatLancer(e: EspecePokemon, bonus = 0, alea: Alea = Math.random): ResultatLancer {
  if (alea() < chanceCapture(e, bonus)) return 'capture';
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

// ---------- Soins du compagnon (tamagotchi) ----------
// Aucune baisse avec le temps : les jauges ne bougent qu'en marchant ou en s'occupant du compagnon.
// Une jauge basse ne bloque jamais rien : elle réduit seulement les bonus.


export const SOINS_DEFAUT: Soins = { satiete: 80, bonheur: 50, energie: 100 };

const borne = (v: number) => Math.max(0, Math.min(100, v));

export function soinsDe(p: { soins?: Soins }): Soins {
  return p.soins ?? SOINS_DEFAUT;
}

/** Marcher : creuse l'appétit (-1 / 50 pas), fatigue (-1 / 40 pas), rend heureux (+1 / 100 pas) sauf si affamé ou épuisé.
 * Calcul par tranches de 100 pas pour qu'un gros rattrapage (app fermée) donne le même résultat que la marche en direct. */
export function soinsApresMarche(s: Soins, pas: number): Soins {
  let r = s;
  let reste = Math.max(0, pas);
  while (reste > 0) {
    const t = Math.min(100, reste);
    reste -= t;
    const malheureux = r.satiete < 20 || r.energie < 20;
    r = {
      satiete: borne(r.satiete - t / 50),
      energie: borne(r.energie - t / 40),
      bonheur: borne(r.bonheur + (malheureux ? -t / 100 : t / 100)),
    };
  }
  return r;
}

export function nourrir(s: Soins): Soins {
  return { ...s, satiete: borne(s.satiete + 25), bonheur: borne(s.bonheur + (s.satiete < 50 ? 4 : 1)) };
}

export function caresser(s: Soins): Soins {
  return { ...s, bonheur: borne(s.bonheur + 2) };
}

export function pause(s: Soins): Soins {
  return { ...s, energie: borne(s.energie + 35) };
}

/** Multiplicateur d'XP du compagnon : x0.5 (triste) à x1.5 (aux anges), divisé par 2 s'il a faim ou est épuisé. */
export function multXp(s: Soins): number {
  let m = 0.5 + s.bonheur / 100;
  if (s.satiete < 20) m /= 2;
  if (s.energie < 20) m /= 2;
  return m;
}

/** Compagnon très heureux : il t'aide, +5 points de chance de capture. */
export function bonusCaptureCompagnon(s: Soins): number {
  return s.bonheur >= 80 && s.satiete >= 20 && s.energie >= 20 ? 0.05 : 0;
}

export function humeur(s: Soins): { texte: string; icone: string } {
  if (s.satiete < 20) return { texte: 'a faim', icone: '🍽️' };
  if (s.energie < 20) return { texte: 'est épuisé', icone: '😴' };
  if (s.bonheur >= 80) return { texte: 'est aux anges', icone: '💖' };
  if (s.bonheur >= 50) return { texte: 'est content', icone: '🙂' };
  if (s.bonheur >= 25) return { texte: 'est un peu triste', icone: '😕' };
  return { texte: 'boude', icone: '😞' };
}
