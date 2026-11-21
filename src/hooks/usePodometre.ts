// Podomètre : compte les pas en direct ET rattrape ceux faits pendant que l'app était fermée.
// iOS garde l'historique des pas 7 jours : au retour dans l'app on demande les pas depuis le dernier relevé.
import { Pedometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type StatutPodometre = 'verification' | 'actif' | 'indisponible' | 'refuse';

const SEPT_JOURS = 7 * 24 * 3600 * 1000;

type Options = {
  /** false tant que la sauvegarde n'est pas chargée (on a besoin de dernierReleve). */
  pret: boolean;
  dernierReleve: number | null;
  onPas: (pas: number, releve: number) => void;
};

export function usePodometre({ pret, dernierReleve, onPas }: Options): StatutPodometre {
  const [statut, setStatut] = useState<StatutPodometre>('verification');
  const releveRef = useRef<number | null>(dernierReleve);
  const onPasRef = useRef(onPas);
  onPasRef.current = onPas;

  // Suit la sauvegarde (import, remise à zéro) : le prochain rattrapage part du bon relevé.
  useEffect(() => {
    releveRef.current = dernierReleve;
  }, [dernierReleve]);

  useEffect(() => {
    if (!pret) return;
    releveRef.current = dernierReleve;
    let annule = false;
    let abonnement: { remove: () => void } | null = null;
    let dernierCumul = 0;

    const signaler = (pas: number) => {
      const maintenant = Date.now();
      releveRef.current = maintenant;
      onPasRef.current(pas, maintenant);
    };

    // Pas faits entre le dernier relevé et maintenant (app fermée / en arrière-plan)
    const rattraper = async () => {
      const maintenant = Date.now();
      const depuis = releveRef.current;
      if (depuis === null) {
        signaler(0); // premier lancement : on démarre le compteur maintenant
        return;
      }
      const debut = new Date(Math.max(depuis, maintenant - SEPT_JOURS + 60_000));
      try {
        const { steps } = await Pedometer.getStepCountAsync(debut, new Date(maintenant));
        if (!annule) signaler(steps);
      } catch {
        if (!annule) signaler(0);
      }
    };

    // Pas en direct pendant que l'app est ouverte
    const ecouter = () => {
      abonnement?.remove();
      dernierCumul = 0;
      abonnement = Pedometer.watchStepCount(({ steps }) => {
        const delta = steps - dernierCumul;
        dernierCumul = steps;
        if (delta > 0) signaler(delta);
      });
    };

    (async () => {
      const dispo = await Pedometer.isAvailableAsync().catch(() => false);
      if (annule) return;
      if (!dispo) return setStatut('indisponible');
      const perm = await Pedometer.requestPermissionsAsync().catch(() => null);
      if (annule) return;
      if (!perm?.granted) return setStatut('refuse');
      setStatut('actif');
      await rattraper();
      if (!annule) ecouter();
    })();

    const sub = AppState.addEventListener('change', async (etat) => {
      if (etat === 'active') {
        abonnement?.remove();
        abonnement = null;
        await rattraper();
        if (!annule) ecouter();
      } else if (etat === 'background') {
        abonnement?.remove();
        abonnement = null;
      }
    });

    return () => {
      annule = true;
      abonnement?.remove();
      sub.remove();
    };
    // On ne relance qu'une fois la sauvegarde chargée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  return statut;
}
