// Rangée de pastilles à choix unique (avec option "Auto" = null).
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { C } from '../theme';

type Props = {
  options: { valeur: string; libelle: string }[];
  valeur: string | null;
  onChange: (v: string | null) => void;
  libelleAuto?: string;
};

export function ChoixChips({ options, valeur, onChange, libelleAuto = 'Auto' }: Props) {
  const toutes = [{ valeur: null as string | null, libelle: libelleAuto }, ...options];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangee}>
      {toutes.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable key={o.valeur ?? 'auto'} onPress={() => onChange(o.valeur)} style={[styles.chip, actif && styles.actif]}>
            <Text style={[styles.txt, actif && { color: '#fff' }]}>{o.libelle}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rangee: { gap: 6, paddingVertical: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: C.bordure },
  actif: { backgroundColor: C.herbe },
  txt: { fontSize: 13, fontWeight: '600', color: C.texte },
});
