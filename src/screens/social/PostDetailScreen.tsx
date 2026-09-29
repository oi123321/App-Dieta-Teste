import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APPLIANCE_ICONS } from '../../components/ApplianceIcon';
import { Button } from '../../components/Button';
import { Emoji } from '../../components/Emoji';
import { IconButton } from '../../components/IconButton';
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  CalendarPlus,
  Check,
  Clock,
  Droplet,
  Drumstick,
  Ellipsis,
  Flame,
  Heart,
  Trash2,
  Users,
  Wheat,
  type LucideIcon,
} from '../../components/icons';
import { IngredientList } from '../../components/recipe/IngredientList';
import { postRows } from '../../components/recipe/ingredientRows';
import { StepList } from '../../components/recipe/StepList';
import { Avatar } from '../../components/social/Avatar';
import { PostPhoto } from '../../components/social/PostPhoto';
import { Stepper } from '../../components/Stepper';
import { applianceName } from '../../data/appliances';
import { brl, minutesLabel } from '../../lib/format';
import { haptics } from '../../lib/haptics';
import { recipeCost, recipeMacros } from '../../lib/recipes';
import { compactCount, timeAgo } from '../../lib/time';
import type { RootScreenProps } from '../../navigation/types';
import { postToRecipe } from '../../social/convert';
import { useAddComment, useComments, useDeleteComment, useFollow, useIsFollowing, usePost } from '../../social/hooks';
import type { Post } from '../../social/types';
import { usePostActions } from '../../social/usePostActions';
import { useMarketInfo } from '../../store/selectors';
import { colors, fonts, GUTTER, noOutline, radius, shadow, type } from '../../theme';

export function PostDetailScreen({ route, navigation }: RootScreenProps<'PostDetail'>) {
  const insets = useSafeAreaInsets();
  const query = usePost(route.params.postId);
  const post = query.data;

  if (!post) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top + 80 }]}>
        {query.isPending ? (
          <ActivityIndicator color={colors.forest} />
        ) : (
          <>
            <Emoji name="face-savoring-food" size={52} />
            <Text style={[type.h2, { marginTop: 12, textAlign: 'center' }]}>
              {query.isError ? 'Não deu para abrir a receita' : 'Essa receita não está mais disponível'}
            </Text>
            <Button label="Voltar" variant="light" style={{ marginTop: 20 }} onPress={() => navigation.goBack()} />
          </>
        )}
      </View>
    );
  }
  return <PostDetail post={post} focusComments={Boolean(route.params.focusComments)} navigation={navigation} />;
}

