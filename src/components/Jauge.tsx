// Barre de progression simple (XP, pas avant fouille, futures jauges faim/bonheur/énergie).
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

type Props = { valeur: number; couleur?: string; libelle?: string; detail?: string };

export function Jauge({ valeur, couleur = C.herbe, libelle, detail }: Props) {
  const pct = Math.max(0, Math.min(1, valeur)) * 100;
  return (
    <View style={styles.bloc}>
      {(libelle || detail) && (
        <View style={styles.ligne}>
          <Text style={styles.libelle}>{libelle}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
      )}
      <View style={styles.fond}>
        <View style={[styles.rempli, { width: `${pct}%`, backgroundColor: couleur }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { width: '100%', gap: 4 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between' },
  libelle: { fontSize: 13, fontWeight: '600', color: C.texte },
  detail: { fontSize: 13, color: C.texteDoux },
  fond: { height: 10, borderRadius: 5, backgroundColor: C.bordure, overflow: 'hidden' },
  rempli: { height: '100%', borderRadius: 5 },
});
