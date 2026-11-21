// Météo actuelle via Open-Meteo (gratuit, sans clé). Cache 30 min par zone de ~10 km.
import { meteoDepuisCode, type CleMeteo } from '../environnement';
import { ecrireCache, fetchJson, lireCache } from './reseau';

type ReponseOpenMeteo = { current?: { weather_code?: number; wind_speed_10m?: number } };

const VALIDITE = 30 * 60 * 1000;
/** Si pas de réseau, on garde la dernière météo connue jusqu'à 3 h. */
const VALIDITE_HORS_LIGNE = 3 * 3600 * 1000;

export async function meteoActuelle(lat: number, lon: number): Promise<CleMeteo | null> {
  const cle = `pokewalker.meteo.${lat.toFixed(1)},${lon.toFixed(1)}`;
  const enCache = await lireCache<CleMeteo>(cle, VALIDITE);
  if (enCache) return enCache;
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
      '&current=weather_code,wind_speed_10m&wind_speed_unit=kmh';
    const r = await fetchJson<ReponseOpenMeteo>(url);
    const code = r.current?.weather_code;
    if (typeof code !== 'number') throw new Error('réponse météo incomplète');
    const m = meteoDepuisCode(code, r.current?.wind_speed_10m ?? 0);
    await ecrireCache(cle, m);
    return m;
  } catch {
    return lireCache<CleMeteo>(cle, VALIDITE_HORS_LIGNE);
  }
}
