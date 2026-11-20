// Pokédex (151 cases : capturé / vu / inconnu) + liste des Pokémon capturés.
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { POKEDEX, getEspece } from '../pokemon';
import { niveauDepuisXp } from '../regles';
import type { Sauvegarde } from '../types';
import { C, R } from '../theme';
import { SpritePokemon } from './SpritePokemon';

type Props = { s: Sauvegarde; onDefinirCompagnon: (uid: string) => void };

export function EcranCollection({ s, onDefinirCompagnon }: Props) {
  const [vue, setVue] = useState<'pokedex' | 'equipe'>('pokedex');
  const captures = useMemo(() => new Set(s.collection.map((p) => p.especeId)), [s.collection]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.switch}>
        {(['pokedex', 'equipe'] as const).map((v) => (
          <Pressable key={v} style={[styles.choix, vue === v && styles.choixActif]} onPress={() => setVue(v)}>
            <Text style={[styles.choixTxt, vue === v && { color: '#fff' }]}>
              {v === 'pokedex' ? `Pokédex ${captures.size}/151` : `Mes Pokémon (${s.collection.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {vue === 'pokedex' ? (
        <FlatList
          data={POKEDEX}
          key="pokedex"
          numColumns={4}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.liste}
          initialNumToRender={24}
          renderItem={({ item }) => {
            const pris = captures.has(item.id);
            const vu = (s.vus[item.id] ?? 0) > 0;
            return (
              <View style={[styles.case, pris && styles.casePrise]}>
                <SpritePokemon id={item.id} taille={64} silhouette={!vu} />
                <Text style={styles.num}>#{String(item.id).padStart(3, '0')}</Text>
                <Text style={styles.nomCase} numberOfLines={1}>{vu ? item.nom : '???'}</Text>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={s.collection}
          key="equipe"
          keyExtractor={(p) => p.uid}
          contentContainerStyle={styles.liste}
          ListEmptyComponent={<Text style={styles.vide}>Aucun Pokémon pour l'instant.</Text>}
          renderItem={({ item }) => {
            const e = getEspece(item.especeId);
            const estCompagnon = item.uid === s.compagnonUid;
            return (
              <Pressable
                style={[styles.ligne, estCompagnon && styles.ligneCompagnon]}
                onPress={() =>
                  !estCompagnon &&
                  Alert.alert(e.nom, 'En faire ton compagnon ?', [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Oui', onPress: () => onDefinirCompagnon(item.uid) },
                  ])
                }
              >
                <SpritePokemon id={e.id} shiny={item.shiny} taille={56} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nomLigne}>{item.surnom ?? e.nom}</Text>
                  <Text style={styles.detail}>
                    Niv. {niveauDepuisXp(item.xp)} · capturé le {new Date(item.captureLe).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                {estCompagnon && <Text style={styles.badge}>Compagnon</Text>}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  switch: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: C.bordure, borderRadius: 12, padding: 3 },
  choix: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  choixActif: { backgroundColor: C.herbe },
  choixTxt: { fontWeight: '700', color: C.texte, fontSize: 13 },
  liste: { paddingHorizontal: 12, paddingBottom: 20, gap: 8 },
  case: {
    flex: 1 / 4, alignItems: 'center', margin: 3, paddingVertical: 6, backgroundColor: C.carte,
    borderRadius: 10, borderWidth: 1, borderColor: C.bordure,
  },
  casePrise: { borderColor: C.herbe, backgroundColor: '#eef7e8' },
  num: { fontSize: 10, color: C.texteDoux },
  nomCase: { fontSize: 11, fontWeight: '600', color: C.texte, paddingHorizontal: 2 },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.carte, borderRadius: R,
    padding: 8, borderWidth: 1, borderColor: C.bordure,
  },
  ligneCompagnon: { borderColor: C.or, borderWidth: 2 },
  nomLigne: { fontSize: 16, fontWeight: '700', color: C.texte },
  detail: { fontSize: 12, color: C.texteDoux },
  badge: { fontSize: 11, fontWeight: '800', color: C.or },
  vide: { textAlign: 'center', color: C.texteDoux, marginTop: 40 },
});
