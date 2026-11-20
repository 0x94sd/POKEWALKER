// Premier lancement : choix du compagnon de départ.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STARTERS, getEspece } from '../pokemon';
import { C, R } from '../theme';
import { SpritePokemon } from './SpritePokemon';

export function EcranStarter({ onChoisir }: { onChoisir: (id: number) => void }) {
  return (
    <View style={styles.page}>
      <Text style={styles.titre}>Bienvenue !</Text>
      <Text style={styles.sous}>Choisis le Pokémon qui marchera avec toi.</Text>
      <View style={styles.grille}>
        {STARTERS.map((id) => (
          <Pressable key={id} style={({ pressed }) => [styles.carte, pressed && { opacity: 0.6 }]} onPress={() => onChoisir(id)}>
            <SpritePokemon id={id} taille={110} sauter />
            <Text style={styles.nom}>{getEspece(id).nom}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 20, justifyContent: 'center', gap: 8 },
  titre: { fontSize: 30, fontWeight: '800', textAlign: 'center', color: C.texte },
  sous: { fontSize: 16, textAlign: 'center', color: C.texteDoux, marginBottom: 16 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  carte: {
    width: '45%', alignItems: 'center', backgroundColor: C.carte, borderRadius: R, paddingVertical: 14,
    borderWidth: 1, borderColor: C.bordure,
  },
  nom: { fontSize: 16, fontWeight: '700', color: C.texte, marginTop: 4 },
});
