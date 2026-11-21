// Toutes les actions du jeu sous forme de "reducer" : (état, action) -> nouvel état.
// Pur (hors hasard) : aucun affichage, aucun stockage. Le hook useJeu branche ça sur React + AsyncStorage.
import { getEspece } from './pokemon';
import {
  CHANCE_OEUF, COUT_FOUILLE, PAS_PAR_XP, XP_CAPTURE, avancerOeufs, creerOeuf, fouillesDispo, nouvelUid,
  resultatLancer, tirerBuissons, tirerRencontre, type OptionsTirage,
} from './regles';
import type { Oeuf, PokemonCapture, ResultatLancer, Sauvegarde } from './types';

export type Action =
  | { type: 'charger'; sauvegarde: Sauvegarde }
  | { type: 'ajouterPas'; pas: number; releve?: number }
  | { type: 'choisirStarter'; especeId: number }
  | { type: 'fouiller'; gratuit?: boolean; opts?: OptionsTirage }
  | { type: 'lancerRadar'; gratuit?: boolean; opts?: OptionsTirage }
  | { type: 'choisirBuisson'; index: number }
  | { type: 'quitterRadar' }
  | { type: 'lancerBall' }
  | { type: 'abandonnerRencontre' }
  | { type: 'definirCompagnon'; uid: string }
  | { type: 'renommer'; uid: string; surnom: string }
  | { type: 'annonceVue' }
  | { type: 'debugDonnerOeuf' }
  | { type: 'debugEclore' }
  | { type: 'basculerForcerShiny' }
  | { type: 'debugForcer'; champ: 'meteoForcee' | 'lieuForce' | 'frequentationForcee'; valeur: string | null }
  | { type: 'reinitialiser'; sauvegarde: Sauvegarde };

export type Etat = {
  s: Sauvegarde;
  charge: boolean;
  /** Dernier lancer de Poké Ball, pour l'affichage. */
  dernierLancer: { resultat: ResultatLancer; especeId: number; shiny: boolean; n: number } | null;
  /** Un œuf vient d'être trouvé (affichage). */
  oeufTrouve: boolean;
};

export const etatInitial = (s: Sauvegarde): Etat => ({ s, charge: false, dernierLancer: null, oeufTrouve: false });

function avecXpCompagnon(s: Sauvegarde, xp: number): PokemonCapture[] {
  if (!s.compagnonUid || xp <= 0) return s.collection;
  return s.collection.map((p) => (p.uid === s.compagnonUid ? { ...p, xp: p.xp + xp } : p));
}

/** Transforme des œufs éclos en Pokémon de la collection. */
function faireEclore(s: Sauvegarde, restants: Oeuf[], eclos: Oeuf[]): Sauvegarde {
  if (eclos.length === 0) return { ...s, oeufs: restants };
  const nes: PokemonCapture[] = eclos.map((o) => ({
    uid: nouvelUid(), especeId: o.especeId, shiny: o.shiny, captureLe: Date.now(), xp: 0,
  }));
  const vus = { ...s.vus };
  for (const p of nes) vus[p.especeId] = (vus[p.especeId] ?? 0) + 1;
  return {
    ...s,
    oeufs: restants,
    collection: [...nes, ...s.collection],
    vus,
    aAnnoncer: [...s.aAnnoncer, ...nes.map((p) => p.uid)],
    stats: {
      ...s.stats,
      eclosions: s.stats.eclosions + nes.length,
      shinies: s.stats.shinies + nes.filter((p) => p.shiny).length,
    },
  };
}

/** Coûte une fouille (sauf gratuit) et tente de trouver un œuf. Renvoie null si pas assez de pas. */
function payerFouille(s: Sauvegarde, gratuit: boolean | undefined): { s: Sauvegarde; oeuf: boolean } | null {
  if (!gratuit && fouillesDispo(s.pasTotal, s.pasDepenses) < 1) return null;
  const oeuf = Math.random() < CHANCE_OEUF;
  return {
    oeuf,
    s: {
      ...s,
      pasDepenses: gratuit ? s.pasDepenses : s.pasDepenses + COUT_FOUILLE,
      oeufs: oeuf ? [...s.oeufs, creerOeuf({ forcerShiny: s.debug.forcerShiny })] : s.oeufs,
      stats: { ...s.stats, fouilles: s.stats.fouilles + 1 },
    },
  };
}

