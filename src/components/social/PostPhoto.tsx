import { Image, type ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp } from 'react-native';

import { COVERS } from '../../data/covers';
import { postEmoji, postRecipeId } from '../../social/convert';
import type { Post } from '../../social/types';
import { Emoji } from '../Emoji';

const PLACEHOLDER_TINTS: [string, string][] = [
  ['#FBE3B8', '#F4B98A'],
  ['#E4F1D6', '#BFDDA2'],
  ['#F9D7D0', '#F0AE9E'],
  ['#DCEBF5', '#B4D2E8'],
  ['#ECE5F5', '#CDBFE6'],
];

function tintFor(id: string): [string, string] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_TINTS[h % PLACEHOLDER_TINTS.length];
}

/** Photo of a community post: uploaded photo, bundled example art, or an illustrated placeholder. */
export function PostPhoto({
  post,
  style,
  emojiSize = 72,
}: {
  post: Pick<Post, 'id' | 'photoUrl' | 'ingredients'>;
  style?: StyleProp<ImageStyle>;
  emojiSize?: number;
}) {
  const bundled = COVERS[postRecipeId(post.id)];
  if (bundled) return <Image source={bundled} style={style} contentFit="cover" transition={120} />;
  if (post.photoUrl) return <Image source={{ uri: post.photoUrl }} style={style} contentFit="cover" transition={120} />;
  return (
    <View style={[style as object, styles.placeholder]}>
      <LinearGradient colors={tintFor(post.id)} style={StyleSheet.absoluteFill} />
      <View style={[styles.plate, { width: emojiSize * 1.9, height: emojiSize * 1.9, borderRadius: emojiSize }]}>
        <Emoji name={postEmoji(post)} size={emojiSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plate: { backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
});
