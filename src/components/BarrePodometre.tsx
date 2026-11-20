// Bandeau du haut : pas, fouilles disponibles, progression vers la prochaine fouille.
import { StyleSheet, Text, View } from 'react-native';
import { COUT_FOUILLE, fouillesDispo, pasAvantProchaine } from '../regles';
import type { StatutPodometre } from '../hooks/usePodometre';
import { C, R } from '../theme';
import { Jauge } from './Jauge';

type Props = { pasTotal: number; pasDepenses: number; statut: StatutPodometre };

const MESSAGES: Partial<Record<StatutPodometre, string>> = {
  verification: 'Podomètre : vérification…',
  indisponible: 'Podomètre indisponible sur cet appareil (utilise le mode debug)',
  refuse: 'Accès aux mouvements refusé : Réglages > Expo Go > Mouvements et forme',
};

export function BarrePodometre({ pasTotal, pasDepenses, statut }: Props) {
  const dispo = fouillesDispo(pasTotal, pasDepenses);
  const reste = pasAvantProchaine(pasTotal, pasDepenses);
  return (
    <View style={styles.carte}>
      <View style={styles.ligne}>
        <View>
          <Text style={styles.gros}>{Math.floor(pasTotal).toLocaleString('fr-FR')}</Text>
          <Text style={styles.petit}>pas au total</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.gros, { color: C.herbeFonce }]}>{dispo}</Text>
          <Text style={styles.petit}>fouille{dispo > 1 ? 's' : ''} dispo</Text>
        </View>
      </View>
      <Jauge valeur={(COUT_FOUILLE - reste) / COUT_FOUILLE} detail={`encore ${reste} pas`} libelle="Prochaine fouille" />
      {MESSAGES[statut] && <Text style={styles.alerte}>{MESSAGES[statut]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { backgroundColor: C.carte, borderRadius: R, padding: 14, gap: 10, borderWidth: 1, borderColor: C.bordure },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  gros: { fontSize: 26, fontWeight: '800', color: C.texte },
  petit: { fontSize: 12, color: C.texteDoux },
  alerte: { fontSize: 12, color: C.rouge },
});
