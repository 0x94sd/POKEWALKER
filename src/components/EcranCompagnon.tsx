// Écran du compagnon : sprite, niveau, XP, stats rapides.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COULEURS_TYPES, NOMS_TYPES, getEspece } from '../pokemon';
import { PAS_PAR_XP, niveauDepuisXp, progressionNiveau, xpPourNiveau } from '../regles';
import type { PokemonCapture, Sauvegarde } from '../types';
import { C, R } from '../theme';
import { Jauge } from './Jauge';
import { SpritePokemon } from './SpritePokemon';

export function EcranCompagnon({ s, compagnon }: { s: Sauvegarde; compagnon: PokemonCapture }) {
  const e = getEspece(compagnon.especeId);
  const niv = niveauDepuisXp(compagnon.xp);
  const xp = Math.floor(compagnon.xp);
  const prochain = xpPourNiveau(niv + 1);
  const especesCapturees = new Set(s.collection.map((p) => p.especeId)).size;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.carte}>
        <View style={styles.scene}>
          <SpritePokemon id={e.id} shiny={compagnon.shiny} taille={180} sauter />
        </View>
        <Text style={styles.nom}>{compagnon.surnom ?? e.nom}</Text>
        <Text style={styles.niveau}>Niv. {niv}</Text>
        <View style={styles.types}>
          {e.types.map((t) => (
            <Text key={t} style={[styles.type, { backgroundColor: COULEURS_TYPES[t] ?? '#999' }]}>
              {NOMS_TYPES[t] ?? t}
            </Text>
          ))}
        </View>
        <Jauge
          valeur={progressionNiveau(compagnon.xp)}
          couleur={C.or}
          libelle="XP"
          detail={niv >= 100 ? 'max' : `${xp} / ${prochain}`}
        />
        <Text style={styles.astuce}>+1 XP tous les {PAS_PAR_XP} pas, bonus à chaque capture</Text>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titreBloc}>Ton aventure</Text>
        <Stat nom="Fouilles" val={s.stats.fouilles} />
        <Stat nom="Captures" val={s.stats.captures} />
        <Stat nom="Fuites" val={s.stats.fuites} />
        <Stat nom="Shiny" val={s.stats.shinies} />
        <Stat nom="Espèces capturées" val={`${especesCapturees} / 151`} />
      </View>
    </ScrollView>
  );
}

function Stat({ nom, val }: { nom: string; val: number | string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNom}>{nom}</Text>
      <Text style={styles.statVal}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14 },
  carte: { backgroundColor: C.carte, borderRadius: R, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.bordure },
  scene: { backgroundColor: '#e4f1da', borderRadius: 100, padding: 10 },
  nom: { fontSize: 24, fontWeight: '800', color: C.texte },
  niveau: { fontSize: 15, color: C.texteDoux, marginTop: -6 },
  types: { flexDirection: 'row', gap: 6 },
  type: { color: '#fff', fontWeight: '700', fontSize: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  astuce: { fontSize: 12, color: C.texteDoux },
  titreBloc: { fontSize: 17, fontWeight: '800', color: C.texte, alignSelf: 'flex-start' },
  stat: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  statNom: { color: C.texteDoux, fontSize: 15 },
  statVal: { color: C.texte, fontSize: 15, fontWeight: '700' },
});
