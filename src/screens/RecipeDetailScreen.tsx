import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  Clock,
  Droplet,
  Drumstick,
  ExternalLink,
  Flame,
  Heart,
  Play,
  ThumbsDown,
  Trash2,
  Users,
  Wheat,
  type LucideIcon,
} from '../components/icons';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APPLIANCE_ICONS } from '../components/ApplianceIcon';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Emoji } from '../components/Emoji';
import { IconButton } from '../components/IconButton';
import { RecipeImage } from '../components/RecipeImage';
import { Stepper } from '../components/Stepper';
import { TagRow } from '../components/Tags';
import { applianceName, appliancesUsed } from '../data/appliances';
import { getIngredient } from '../data/ingredients';
import type { Aisle } from '../data/types';
import { brl, DAY_SHORT, daysLabel, minutesLabel, recipeQty } from '../lib/format';
import { haptics } from '../lib/haptics';
import { recipeCost, recipeMacros, recipeTags } from '../lib/recipes';
import type { RootScreenProps } from '../navigation/types';
import { useMarketInfo, useRecipeLookup } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow, type } from '../theme';

const AISLE_TINT: Record<Aisle, string> = {
  hortifruti: '#E8F3DC',
  acougue: '#FBE0DA',
  frios: '#FFF0C2',
  padaria: '#F6E6D2',
  mercearia: '#F1EADB',
  temperos: '#DCEBF5',
  congelados: '#E3EEF7',
  outros: '#EEE8F7',
  despensa: '#F0EBDF',
};

