// Sprite d'un Pokémon avec animation de saut optionnelle et étoile si shiny.
import { Image } from 'expo-image';
import { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { urlSprite, type StyleSprite } from '../pokemon';

/** Style de sprite choisi dans les réglages, partagé par toute l'app. */
export const StyleSpriteContext = createContext<StyleSprite>('defaut');

type Props = {
  id: number;
  shiny?: boolean;
  taille?: number;
  sauter?: boolean;
  /** Affiche une silhouette noire (Pokémon pas encore vu). */
  silhouette?: boolean;
};

export function SpritePokemon({ id, shiny = false, taille = 96, sauter = false, silhouette = false }: Props) {
  const y = useRef(new Animated.Value(0)).current;
  const style = useContext(StyleSpriteContext);

  useEffect(() => {
    if (!sauter) return;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -taille * 0.12, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [sauter, taille, y]);

  return (
    <View style={{ width: taille, height: taille }}>
      <Animated.View style={{ flex: 1, transform: [{ translateY: y }] }}>
        <Image
          source={{ uri: urlSprite(id, shiny, style) }}
          style={[styles.img, silhouette && styles.silhouette]}
          contentFit="contain"
          cachePolicy="disk"
          transition={150}
        />
      </Animated.View>
      {shiny && !silhouette && <Text style={[styles.etoile, { fontSize: taille * 0.18 }]}>✨</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
  silhouette: { tintColor: '#000', opacity: 0.25 },
  etoile: { position: 'absolute', top: 0, right: 0 },
});
