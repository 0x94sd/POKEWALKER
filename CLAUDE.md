# Pokéwalker Amélioré

App iPhone perso (jamais publiée) : Pokéwalker + Pokémon GO + tamagotchi. On rencontre des Pokémon en marchant.
Vision : découverte, liberté. **Zéro microtransaction, aucune limite artificielle** (pas d'énergie, de timers, d'expirations).

## Contexte dev
- L'utilisateur ne code pas : Claude code tout. Lui teste sur **iPhone via Expo Go**, depuis **Windows + PowerShell** (pas de Mac).
- Dossier local : `C:\Users\kerya\Documents\pokewalker`
- Réponses en français, directes. Fin de lot : 3 lignes de changements, quoi tester sur l'iPhone, commandes PowerShell.
- Voir aussi `AGENTS.md` (règles Expo génériques). Ici on **n'utilise pas Expo Router** : navigation par onglets maison dans `App.tsx`.

## Stack
- Expo **SDK 58** + TypeScript (React Native 0.88, React 19.3)
- Libs (toutes incluses dans Expo Go) : `expo-sensors` (Pedometer), `@react-native-async-storage/async-storage`, `expo-image` (cache disque des sprites), `expo-haptics`, `react-native-safe-area-context`
- Ajouter une lib : `npx expo install <paquet>` (jamais `npm install` direct). Aucun module natif hors Expo Go sans prévenir.
- Données Pokémon : générées depuis PokéAPI par `node scripts/genererPokedex.mjs 151` -> `src/data/pokedex.ts` (hors ligne).
- Sprites : `raw.githubusercontent.com/PokeAPI/sprites`, mis en cache disque par expo-image.

## Architecture
| Fichier | Rôle |
| --- | --- |
| `App.tsx` | Assemble les écrans, 5 zones commentées : Mémoire, Effets, Actions, Affichage, Styles |
| `src/types.ts` | Types partagés (Espece, Rencontre, PokemonCapture, Sauvegarde) |
| `src/pokemon.ts` | Accès Pokédex, starters, URL sprites, noms/couleurs des types |
| `src/data/pokedex.ts` | **Généré**, 151 espèces (nom FR, types, captureRate, légendaire, éclosion, évolution) |
| `src/regles.ts` | Règles pures : fouilles, paliers de rareté, tirage 2 temps, shiny, capture, fuite, XP/niveau |
| `src/jeu.ts` | Reducer pur : toutes les actions du jeu (état -> nouvel état) |
| `src/sauvegarde.ts` | AsyncStorage : charger / enregistrer / normaliser / effacer |
| `src/hooks/useJeu.ts` | Branche le reducer sur React + sauvegarde auto (debounce 500 ms) |
| `src/hooks/usePodometre.ts` | Pas en direct + rattrapage des pas faits app fermée (historique iOS 7 j) |
| `src/components/` | Écrans (Starter, Compagnon, Herbes, Collection, Debug) + briques (Sprite, Jauge, Bouton, Onglets, BarrePodometre) |

Règle : logique de jeu pure dans `src/` (testable sans React), affichage dans `src/components/`.

## Règles de jeu actuelles
- 250 pas = 1 fouille. `fouillesDispo = floor((pasTotal - pasDepenses) / 250)`
- Paliers selon captureRate : commun ≥150 (60 %), peu commun 75-149 (25 %), rare 45-74 (10 %), très rare <45 (4 %), légendaire/fabuleux (1 %)
- Tirage en 2 temps : palier puis espèce au hasard dans le palier. Shiny 1/512.
- Capture : `0.15 + 0.75 * captureRate/255`. Fuite après échec : `0.05 + 0.15 * (1 - captureRate/255)`. Poké Balls illimitées.
- Compagnon : +1 XP / 10 pas, +25 XP par capture. Niveau n = 10·(n-1)² XP cumulée, max 100.

## Vérifs avant de rendre la main
```
npx tsc --noEmit
EXPO_OFFLINE=1 CI=1 npx expo export --platform ios --output-dir /tmp/export   # vérifie que Metro bundle
```

## État (lot 1, nov. 2026)
Fait :
- Projet Expo SDK 58 recréé (le dépôt GitHub était vide), découpé en composants
- Podomètre en direct + rattrapage au retour dans l'app, sauvegarde locale auto
- Choix du starter (Bulbizarre, Salamèche, Carapuce, Pikachu)
- Fouille, paliers de rareté, shiny, capture/échappe/fuite, vibrations
- Pokédex 151 (silhouettes / vus / capturés) + liste des Pokémon, changer de compagnon
- Compagnon : niveau + barre d'XP + stats
- Debug : +250/+1000/+10000 pas, forcer rencontre, forcer shiny, voir les paliers, tout effacer

## Roadmap
**Lot 2** : mode 3 buissons (Poké Radar), œufs qui éclosent à la distance, export/import de sauvegarde (copier/coller texte)
**Lot 3** : météo Open-Meteo + localisation (types favorisés selon météo et lieu), lieux spéciaux OSM (cimetière -> Spectre, centrale -> Électrik...), plus de rares dans les endroits peu fréquentés
**Lot 4** : jauges tamagotchi (faim / bonheur / énergie), interactions compagnon, choix du style de sprites par génération + sprites animés Showdown
**Lot 5+** : niveaux/IV/stats/attaques façon jeux principaux, combats (`@smogon/calc` + `@pkmn/data`, MIT à vérifier), arènes Kanto, Conseil 4, échanges par QR code
**Hors Expo Go** (dev build nécessaire, à valider avant) : widget écran d'accueil / verrouillage
