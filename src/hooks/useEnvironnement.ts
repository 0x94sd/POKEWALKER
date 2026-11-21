// Récupère position, météo et lieu quand l'app est ouverte (et toutes les 10 min).
// Sans réseau ni GPS : seul le moment de la journée (jour/nuit) s'applique, le jeu reste jouable.
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  bonusContexte, momentDe, type CleFrequentation, type CleLieu, type CleMeteo, type Contexte,
} from '../environnement';
import type { OptionsTirage } from '../regles';
import { lieuActuel } from '../services/lieux';
import { meteoActuelle } from '../services/meteo';

export type StatutLocalisation = 'verification' | 'ok' | 'refuse' | 'erreur';

export type Forcages = {
  meteo: CleMeteo | null;
  lieu: CleLieu | null;
  frequentation: CleFrequentation | null;
};

const INTERVALLE = 10 * 60 * 1000;

export function useEnvironnement(forcages: Forcages) {
  const [statut, setStatut] = useState<StatutLocalisation>('verification');
  const [meteo, setMeteo] = useState<CleMeteo | null>(null);
  const [lieux, setLieux] = useState<CleLieu[]>([]);
  const [frequentation, setFrequentation] = useState<CleFrequentation | null>(null);
  const [maintenant, setMaintenant] = useState(() => new Date());
  const enCours = useRef(false);

  const rafraichir = useCallback(async () => {
    setMaintenant(new Date());
    if (enCours.current) return;
    enCours.current = true;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setStatut('refuse');
        return;
      }
      const pos =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const { latitude: lat, longitude: lon } = pos.coords;
      setStatut('ok');
      const [m, l] = await Promise.all([meteoActuelle(lat, lon), lieuActuel(lat, lon)]);
      setMeteo(m);
      if (l) {
        setLieux(l.lieux);
        setFrequentation(l.frequentation);
      }
    } catch {
      setStatut('erreur');
    } finally {
      enCours.current = false;
    }
  }, []);

  useEffect(() => {
    rafraichir();
    const id = setInterval(rafraichir, INTERVALLE);
    const sub = AppState.addEventListener('change', (e) => {
      if (e === 'active') rafraichir();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [rafraichir]);

  const contexte: Contexte = {
    meteo: forcages.meteo ?? meteo,
    moment: momentDe(maintenant),
    lieux: forcages.lieu ? [forcages.lieu] : lieux,
    frequentation: forcages.frequentation ?? frequentation,
  };
  const bonus = bonusContexte(contexte);
  const opts: OptionsTirage = { typesFavoris: bonus.typesFavoris, typesLieu: bonus.typesLieu, multRare: bonus.multRare };

  return { statut, contexte, opts, rafraichir };
}
