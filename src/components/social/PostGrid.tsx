import { Pressable, StyleSheet, Text, View } from 'react-native';

import { compactCount } from '../../lib/time';
import type { Post } from '../../social/types';
import { colors, fonts, GUTTER, radius, shadow } from '../../theme';
import { Bookmark, Heart } from '../icons';
import { useScreenSize } from '../PhoneFrame';
import { PostPhoto } from './PostPhoto';

const GAP = 12;

/** Two-column grid of post thumbnails, used on profiles. */
export function PostGrid({ posts, onOpen }: { posts: Post[]; onOpen: (post: Post) => void }) {
  const { width } = useScreenSize();
  const tile = Math.floor((width - GUTTER * 2 - GAP) / 2);
  return (
    <View style={styles.grid}>
      {posts.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => onOpen(post)}
          style={({ pressed }) => [styles.tile, { width: tile }, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={post.title}
        >
          <PostPhoto post={post} style={{ width: tile, height: tile * 0.85 }} emojiSize={40} />
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {post.title}
            </Text>
            <View style={styles.meta}>
              <Heart size={13} color={colors.tomato} fill={post.likedByMe ? colors.tomato : 'transparent'} strokeWidth={2.4} />
              <Text style={styles.metaText}>{compactCount(post.likeCount)}</Text>
              <Bookmark
                size={13}
                color={colors.forest}
                fill={post.savedByMe ? colors.forest : 'transparent'}
                strokeWidth={2.4}
                style={{ marginLeft: 8 }}
              />
              <Text style={styles.metaText}>{compactCount(post.saveCount)}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow(1) },
  body: { padding: 10, gap: 6 },
  title: { fontFamily: fonts.extrabold, fontSize: 13.5, lineHeight: 17, color: colors.ink, minHeight: 34 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft },
});
