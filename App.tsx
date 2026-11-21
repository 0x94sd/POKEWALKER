// Point d'entrée de l'app : assemble les écrans. La logique est dans src/, l'affichage dans src/components/.
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AnnonceEclosion } from './src/components/AnnonceEclosion';
import { BarreOnglets, type Onglet } from './src/components/BarreOnglets';
import { BandeauContexte } from './src/components/BandeauContexte';
import { BarrePodometre } from './src/components/BarrePodometre';
import { EcranCollection } from './src/components/EcranCollection';
import { EcranCompagnon } from './src/components/EcranCompagnon';
import { EcranDebug } from './src/components/EcranDebug';
import { EcranHerbes } from './src/components/EcranHerbes';
import { EcranStarter } from './src/components/EcranStarter';
import { StyleSpriteContext } from './src/components/SpritePokemon';
import { useEnvironnement, type Forcages } from './src/hooks/useEnvironnement';
import { useJeu } from './src/hooks/useJeu';
import { usePodometre } from './src/hooks/usePodometre';
import type { StyleSprite } from './src/pokemon';
import { fouillesDispo } from './src/regles';
import { effacer, sauvegardeVierge } from './src/sauvegarde';
import { C } from './src/theme';
import type { Sauvegarde } from './src/types';

export default function App() {
  return (
    <SafeAreaProvider>
      <Jeu />
    </SafeAreaProvider>
  );
}