export function reducer(etat: Etat, a: Action): Etat {
  const s = etat.s;
  switch (a.type) {
    case 'charger':
      return { ...etat, s: a.sauvegarde, charge: true };

    case 'reinitialiser':
      return { s: a.sauvegarde, charge: true, dernierLancer: null, oeufTrouve: false };

    case 'ajouterPas': {
      if (a.pas <= 0 && a.releve === undefined) return etat;
      const pas = Math.max(0, a.pas);
      const base: Sauvegarde = {
        ...s,
        pasTotal: s.pasTotal + pas,
        dernierReleve: a.releve ?? s.dernierReleve,
        collection: avecXpCompagnon(s, pas / PAS_PAR_XP),
      };
      if (pas === 0 || s.oeufs.length === 0) return { ...etat, s: base };
      const { restants, eclos } = avancerOeufs(s.oeufs, pas);
      return { ...etat, s: faireEclore(base, restants, eclos) };
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
      if (s.rencontreEnCours || s.radar) return etat;
      const paye = payerFouille(s, a.gratuit);
      if (!paye) return etat;
      const r = tirerRencontre({ ...a.opts, forcerShiny: s.debug.forcerShiny });
      return {
        ...etat,
        dernierLancer: null,
        oeufTrouve: paye.oeuf,
        s: {
          ...paye.s,
          rencontreEnCours: r,
          vus: { ...s.vus, [r.especeId]: (s.vus[r.especeId] ?? 0) + 1 },
        },
      };
    }

    case 'lancerRadar': {
      if (s.rencontreEnCours || s.radar) return etat;
      const paye = payerFouille(s, a.gratuit);
      if (!paye) return etat;
      return {
        ...etat,
        dernierLancer: null,
        oeufTrouve: paye.oeuf,
        s: { ...paye.s, radar: { buissons: tirerBuissons(s.chaineRadar, { ...a.opts, forcerShiny: s.debug.forcerShiny }) } },
      };
    }

    case 'choisirBuisson': {
      const b = s.radar?.buissons[a.index];
      if (!b) return etat;
      const r = b.rencontre;
      return {
        ...etat,
        oeufTrouve: false,
        s: { ...s, radar: null, rencontreEnCours: r, vus: { ...s.vus, [r.especeId]: (s.vus[r.especeId] ?? 0) + 1 } },
      };
    }

    case 'quitterRadar':
      if (!s.radar) return etat;
      return { ...etat, oeufTrouve: false, s: { ...s, radar: null, chaineRadar: 0 } };

    case 'lancerBall': {
      const r = s.rencontreEnCours;
      if (!r) return etat;
      const resultat = resultatLancer(getEspece(r.especeId));
      const n = (etat.dernierLancer?.n ?? 0) + 1;
      const info = { resultat, especeId: r.especeId, shiny: r.shiny, n };
      const radar = r.source === 'radar';
      if (resultat === 'echappe') {
        return { ...etat, oeufTrouve: false, dernierLancer: info, s: { ...s, rencontreEnCours: { ...r, lancers: r.lancers + 1 } } };
      }
      if (resultat === 'fuite') {
        return {
          ...etat, oeufTrouve: false, dernierLancer: info,
          s: {
            ...s, rencontreEnCours: null, chaineRadar: radar ? 0 : s.chaineRadar,
            stats: { ...s.stats, fuites: s.stats.fuites + 1 },
          },
        };
      }
      const capture: PokemonCapture = {
        uid: nouvelUid(), especeId: r.especeId, shiny: r.shiny, captureLe: Date.now(), xp: 0,
      };
      const chaine = radar ? s.chaineRadar + 1 : s.chaineRadar;
      return {
        ...etat,
        oeufTrouve: false,
        dernierLancer: info,
        s: {
          ...s,
          rencontreEnCours: null,
          chaineRadar: chaine,
          collection: [capture, ...avecXpCompagnon(s, XP_CAPTURE)],
          stats: {
            ...s.stats,
            captures: s.stats.captures + 1,
            shinies: s.stats.shinies + (r.shiny ? 1 : 0),
            meilleureChaine: Math.max(s.stats.meilleureChaine, chaine),
          },
        },
      };
    }

    case 'abandonnerRencontre': {
      const radar = s.rencontreEnCours?.source === 'radar';
      return {
        ...etat, dernierLancer: null, oeufTrouve: false,
        s: { ...s, rencontreEnCours: null, chaineRadar: radar ? 0 : s.chaineRadar },
      };
    }

    case 'definirCompagnon':
      if (!s.collection.some((p) => p.uid === a.uid)) return etat;
      return { ...etat, s: { ...s, compagnonUid: a.uid } };

    case 'renommer': {
      const surnom = a.surnom.trim().slice(0, 20);
      return {
        ...etat,
        s: { ...s, collection: s.collection.map((p) => (p.uid === a.uid ? { ...p, surnom: surnom || undefined } : p)) },
      };
    }

    case 'annonceVue':
      return { ...etat, s: { ...s, aAnnoncer: s.aAnnoncer.slice(1) } };

    case 'debugDonnerOeuf':
      return { ...etat, s: { ...s, oeufs: [...s.oeufs, creerOeuf({ forcerShiny: s.debug.forcerShiny })] } };

    case 'debugEclore':
      return { ...etat, s: faireEclore(s, [], s.oeufs) };

    case 'debugForcer':
      return { ...etat, s: { ...s, debug: { ...s.debug, [a.champ]: a.valeur } } };

    case 'basculerForcerShiny':
      return { ...etat, s: { ...s, debug: { ...s.debug, forcerShiny: !s.debug.forcerShiny } } };
  }
}
