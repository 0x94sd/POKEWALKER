// Un buisson du Poké Radar : il tremble plus ou moins fort selon la rareté cachée, et scintille si shiny.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Buisson } from '../types';
import { C, R } from '../theme';

const REGLAGES = {
  1: { angle: 4, duree: 140, pause: 1400, libelle: 'Léger' },
  2: { angle: 9, duree: 100, pause: 800, libelle: 'Moyen' },
  3: { angle: 15, duree: 70, pause: 350, libelle: 'Fort !' },
};

export function BuissonRadar({ buisson, onPress }: { buisson: Buisson; onPress: () => void }) {
  const r = useRef(new Animated.Value(0)).current;
  const eclat = useRef(new Animated.Value(0)).current;
  const cfg = REGLAGES[buisson.intensite];

  useEffect(() => {
    const t = (v: number) => Animated.timing(r, { toValue: v, duration: cfg.duree, easing: Easing.linear, useNativeDriver: true });
    const boucle = Animated.loop(Animated.sequence([t(1), t(-1), t(1), t(0), Animated.delay(cfg.pause)]));
    boucle.start();
    let boucleEclat: Animated.CompositeAnimation | null = null;
    if (buisson.brille) {
      boucleEclat = Animated.loop(
        Animated.sequence([
          Animated.timing(eclat, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(eclat, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ]),
      );
      boucleEclat.start();
    }
    return () => {
      boucle.stop();
      boucleEclat?.stop();
    };
  }, [buisson, cfg, r, eclat]);

  const rotate = r.interpolate({ inputRange: [-1, 1], outputRange: [`-${cfg.angle}deg`, `${cfg.angle}deg`] });

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.carte, pressed && { opacity: 0.6 }]}>
      <View>
        <Animated.Text style={[styles.buisson, { transform: [{ rotate }] }]}>🌳</Animated.Text>
        {buisson.brille && <Animated.Text style={[styles.eclat, { opacity: eclat }]}>✨</Animated.Text>}
      </View>
      <Text style={styles.libelle}>{cfg.libelle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: '#e4f1da', borderRadius: R,
    borderWidth: 1, borderColor: C.bordure,
  },
  buisson: { fontSize: 58 },
  eclat: { position: 'absolute', top: -6, right: -10, fontSize: 28 },
  libelle: { fontSize: 13, fontWeight: '700', color: C.herbeFonce, marginTop: 4 },
});
