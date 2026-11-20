// Toutes les actions du jeu sous forme de "reducer" : (état, action) -> nouvel état.
// Pur : aucun affichage, aucun stockage. Le hook useJeu branche ça sur React + AsyncStorage.
import { getEspece } from './pokemon';
import {
  COUT_FOUILLE, PAS_PAR_XP, XP_CAPTURE, fouillesDispo, nouvelUid, resultatLancer, tirerRencontre,
} from './regles';
import type { PokemonCapture, ResultatLancer, Sauvegarde } from './types';

export type Action =
  | { type: 'charger'; sauvegarde: Sauvegarde }
  | { type: 'ajouterPas'; pas: number; releve?: number }
  | { type: 'choisirStarter'; especeId: number }
  | { type: 'fouiller'; gratuit?: boolean }
  | { type: 'lancerBall' }
  | { type: 'abandonnerRencontre' }
  | { type: 'definirCompagnon'; uid: string }
  | { type: 'basculerForcerShiny' }
  | { type: 'reinitialiser'; sauvegarde: Sauvegarde };

export type Etat = {
  s: Sauvegarde;
  charge: boolean;
  /** Dernier évènement à afficher (résultat d'un lancer, etc.). */
  dernierLancer: { resultat: ResultatLancer; especeId: number; shiny: boolean; n: number } | null;
};

export const etatInitial = (s: Sauvegarde): Etat => ({ s, charge: false, dernierLancer: null });

function avecXpCompagnon(s: Sauvegarde, xp: number): PokemonCapture[] {
  if (!s.compagnonUid || xp <= 0) return s.collection;
  return s.collection.map((p) => (p.uid === s.compagnonUid ? { ...p, xp: p.xp + xp } : p));
}

export function reducer(etat: Etat, a: Action): Etat {
  const s = etat.s;
  switch (a.type) {
    case 'charger':
      return { ...etat, s: a.sauvegarde, charge: true };

    case 'reinitialiser':
      return { s: a.sauvegarde, charge: true, dernierLancer: null };

    case 'ajouterPas': {
      if (a.pas <= 0 && a.releve === undefined) return etat;
      const pas = Math.max(0, a.pas);
      return {
        ...etat,
        s: {
          ...s,
          pasTotal: s.pasTotal + pas,
          dernierReleve: a.releve ?? s.dernierReleve,
          collection: avecXpCompagnon(s, pas / PAS_PAR_XP),
        },
      };
    }

    case 'choisirStarter': {
      if (s.compagnonUid) return etat;
      const p: PokemonCapture = {
        uid: nouvelUid(), especeId: a.especeId, shiny: false, captureLe: Date.now(), xp: 0,
      };
      return {
        ...etat,
        s: {
          ...s,
          compagnonUid: p.uid,
          collection: [p, ...s.collection],
          vus: { ...s.vus, [a.especeId]: (s.vus[a.especeId] ?? 0) + 1 },
        },
      };
    }

    case 'fouiller': {
      if (s.rencontreEnCours) return etat;
      if (!a.gratuit && fouillesDispo(s.pasTotal, s.pasDepenses) < 1) return etat;
      const r = tirerRencontre({ forcerShiny: s.debug.forcerShiny });
      return {
        ...etat,
        dernierLancer: null,
        s: {
          ...s,
          pasDepenses: a.gratuit ? s.pasDepenses : s.pasDepenses + COUT_FOUILLE,
          rencontreEnCours: r,
          vus: { ...s.vus, [r.especeId]: (s.vus[r.especeId] ?? 0) + 1 },
          stats: { ...s.stats, fouilles: s.stats.fouilles + 1 },
        },
      };
    }

    case 'lancerBall': {
      const r = s.rencontreEnCours;
      if (!r) return etat;
      const resultat = resultatLancer(getEspece(r.especeId));
      const n = (etat.dernierLancer?.n ?? 0) + 1;
      const info = { resultat, especeId: r.especeId, shiny: r.shiny, n };
      if (resultat === 'echappe') {
        return { ...etat, dernierLancer: info, s: { ...s, rencontreEnCours: { ...r, lancers: r.lancers + 1 } } };
      }
      if (resultat === 'fuite') {
        return {
          ...etat, dernierLancer: info,
          s: { ...s, rencontreEnCours: null, stats: { ...s.stats, fuites: s.stats.fuites + 1 } },
        };
      }
      const capture: PokemonCapture = {
        uid: nouvelUid(), especeId: r.especeId, shiny: r.shiny, captureLe: Date.now(), xp: 0,
      };
      const base = { ...s, collection: avecXpCompagnon(s, XP_CAPTURE) };
      return {
        ...etat,
        dernierLancer: info,
        s: {
          ...base,
          rencontreEnCours: null,
          collection: [capture, ...base.collection],
          stats: {
            ...s.stats,
            captures: s.stats.captures + 1,
            shinies: s.stats.shinies + (r.shiny ? 1 : 0),
          },
        },
      };
    }

    case 'abandonnerRencontre':
      return { ...etat, dernierLancer: null, s: { ...s, rencontreEnCours: null } };

    case 'definirCompagnon':
      if (!s.collection.some((p) => p.uid === a.uid)) return etat;
      return { ...etat, s: { ...s, compagnonUid: a.uid } };

    case 'basculerForcerShiny':
      return { ...etat, s: { ...s, debug: { ...s.debug, forcerShiny: !s.debug.forcerShiny } } };
  }
}
