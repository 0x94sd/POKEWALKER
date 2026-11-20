// Branche le reducer du jeu sur React et sauvegarde automatiquement à chaque changement.
import { useEffect, useReducer, useRef } from 'react';
import { etatInitial, reducer } from '../jeu';
import { charger, enregistrer, sauvegardeVierge } from '../sauvegarde';

export function useJeu() {
  const [etat, dispatch] = useReducer(reducer, sauvegardeVierge(), etatInitial);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement au démarrage
  useEffect(() => {
    charger().then((s) => dispatch({ type: 'charger', sauvegarde: s }));
  }, []);

  // Sauvegarde auto (regroupée toutes les 500 ms pour ne pas écrire à chaque pas)
  useEffect(() => {
    if (!etat.charge) return;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => enregistrer(etat.s), 500);
    return () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    };
  }, [etat.s, etat.charge]);

  return { etat, dispatch };
}
