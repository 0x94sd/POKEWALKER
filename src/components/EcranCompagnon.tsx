// Écran du compagnon : sprite (tap = caresse), humeur, jauges, soins, XP, œufs, stats.
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COULEURS_TYPES, NOMS_TYPES, getEspece } from '../pokemon';
import {
  PAS_PAR_XP, bonusCaptureCompagnon, humeur, multXp, niveauDepuisXp, progressionNiveau, soinsDe, xpPourNiveau,
} from '../regles';
import type { PokemonCapture, Sauvegarde } from '../types';
import { C, R } from '../theme';
import { Bouton } from './Bouton';
import { Jauge } from './Jauge';
import { ListeOeufs } from './ListeOeufs';
import { SpritePokemon } from './SpritePokemon';

type Props = {
  s: Sauvegarde;
  compagnon: PokemonCapture;
  onRenommer: (surnom: string) => void;
  onSoigner: (soin: 'nourrir' | 'caresser' | 'pause') => void;
};

type Coeur = { id: number; x: number; anim: Animated.Value };

export function EcranCompagnon({ s, compagnon, onRenommer, onSoigner }: Props) {
  const e = getEspece(compagnon.especeId);
  const nom = compagnon.surnom ?? e.nom;
  const niv = niveauDepuisXp(compagnon.xp);
  const xp = Math.floor(compagnon.xp);
  const prochain = xpPourNiveau(niv + 1);
  const especesCapturees = new Set(s.collection.map((p) => p.especeId)).size;
  const soins = soinsDe(compagnon);
  const h = humeur(soins);
  const mult = multXp(soins);
  const aide = bonusCaptureCompagnon(soins);

  const [coeurs, setCoeurs] = useState<Coeur[]>([]);
  const prochainId = useRef(0);

  const caresser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSoigner('caresser');
    const c: Coeur = { id: prochainId.current++, x: Math.random() * 120 - 60, anim: new Animated.Value(0) };
    setCoeurs((l) => [...l.slice(-6), c]);
    Animated.timing(c.anim, { toValue: 1, duration: 900, useNativeDriver: true }).start(() =>
      setCoeurs((l) => l.filter((x) => x.id !== c.id)),
    );
  };

  const soigner = (soin: 'nourrir' | 'pause') => {
    Haptics.selectionAsync();
    onSoigner(soin);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.carte}>
        <Pressable onPress={caresser} style={styles.scene}>
          <SpritePokemon id={e.id} shiny={compagnon.shiny} taille={180} sauter={soins.energie >= 20} />
          {coeurs.map((c) => (
            <Animated.Text
              key={c.id}
              style={[
                styles.coeur,
                {
                  opacity: c.anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
                  transform: [
                    { translateX: c.x },
                    { translateY: c.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -90] }) },
                  ],
                },
              ]}
            >
              💖
            </Animated.Text>
          ))}
        </Pressable>
        <Pressable
          onPress={() => Alert.prompt('Surnom', `Laisse vide pour revenir à « ${e.nom} »`, onRenommer, 'plain-text', compagnon.surnom ?? '')}
        >
          <Text style={styles.nom}>{nom} ✏️</Text>
        </Pressable>
        <Text style={styles.niveau}>
          Niv. {niv} · {h.icone} {nom} {h.texte}
        </Text>
        <View style={styles.types}>
          {e.types.map((t) => (
            <Text key={t} style={[styles.type, { backgroundColor: COULEURS_TYPES[t] ?? '#999' }]}>
              {NOMS_TYPES[t] ?? t}
            </Text>
          ))}
        </View>
        <Jauge valeur={progressionNiveau(compagnon.xp)} couleur={C.or} libelle="XP" detail={niv >= 100 ? 'max' : `${xp} / ${prochain}`} />
        <Text style={styles.astuce}>
          +1 XP / {PAS_PAR_XP} pas, bonus à chaque capture · humeur : XP x{mult.toFixed(2)}
          {aide > 0 ? ` · +${Math.round(aide * 100)} % de capture` : ''}
        </Text>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titreBloc}>Soins</Text>
        <Jauge valeur={soins.satiete / 100} couleur="#e8833a" libelle="🍎 Satiété" detail={`${Math.round(soins.satiete)} %`} />
        <Jauge valeur={soins.bonheur / 100} couleur="#e0579b" libelle="💖 Bonheur" detail={`${Math.round(soins.bonheur)} %`} />
        <Jauge valeur={soins.energie / 100} couleur="#3d8be0" libelle="⚡ Énergie" detail={`${Math.round(soins.energie)} %`} />
        <View style={styles.rangee}>
          <View style={{ flex: 1 }}><Bouton titre="🍎 Nourrir" couleur="#e8833a" onPress={() => soigner('nourrir')} /></View>
          <View style={{ flex: 1 }}><Bouton titre="💤 Pause" couleur="#3d8be0" onPress={() => soigner('pause')} /></View>
        </View>
        <Text style={styles.astuce}>
          Marcher creuse l'appétit et fatigue, mais rend heureux. Tape sur {nom} pour le caresser. Rien ne baisse quand tu ne marches pas.
        </Text>
      </View>

      <ListeOeufs oeufs={s.oeufs} />

      <View style={styles.carte}>
        <Text style={styles.titreBloc}>Ton aventure</Text>
        <Stat nom="Fouilles" val={s.stats.fouilles} />
        <Stat nom="Captures" val={s.stats.captures} />
        <Stat nom="Fuites" val={s.stats.fuites} />
        <Stat nom="Shiny" val={s.stats.shinies} />
        <Stat nom="Œufs éclos" val={s.stats.eclosions} />
        <Stat nom="Meilleure chaîne radar" val={s.stats.meilleureChaine} />
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
  scene: { backgroundColor: '#e4f1da', borderRadius: 100, padding: 10, alignItems: 'center', justifyContent: 'center' },
  coeur: { position: 'absolute', top: 30, fontSize: 26 },
  nom: { fontSize: 24, fontWeight: '800', color: C.texte },
  niveau: { fontSize: 15, color: C.texteDoux, marginTop: -6, textAlign: 'center' },
  types: { flexDirection: 'row', gap: 6 },
  type: { color: '#fff', fontWeight: '700', fontSize: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  astuce: { fontSize: 12, color: C.texteDoux, textAlign: 'center' },
  titreBloc: { fontSize: 17, fontWeight: '800', color: C.texte, alignSelf: 'flex-start' },
  rangee: { flexDirection: 'row', gap: 8, width: '100%' },
  stat: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  statNom: { color: C.texteDoux, fontSize: 15 },
  statVal: { color: C.texte, fontSize: 15, fontWeight: '700' },
});
