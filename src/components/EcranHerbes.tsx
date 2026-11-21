// Fouille des hautes herbes, Poké Radar (3 buissons), rencontre et lancer de Poké Ball.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { getEspece } from '../pokemon';
import { CHAINE_MAX, COUT_FOUILLE, INFOS_PALIER, bonusChaine, chanceCapture, fouillesDispo } from '../regles';
import type { Etat } from '../jeu';
import type { Sauvegarde } from '../types';
import { C, R } from '../theme';
import { Bouton } from './Bouton';
import { BuissonRadar } from './BuissonRadar';
import { SpritePokemon } from './SpritePokemon';

type Props = {
  s: Sauvegarde;
  dernierLancer: Etat['dernierLancer'];
  oeufTrouve: boolean;
  /** Bandeau d'info sur les bonus actuels (météo, lieu), affiché au-dessus des herbes. */
  bandeau?: ReactNode;
  onFouiller: () => void;
  onRadar: () => void;
  onChoisirBuisson: (i: number) => void;
  onQuitterRadar: () => void;
  onLancer: () => void;
  onAbandonner: () => void;
};

const MESSAGES = {
  capture: (n: string) => `Gotcha ! ${n} est capturé !`,
  echappe: (n: string) => `Oh non ! ${n} s'est libéré !`,
  fuite: (n: string) => `${n} s'est enfui…`,
};

export function EcranHerbes(p: Props) {
  const { s, dernierLancer } = p;
  const r = s.rencontreEnCours;
  const dispo = fouillesDispo(s.pasTotal, s.pasDepenses);
  const secousse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!dernierLancer) return;
    if (dernierLancer.resultat === 'capture') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (dernierLancer.resultat === 'fuite') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [dernierLancer]);

  useEffect(() => {
    if (r?.shiny && r.lancers === 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [r?.especeId, r?.shiny, r?.lancers]);

  const animerPuis = (fin: () => void) => {
    Haptics.selectionAsync();
    secousse.setValue(0);
    const t = (v: number) => Animated.timing(secousse, { toValue: v, duration: 70, easing: Easing.linear, useNativeDriver: true });
    Animated.sequence([t(1), t(-1), t(1), t(0)]).start(() => fin());
  };

  const message = dernierLancer ? MESSAGES[dernierLancer.resultat](getEspece(dernierLancer.especeId).nom) : null;
  const chaine = s.chaineRadar;
  const bonus = bonusChaine(chaine);
  const infoChaine =
    chaine > 0 ? `Chaîne radar : ${chaine}${chaine >= CHAINE_MAX ? ' (max)' : ''} · shiny x${bonus.multShiny.toFixed(1)} · rares x${bonus.multRare.toFixed(1)}` : null;
  const oeuf = p.oeufTrouve ? <Text style={styles.oeuf}>🥚 Tu as trouvé un œuf en fouillant !</Text> : null;

  // --- Rencontre en cours ---
  if (r) {
    const e = getEspece(r.especeId);
    const palier = INFOS_PALIER[r.palier];
    return (
      <View style={styles.page}>
        <View style={styles.carte}>
          {oeuf}
          <Text style={[styles.palier, { color: palier.couleur }]}>
            {palier.nom}
            {r.source === 'radar' ? ' · Radar' : ''}
          </Text>
          <Text style={styles.titre}>
            Un {e.nom} {r.shiny ? 'chromatique ' : ''}sauvage apparaît !
          </Text>
          <SpritePokemon id={e.id} shiny={r.shiny} taille={200} sauter />
          <Text style={styles.info}>
            Chance de capture : {Math.round(chanceCapture(e) * 100)} % · Lancers : {r.lancers}
          </Text>
          {message && dernierLancer?.resultat === 'echappe' && <Text style={styles.message}>{message}</Text>}
          {r.source === 'radar' && chaine > 0 && <Text style={styles.info}>Si tu le rates, la chaîne de {chaine} est perdue.</Text>}
        </View>
        <Bouton titre="Lancer une Poké Ball" couleur={C.rouge} onPress={p.onLancer} />
        <Bouton titre="Prendre la fuite" secondaire couleur={C.texteDoux} onPress={p.onAbandonner} />
      </View>
    );
  }

  // --- Poké Radar : 3 buissons ---
  if (s.radar) {
    return (
      <View style={styles.page}>
        <View style={styles.carte}>
          {oeuf}
          <Text style={styles.titre}>Poké Radar</Text>
          <Text style={styles.info}>
            Plus un buisson tremble fort, plus le Pokémon caché est rare. S'il scintille… c'est un chromatique !
          </Text>
          <View style={styles.buissons}>
            {s.radar.buissons.map((b, i) => (
              <BuissonRadar key={i} buisson={b} onPress={() => p.onChoisirBuisson(i)} />
            ))}
          </View>
          {infoChaine && <Text style={styles.chaine}>{infoChaine}</Text>}
        </View>
        <Bouton titre="Quitter le radar" secondaire couleur={C.texteDoux} onPress={p.onQuitterRadar} />
      </View>
    );
  }

  // --- Accueil : herbes ---
  const rotation = secousse.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
  return (
    <View style={styles.page}>
      {p.bandeau}
      <View style={styles.carte}>
        {oeuf}
        {message && (
          <View style={styles.resultat}>
            {dernierLancer && <SpritePokemon id={dernierLancer.especeId} shiny={dernierLancer.shiny} taille={90} />}
            <Text style={styles.message}>{message}</Text>
          </View>
        )}
        <Animated.Text style={[styles.herbes, { transform: [{ rotate: rotation }] }]}>🌿🌿🌿</Animated.Text>
        <Text style={styles.info}>
          Une fouille coûte {COUT_FOUILLE} pas. Tu en as {dispo} de disponible{dispo > 1 ? 's' : ''}.
        </Text>
        {infoChaine && <Text style={styles.chaine}>{infoChaine}</Text>}
      </View>
      <Bouton titre={dispo > 0 ? 'Fouiller les herbes' : 'Marche encore un peu…'} desactive={dispo < 1} onPress={() => animerPuis(p.onFouiller)} />
      <Bouton titre="Poké Radar (3 buissons)" secondaire couleur={C.herbeFonce} desactive={dispo < 1} onPress={() => animerPuis(p.onRadar)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16, gap: 10 },
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
  buissons: { flexDirection: 'row', gap: 8, width: '100%' },
  chaine: { fontSize: 13, fontWeight: '700', color: C.or, textAlign: 'center' },
  oeuf: { fontSize: 15, fontWeight: '700', color: '#a07a20' },
});
