import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

import { EMOJI, type EmojiName } from '../data/emoji';

export function Emoji({ name, size = 24, style }: { name: EmojiName; size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={EMOJI[name]} style={[{ width: size, height: size }, style]} contentFit="contain" />;
}
