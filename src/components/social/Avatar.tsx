import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Avatar as AvatarData } from '../../social/types';
import { colors } from '../../theme';
import { Emoji } from '../Emoji';

export function Avatar({
  avatar,
  size = 40,
  ring,
  style,
}: {
  avatar: AvatarData | null | undefined;
  size?: number;
  /** White ring, for avatars placed on photos or dark headers. */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const box = [
    styles.box,
    { width: size, height: size, borderRadius: size / 2 },
    ring && { borderWidth: Math.max(2, size / 20), borderColor: colors.card },
    style,
  ];
  if (avatar?.kind === 'photo') {
    return (
      <View style={box}>
        <Image source={{ uri: avatar.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={[box, { backgroundColor: avatar?.color ?? colors.creamDeep }]}>
      <Emoji name={avatar?.emoji ?? 'cook'} size={size * 0.68} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
