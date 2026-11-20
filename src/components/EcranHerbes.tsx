// Fouille des hautes herbes + rencontre et lancer de Poké Ball.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { getEspece } from '../pokemon';
import { COUT_FOUILLE, INFOS_PALIER, chanceCapture, fouillesDispo } from '../regles';
import type { Etat } from '../jeu';
import type { Sauvegarde } from '../types';
import { C, R } from '../theme';
import { Bouton } from './Bouton';
import { SpritePokemon } from './SpritePokemon';

type Props = {
  s: Sauvegarde;
  dernierLancer: Etat['dernierLancer'];
  onFouiller: () => void;
  onLancer: () => void;
  onAbandonner: () => void;
};

const MESSAGES = {
  capture: (n: string) => `Gotcha ! ${n} est capturé !`,
  echappe: (n: string) => `Oh non ! ${n} s'est libéré !`,
  fuite: (n: string) => `${n} s'est enfui…`,
};

export function EcranHerbes({ s, dernierLancer, onFouiller, onLancer, onAbandonner }: Props) {
  const r = s.rencontreEnCours;
  const dispo = fouillesDispo(s.pasTotal, s.pasDepenses);
  const secousse = useRef(new Animated.Value(0)).current;

  // Vibration selon le résultat du lancer
  useEffect(() => {
    if (!dernierLancer) return;
    if (dernierLancer.resultat === 'capture') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (dernierLancer.resultat === 'fuite') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [dernierLancer]);

  // Vibration spéciale à l'apparition d'un shiny
  useEffect(() => {
    if (r?.shiny && r.lancers === 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [r?.especeId, r?.shiny, r?.lancers]);

  const fouiller = () => {
    Haptics.selectionAsync();
    secousse.setValue(0);
    Animated.sequence([
      Animated.timing(secousse, { toValue: 1, duration: 70, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(secousse, { toValue: -1, duration: 70, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(secousse, { toValue: 1, duration: 70, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(secousse, { toValue: 0, duration: 70, easing: Easing.linear, useNativeDriver: true }),
    ]).start(() => onFouiller());
  };

  const message = dernierLancer ? MESSAGES[dernierLancer.resultat](getEspece(dernierLancer.especeId).nom) : null;

  if (r) {
    const e = getEspece(r.especeId);
    const palier = INFOS_PALIER[r.palier];
    return (
      <View style={styles.page}>
        <View style={styles.carte}>
          <Text style={[styles.palier, { color: palier.couleur }]}>{palier.nom}</Text>
          <Text style={styles.titre}>
            Un {e.nom} {r.shiny ? 'chromatique ' : ''}sauvage apparaît !
          </Text>
          <SpritePokemon id={e.id} shiny={r.shiny} taille={200} sauter />
          <Text style={styles.info}>
            Chance de capture : {Math.round(chanceCapture(e) * 100)} % · Lancers : {r.lancers}
          </Text>
          {message && dernierLancer?.resultat === 'echappe' && <Text style={styles.message}>{message}</Text>}
        </View>
        <Bouton titre="Lancer une Poké Ball" couleur={C.rouge} onPress={onLancer} />
        <Bouton titre="Prendre la fuite" secondaire couleur={C.texteDoux} onPress={onAbandonner} />
      </View>
    );
  }

  const rotation = secousse.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <View style={styles.page}>
      <View style={styles.carte}>
        {message && (
          <View style={styles.resultat}>
            {dernierLancer && (
              <SpritePokemon id={dernierLancer.especeId} shiny={dernierLancer.shiny} taille={90} />
            )}
            <Text style={styles.message}>{message}</Text>
          </View>
        )}
        <Animated.Text style={[styles.herbes, { transform: [{ rotate: rotation }] }]}>🌿🌿🌿</Animated.Text>
        <Text style={styles.info}>
          Une fouille coûte {COUT_FOUILLE} pas. Tu en as {dispo} de disponible{dispo > 1 ? 's' : ''}.
        </Text>
      </View>
      <Bouton titre={dispo > 0 ? 'Fouiller les herbes' : 'Marche encore un peu…'} desactive={dispo < 1} onPress={fouiller} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 12 },
  carte: {
    flex: 1, backgroundColor: C.carte, borderRadius: R, padding: 16, alignItems: 'center', justifyContent: 'center',
    gap: 12, borderWidth: 1, borderColor: C.bordure,
  },
  palier: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  titre: { fontSize: 20, fontWeight: '800', textAlign: 'center', color: C.texte },
  info: { fontSize: 14, color: C.texteDoux, textAlign: 'center' },
  message: { fontSize: 17, fontWeight: '700', color: C.texte, textAlign: 'center' },
  herbes: { fontSize: 72 },
  resultat: { alignItems: 'center', gap: 4, marginBottom: 12 },
});
