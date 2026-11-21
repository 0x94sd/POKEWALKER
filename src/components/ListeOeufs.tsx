// Liste des œufs en incubation (tous en même temps, sans limite).
import { StyleSheet, Text, View } from 'react-native';
import type { Oeuf } from '../types';
import { C, R } from '../theme';
import { Jauge } from './Jauge';

export function ListeOeufs({ oeufs }: { oeufs: Oeuf[] }) {
  return (
    <View style={styles.carte}>
      <Text style={styles.titre}>Œufs ({oeufs.length})</Text>
      {oeufs.length === 0 ? (
        <Text style={styles.vide}>Aucun œuf. Tu as 1 chance sur 10 d'en trouver un à chaque fouille.</Text>
      ) : (
        oeufs.map((o) => {
          const reste = Math.max(0, Math.ceil(o.pasRequis - o.pasFaits));
          return (
            <View key={o.uid} style={styles.ligne}>
              <Text style={styles.icone}>🥚</Text>
              <View style={{ flex: 1 }}>
                <Jauge
                  valeur={o.pasFaits / o.pasRequis}
                  couleur="#c9a24a"
                  libelle={reste < 300 ? 'Ça bouge !' : 'En incubation'}
                  detail={`encore ${reste.toLocaleString('fr-FR')} pas`}
                />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { backgroundColor: C.carte, borderRadius: R, padding: 16, gap: 10, borderWidth: 1, borderColor: C.bordure },
  titre: { fontSize: 17, fontWeight: '800', color: C.texte },
  vide: { fontSize: 13, color: C.texteDoux },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icone: { fontSize: 28 },
});
