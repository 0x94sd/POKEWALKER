// Fenêtre "Ton œuf a éclos !" (une par Pokémon éclos, même si c'est arrivé app fermée).
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { getEspece } from '../pokemon';
import type { PokemonCapture } from '../types';
import { C, R } from '../theme';
import { Bouton } from './Bouton';
import { SpritePokemon } from './SpritePokemon';

export function AnnonceEclosion({ pokemon, onFermer }: { pokemon: PokemonCapture | null; onFermer: () => void }) {
  useEffect(() => {
    if (pokemon) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [pokemon]);

  return (
    <Modal visible={!!pokemon} transparent animationType="fade" onRequestClose={onFermer}>
      <View style={styles.fond}>
        {pokemon && (
          <View style={styles.carte}>
            <Text style={styles.titre}>Ton œuf a éclos !</Text>
            <SpritePokemon id={pokemon.especeId} shiny={pokemon.shiny} taille={160} sauter />
            <Text style={styles.nom}>
              {getEspece(pokemon.especeId).nom}
              {pokemon.shiny ? ' chromatique' : ''}
            </Text>
            <Bouton titre="Génial !" onPress={onFermer} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  carte: { backgroundColor: C.carte, borderRadius: R, padding: 22, alignItems: 'center', gap: 12, width: '100%' },
  titre: { fontSize: 22, fontWeight: '800', color: C.texte },
  nom: { fontSize: 18, fontWeight: '700', color: C.texte },
});
