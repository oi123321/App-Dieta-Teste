import { Image, type ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp } from 'react-native';

import { COVERS } from '../data/covers';
import type { Recipe } from '../data/types';
import { colors, fonts } from '../theme';
import { Emoji } from './Emoji';

export function RecipeImage({ recipe, style, plain }: { recipe: Recipe; style?: StyleProp<ImageStyle>; plain?: boolean }) {
  const cover = COVERS[recipe.id];
  if (cover) return <Image source={cover} style={style} contentFit="cover" transition={120} accessibilityIgnoresInvertColors />;
  if (recipe.imageUrl) return <Image source={{ uri: recipe.imageUrl }} style={style} contentFit="cover" transition={120} />;
  const platform = recipe.source?.platform;
  return (
    <View style={[style as object, styles.placeholder]}>
      <LinearGradient colors={['#FBE3B8', '#F4B98A']} style={StyleSheet.absoluteFill} />
      {plain ? null : <Emoji name="cook" size={64} />}
      {!plain && platform && platform !== 'link' ? (
        <Text style={styles.platform}>{platform === 'tiktok' ? 'TikTok' : 'Instagram'}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 6 },
  platform: { fontFamily: fonts.bold, fontSize: 12, color: colors.forest, opacity: 0.7 },
});
