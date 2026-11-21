// Export / import de la sauvegarde par copier-coller (presse-papiers) ou partage iOS.
import * as Clipboard from 'expo-clipboard';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { exporter, importer } from '../exportSauvegarde';
import type { Sauvegarde } from '../types';
import { C, R } from '../theme';
import { Bouton } from './Bouton';

type Props = { s: Sauvegarde; onImporter: (s: Sauvegarde) => void };

export function CarteSauvegarde({ s, onImporter }: Props) {
  const copier = async () => {
    await Clipboard.setStringAsync(exporter(s));
    Alert.alert('Copié', 'Sauvegarde copiée. Colle-la dans Notes ou envoie-la-toi par mail pour la garder.');
  };

  const partager = () => Share.share({ message: exporter(s) });

  const coller = async () => {
    const texte = await Clipboard.getStringAsync();
    let nouvelle: Sauvegarde;
    try {
      nouvelle = importer(texte);
    } catch (e) {
      Alert.alert('Import impossible', e instanceof Error ? e.message : String(e));
      return;
    }
    Alert.alert(
      'Remplacer la partie ?',
      `Sauvegarde trouvée : ${nouvelle.collection.length} Pokémon, ${Math.floor(nouvelle.pasTotal)} pas. La partie actuelle sera écrasée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Importer', style: 'destructive', onPress: () => onImporter(nouvelle) },
      ],
    );
  };

  return (
    <View style={styles.carte}>
      <Text style={styles.titre}>Export / import</Text>
      <Text style={styles.petit}>
        Pour importer : copie le texte de sauvegarde (il commence par PKW1.) puis appuie sur « Importer ».
      </Text>
      <View style={styles.rangee}>
        <View style={{ flex: 1 }}><Bouton titre="Copier" onPress={copier} /></View>
        <View style={{ flex: 1 }}><Bouton titre="Partager" onPress={partager} /></View>
      </View>
      <Bouton titre="Importer depuis le presse-papiers" secondaire couleur={C.herbeFonce} onPress={coller} />
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { backgroundColor: C.carte, borderRadius: R, padding: 16, gap: 10, borderWidth: 1, borderColor: C.bordure },
  titre: { fontSize: 17, fontWeight: '800', color: C.texte },
  petit: { fontSize: 12, color: C.texteDoux },
  rangee: { flexDirection: 'row', gap: 8 },
});