export function RecipeDetailScreen({ route, navigation }: RootScreenProps<'RecipeDetail'>) {
  const insets = useSafeAreaInsets();
  const { find } = useRecipeLookup();
  const recipe = find(route.params.recipeId);
  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plan);
  const liked = useAppStore((s) => s.liked);
  const disliked = useAppStore((s) => s.disliked);
  const toggleLike = useAppStore((s) => s.toggleLike);
  const toggleDislike = useAppStore((s) => s.toggleDislike);
  const putRecipeOnDay = useAppStore((s) => s.putRecipeOnDay);
  const deleteImported = useAppStore((s) => s.deleteImported);
  const { index, label: market } = useMarketInfo();
  const [servings, setServings] = useState(profile.people);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!recipe) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top + 60 }]}>
        <Text style={type.h2}>Receita não encontrada</Text>
        <Button label="Voltar" variant="light" style={{ marginTop: 20 }} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const macros = recipeMacros(recipe);
  const cost = recipeCost(recipe, servings, index);
  const factor = servings / recipe.servings;
  const entry = plan?.entries.find((e) => e.recipeId === recipe.id);
  const isLiked = liked.includes(recipe.id);
  const isDisliked = disliked.includes(recipe.id);
  const used = appliancesUsed(recipe.appliances, profile.appliances);
  const source = recipe.source;
  const platformName = source?.platform === 'tiktok' ? 'TikTok' : source?.platform === 'instagram' ? 'Instagram' : 'link';

  const stats: { icon: LucideIcon; value: string; label: string }[] = [
    { icon: Drumstick, value: `${macros.protein}g`, label: 'Proteína' },
    { icon: Wheat, value: `${macros.carbs}g`, label: 'Carboidratos' },
    { icon: Droplet, value: `${macros.fat}g`, label: 'Gorduras' },
    { icon: Flame, value: String(macros.kcal), label: 'Kcal' },
    { icon: Users, value: String(servings), label: 'Porções' },
    { icon: Clock, value: minutesLabel(recipe.minutes).replace(' min', 'm'), label: 'Tempo' },
  ];

  const addToDay = (day: number) => {
    putRecipeOnDay(recipe.id, day);
    haptics.success();
    setPicking(false);
    setToast(`Adicionada na ${DAY_SHORT[day]}! A lista já foi atualizada.`);
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={styles.hero}>
          <RecipeImage recipe={recipe} style={StyleSheet.absoluteFill} plain={Boolean(source)} />
          <LinearGradient colors={['rgba(8,20,12,0.45)', 'rgba(8,20,12,0)']} style={styles.heroTop} />
          <LinearGradient colors={['rgba(8,20,12,0)', 'rgba(8,20,12,0.72)']} style={styles.heroBottom} />
          {source ? (
            <Pressable
              style={styles.play}
              onPress={() => Linking.openURL(source.url).catch(() => {})}
              accessibilityRole="button"
              accessibilityLabel={`Assistir no ${platformName}`}
            >
              <Play size={30} color={colors.onDark} fill={colors.onDark} />
            </Pressable>
          ) : null}
          <Text style={styles.heroTitle} numberOfLines={3}>
            {recipe.title}
          </Text>
        </View>
        <IconButton
          icon={ArrowLeft}
          label="Voltar"
          tone="dark"
          onPress={() => navigation.goBack()}
          style={[styles.back, { top: insets.top + 8 }]}
        />

        <View style={styles.content}>
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
            <View style={styles.reactRow}>
              <Pressable
                style={[styles.react, styles.like, isLiked && styles.likeOn]}
                onPress={() => {
                  haptics.tap();
                  toggleLike(recipe.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isLiked }}
              >
                <Heart
                  size={17}
                  color={isLiked ? colors.onDark : colors.leafDark}
                  fill={isLiked ? colors.onDark : 'transparent'}
                  strokeWidth={2.4}
                />
                <Text style={[styles.reactText, { color: isLiked ? colors.onDark : colors.leafDark }]}>
                  {isLiked ? 'Curtida' : 'Curti'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.react, styles.nope, isDisliked && styles.nopeOn]}
                onPress={() => {
                  haptics.tap();
                  toggleDislike(recipe.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isDisliked }}
              >
                <ThumbsDown size={17} color={isDisliked ? colors.tomato : colors.muted} strokeWidth={2.4} />
                <Text style={[styles.reactText, { color: isDisliked ? colors.tomato : colors.muted }]}>Não é pra mim</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.macroNote}>Valores por porção, estimados a partir dos ingredientes.</Text>

          <View style={styles.costRow}>
            <Emoji name="shopping-bags" size={26} />
            <Text style={styles.costText}>
              ≈ <Text style={styles.costStrong}>{brl(cost)}</Text> no {market} · {brl(cost / servings)} por porção
              {recipe.extras?.length
                ? ` · ${recipe.extras.length} ${recipe.extras.length === 1 ? 'item' : 'itens'} sem preço`
                : ''}
            </Text>
          </View>

          <TagRow tags={recipeTags(recipe)} max={5} style={{ marginTop: 14 }} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <Stepper value={servings} min={1} max={12} onChange={setServings} label="porções" />
          </View>
          <View style={styles.group}>
            {recipe.ingredients.map((item, i) => {
              const ing = getIngredient(item.id);
              if (!ing) return null;
              return (
                <View key={item.id} style={[styles.ingRow, i > 0 && styles.rowBorder]}>
                  <View style={[styles.ingIcon, { backgroundColor: AISLE_TINT[ing.aisle] }]}>
                    <Emoji name={ing.icon} size={24} />
                  </View>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingQty}>{ing.pantry ? 'a gosto' : recipeQty(ing, item.qty * factor)}</Text>
                </View>
              );
            })}
            {recipe.extras?.map((extra, i) => (
              <View key={`x${i}`} style={[styles.ingRow, (recipe.ingredients.length > 0 || i > 0) && styles.rowBorder]}>
                <View style={[styles.ingIcon, { backgroundColor: AISLE_TINT.outros }]}>
                  <Emoji name="clipboard" size={22} />
                </View>
                <Text style={styles.ingName}>{extra.text}</Text>
              </View>
            ))}
          </View>

          {recipe.steps.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 26, marginBottom: 12 }]}>Modo de preparo</Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </>
          ) : null}

          {used.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 12 }]}>Você vai usar</Text>
              <View style={styles.appliances}>
                {used.map((id) => {
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

          {source ? (
            <View style={styles.sourceCard}>
              <Text style={styles.sourceText}>
                Importada do {platformName}
                {source.author ? ` · @${source.author.replace(/^@/, '')}` : ''}
              </Text>
              <Pressable
                style={styles.sourceBtn}
                onPress={() => Linking.openURL(source.url).catch(() => {})}
                accessibilityRole="link"
              >
                <ExternalLink size={15} color={colors.leafDark} />
                <Text style={styles.sourceBtnText}>Abrir vídeo</Text>
              </Pressable>
            </View>
          ) : null}

          {recipe.imported ? (
            <Pressable style={styles.delete} onPress={() => setConfirmDelete(true)} accessibilityRole="button">
              <Trash2 size={16} color={colors.tomato} />
              <Text style={styles.deleteText}>Excluir receita importada</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
        {picking ? (
          <View style={styles.picker}>
            <Text style={styles.pickerTitle}>Em qual dia?</Text>
            <View style={styles.days}>
              {DAY_SHORT.map((d, day) => {
                const taken = plan?.entries.find((e) => e.days.includes(day));
                return (
                  <Pressable
                    key={d}
                    style={styles.dayChip}
                    onPress={() => addToDay(day)}
                    accessibilityRole="button"
                    accessibilityLabel={`Colocar na ${d}`}
                  >
                    <Text style={styles.dayChipText}>{d}</Text>
                    <View style={[styles.dayDot, { backgroundColor: taken ? colors.sunDeep : colors.leaf }]} />
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.pickerHint}>O dia escolhido troca a receita que estava lá.</Text>
          </View>
        ) : null}
        {entry ? (
          <View style={styles.inPlan}>
            <Check size={18} color={colors.leafDark} strokeWidth={3} />
            <Text style={styles.inPlanText}>No seu plano · {daysLabel(entry.days)}</Text>
          </View>
        ) : (
          <Button
            label={picking ? 'Cancelar' : 'Adicionar ao plano'}
            icon={picking ? undefined : CalendarPlus}
            variant={picking ? 'light' : 'primary'}
            onPress={() => setPicking((p) => !p)}
          />
        )}
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title="Excluir receita?"
        message="Ela sai das suas receitas e do plano da semana."
        confirmLabel="Excluir"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteImported(recipe.id);
          navigation.goBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  missing: { flex: 1, alignItems: 'center', backgroundColor: colors.cream, paddingHorizontal: GUTTER },
  hero: { height: 360, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64, overflow: 'hidden' },
  heroTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },
  heroBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 31,
    lineHeight: 34,
    color: colors.onDark,
    textAlign: 'center',
    paddingHorizontal: GUTTER + 6,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 2 },
  },
  play: {
    position: 'absolute',
    top: 110,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  back: { position: 'absolute', left: GUTTER },
  content: { paddingHorizontal: GUTTER, marginTop: -44 },
  statsCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, ...shadow(2) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: { width: '33.33%', alignItems: 'center', paddingVertical: 8, gap: 2 },
  statBottom: { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 12 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink, marginTop: 2 },
  statLabel: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1, color: colors.muted },
  reactRow: { flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 14 },
  react: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  like: { backgroundColor: colors.leafSoft },
  likeOn: { backgroundColor: colors.leaf },
  nope: { backgroundColor: '#EFEDE8' },
  nopeOn: { backgroundColor: colors.tomatoSoft },
  reactText: { fontFamily: fonts.extrabold, fontSize: 14 },
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
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow(1) },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  ingIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  ingName: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  ingQty: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.sun },
  stepText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.ink },
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
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 22,
  },
  sourceText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, color: colors.inkSoft },
  sourceBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sourceBtnText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.leafDark },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22, padding: 10 },
  deleteText: { fontFamily: fonts.bold, fontSize: 14, color: colors.tomato },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: 'rgba(248,244,234,0.97)',
    gap: 10,
  },
  picker: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, ...shadow(2) },
  pickerTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink, marginBottom: 10 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: { alignItems: 'center', gap: 5, paddingVertical: 8, width: 42, borderRadius: 12, backgroundColor: colors.cream },
  dayChipText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.forest },
  dayDot: { width: 6, height: 6, borderRadius: 3 },
  pickerHint: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.muted, marginTop: 10 },
  inPlan: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.leafSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inPlanText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.leafDark },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.onDark },
});
