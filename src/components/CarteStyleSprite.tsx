// Choix du style de sprites (par génération, animés Showdown / Noir-Blanc, HOME, artwork).
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { STYLES_SPRITE, type StyleSprite } from '../pokemon';
import { C, R } from '../theme';
import { SpritePokemon, StyleSpriteContext } from './SpritePokemon';

type Props = { actuel: string; especeApercu: number; onChoisir: (s: StyleSprite) => void };

export function CarteStyleSprite({ actuel, especeApercu, onChoisir }: Props) {
  return (
    <View style={styles.carte}>
      <Text style={styles.titre}>Style de sprites</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangee}>
        {(Object.keys(STYLES_SPRITE) as StyleSprite[]).map((st) => (
          <Pressable key={st} onPress={() => onChoisir(st)} style={[styles.choix, st === actuel && styles.actif]}>
            <StyleSpriteContext.Provider value={st}>
              <SpritePokemon id={especeApercu} taille={64} />
            </StyleSpriteContext.Provider>
            <Text style={styles.nom} numberOfLines={2}>{STYLES_SPRITE[st].nom}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.petit}>Rouge / Bleu n'a pas de chromatiques : les shiny s'affichent alors en style Classique.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { backgroundColor: C.carte, borderRadius: R, padding: 16, gap: 10, borderWidth: 1, borderColor: C.bordure },
  titre: { fontSize: 17, fontWeight: '800', color: C.texte },
  rangee: { gap: 8 },
  choix: { width: 86, alignItems: 'center', padding: 6, borderRadius: 12, borderWidth: 2, borderColor: C.bordure },
  actif: { borderColor: C.herbe, backgroundColor: '#eef7e8' },
  nom: { fontSize: 11, fontWeight: '600', color: C.texte, textAlign: 'center' },
  petit: { fontSize: 12, color: C.texteDoux },
});
