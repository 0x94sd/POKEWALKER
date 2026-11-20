// Génère src/data/pokedex.ts depuis les données brutes de PokéAPI (api-data sur GitHub).
// Usage : node scripts/genererPokedex.mjs [maxId]
import { writeFileSync } from 'node:fs';

const BASE = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2';
const MAX = Number(process.argv[2] ?? 151);

async function json(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
    } catch {}
    await new Promise((r) => setTimeout(r, 500 * (i + 1)));
  }
  throw new Error('Echec ' + url);
}

const liste = [];
for (let id = 1; id <= MAX; id++) {
  const [esp, pkm] = await Promise.all([
    json(`${BASE}/pokemon-species/${id}/index.json`),
    json(`${BASE}/pokemon/${id}/index.json`),
  ]);
  const nom = esp.names.find((n) => n.language.name === 'fr')?.name ?? esp.name;
  const types = pkm.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
  const evo = esp.evolves_from_species ? Number(esp.evolves_from_species.url.split('/').filter(Boolean).pop()) : null;
  liste.push({
    id,
    nom,
    types,
    captureRate: esp.capture_rate,
    legendaire: esp.is_legendary || esp.is_mythical,
    eclosion: esp.hatch_counter,
    evolueDe: evo,
  });
  process.stdout.write(`${id} `);
}

const contenu = `// FICHIER GÉNÉRÉ par scripts/genererPokedex.mjs (source : PokéAPI). Ne pas éditer à la main.
import type { EspecePokemon } from '../types';

export const POKEDEX: EspecePokemon[] = ${JSON.stringify(liste, null, 0).replace(/\},\{/g, '},\n  {').replace('[{', '[\n  {').replace('}]', '},\n]')};
`;
writeFileSync(new URL('../src/data/pokedex.ts', import.meta.url), contenu);
console.log('\nOK', liste.length);