function Jeu() {
  // ===== 1. MÉMOIRE =====
  const { etat, dispatch } = useJeu();
  const [onglet, setOnglet] = useState<Onglet>('compagnon');
  const s = etat.s;
  const compagnon = s.collection.find((p) => p.uid === s.compagnonUid) ?? null;
  const aAnnoncer = s.aAnnoncer.length > 0 ? (s.collection.find((p) => p.uid === s.aAnnoncer[0]) ?? null) : null;

  // ===== 2. EFFETS (podomètre) =====
  const onPas = useCallback((pas: number, releve: number) => dispatch({ type: 'ajouterPas', pas, releve }), [dispatch]);
  const statutPodometre = usePodometre({ pret: etat.charge, dernierReleve: s.dernierReleve, onPas });
  const env = useEnvironnement({
    meteo: s.debug.meteoForcee,
    lieu: s.debug.lieuForce,
    frequentation: s.debug.frequentationForcee,
  } as Forcages);

  // ===== 3. ACTIONS =====
  const actions = {
    choisirStarter: (especeId: number) => dispatch({ type: 'choisirStarter', especeId }),
    fouiller: () => dispatch({ type: 'fouiller', opts: env.opts }),
    radar: () => dispatch({ type: 'lancerRadar', opts: env.opts }),
    choisirBuisson: (index: number) => dispatch({ type: 'choisirBuisson', index }),
    quitterRadar: () => dispatch({ type: 'quitterRadar' }),
    renommerCompagnon: (surnom: string) => compagnon && dispatch({ type: 'renommer', uid: compagnon.uid, surnom }),
    annonceVue: () => dispatch({ type: 'annonceVue' }),
    soigner: (soin: 'nourrir' | 'caresser' | 'pause') => dispatch({ type: 'soigner', soin }),
    choisirStyle: (style: StyleSprite) => dispatch({ type: 'choisirStyleSprite', style }),
    lancer: () => dispatch({ type: 'lancerBall' }),
    abandonner: () => dispatch({ type: 'abandonnerRencontre' }),
    definirCompagnon: (uid: string) => dispatch({ type: 'definirCompagnon', uid }),
    ajouterPasDebug: (pas: number) => dispatch({ type: 'ajouterPas', pas }),
    forcerRencontre: () => {
      dispatch({ type: 'fouiller', gratuit: true, opts: env.opts });
      setOnglet('herbes');
    },
    forcerRadar: () => {
      dispatch({ type: 'lancerRadar', gratuit: true, opts: env.opts });
      setOnglet('herbes');
    },
    donnerOeuf: () => dispatch({ type: 'debugDonnerOeuf' }),
    eclore: () => dispatch({ type: 'debugEclore' }),
    importer: (nouvelle: Sauvegarde) => {
      dispatch({ type: 'reinitialiser', sauvegarde: { ...nouvelle, dernierReleve: Date.now() } });
      setOnglet('compagnon');
    },
    basculerShiny: () => dispatch({ type: 'basculerForcerShiny' }),
    forcer: (champ: 'meteoForcee' | 'lieuForce' | 'frequentationForcee', valeur: string | null) =>
      dispatch({ type: 'debugForcer', champ, valeur }),
    reinitialiser: async () => {
      await effacer();
      dispatch({ type: 'reinitialiser', sauvegarde: { ...sauvegardeVierge(), dernierReleve: Date.now() } });
      setOnglet('compagnon');
    },
  };

  // ===== 4. AFFICHAGE =====
  if (!etat.charge) {
    return (
      <View style={[styles.racine, styles.centre]}>
        <ActivityIndicator size="large" color={C.herbe} />
      </View>
    );
  }

  if (!compagnon) {
    return (
      <SafeAreaView style={styles.racine}>
        <StatusBar style="dark" />
        <EcranStarter onChoisir={actions.choisirStarter} />
      </SafeAreaView>
    );
  }

  return (
    <StyleSpriteContext.Provider value={s.reglages.styleSprite as StyleSprite}>
      <SafeAreaView style={styles.racine} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.entete}>
          <BarrePodometre pasTotal={s.pasTotal} pasDepenses={s.pasDepenses} statut={statutPodometre} />
        </View>
        <View style={styles.contenu}>
          {onglet === 'compagnon' && (
            <EcranCompagnon s={s} compagnon={compagnon} onRenommer={actions.renommerCompagnon} onSoigner={actions.soigner} />
          )}
          {onglet === 'herbes' && (
            <EcranHerbes
              s={s}
              dernierLancer={etat.dernierLancer}
              oeufTrouve={etat.oeufTrouve}
              bandeau={<BandeauContexte contexte={env.contexte} statut={env.statut} onRafraichir={env.rafraichir} />}
              onFouiller={actions.fouiller}
              onRadar={actions.radar}
              onChoisirBuisson={actions.choisirBuisson}
              onQuitterRadar={actions.quitterRadar}
              onLancer={actions.lancer}
              onAbandonner={actions.abandonner}
            />
          )}
          {onglet === 'collection' && <EcranCollection s={s} onDefinirCompagnon={actions.definirCompagnon} />}
          {onglet === 'debug' && (
            <EcranDebug
              s={s}
              onAjouterPas={actions.ajouterPasDebug}
              onForcerRencontre={actions.forcerRencontre}
              onForcerRadar={actions.forcerRadar}
              onDonnerOeuf={actions.donnerOeuf}
              onEclore={actions.eclore}
              onImporter={actions.importer}
              onForcer={actions.forcer}
              onChoisirStyle={actions.choisirStyle}
              especeApercu={compagnon.especeId}
              onBasculerShiny={actions.basculerShiny}
              onReinitialiser={actions.reinitialiser}
            />
          )}
        </View>
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: C.carte }}>
          <BarreOnglets
            actif={onglet}
            onChange={setOnglet}
            pastilleHerbes={s.rencontreEnCours || s.radar ? 1 : fouillesDispo(s.pasTotal, s.pasDepenses)}
          />
        </SafeAreaView>
        <AnnonceEclosion pokemon={aAnnoncer} onFermer={actions.annonceVue} />
      </SafeAreaView>
    </StyleSpriteContext.Provider>
  );
}

// ===== 5. STYLES =====
const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: C.fond },
  centre: { alignItems: 'center', justifyContent: 'center' },
  entete: { paddingHorizontal: 16, paddingTop: 8 },
  contenu: { flex: 1 },
});
