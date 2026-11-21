// Bandeau "conditions du moment" : météo, jour/nuit, lieu, fréquentation et types favorisés.
import { Pressable, StyleSheet, Text } from 'react-native';
import { FREQUENTATIONS, LIEUX, METEOS, MOMENTS, bonusContexte, type Contexte } from '../environnement';
import type { StatutLocalisation } from '../hooks/useEnvironnement';
import { NOMS_TYPES } from '../pokemon';
import { C, R } from '../theme';

type Props = { contexte: Contexte; statut: StatutLocalisation; onRafraichir: () => void };

export function BandeauContexte({ contexte, statut, onRafraichir }: Props) {
  const b = bonusContexte(contexte);
  const morceaux: string[] = [];
  if (contexte.meteo) morceaux.push(`${METEOS[contexte.meteo].icone} ${METEOS[contexte.meteo].nom}`);
  if (contexte.moment === 'nuit') morceaux.push(`${MOMENTS.nuit.icone} Nuit`);
  for (const l of contexte.lieux.slice(0, 2)) morceaux.push(`${LIEUX[l].icone} ${LIEUX[l].nom}`);
  if (contexte.frequentation && contexte.frequentation !== 'urbain') {
    const f = FREQUENTATIONS[contexte.frequentation];
    morceaux.push(`🧭 ${f.nom} (rares x${f.multRare})`);
  }
  const types = [...new Set([...b.typesLieu, ...b.typesFavoris])].map((t) => NOMS_TYPES[t] ?? t);

  let aide: string | null = null;
  if (statut === 'refuse') aide = 'Localisation refusée : pas de météo ni de lieux (Réglages > Expo Go > Position).';
  else if (statut === 'erreur') aide = 'Position introuvable pour le moment.';
  else if (statut === 'verification') aide = 'Recherche de la météo et du lieu…';
  else if (!contexte.meteo) aide = 'Pas de réseau : météo indisponible.';

  return (
    <Pressable onPress={onRafraichir} style={styles.carte}>
      {morceaux.length > 0 && <Text style={styles.ligne}>{morceaux.join('  ·  ')}</Text>}
      {types.length > 0 && <Text style={styles.types}>Plus fréquents : {types.join(', ')}</Text>}
      {aide && <Text style={styles.aide}>{aide}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { backgroundColor: C.carte, borderRadius: R, paddingHorizontal: 14, paddingVertical: 10, gap: 3, borderWidth: 1, borderColor: C.bordure },
  ligne: { fontSize: 14, fontWeight: '700', color: C.texte },
  types: { fontSize: 12, color: C.herbeFonce },
  aide: { fontSize: 12, color: C.texteDoux },
});
