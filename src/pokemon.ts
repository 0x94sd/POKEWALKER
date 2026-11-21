// Données : accès au Pokédex, starters, URL des sprites.
import { POKEDEX } from './data/pokedex';
import type { EspecePokemon } from './types';

export { POKEDEX };

const PAR_ID = new Map<number, EspecePokemon>(POKEDEX.map((p) => [p.id, p]));

export function getEspece(id: number): EspecePokemon {
  const e = PAR_ID.get(id);
  if (!e) throw new Error(`Espèce inconnue : ${id}`);
  return e;
}

/** Starters proposés au premier lancement. */
export const STARTERS = [1, 4, 7, 25];

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export type StyleSprite = 'defaut' | 'rb' | 'cristal' | 'emeraude' | 'platine' | 'nb' | 'showdown' | 'home' | 'artwork';

/** Styles proposés. `shiny: false` = pas de version chromatique, on retombe sur le style par défaut. */
export const STYLES_SPRITE: Record<StyleSprite, { nom: string; chemin: string; ext: 'png' | 'gif'; shiny: boolean; anime?: boolean }> = {
  defaut: { nom: 'Classique', chemin: '', ext: 'png', shiny: true },
  rb: { nom: 'Rouge / Bleu', chemin: 'versions/generation-i/red-blue/transparent', ext: 'png', shiny: false },
  cristal: { nom: 'Cristal', chemin: 'versions/generation-ii/crystal/transparent', ext: 'png', shiny: true },
  emeraude: { nom: 'Émeraude', chemin: 'versions/generation-iii/emerald', ext: 'png', shiny: true },
  platine: { nom: 'Platine', chemin: 'versions/generation-iv/platinum', ext: 'png', shiny: true },
  nb: { nom: 'Noir / Blanc (animé)', chemin: 'versions/generation-v/black-white/animated', ext: 'gif', shiny: true, anime: true },
  showdown: { nom: 'Showdown (animé)', chemin: 'other/showdown', ext: 'gif', shiny: true, anime: true },
  home: { nom: 'HOME (3D)', chemin: 'other/home', ext: 'png', shiny: true },
  artwork: { nom: 'Artwork officiel', chemin: 'other/official-artwork', ext: 'png', shiny: true },
};

export function urlSprite(id: number, shiny = false, style: StyleSprite = 'defaut'): string {
  const st = STYLES_SPRITE[style] ?? STYLES_SPRITE.defaut;
  const cfg = shiny && !st.shiny ? STYLES_SPRITE.defaut : st;
  const base = cfg.chemin ? `${SPRITES}/${cfg.chemin}` : SPRITES;
  return `${base}${shiny ? '/shiny' : ''}/${id}.${cfg.ext}`;
}

export const NOMS_TYPES: Record<string, string> = {
  normal: 'Normal', fire: 'Feu', water: 'Eau', grass: 'Plante', electric: 'Électrik',
  ice: 'Glace', fighting: 'Combat', poison: 'Poison', ground: 'Sol', flying: 'Vol',
  psychic: 'Psy', bug: 'Insecte', rock: 'Roche', ghost: 'Spectre', dragon: 'Dragon',
  dark: 'Ténèbres', steel: 'Acier', fairy: 'Fée',
};

export const COULEURS_TYPES: Record<string, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', grass: '#7AC74C', electric: '#F7D02C',
  ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3',
  psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};
