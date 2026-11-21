import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

export type Onglet = 'compagnon' | 'herbes' | 'collection' | 'debug';

const ONGLETS: { id: Onglet; icone: string; nom: string }[] = [
  { id: 'compagnon', icone: '🏠', nom: 'Compagnon' },
  { id: 'herbes', icone: '🌿', nom: 'Herbes' },
  { id: 'collection', icone: '📕', nom: 'Pokédex' },
  { id: 'debug', icone: '⚙️', nom: 'Réglages' },
];

type Props = { actif: Onglet; onChange: (o: Onglet) => void; pastilleHerbes?: number };

export function BarreOnglets({ actif, onChange, pastilleHerbes = 0 }: Props) {
  return (
    <View style={styles.barre}>
      {ONGLETS.map((o) => (
        <Pressable key={o.id} style={styles.onglet} onPress={() => onChange(o.id)}>
          <Text style={styles.icone}>{o.icone}</Text>
          <Text style={[styles.nom, actif === o.id && styles.actif]}>{o.nom}</Text>
          {o.id === 'herbes' && pastilleHerbes > 0 && (
            <View style={styles.pastille}>
              <Text style={styles.pastilleTxt}>{pastilleHerbes > 99 ? '99+' : pastilleHerbes}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.bordure, backgroundColor: C.carte, paddingTop: 6 },
  onglet: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  icone: { fontSize: 22 },
  nom: { fontSize: 11, color: C.texteDoux, marginTop: 2 },
  actif: { color: C.herbeFonce, fontWeight: '800' },
  pastille: {
    position: 'absolute', top: 0, right: '22%', backgroundColor: C.rouge, borderRadius: 9,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  pastilleTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
