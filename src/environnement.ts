// Règles pures : comment la météo, l'heure et le lieu influencent les rencontres.
// Aucune requête réseau ici (voir src/services/).

export type CleMeteo = 'soleil' | 'partiel' | 'couvert' | 'brouillard' | 'pluie' | 'neige' | 'orage' | 'vent';

export const METEOS: Record<CleMeteo, { nom: string; icone: string; types: string[] }> = {
  soleil: { nom: 'Ensoleillé', icone: '☀️', types: ['fire', 'grass', 'ground'] },
  partiel: { nom: 'Partiellement nuageux', icone: '⛅', types: ['normal', 'rock'] },
  couvert: { nom: 'Couvert', icone: '☁️', types: ['fairy', 'fighting', 'poison'] },
  brouillard: { nom: 'Brouillard', icone: '🌫️', types: ['dark', 'ghost'] },
  pluie: { nom: 'Pluie', icone: '🌧️', types: ['water', 'electric', 'bug'] },
  neige: { nom: 'Neige', icone: '❄️', types: ['ice', 'steel'] },
  orage: { nom: 'Orage', icone: '⛈️', types: ['electric', 'water', 'dragon'] },
  vent: { nom: 'Venteux', icone: '🌬️', types: ['dragon', 'flying', 'psychic'] },
};

/** Code météo WMO (Open-Meteo) + vent (km/h) -> météo du jeu. */
export function meteoDepuisCode(code: number, ventKmh = 0): CleMeteo {
  if (code >= 95) return 'orage';
  if (ventKmh >= 30) return 'vent';
  if (code === 0 || code === 1) return 'soleil';
  if (code === 2) return 'partiel';
  if (code === 3) return 'couvert';
  if (code === 45 || code === 48) return 'brouillard';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'neige';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'pluie';
  return 'partiel';
}

// ---------- Moment de la journée (marche hors ligne) ----------

export type CleMoment = 'jour' | 'nuit';

export const MOMENTS: Record<CleMoment, { nom: string; icone: string; types: string[] }> = {
  jour: { nom: 'Jour', icone: '🌤️', types: [] },
  nuit: { nom: 'Nuit', icone: '🌙', types: ['ghost', 'dark', 'poison'] },
};

export function momentDe(d: Date): CleMoment {
  const h = d.getHours();
  return h >= 21 || h < 6 ? 'nuit' : 'jour';
}

// ---------- Lieux spéciaux (tags OpenStreetMap) ----------

export type CleLieu =
  | 'cimetiere' | 'centrale' | 'eau' | 'foret' | 'parc' | 'industrie' | 'roche' | 'campagne'
  | 'sport' | 'culte' | 'pompiers' | 'glace' | 'aeroport';

export const LIEUX: Record<CleLieu, { nom: string; icone: string; types: string[] }> = {
  cimetiere: { nom: 'Cimetière', icone: '🪦', types: ['ghost'] },
  centrale: { nom: 'Installation électrique', icone: '⚡', types: ['electric'] },
  eau: { nom: "Point d'eau", icone: '🌊', types: ['water'] },
  foret: { nom: 'Forêt', icone: '🌲', types: ['bug', 'grass'] },
  parc: { nom: 'Parc', icone: '🌳', types: ['grass', 'normal'] },
  industrie: { nom: 'Zone industrielle', icone: '🏭', types: ['poison', 'steel'] },
  roche: { nom: 'Zone rocheuse', icone: '⛰️', types: ['rock', 'ground'] },
  campagne: { nom: 'Campagne', icone: '🌾', types: ['normal', 'grass'] },
  sport: { nom: 'Terrain de sport', icone: '🏟️', types: ['fighting'] },
  culte: { nom: 'Lieu de culte', icone: '⛪', types: ['psychic'] },
  pompiers: { nom: 'Caserne de pompiers', icone: '🚒', types: ['fire'] },
  glace: { nom: 'Glace', icone: '🧊', types: ['ice'] },
  aeroport: { nom: 'Aéroport', icone: '✈️', types: ['flying'] },
};

