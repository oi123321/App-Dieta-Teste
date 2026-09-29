import { ArrowRight, Heart, Search, Timer } from '../components/icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Emoji } from '../components/Emoji';
import { useScreenSize } from '../components/PhoneFrame';
import { RecipeImage } from '../components/RecipeImage';
import type { Recipe, TagId } from '../data/types';
import { brl, minutesLabel } from '../lib/format';
import { normalize } from '../lib/importer';
import { eligibleRecipes } from '../lib/planner';
import { recipeCost, recipeTags } from '../lib/recipes';
import type { TabScreenProps } from '../navigation/types';
import { usePlannerContext } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow, type } from '../theme';

type FilterId = 'pravoce' | 'todas' | 'curtidas' | 'comunidade' | 'importadas' | TagId;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'pravoce', label: 'Pra você' },
  { id: 'todas', label: 'Todas' },
  { id: 'rapido', label: 'Rápidas' },
  { id: 'proteico', label: 'Proteicas' },
  { id: 'leve', label: 'Leves' },
  { id: 'vegetariano', label: 'Vegetarianas' },
  { id: 'economico', label: 'Econômicas' },
  { id: 'curtidas', label: 'Curtidas' },
  { id: 'comunidade', label: 'Da comunidade' },
  { id: 'importadas', label: 'Importadas' },
];

export function RecipesScreen({ navigation }: TabScreenProps<'Recipes'>) {
  const insets = useSafeAreaInsets();
  const { width } = useScreenSize();
  const ctx = usePlannerContext();
  const liked = useAppStore((s) => s.liked);
  const plan = useAppStore((s) => s.plan);
  const [filter, setFilter] = useState<FilterId>('pravoce');
  const [query, setQuery] = useState('');

  const inPlan = useMemo(() => new Set(plan?.entries.map((e) => e.recipeId)), [plan]);
  const eligible = useMemo(() => new Set(eligibleRecipes(ctx).map((r) => r.id)), [ctx]);

  const data = useMemo(() => {
    const q = normalize(query);
    return ctx.recipes.filter((r) => {
      if (q && !normalize(r.title).includes(q)) return false;
      switch (filter) {
        case 'pravoce':
          return eligible.has(r.id);
        case 'todas':
          return true;
        case 'curtidas':
          return liked.includes(r.id);
        case 'comunidade':
          return Boolean(r.community);
        case 'importadas':
          return Boolean(r.imported);
        default:
          return recipeTags(r).includes(filter);
      }
    });
  }, [ctx.recipes, filter, query, eligible, liked]);

  const tileW = (width - GUTTER * 2 - 12) / 2;

  const header = (
    <View>
      <Text style={type.h1} accessibilityRole="header">
        receitas
      </Text>
      <Text style={[type.body, { marginTop: 4 }]}>{eligible.size} receitas funcionam na sua cozinha.</Text>

      <View style={styles.search}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar receita"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          accessibilityLabel="Buscar receita"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.promo, pressed && { transform: [{ scale: 0.99 }] }]}
        onPress={() => navigation.navigate('Import')}
        accessibilityRole="button"
        accessibilityLabel="Importar receita do TikTok ou Instagram"
      >
        <View style={styles.promoIcon}>
          <Emoji name="mobile-phone" size={34} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.newPill}>
            <Text style={styles.newText}>NOVO</Text>
          </View>
          <Text style={styles.promoTitle}>Importe do TikTok e Instagram</Text>
          <Text style={styles.promoText}>Cole o link do vídeo e a receita vem junto.</Text>
        </View>
        <ArrowRight size={20} color={colors.sun} strokeWidth={2.6} />
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersWrap}
      >
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filter, active && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      data={data}
      keyExtractor={(r) => r.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: GUTTER, paddingBottom: 28, gap: 16 }}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Emoji name="cook" size={64} />
          <Text style={[type.body, { textAlign: 'center', marginTop: 10 }]}>
            {filter === 'importadas'
              ? 'Você ainda não importou receitas.'
              : filter === 'comunidade'
                ? 'Salve receitas na aba Comunidade ou coloque no plano e elas aparecem aqui.'
                : filter === 'curtidas'
                  ? 'Toque em "Curti" nas receitas que você gostar.'
                  : 'Nenhuma receita encontrada.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <RecipeTile
          recipe={item}
          width={tileW}
          liked={liked.includes(item.id)}
          inPlan={inPlan.has(item.id)}
          perServing={recipeCost(item, 1, ctx.marketIndex)}
          onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
        />
      )}
    />
  );
}

function RecipeTile({
  recipe,
  width,
  liked,
  inPlan,
  perServing,
  onPress,
}: {
  recipe: Recipe;
  width: number;
  liked: boolean;
  inPlan: boolean;
  perServing: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [{ width }, pressed && { transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      <View style={styles.tileImgWrap}>
        <RecipeImage recipe={recipe} style={[styles.tileImg, { width, height: width }]} />
        {inPlan ? (
          <View style={styles.inPlan}>
            <Text style={styles.inPlanText}>No plano</Text>
          </View>
        ) : null}
        {liked ? (
          <View style={styles.likeBadge}>
            <Heart size={14} color={colors.onDark} fill={colors.onDark} />
          </View>
        ) : null}
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>
        {recipe.title}
      </Text>
      <View style={styles.tileMeta}>
        <Timer size={13} color={colors.muted} strokeWidth={2.3} />
        <Text style={styles.tileMetaText}>
          {minutesLabel(recipe.minutes)}
          {recipe.ingredients.length > 0 ? ` · ${brl(perServing)}/porção` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 48,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, height: '100%' },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 14,
  },
  promoIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sun,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newText: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1, color: colors.forest },
  promoTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.onDark, marginTop: 5, letterSpacing: -0.3 },
  promoText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.onDarkSoft, marginTop: 2 },
  filtersWrap: { marginHorizontal: -GUTTER, marginTop: 16 },
  filters: { paddingHorizontal: GUTTER, gap: 8 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  filterTextActive: { color: colors.onDark },
  tileImgWrap: { borderRadius: 20, backgroundColor: colors.creamDeep, ...shadow(1) },
  tileImg: { borderRadius: 20 },
  inPlan: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: colors.leaf,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  inPlanText: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.onDark },
  likeBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tomato,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: { fontFamily: fonts.extrabold, fontSize: 14.5, lineHeight: 18, color: colors.ink, marginTop: 8 },
  tileMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  tileMetaText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  empty: { alignItems: 'center', paddingTop: 30 },
});