function PostDetail({
  post,
  focusComments,
  navigation,
}: {
  post: Post;
  focusComments: boolean;
  navigation: RootScreenProps<'PostDetail'>['navigation'];
}) {
  const insets = useSafeAreaInsets();
  const actions = usePostActions({ onDeleted: () => navigation.goBack(), toastBottom: 96 + insets.bottom });
  const { index, label: market } = useMarketInfo();
  const [servings, setServings] = useState(post.servings);
  const scroll = useRef<ScrollView>(null);
  const commentsY = useRef(0);
  const scrolledToComments = useRef(false);

  const recipe = useMemo(() => postToRecipe(post), [post]);
  const macros = recipeMacros(recipe);
  const cost = recipeCost(recipe, servings, index);
  const factor = servings / post.servings;
  const rows = useMemo(() => postRows(post.ingredients, factor), [post.ingredients, factor]);
  const inPlan = actions.inPlan(post);
  const isMine = actions.me?.id === post.author.id;
  const unpriced = recipe.extras?.length ?? 0;

  const stats: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: Drumstick, value: `${macros.protein}g`, label: 'Proteína' },
    { icon: Wheat, value: `${macros.carbs}g`, label: 'Carboidratos' },
    { icon: Droplet, value: `${macros.fat}g`, label: 'Gorduras' },
    { icon: Flame, value: String(macros.kcal), label: 'Kcal' },
    { icon: Users, value: String(post.servings), label: 'Rende' },
    { icon: Clock, value: minutesLabel(post.minutes).replace(' min', 'm'), label: 'Tempo' },
  ];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        <View style={styles.hero}>
          <PostPhoto post={post} style={StyleSheet.absoluteFill} emojiSize={90} />
          <LinearGradient colors={['rgba(8,20,12,0.45)', 'rgba(8,20,12,0)']} style={styles.heroTop} />
          <LinearGradient colors={['rgba(8,20,12,0)', 'rgba(8,20,12,0.72)']} style={styles.heroBottom} />
          <Text style={styles.heroTitle} numberOfLines={3}>
            {post.title}
          </Text>
        </View>
        <IconButton
          icon={ArrowLeft}
          label="Voltar"
          tone="dark"
          onPress={() => navigation.goBack()}
          style={[styles.back, { top: insets.top + 8 }]}
        />
        <IconButton
          icon={Ellipsis}
          label="Mais opções"
          tone="dark"
          onPress={() => actions.more(post)}
          style={[styles.moreBtn, { top: insets.top + 8 }]}
        />

        <View style={styles.content}>
          <View style={styles.authorCard}>
            <Pressable
              style={styles.author}
              onPress={() => actions.openAuthor(post)}
              accessibilityRole="button"
              accessibilityLabel={`Perfil de ${post.author.name}`}
            >
              <Avatar avatar={post.author.avatar} size={46} />
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName} numberOfLines={1}>
                  {post.author.name}
                </Text>
                <Text style={styles.authorMeta} numberOfLines={1}>
                  @{post.author.username} · {timeAgo(post.createdAt)}
                </Text>
              </View>
            </Pressable>
            {isMine ? null : <FollowButton userId={post.author.id} withProfile={actions.withProfile} />}
          </View>
          {post.description ? <Text style={styles.description}>{post.description}</Text> : null}

          <View style={styles.statsCard}>
            <View style={styles.statsGrid}>
              {stats.map((s, i) => (
                <View key={s.label} style={[styles.stat, i >= 3 && styles.statBottom]}>
                  <s.icon size={20} color={colors.leaf} strokeWidth={2.3} />
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.macroNote}>Por porção, estimado a partir dos ingredientes.</Text>

          <View style={styles.costRow}>
            <Emoji name="shopping-bags" size={26} />
            <Text style={styles.costText}>
              ≈ <Text style={styles.costStrong}>{brl(cost)}</Text> no {market} · {brl(cost / servings)} por porção
              {unpriced ? ` · ${unpriced} ${unpriced === 1 ? 'item' : 'itens'} sem preço` : ''}
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <Stepper value={servings} min={1} max={20} onChange={setServings} label="porções" />
          </View>
          <IngredientList rows={rows} />

          {post.steps.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, styles.sectionGap]}>Modo de preparo</Text>
              <Text style={styles.sectionHint}>Em cada passo, a quantidade do que vai na panela.</Text>
              <StepList steps={post.steps} rows={rows} />
            </>
          ) : null}

          {post.appliances.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, styles.sectionGap]}>Você vai usar</Text>
              <View style={styles.appliances}>
                {post.appliances.map((id) => {
                  const Icon = APPLIANCE_ICONS[id];
                  return (
                    <View key={id} style={styles.applianceChip}>
                      <Icon size={16} color={colors.forest} strokeWidth={2.3} />
                      <Text style={styles.applianceText}>{applianceName(id)}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          <View
            onLayout={(e) => {
              commentsY.current = e.nativeEvent.layout.y;
              if (focusComments && !scrolledToComments.current) {
                scrolledToComments.current = true;
                setTimeout(() => scroll.current?.scrollTo({ y: commentsY.current + 280, animated: true }), 250);
              }
            }}
          >
            <Comments
              post={post}
              myId={actions.me?.id ?? null}
              withProfile={actions.withProfile}
              onFocusInput={() => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 300)}
              onError={actions.showToast}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={styles.bottomAction}
          onPress={() => actions.like(post)}
          accessibilityRole="button"
          accessibilityState={{ selected: post.likedByMe }}
          accessibilityLabel={`${post.likedByMe ? 'Descurtir' : 'Curtir'}, ${post.likeCount} curtidas`}
        >
          <Heart
            size={22}
            color={post.likedByMe ? colors.tomato : colors.inkSoft}
            fill={post.likedByMe ? colors.tomato : 'transparent'}
            strokeWidth={2.2}
          />
          <Text style={styles.bottomCount}>{compactCount(post.likeCount)}</Text>
        </Pressable>
        <Pressable
          style={styles.bottomAction}
          onPress={() => actions.save(post)}
          accessibilityRole="button"
          accessibilityState={{ selected: post.savedByMe }}
          accessibilityLabel={post.savedByMe ? 'Remover dos salvos' : 'Salvar receita'}
        >
          <Bookmark
            size={22}
            color={post.savedByMe ? colors.forest : colors.inkSoft}
            fill={post.savedByMe ? colors.forest : 'transparent'}
            strokeWidth={2.2}
          />
          <Text style={styles.bottomCount}>{post.savedByMe ? 'Salva' : 'Salvar'}</Text>
        </Pressable>
        <Button
          label={inPlan ? 'No plano · trocar dia' : 'Adicionar ao plano'}
          icon={inPlan ? Check : CalendarPlus}
          variant={inPlan ? 'light' : 'primary'}
          onPress={() => actions.addToPlan(post)}
          style={{ flex: 1 }}
        />
      </View>
      {actions.overlays}
    </KeyboardAvoidingView>
  );
}

function FollowButton({ userId, withProfile }: { userId: string; withProfile: (fn: () => void) => void }) {
  const following = useIsFollowing(userId);
  const follow = useFollow(userId);
  const on = Boolean(following.data);
  return (
    <Pressable
      style={[styles.follow, on && styles.followOn]}
      onPress={() =>
        withProfile(() => {
          haptics.tap();
          follow.mutate(!on);
        })
      }
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.followText, on && styles.followTextOn]}>{on ? 'Seguindo' : 'Seguir'}</Text>
    </Pressable>
  );
}