/** Règles tag OSM -> lieu. Ordre = priorité d'affichage (le plus spécial d'abord). */
const REGLES_OSM: { cle: string; valeurs: string[]; lieu: CleLieu }[] = [
  { cle: 'landuse', valeurs: ['cemetery'], lieu: 'cimetiere' },
  { cle: 'amenity', valeurs: ['grave_yard'], lieu: 'cimetiere' },
  { cle: 'power', valeurs: ['plant', 'generator', 'substation'], lieu: 'centrale' },
  { cle: 'amenity', valeurs: ['fire_station'], lieu: 'pompiers' },
  { cle: 'leisure', valeurs: ['ice_rink'], lieu: 'glace' },
  { cle: 'natural', valeurs: ['glacier'], lieu: 'glace' },
  { cle: 'aeroway', valeurs: ['aerodrome'], lieu: 'aeroport' },
  { cle: 'amenity', valeurs: ['place_of_worship'], lieu: 'culte' },
  { cle: 'landuse', valeurs: ['religious'], lieu: 'culte' },
  { cle: 'natural', valeurs: ['water', 'beach', 'coastline', 'wetland'], lieu: 'eau' },
  { cle: 'waterway', valeurs: ['river', 'canal', 'stream'], lieu: 'eau' },
  { cle: 'landuse', valeurs: ['industrial'], lieu: 'industrie' },
  { cle: 'landuse', valeurs: ['quarry'], lieu: 'roche' },
  { cle: 'natural', valeurs: ['peak', 'cliff', 'bare_rock', 'scree'], lieu: 'roche' },
  { cle: 'landuse', valeurs: ['forest'], lieu: 'foret' },
  { cle: 'natural', valeurs: ['wood', 'scrub'], lieu: 'foret' },
  { cle: 'leisure', valeurs: ['nature_reserve'], lieu: 'foret' },
  { cle: 'leisure', valeurs: ['stadium', 'pitch', 'sports_centre'], lieu: 'sport' },
  { cle: 'leisure', valeurs: ['park', 'garden'], lieu: 'parc' },
  { cle: 'landuse', valeurs: ['farmland', 'meadow', 'farmyard', 'orchard', 'vineyard', 'grass'], lieu: 'campagne' },
];

const ORDRE_LIEUX: CleLieu[] = [...new Set(REGLES_OSM.map((r) => r.lieu))];

/** Liste des tags OSM trouvés autour -> lieux reconnus (triés par priorité). */
export function lieuxDepuisTags(tags: Record<string, string>[]): CleLieu[] {
  const trouves = new Set<CleLieu>();
  for (const t of tags) {
    for (const r of REGLES_OSM) {
      const v = t[r.cle];
      if (v && r.valeurs.includes(v)) trouves.add(r.lieu);
    }
  }
  return ORDRE_LIEUX.filter((l) => trouves.has(l));
}

// ---------- Fréquentation ----------

export type CleFrequentation = 'isole' | 'calme' | 'urbain';

export const FREQUENTATIONS: Record<CleFrequentation, { nom: string; multRare: number }> = {
  isole: { nom: 'Coin isolé', multRare: 2 },
  calme: { nom: 'Coin calme', multRare: 1.4 },
  urbain: { nom: 'Zone fréquentée', multRare: 1 },
};

/** Nombre de bâtiments dans un rayon de 300 m -> fréquentation estimée. */
export function frequentationDepuisBatiments(n: number): CleFrequentation {
  if (n < 5) return 'isole';
  if (n < 40) return 'calme';
  return 'urbain';
}

// ---------- Synthèse ----------

export type Contexte = {
  meteo: CleMeteo | null;
  moment: CleMoment;
  lieux: CleLieu[];
  frequentation: CleFrequentation | null;
};

/** Contexte -> options de tirage (types favorisés et bonus de rareté). */
export function bonusContexte(c: Contexte): { typesFavoris: string[]; typesLieu: string[]; multRare: number } {
  const typesFavoris = [...(c.meteo ? METEOS[c.meteo].types : []), ...MOMENTS[c.moment].types];
  const typesLieu = c.lieux.flatMap((l) => LIEUX[l].types);
  const multRare = c.frequentation ? FREQUENTATIONS[c.frequentation].multRare : 1;
  return { typesFavoris: [...new Set(typesFavoris)], typesLieu: [...new Set(typesLieu)], multRare };
}
