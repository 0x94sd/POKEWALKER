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

/** Sprite par défaut (style jeux récents). Le choix du style par génération viendra plus tard. */
export function urlSprite(id: number, shiny = false): string {
  return shiny ? `${SPRITES}/shiny/${id}.png` : `${SPRITES}/${id}.png`;
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
