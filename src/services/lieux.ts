// Type de lieu autour du joueur via OpenStreetMap (API Overpass, gratuite, sans clé).
// Résultat mis en cache 30 jours par case de ~250 m : une fois visitée, une zone marche hors ligne.
import { frequentationDepuisBatiments, lieuxDepuisTags, type CleFrequentation, type CleLieu } from '../environnement';
import { ecrireCache, fetchJson, lireCache } from './reseau';

export type InfoLieu = { lieux: CleLieu[]; frequentation: CleFrequentation };

const SERVEURS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const VALIDITE = 30 * 24 * 3600 * 1000;
const PAS_GRILLE = 0.0025; // ~250 m en latitude

type ElementOverpass = { type: string; tags?: Record<string, string> };

function requete(lat: number, lon: number): string {
  const a = `(around:150,${lat},${lon})`;
  return `[out:json][timeout:20];
is_in(${lat},${lon})->.dedans;
(
  area.dedans[landuse];
  area.dedans[leisure];
  area.dedans[natural];
  area.dedans[amenity~"^(grave_yard|place_of_worship)$"];
  area.dedans[aeroway=aerodrome];
)->.zones;
.zones out tags;
(
  nwr${a}[landuse~"^(cemetery|industrial|quarry|forest|religious)$"];
  nwr${a}[amenity~"^(grave_yard|place_of_worship|fire_station)$"];
  nwr${a}[power~"^(plant|generator|substation)$"];
  nwr${a}[natural~"^(water|beach|coastline|wetland|peak|cliff|bare_rock|glacier|wood)$"];
  nwr${a}[waterway~"^(river|canal)$"];
  nwr${a}[leisure~"^(park|stadium|pitch|sports_centre|ice_rink|nature_reserve)$"];
);
out tags 100;
nwr(around:300,${lat},${lon})[building];
out count;`;
}

export function caseGrille(lat: number, lon: number): string {
  return `${Math.round(lat / PAS_GRILLE)}:${Math.round(lon / PAS_GRILLE)}`;
}

export async function lieuActuel(lat: number, lon: number): Promise<InfoLieu | null> {
  const cle = `pokewalker.lieu.${caseGrille(lat, lon)}`;
  const enCache = await lireCache<InfoLieu>(cle, VALIDITE);
  if (enCache) return enCache;

  const corps = 'data=' + encodeURIComponent(requete(lat, lon));
  for (const url of SERVEURS) {
    try {
      const r = await fetchJson<{ elements?: ElementOverpass[] }>(
        url,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: corps },
        20000,
      );
      const elements = r.elements ?? [];
      const compte = elements.find((e) => e.type === 'count');
      const batiments = Number(compte?.tags?.total ?? 0);
      const tags = elements.filter((e) => e.type !== 'count' && e.tags).map((e) => e.tags!);
      const info: InfoLieu = { lieux: lieuxDepuisTags(tags), frequentation: frequentationDepuisBatiments(batiments) };
      await ecrireCache(cle, info);
      return info;
    } catch {
      // serveur suivant
    }
  }
  return null;
}
