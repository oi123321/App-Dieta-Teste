import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Emoji } from '../../components/Emoji';
import { ImagePlus, Info, Plus } from '../../components/icons';
import { Avatar } from '../../components/social/Avatar';
import { PostCard } from '../../components/social/PostCard';
import { haptics } from '../../lib/haptics';
import type { TabScreenProps } from '../../navigation/types';
import { isDemo } from '../../social/backend';
import { useFeed } from '../../social/hooks';
import type { FeedFilter, Post } from '../../social/types';
import { usePostActions } from '../../social/usePostActions';
import { useMarketInfo } from '../../store/selectors';
import { colors, fonts, GUTTER, radius, shadow } from '../../theme';

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'recentes', label: 'Recentes' },
  { id: 'seguindo', label: 'Seguindo' },
  { id: 'populares', label: 'Populares' },
];

export function CommunityScreen({ navigation }: TabScreenProps<'Community'>) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FeedFilter>('recentes');
  const feed = useFeed(filter);
  const actions = usePostActions();
  const { index } = useMarketInfo();

  const compose = () => actions.withProfile(() => navigation.navigate('Composer'));
  const open = useCallback((post: Post) => navigation.navigate('PostDetail', { postId: post.id }), [navigation]);
  const comment = useCallback(
    (post: Post) => navigation.navigate('PostDetail', { postId: post.id, focusComments: true }),
    [navigation],
  );

  const header = (
    <View style={{ marginBottom: 16 }}>
      <Pressable style={styles.composer} onPress={compose} accessibilityRole="button" accessibilityLabel="Publicar uma receita">
        <Avatar avatar={actions.me?.avatar} size={42} />
        <Text style={styles.composerText}>Qual receita você fez hoje?</Text>
        <View style={styles.composerIcon}>
          <ImagePlus size={19} color={colors.forest} strokeWidth={2.3} />
        </View>
      </Pressable>
      {isDemo ? (
        <View style={styles.demo}>
          <Info size={16} color={colors.inkSoft} />
          <Text style={styles.demoText}>
            Modo demonstração: as receitas de exemplo e o que você publicar ficam só neste aparelho.
          </Text>
        </View>
      ) : null}
    </View>
  );

  const empty = feed.isPending ? (
    <ActivityIndicator color={colors.forest} style={{ marginTop: 40 }} />
  ) : feed.isError ? (
    <View style={styles.empty}>
      <Emoji name="warning" size={44} />
      <Text style={styles.emptyTitle}>Não deu para carregar</Text>
      <Text style={styles.emptyText}>Confira sua internet e tente de novo.</Text>
      <Button label="Tentar de novo" variant="light" size="md" onPress={() => feed.refetch()} style={{ marginTop: 14 }} />
    </View>
  ) : filter === 'seguindo' ? (
    <View style={styles.empty}>
      <Emoji name="busts-in-silhouette" size={48} />
      <Text style={styles.emptyTitle}>Ninguém por aqui ainda</Text>
      <Text style={styles.emptyText}>Siga quem cozinha bem para ver as receitas dessas pessoas primeiro.</Text>
      <Button
        label="Ver as populares"
        variant="light"
        size="md"
        onPress={() => setFilter('populares')}
        style={{ marginTop: 14 }}
      />
    </View>
  ) : (
    <View style={styles.empty}>
      <Emoji name="cook" size={48} />
      <Text style={styles.emptyTitle}>Seja a primeira receita</Text>
      <Text style={styles.emptyText}>Publique o que você cozinha e ajude mais gente a planejar a semana.</Text>
      <Button label="Publicar receita" size="md" icon={Plus} onPress={compose} style={{ marginTop: 14 }} />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} accessibilityRole="header">
              comunidade
            </Text>
            <Text style={styles.subtitle}>Receitas de quem cozinha de verdade</Text>
          </View>
          <Pressable style={styles.publish} onPress={compose} accessibilityRole="button" accessibilityLabel="Publicar receita">
            <Plus size={18} color={colors.sun} strokeWidth={2.8} />
            <Text style={styles.publishText}>Publicar</Text>
          </Pressable>
        </View>
        <View style={styles.filters} accessibilityRole="tablist">
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  haptics.select();
                  setFilter(f.id);
                }}
                style={[styles.filter, active && styles.filterActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={feed.posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            marketIndex={index}
            inPlan={actions.inPlan(item)}
            onOpen={open}
            onAuthor={actions.openAuthor}
            onLike={actions.like}
            onComment={comment}
            onSave={actions.save}
            onPlan={actions.addToPlan}
            onMore={actions.more}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.forest} />
        }
      />
      {actions.overlays}
    </View>
  );
}

function Separator() {
  return <View style={{ height: 16 }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  top: { paddingHorizontal: GUTTER, paddingBottom: 10, backgroundColor: colors.cream },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 33, letterSpacing: -1, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.inkSoft, marginTop: 2 },
  publish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 40,
    ...shadow(2),
  },
  publishText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.sun },
  filters: { flexDirection: 'row', gap: 8, marginTop: 14 },
  filter: {
    paddingHorizontal: 15,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
  },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.inkSoft },
  filterTextActive: { color: colors.onDark },
  list: { paddingHorizontal: GUTTER, paddingTop: 6, paddingBottom: 28 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 7,
    paddingRight: 8,
    ...shadow(1),
  },
  composerText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14.5, color: colors.muted },
  composerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: colors.sky,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  demoText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17, color: colors.inkSoft },
  empty: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink, marginTop: 12, textAlign: 'center' },
  emptyText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.inkSoft, textAlign: 'center', marginTop: 6 },
});
