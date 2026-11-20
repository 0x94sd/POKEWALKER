// Types partagés par tout le jeu.

/** Données fixes d'une espèce (issues de PokéAPI, voir src/data/pokedex.ts). */
export type EspecePokemon = {
  id: number;
  nom: string;
  types: string[];
  /** Taux de capture PokéAPI : 3 (très dur) à 255 (très facile). */
  captureRate: number;
  legendaire: boolean;
  /** Cycles d'éclosion PokéAPI (servira pour les œufs). */
  eclosion: number;
  evolueDe: number | null;
};

export type Palier = 'commun' | 'peuCommun' | 'rare' | 'tresRare' | 'legendaire';

/** Un Pokémon sauvage rencontré, pas encore capturé. */
export type Rencontre = {
  especeId: number;
  shiny: boolean;
  palier: Palier;
  /** Nombre de Poké Balls lancées sur cette rencontre. */
  lancers: number;
};

/** Un Pokémon capturé, dans la collection du joueur. */
export type PokemonCapture = {
  uid: string;
  especeId: number;
  shiny: boolean;
  surnom?: string;
  captureLe: number; // timestamp ms
  /** XP gagnée en tant que compagnon. */
  xp: number;
};

export type ResultatLancer = 'capture' | 'echappe' | 'fuite';

/** Tout ce qui est sauvegardé sur le téléphone. */
export type Sauvegarde = {
  version: 1;
  /** Total de pas comptés depuis le début (podomètre + bonus debug). */
  pasTotal: number;
  /** Pas déjà dépensés en fouilles. */
  pasDepenses: number;
  /** Dernier relevé du podomètre (ms) : sert à rattraper les pas faits app fermée. */
  dernierReleve: number | null;
  /** uid du Pokémon compagnon (null tant que le starter n'est pas choisi). */
  compagnonUid: string | null;
  collection: PokemonCapture[];
  /** id d'espèce -> nombre de fois vu. */
  vus: Record<number, number>;
  rencontreEnCours: Rencontre | null;
  stats: {
    fouilles: number;
    captures: number;
    fuites: number;
    shinies: number;
  };
  debug: {
    forcerShiny: boolean;
  };
};
