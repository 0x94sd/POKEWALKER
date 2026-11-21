// Outils de test sans marcher.
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { INFOS_PALIER, PALIERS, especesDuPalier } from '../regles';
import type { Sauvegarde } from '../types';
import { C, R } from '../theme';
import { Bouton } from './Bouton';
import { CarteSauvegarde } from './CarteSauvegarde';

type Props = {
  s: Sauvegarde;
  onAjouterPas: (n: number) => void;
  onForcerRencontre: () => void;
  onForcerRadar: () => void;
  onDonnerOeuf: () => void;
  onEclore: () => void;
  onBasculerShiny: () => void;
  onImporter: (s: Sauvegarde) => void;
  onReinitialiser: () => void;
};

export function EcranDebug(p: Props) {
  const { s, onAjouterPas, onForcerRencontre, onBasculerShiny, onReinitialiser } = p;
  const occupe = !!s.rencontreEnCours || !!s.radar;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.carte}>
        <Text style={styles.titre}>Pas bonus</Text>
        <View style={styles.rangee}>
          <View style={{ flex: 1 }}><Bouton titre="+250" onPress={() => onAjouterPas(250)} /></View>
          <View style={{ flex: 1 }}><Bouton titre="+1 000" onPress={() => onAjouterPas(1000)} /></View>
          <View style={{ flex: 1 }}><Bouton titre="+10 000" onPress={() => onAjouterPas(10000)} /></View>
        </View>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Rencontres</Text>
        <Bouton
          titre={occupe ? 'Rencontre / radar déjà en cours' : 'Forcer une rencontre (gratuite)'}
          desactive={occupe}
          onPress={onForcerRencontre}
        />
        <Bouton titre="Forcer le Poké Radar (gratuit)" desactive={occupe} secondaire couleur={C.herbeFonce} onPress={p.onForcerRadar} />
        <View style={styles.ligne}>
          <Text style={styles.txt}>Forcer le shiny</Text>
          <Switch value={s.debug.forcerShiny} onValueChange={onBasculerShiny} />
        </View>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Œufs</Text>
        <View style={styles.rangee}>
          <View style={{ flex: 1 }}><Bouton titre="Donner un œuf" onPress={p.onDonnerOeuf} /></View>
          <View style={{ flex: 1 }}>
            <Bouton titre={`Tout éclore (${s.oeufs.length})`} desactive={s.oeufs.length === 0} onPress={p.onEclore} />
          </View>
        </View>
      </View>

      <CarteSauvegarde s={s} onImporter={p.onImporter} />

      <View style={styles.carte}>
        <Text style={styles.titre}>Paliers de rareté</Text>
        {PALIERS.map((p) => (
          <View key={p} style={styles.ligne}>
            <Text style={[styles.txt, { color: INFOS_PALIER[p].couleur, fontWeight: '700' }]}>{INFOS_PALIER[p].nom}</Text>
            <Text style={styles.txt}>{INFOS_PALIER[p].poids} % · {especesDuPalier(p).length} espèces</Text>
          </View>
        ))}
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Sauvegarde</Text>
        <Text style={styles.petit}>
          Pas : {Math.floor(s.pasTotal)} · dépensés : {s.pasDepenses} · dernier relevé :{' '}
          {s.dernierReleve ? new Date(s.dernierReleve).toLocaleString('fr-FR') : 'aucun'}
        </Text>
        <Bouton
          titre="Tout effacer"
          couleur={C.rouge}
          secondaire
          onPress={() =>
            Alert.alert('Tout effacer ?', 'Collection, pas et compagnon seront perdus.', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Effacer', style: 'destructive', onPress: onReinitialiser },
            ])
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14 },
  carte: { backgroundColor: C.carte, borderRadius: R, padding: 16, gap: 10, borderWidth: 1, borderColor: C.bordure },
  titre: { fontSize: 17, fontWeight: '800', color: C.texte },
  rangee: { flexDirection: 'row', gap: 8 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txt: { fontSize: 15, color: C.texte },
  petit: { fontSize: 12, color: C.texteDoux },
});