function Comments({
  post,
  myId,
  withProfile,
  onFocusInput,
  onError,
}: {
  post: Post;
  myId: string | null;
  withProfile: (fn: () => void) => void;
  onFocusInput: () => void;
  onError: (message: string) => void;
}) {
  const comments = useComments(post.id);
  const add = useAddComment(post.id);
  const remove = useDeleteComment(post.id);
  const [text, setText] = useState('');
  const list = comments.data ?? [];

  const send = () => {
    const body = text.trim();
    if (!body) return;
    withProfile(() => {
      add.mutate(body, {
        onSuccess: () => {
          haptics.success();
          setText('');
        },
        onError: (e) => onError(e instanceof Error ? e.message : 'Não foi possível comentar.'),
      });
    });
  };

  return (
    <View>
      <Text style={[styles.sectionTitle, styles.sectionGap]}>Comentários{list.length ? ` (${list.length})` : ''}</Text>
      {comments.isPending ? <ActivityIndicator color={colors.forest} style={{ marginVertical: 12 }} /> : null}
      {!comments.isPending && list.length === 0 ? (
        <Text style={styles.noComments}>Ninguém comentou ainda. Fez a receita? Conte como ficou!</Text>
      ) : null}
      <View style={styles.comments}>
        {list.map((c) => (
          <View key={c.id} style={styles.comment}>
            <Avatar avatar={c.author.avatar} size={34} />
            <View style={styles.commentBubble}>
              <View style={styles.commentHead}>
                <Text style={styles.commentName} numberOfLines={1}>
                  {c.author.name}
                </Text>
                <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                {myId && c.author.id === myId ? (
                  <Pressable
                    onPress={() => remove.mutate(c.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Excluir comentário"
                  >
                    <Trash2 size={14} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={myId ? 'Escreva um comentário…' : 'Crie seu perfil para comentar'}
          placeholderTextColor={colors.muted}
          style={[styles.input, noOutline]}
          multiline
          maxLength={500}
          onFocus={() => (myId ? onFocusInput() : withProfile(() => {}))}
          accessibilityLabel="Escrever comentário"
        />
        <Pressable
          style={[styles.send, !text.trim() && { opacity: 0.4 }]}
          onPress={send}
          disabled={!text.trim() || add.isPending}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentário"
        >
          {add.isPending ? (
            <ActivityIndicator color={colors.sun} size="small" />
          ) : (
            <ArrowUp size={19} color={colors.sun} strokeWidth={2.8} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  missing: { flex: 1, alignItems: 'center', backgroundColor: colors.cream, paddingHorizontal: GUTTER },
  hero: { height: 340, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 30, overflow: 'hidden' },
  heroTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },
  heroBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 190 },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 29,
    lineHeight: 32,
    color: colors.onDark,
    textAlign: 'center',
    paddingHorizontal: GUTTER + 6,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 2 },
  },
  back: { position: 'absolute', left: GUTTER },
  moreBtn: { position: 'absolute', right: GUTTER },
  content: { paddingHorizontal: GUTTER, marginTop: -16 },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    ...shadow(2),
  },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorName: { fontFamily: fonts.extrabold, fontSize: 15.5, color: colors.ink },
  authorMeta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, marginTop: 1 },
  follow: {
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
  },
  followOn: { backgroundColor: colors.leafSoft },
  followText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.sun },
  followTextOn: { color: colors.leafDark },
  description: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.inkSoft, marginTop: 14 },
  statsCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 14, marginTop: 16, ...shadow(1) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: { width: '33.33%', alignItems: 'center', paddingVertical: 8, gap: 2 },
  statBottom: { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 12 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink, marginTop: 2 },
  statLabel: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1, color: colors.muted },
  macroNote: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.muted, textAlign: 'center', marginTop: 8 },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 14,
  },
  costText: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
  costStrong: { fontFamily: fonts.extrabold, color: colors.forest },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 23, color: colors.forest, letterSpacing: -0.5 },
  sectionGap: { marginTop: 26, marginBottom: 12 },
  sectionHint: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: -6, marginBottom: 14 },
  appliances: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  applianceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  applianceText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.forest },
  noComments: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, marginBottom: 12 },
  comments: { gap: 12 },
  comment: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentBubble: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderTopLeftRadius: 4, padding: 11 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentName: { flexShrink: 1, fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.ink },
  commentTime: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  commentBody: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.inkSoft, marginTop: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14 },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.ink,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: 'rgba(248,244,234,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  bottomAction: { alignItems: 'center', gap: 2, minWidth: 44 },
  bottomCount: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.inkSoft },
});
