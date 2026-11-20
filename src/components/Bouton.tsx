import { Pressable, StyleSheet, Text } from 'react-native';
import { C } from '../theme';

type Props = {
  titre: string;
  onPress: () => void;
  desactive?: boolean;
  couleur?: string;
  secondaire?: boolean;
};

export function Bouton({ titre, onPress, desactive, couleur = C.herbe, secondaire }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      style={({ pressed }) => [
        styles.btn,
        secondaire ? { backgroundColor: 'transparent', borderWidth: 2, borderColor: couleur } : { backgroundColor: couleur },
        desactive && styles.desactive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.txt, secondaire && { color: couleur }]}>{titre}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' },
  txt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  desactive: { opacity: 0.35 },
});
