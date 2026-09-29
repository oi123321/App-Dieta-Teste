import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardPaste, Info, X } from '../components/icons';
import { useMemo, useState, type ReactNode } from 'react';
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

import { Button } from '../components/Button';
import { Emoji } from '../components/Emoji';
import { IconButton } from '../components/IconButton';
import { brl } from '../lib/format';
import { haptics } from '../lib/haptics';
import { detectPlatform, draftFromPreview, extractUrl, fetchPreview, recipeFromDraft, type ImportDraft } from '../lib/importer';
import { estimateMacros, recipeCost } from '../lib/recipes';
import type { RootScreenProps } from '../navigation/types';
import { useMarketInfo } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow, type } from '../theme';

type Phase = 'input' | 'loading' | 'review';

const STEPS = ['No vídeo, toque em Compartilhar', 'Toque em "Copiar link"', 'Volte aqui e cole o link'];

export function ImportScreen({ navigation, route }: RootScreenProps<'Import'>) {
  const insets = useSafeAreaInsets();
  const saveImported = useAppStore((s) => s.saveImported);
  const { index, label: market } = useMarketInfo();
  const [phase, setPhase] = useState<Phase>('input');
  const [text, setText] = useState(route.params?.url ?? '');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const paste = async () => {
    const value = await Clipboard.getStringAsync().catch(() => '');
    if (value) {
      haptics.tap();
      setText(value);
      setError(null);
    } else {
      setError('Não encontramos nada copiado. Copie o link do vídeo e tente de novo.');
    }
  };

  const start = async () => {
    const url = extractUrl(text);
    if (!url) {
      setError('Cole um link do TikTok, do Instagram ou de um site de receitas.');
      return;
    }
    setError(null);
    setPhase('loading');
    const platform = detectPlatform(url);
    const preview = await fetchPreview(url, platform);
    setAutoFilled(Boolean(preview.caption));
    setDraft(draftFromPreview(url, platform, preview));
    setPhase('review');
  };

  const manual = () => {
    const url = extractUrl(text) ?? '';
    setAutoFilled(false);
    setDraft(draftFromPreview(url, url ? detectPlatform(url) : 'link', {}));
    setPhase('review');
  };

  const preview = useMemo(() => {
    if (!draft) return null;
    const recipe = recipeFromDraft(draft);
    return {
      matched: recipe.ingredients.length,
      loose: recipe.extras?.length ?? 0,
      cost: recipeCost(recipe, recipe.servings, index),
      kcal: estimateMacros(recipe).kcal,
    };
  }, [draft, index]);

  const save = () => {
    if (!draft) return;
    const recipe = recipeFromDraft(draft);
    saveImported(recipe);
    haptics.success();
    navigation.replace('RecipeDetail', { recipeId: recipe.id });
  };

  const update = (patch: Partial<ImportDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const canSave = Boolean(draft && draft.title.trim() && draft.ingredientsText.trim());

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 16 }]}>
        <View style={styles.newPill}>
          <Text style={styles.newText}>NOVO</Text>
        </View>
        <IconButton icon={X} label="Fechar" tone="white" onPress={() => navigation.goBack()} />
      </View>

      {phase === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.leaf} />
          <Text style={[type.h3, { marginTop: 16 }]}>Lendo a legenda do vídeo…</Text>
          <Text style={[type.small, { marginTop: 4 }]}>Procurando ingredientes e modo de preparo</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 30 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {phase === 'input' ? (
            <>
              <Text style={type.h1} accessibilityRole="header">
                importe receitas do <Text style={{ color: colors.leaf }}>TikTok e Instagram</Text>
              </Text>
              <Text style={[type.body, { marginTop: 8 }]}>Cole o link do vídeo e a receita inteira entra no seu plano.</Text>

              <View style={styles.platforms}>
                <View style={[styles.platform, { backgroundColor: '#111111' }]}>
                  <Text style={styles.platformText}>TikTok</Text>
                </View>
                <LinearGradient
                  colors={['#F58529', '#DD2A7B', '#8134AF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.platform}
                >
                  <Text style={styles.platformText}>Instagram</Text>
                </LinearGradient>
                <View style={[styles.platform, { backgroundColor: colors.card }]}>
                  <Text style={[styles.platformText, { color: colors.ink }]}>Sites de receita</Text>
                </View>
              </View>

              <View style={styles.stepsCard}>
                {STEPS.map((s, i) => (
                  <View key={s} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{s}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  value={text}
                  onChangeText={(t) => {
                    setText(t);
                    setError(null);
                  }}
                  placeholder="https://www.tiktok.com/@…"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={start}
                  accessibilityLabel="Link da receita"
                />
                <Pressable style={styles.pasteBtn} onPress={paste} accessibilityRole="button" accessibilityLabel="Colar link">
                  <ClipboardPaste size={18} color={colors.forest} strokeWidth={2.3} />
                  <Text style={styles.pasteText}>Colar</Text>
                </Pressable>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button label="Buscar receita" style={{ marginTop: 18 }} onPress={start} />
              <Pressable onPress={manual} style={styles.manual} accessibilityRole="button">
                <Text style={styles.manualText}>Prefiro digitar a receita</Text>
              </Pressable>
            </>
          ) : draft ? (
            <>
              <Text style={type.h2} accessibilityRole="header">
                confira a receita
              </Text>
              <View style={styles.sourceRow}>
                {draft.thumbnail ? (
                  <Image source={{ uri: draft.thumbnail }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Emoji name="cook" size={30} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.sourceTitle}>
                    {draft.platform === 'tiktok'
                      ? 'TikTok'
                      : draft.platform === 'instagram'
                        ? 'Instagram'
                        : draft.url
                          ? 'Link'
                          : 'Receita própria'}
                    {draft.author ? ` · @${draft.author.replace(/^@/, '')}` : ''}
                  </Text>
                  {draft.url ? (
                    <Text style={styles.sourceUrl} numberOfLines={1}>
                      {draft.url}
                    </Text>
                  ) : null}
                </View>
              </View>

              {!autoFilled ? (
                <View style={styles.notice}>
                  <Info size={18} color={colors.forestSoft} />
                  <Text style={styles.noticeText}>
                    {draft.platform === 'instagram'
                      ? 'O Instagram não libera a legenda sem login. '
                      : draft.url
                        ? 'Não conseguimos ler a legenda automaticamente. '
                        : ''}
                    Cole ou digite os ingredientes (um por linha) e a gente calcula o preço e as calorias.
                  </Text>
                </View>
              ) : (
                <View style={[styles.notice, { backgroundColor: colors.leafSoft }]}>
                  <Emoji name="sparkles" size={18} />
                  <Text style={styles.noticeText}>Lemos a legenda do vídeo. Confira e ajuste o que precisar.</Text>
                </View>
              )}

              <Field label="Nome da receita">
                <TextInput
                  value={draft.title}
                  onChangeText={(title) => update({ title })}
                  style={styles.field}
                  placeholder="Ex.: Frango cremoso"
                  placeholderTextColor={colors.muted}
                />
              </Field>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Field label="Tempo (min)" style={{ flex: 1 }}>
                  <TextInput
                    value={draft.minutes}
                    onChangeText={(minutes) => update({ minutes: minutes.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    style={styles.field}
                    maxLength={3}
                  />
                </Field>
                <Field label="Rende (porções)" style={{ flex: 1 }}>
                  <TextInput
                    value={draft.servings}
                    onChangeText={(servings) => update({ servings: servings.replace(/\D/g, '') })}
                    keyboardType="number-pad"
                    style={styles.field}
                    maxLength={2}
                  />
                </Field>
              </View>
              <Field label="Ingredientes (um por linha)">
                <TextInput
                  value={draft.ingredientsText}
                  onChangeText={(ingredientsText) => update({ ingredientsText })}
                  style={[styles.field, styles.multiline]}
                  multiline
                  textAlignVertical="top"
                  placeholder={'500 g de peito de frango\n2 batatas-doces\n1 cebola'}
                  placeholderTextColor={colors.muted}
                />
              </Field>
              {preview && (preview.matched > 0 || preview.loose > 0) ? (
                <View style={styles.previewRow}>
                  <Text style={styles.previewChip}>
                    {preview.matched} {preview.matched === 1 ? 'reconhecido' : 'reconhecidos'}
                  </Text>
                  {preview.loose > 0 ? (
                    <Text style={[styles.previewChip, styles.previewWarn]}>{preview.loose} sem preço</Text>
                  ) : null}
                  {preview.matched > 0 ? (
                    <Text style={styles.previewChip}>
                      ≈ {brl(preview.cost)} no {market} · {preview.kcal} kcal/porção
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <Field label="Modo de preparo (um passo por linha)">
                <TextInput
                  value={draft.stepsText}
                  onChangeText={(stepsText) => update({ stepsText })}
                  style={[styles.field, styles.multiline]}
                  multiline
                  textAlignVertical="top"
                  placeholder={'Tempere o frango…\nLeve à air fryer por 20 min…'}
                  placeholderTextColor={colors.muted}
                />
              </Field>
              <Button label="Salvar receita" style={{ marginTop: 8 }} disabled={!canSave} onPress={save} />
              <Pressable onPress={() => setPhase('input')} style={styles.manual} accessibilityRole="button">
                <Text style={styles.manualText}>Usar outro link</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function Field({ label, children, style }: { label: string; children: ReactNode; style?: object }) {
  return (
    <View style={[{ marginTop: 14 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingBottom: 12,
  },
  newPill: { backgroundColor: colors.sun, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  newText: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.1, color: colors.forest },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  platforms: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  platform: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden' },
  platformText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.onDark },
  stepsCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 12, marginTop: 18, ...shadow(1) },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.leafDark },
  stepText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
  inputRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.ink,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.leafSoft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  pasteText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.forest },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.tomato, marginTop: 8 },
  manual: { alignSelf: 'center', padding: 12, marginTop: 4 },
  manualText: { fontFamily: fonts.bold, fontSize: 14, color: colors.leafDark },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  thumbEmpty: { backgroundColor: colors.sunSoft, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.ink },
  sourceUrl: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 },
  notice: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.sky,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 14,
  },
  noticeText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.inkSoft },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 6 },
  field: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  multiline: { minHeight: 130, lineHeight: 21 },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  previewChip: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.leafDark,
    backgroundColor: colors.leafSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  previewWarn: { color: '#7A5A00', backgroundColor: colors.sunSoft },
});
