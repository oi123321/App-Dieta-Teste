import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brl, minutesLabel, plural } from '../../lib/format';
import { recipeCost } from '../../lib/recipes';
import { compactCount, timeAgo } from '../../lib/time';
import { postToRecipe } from '../../social/convert';
import type { Post } from '../../social/types';
import { colors, fonts, radius, shadow } from '../../theme';
import { Emoji } from '../Emoji';
import { Bookmark, CalendarPlus, Check, Clock, Ellipsis, Heart, MessageCircle, Users } from '../icons';
import { postRows } from '../recipe/ingredientRows';
import { Avatar } from './Avatar';
import { PostPhoto } from './PostPhoto';

const MAX_CHIPS = 6;

interface Props {
  post: Post;
  marketIndex: number;
  inPlan: boolean;
  onOpen: (post: Post) => void;
  onAuthor: (post: Post) => void;
  onLike: (post: Post) => void;
  onComment: (post: Post) => void;
  onSave: (post: Post) => void;
  onPlan: (post: Post) => void;
  onMore: (post: Post) => void;
}

export const PostCard = memo(function PostCard({
  post,
  marketIndex,
  inPlan,
  onOpen,
  onAuthor,
  onLike,
  onComment,
  onSave,
  onPlan,
  onMore,
}: Props) {
  const recipe = useMemo(() => postToRecipe(post), [post]);
  const rows = useMemo(() => postRows(post.ingredients, 1), [post.ingredients]);
  const cost = recipeCost(recipe, post.servings, marketIndex);
  const hidden = rows.length - MAX_CHIPS;
  const place = [post.author.username && `@${post.author.username}`, post.author.city].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.author}
          onPress={() => onAuthor(post)}
          accessibilityRole="button"
          accessibilityLabel={`Perfil de ${post.author.name}`}
        >
          <Avatar avatar={post.author.avatar} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {post.author.name}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              {place}
            </Text>
          </View>
        </Pressable>
        <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        <Pressable
          onPress={() => onMore(post)}
          hitSlop={10}
          style={styles.more}
          accessibilityRole="button"
          accessibilityLabel="Mais opções"
        >
          <Ellipsis size={20} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable onPress={() => onOpen(post)} accessibilityRole="button" accessibilityLabel={`Abrir receita ${post.title}`}>
        <View style={styles.photoWrap}>
          <PostPhoto post={post} style={styles.photo} />
          <LinearGradient colors={['rgba(8,20,12,0)', 'rgba(8,20,12,0.55)']} style={styles.photoShade} pointerEvents="none" />
          {cost > 0 ? (
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>≈ {brl(cost)}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Clock size={13} color={colors.onDark} strokeWidth={2.5} />
              <Text style={styles.metaText}>{minutesLabel(post.minutes)}</Text>
            </View>
            <View style={styles.metaPill}>
              <Users size={13} color={colors.onDark} strokeWidth={2.5} />
              <Text style={styles.metaText}>{plural(post.servings, 'porção', 'porções')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          {post.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {post.description}
            </Text>
          ) : null}
          <View style={styles.chips}>
            {rows.slice(0, MAX_CHIPS).map((row) => (
              <View key={row.key} style={[styles.chip, { backgroundColor: row.tint }]}>
                {row.icon ? <Emoji name={row.icon} size={15} /> : null}
                <Text style={styles.chipName} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.chipQty}>{row.qty}</Text>
              </View>
            ))}
            {hidden > 0 ? (
              <View style={[styles.chip, styles.chipMore]}>
                <Text style={styles.chipName}>+{hidden}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={styles.action}
          onPress={() => onLike(post)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityState={{ selected: post.likedByMe }}
          accessibilityLabel={`${post.likedByMe ? 'Descurtir' : 'Curtir'}, ${post.likeCount} curtidas`}
        >
          <Heart
            size={21}
            color={post.likedByMe ? colors.tomato : colors.inkSoft}
            fill={post.likedByMe ? colors.tomato : 'transparent'}
            strokeWidth={2.2}
          />
          <Text style={styles.actionText}>{compactCount(post.likeCount)}</Text>
        </Pressable>
        <Pressable
          style={styles.action}
          onPress={() => onComment(post)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Comentários, ${post.commentCount}`}
        >
          <MessageCircle size={21} color={colors.inkSoft} strokeWidth={2.2} />
          <Text style={styles.actionText}>{compactCount(post.commentCount)}</Text>
        </Pressable>
        <Pressable
          style={styles.action}
          onPress={() => onSave(post)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityState={{ selected: post.savedByMe }}
          accessibilityLabel={`${post.savedByMe ? 'Remover dos salvos' : 'Salvar'}, ${post.saveCount} salvamentos`}
        >
          <Bookmark
            size={21}
            color={post.savedByMe ? colors.forest : colors.inkSoft}
            fill={post.savedByMe ? colors.forest : 'transparent'}
            strokeWidth={2.2}
          />
          <Text style={styles.actionText}>{compactCount(post.saveCount)}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={[styles.planBtn, inPlan && styles.planBtnOn]}
          onPress={() => onPlan(post)}
          accessibilityRole="button"
          accessibilityLabel={inPlan ? 'Já está no plano. Trocar o dia' : 'Adicionar ao cardápio da semana'}
        >
          {inPlan ? (
            <Check size={16} color={colors.leafDark} strokeWidth={3} />
          ) : (
            <CalendarPlus size={16} color={colors.sun} strokeWidth={2.4} />
          )}
          <Text style={[styles.planText, inPlan && styles.planTextOn]}>{inPlan ? 'No plano' : 'Plano'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, overflow: 'hidden', ...shadow(1) },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.ink },
  handle: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  time: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  more: { padding: 4 },
  photoWrap: { aspectRatio: 1.3, backgroundColor: colors.creamDeep },
  photo: { width: '100%', height: '100%' },
  photoShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 },
  pricePill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    ...shadow(1),
  },
  priceText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.forest },
  metaRow: { position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', gap: 6 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8,20,12,0.45)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  metaText: { fontFamily: fonts.bold, fontSize: 12, color: colors.onDark },
  body: { paddingHorizontal: 14, paddingTop: 12 },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.ink },
  description: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 19, color: colors.inkSoft, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipMore: { backgroundColor: colors.lineSoft },
  chipName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkSoft, flexShrink: 1 },
  chipQty: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.forest },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.inkSoft },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 36,
  },
  planBtnOn: { backgroundColor: colors.leafSoft },
  planText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.sun },
  planTextOn: { color: colors.leafDark },
});
