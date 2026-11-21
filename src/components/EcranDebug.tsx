// Outils de test sans marcher.
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { INFOS_PALIER, PALIERS, especesDuPalier } from '../regles';
import type { Sauvegarde } from '../types';
import { C, R } from '../theme';
import { Bouton } from './Bouton';
import { CarteSauvegarde } from './CarteSauvegarde';
import { ChoixChips } from './ChoixChips';
import { FREQUENTATIONS, LIEUX, METEOS } from '../environnement';

type ChampForcage = 'meteoForcee' | 'lieuForce' | 'frequentationForcee';
const OPT_METEO = Object.entries(METEOS).map(([valeur, m]) => ({ valeur, libelle: `${m.icone} ${m.nom}` }));
const OPT_LIEU = Object.entries(LIEUX).map(([valeur, l]) => ({ valeur, libelle: `${l.icone} ${l.nom}` }));
const OPT_FREQ = Object.entries(FREQUENTATIONS).map(([valeur, f]) => ({ valeur, libelle: f.nom }));

type Props = {
  s: Sauvegarde;
  onAjouterPas: (n: number) => void;
  onForcerRencontre: () => void;
  onForcerRadar: () => void;
  onDonnerOeuf: () => void;
  onEclore: () => void;
  onBasculerShiny: () => void;
  onImporter: (s: Sauvegarde) => void;
  onForcer: (champ: ChampForcage, valeur: string | null) => void;
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

      <View style={styles.carte}>
        <Text style={styles.titre}>Simuler météo et lieu</Text>
        <Text style={styles.petit}>Météo</Text>
        <ChoixChips options={OPT_METEO} valeur={s.debug.meteoForcee} onChange={(v) => p.onForcer('meteoForcee', v)} />
        <Text style={styles.petit}>Lieu</Text>
        <ChoixChips options={OPT_LIEU} valeur={s.debug.lieuForce} onChange={(v) => p.onForcer('lieuForce', v)} />
        <Text style={styles.petit}>Fréquentation</Text>
        <ChoixChips options={OPT_FREQ} valeur={s.debug.frequentationForcee} onChange={(v) => p.onForcer('frequentationForcee', v)} />
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
