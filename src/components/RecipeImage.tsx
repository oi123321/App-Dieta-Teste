import { Image, type ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp } from 'react-native';

import { COVERS } from '../data/covers';
import type { EmojiName } from '../data/emoji';
import { getIngredient } from '../data/ingredients';
import type { Recipe } from '../data/types';
import { colors, fonts } from '../theme';
import { Emoji } from './Emoji';

export function RecipeImage({ recipe, style, plain }: { recipe: Recipe; style?: StyleProp<ImageStyle>; plain?: boolean }) {
  const cover = COVERS[recipe.id];
  if (cover) return <Image source={cover} style={style} contentFit="cover" transition={120} accessibilityIgnoresInvertColors />;
  if (recipe.imageUrl) return <Image source={{ uri: recipe.imageUrl }} style={style} contentFit="cover" transition={120} />;
  const platform = recipe.source?.platform;
  const label = platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : null;
  return (
    <View style={[style as object, styles.placeholder]}>
      <LinearGradient colors={['#FBE3B8', '#F4B98A']} style={StyleSheet.absoluteFill} />
      {plain ? null : <Emoji name={recipe.community ? mainIcon(recipe) : 'cook'} size={64} />}
      {!plain && label ? <Text style={styles.platform}>{label}</Text> : null}
    </View>
  );
}

/** Icon of the first ingredient we know, for community recipes without a photo. */
function mainIcon(recipe: Recipe): EmojiName {
  for (const item of recipe.ingredients) {
    const icon = getIngredient(item.id)?.icon;
    if (icon) return icon;
  }
  return 'cook';
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 6 },
  platform: { fontFamily: fonts.bold, fontSize: 12, color: colors.forest, opacity: 0.7 },
});
