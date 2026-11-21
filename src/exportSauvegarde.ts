// Export / import de la sauvegarde sous forme de texte à copier-coller (Notes, mail, Fichiers...).
// Format : "PKW1." + base64(JSON en UTF-8). Le base64 évite que Notes abîme les guillemets.
import { normaliser } from './sauvegarde';
import type { Sauvegarde } from './types';

const PREFIXE = 'PKW1.';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8(txt: string): number[] {
  const out: number[] = [];
  for (const ch of txt) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

function depuisUtf8(o: number[]): string {
  let s = '';
  for (let i = 0; i < o.length; ) {
    const b = o[i];
    let c: number;
    if (b < 0x80) { c = b; i += 1; }
    else if (b < 0xe0) { c = ((b & 31) << 6) | (o[i + 1] & 63); i += 2; }
    else if (b < 0xf0) { c = ((b & 15) << 12) | ((o[i + 1] & 63) << 6) | (o[i + 2] & 63); i += 3; }
    else { c = ((b & 7) << 18) | ((o[i + 1] & 63) << 12) | ((o[i + 2] & 63) << 6) | (o[i + 3] & 63); i += 4; }
    s += String.fromCodePoint(c);
  }
  return s;
}

function versBase64(o: number[]): string {
  let s = '';
  for (let i = 0; i < o.length; i += 3) {
    const n = (o[i] << 16) | ((o[i + 1] ?? 0) << 8) | (o[i + 2] ?? 0);
    s += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    s += i + 1 < o.length ? ALPHABET[(n >> 6) & 63] : '=';
    s += i + 2 < o.length ? ALPHABET[n & 63] : '=';
  }
  return s;
}

function depuisBase64(b64: string): number[] {
  const propre = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out: number[] = [];
  for (let i = 0; i < propre.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => ALPHABET.indexOf(propre[i + k] ?? 'A'));
    const n = (v[0] << 18) | (v[1] << 12) | (Math.max(0, v[2]) << 6) | Math.max(0, v[3]);
    out.push((n >> 16) & 255);
    if (i + 2 < propre.length) out.push((n >> 8) & 255);
    if (i + 3 < propre.length) out.push(n & 255);
  }
  return out;
}

export function exporter(s: Sauvegarde): string {
  return PREFIXE + versBase64(utf8(JSON.stringify(s)));
}

/** Renvoie la sauvegarde décodée, ou lève une erreur lisible. */
export function importer(texte: string): Sauvegarde {
  const t = texte.trim();
  if (!t.startsWith(PREFIXE)) throw new Error('Ce texte ne ressemble pas à une sauvegarde Pokéwalker (doit commencer par PKW1.)');
  let brut: unknown;
  try {
    brut = JSON.parse(depuisUtf8(depuisBase64(t.slice(PREFIXE.length))));
  } catch {
    throw new Error('Sauvegarde abîmée : le texte est incomplet ou modifié.');
  }
  const s = normaliser(brut);
  if (!Array.isArray((brut as Sauvegarde).collection)) throw new Error('Sauvegarde invalide.');
  return s;
}
