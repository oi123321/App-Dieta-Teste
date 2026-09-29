import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APPLIANCE_ICONS } from '../../components/ApplianceIcon';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Emoji } from '../../components/Emoji';
import { IconButton } from '../../components/IconButton';
import { Camera, ChevronRight, ClipboardPaste, ImagePlus, Plus, Send, X } from '../../components/icons';
import { mentionedIn, postRows } from '../../components/recipe/ingredientRows';
import { Sheet } from '../../components/Sheet';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import { APPLIANCES } from '../../data/appliances';
import type { ApplianceId } from '../../data/types';
import { haptics } from '../../lib/haptics';
import { canUseCamera, choosePhoto } from '../../lib/photos';
import type { RootScreenProps } from '../../navigation/types';
import { amountText, ingredientFromLine, ingredientIcon, parseAmount, UNIT_OPTIONS, unitLabel } from '../../social/convert';
import { useCreatePost } from '../../social/hooks';
import type { PostIngredient, PostUnit } from '../../social/types';
import { colors, fonts, GUTTER, noOutline, radius, shadow } from '../../theme';

interface DraftIngredient {
  key: string;
  name: string;
  qty: string;
  unit: PostUnit;
}

let nextKey = 0;
const newKey = () => `i${nextKey++}`;
const blankIngredient = (): DraftIngredient => ({ key: newKey(), name: '', qty: '', unit: 'g' });

function toPostIngredient(item: DraftIngredient): PostIngredient | null {
  const name = item.name.trim();
  if (!name) return null;
  if (item.unit === 'a_gosto') return { name, qty: null, unit: 'a_gosto' };
  const qty = parseAmount(item.qty);
  return qty && qty > 0 ? { name, qty, unit: item.unit } : null;
}

export function ComposerScreen({ navigation }: RootScreenProps<'Composer'>) {
  const insets = useSafeAreaInsets();
  const create = useCreatePost();
  const scroll = useRef<ScrollView>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>(() => [blankIngredient(), blankIngredient()]);
  const [steps, setSteps] = useState<string[]>(['', '']);
  const [appliances, setAppliances] = useState<ApplianceId[]>([]);
  const [unitFor, setUnitFor] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => ingredients.map(toPostIngredient).filter((i): i is PostIngredient => i !== null), [ingredients]);
  const rows = useMemo(() => postRows(parsed, 1), [parsed]);
  const dirty = Boolean(photo || title.trim() || description.trim() || parsed.length || steps.some((s) => s.trim()));

  const updateIngredient = (key: string, patch: Partial<DraftIngredient>) =>
    setIngredients((list) => list.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const pickPhoto = async (source: 'library' | 'camera') => {
    setError(null);
    try {
      const uri = await choosePhoto({ source, aspect: [4, 3], width: 900 });
      if (uri) setPhoto(uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir as fotos.');
    }
  };

  const addPasted = () => {
    const items = pasted
      .split('\n')
      .map((line) => line.replace(/^[\s\-•*·]+/, ''))
      .map(ingredientFromLine)
      .filter((i): i is PostIngredient => i !== null)
      .map((i) => ({ key: newKey(), name: i.name, qty: amountText(i.qty), unit: i.unit }));
    if (items.length) {
      haptics.success();
      setIngredients((list) => [...list.filter((i) => i.name.trim()), ...items]);
    }
    setPasted('');
    setPasting(false);
  };

  const problem = (): string | null => {
    if (title.trim().length < 3) return 'Dê um nome para a receita.';
    const incomplete = ingredients.find((i) => i.name.trim() && !toPostIngredient(i));
    if (incomplete) return `Falta a quantidade de "${incomplete.name.trim()}" (ou escolha "a gosto").`;
    if (parsed.length < 2) return 'Coloque pelo menos 2 ingredientes com as quantidades.';
    if (!steps.some((s) => s.trim().length >= 5)) return 'Explique o modo de preparo em pelo menos um passo.';
    const time = Number(minutes);
    if (!Number.isFinite(time) || time < 1 || time > 600) return 'Informe o tempo de preparo em minutos.';
    return null;
  };

  const publish = () => {
    const issue = problem();
    if (issue) {
      setError(issue);
      haptics.warn();
      return;
    }
    setError(null);
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        photoUri: photo,
        minutes: Number(minutes),
        servings,
        ingredients: parsed,
        steps: steps.map((s) => s.trim()).filter(Boolean),
        appliances,
      },
      {
        onSuccess: (post) => {
          haptics.success();
          navigation.replace('PostDetail', { postId: post.id });
        },
        onError: (e) => setError(e instanceof Error ? e.message : 'Não foi possível publicar. Tente de novo.'),
      },
    );
  };

  const close = () => (dirty ? setConfirmClose(true) : navigation.goBack());
  const unitItem = ingredients.find((i) => i.key === unitFor);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 10 }]}>
        <IconButton icon={X} label="Fechar" tone="white" onPress={close} />
        <Text style={styles.headerTitle}>Nova receita</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        ref={scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {photo ? (
          <View style={styles.photoBox}>
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.photoActions}>
              <Pressable style={styles.photoChip} onPress={() => pickPhoto('library')} accessibilityRole="button">
                <ImagePlus size={15} color={colors.forest} strokeWidth={2.4} />
                <Text style={styles.photoChipText}>Trocar</Text>
              </Pressable>
              <Pressable style={styles.photoChip} onPress={() => setPhoto(null)} accessibilityRole="button">
                <X size={15} color={colors.tomato} strokeWidth={2.4} />
                <Text style={[styles.photoChipText, { color: colors.tomato }]}>Remover</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.photoBox, styles.photoEmpty]}>
            <Emoji name="camera-with-flash" size={44} />
            <Text style={styles.photoTitle}>Foto do prato pronto</Text>
            <Text style={styles.photoText}>Receitas com foto são muito mais salvas.</Text>
            <View style={styles.photoButtons}>
              <Pressable style={styles.photoBtn} onPress={() => pickPhoto('library')} accessibilityRole="button">
                <ImagePlus size={17} color={colors.sun} strokeWidth={2.4} />
                <Text style={styles.photoBtnText}>Galeria</Text>
              </Pressable>
              {canUseCamera ? (
                <Pressable style={styles.photoBtn} onPress={() => pickPhoto('camera')} accessibilityRole="button">
                  <Camera size={17} color={colors.sun} strokeWidth={2.4} />
                  <Text style={styles.photoBtnText}>Câmera</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}

        <TextField
          label="Nome da receita"
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: Frango cremoso de panela"
          maxLength={80}
        />
        <TextField
          label="Conte um pouco (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Ex.: Rende marmitas para 3 dias e custa pouco."
          multiline
          maxLength={300}
        />

        <View style={styles.pair}>
          <TextField
            label="Tempo"
            value={minutes}
            onChangeText={(t) => setMinutes(t.replace(/\D/g, '').slice(0, 3))}
            keyboardType="number-pad"
            right={<Text style={styles.suffix}>min</Text>}
            style={{ flex: 1 }}
          />
          <View style={styles.servings}>
            <Text style={styles.label}>Rende</Text>
            <View style={styles.servingsBox}>
              <Stepper value={servings} min={1} max={20} onChange={setServings} label="porções" />
              <Text style={styles.suffix}>{servings === 1 ? 'porção' : 'porções'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Ingredientes</Text>
          <Pressable style={styles.linkBtn} onPress={() => setPasting(true)} accessibilityRole="button">
            <ClipboardPaste size={15} color={colors.leafDark} strokeWidth={2.4} />
            <Text style={styles.linkText}>Colar lista</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionHint}>Com a quantidade de cada um — ela aparece em cada passo do preparo.</Text>

        <View style={styles.group}>
          {ingredients.map((item, i) => {
            const icon = item.name.trim() ? ingredientIcon({ name: item.name, qty: null, unit: item.unit }) : undefined;
            return (
              <View key={item.key} style={[styles.ingredient, i > 0 && styles.border]}>
                <View style={styles.ingIcon}>
                  <Emoji name={icon ?? 'clipboard'} size={icon ? 22 : 18} />
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    value={item.name}
                    onChangeText={(name) => updateIngredient(item.key, { name })}
                    placeholder={i === 0 ? 'Ex.: Peito de frango' : 'Ingrediente'}
                    placeholderTextColor={colors.muted}
                    style={[styles.ingName, noOutline]}
                    maxLength={60}
                    accessibilityLabel={`Ingrediente ${i + 1}`}
                  />
                  <View style={styles.qtyRow}>
                    {item.unit !== 'a_gosto' ? (
                      <TextInput
                        value={item.qty}
                        onChangeText={(qty) => updateIngredient(item.key, { qty: qty.replace(/[^\d,./ ]/g, '').slice(0, 7) })}
                        placeholder="qtd."
                        placeholderTextColor={colors.muted}
                        keyboardType="numbers-and-punctuation"
                        style={[styles.qty, noOutline]}
                        accessibilityLabel={`Quantidade de ${item.name || `ingrediente ${i + 1}`}`}
                      />
                    ) : null}
                    <Pressable
                      style={styles.unit}
                      onPress={() => setUnitFor(item.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Unidade: ${unitLabel(item.unit)}`}
                    >
                      <Text style={styles.unitText}>{unitLabel(item.unit)}</Text>
                      <ChevronRight size={14} color={colors.forest} style={{ transform: [{ rotate: '90deg' }] }} />
                    </Pressable>
                  </View>
                </View>
                <Pressable
                  onPress={() =>
                    setIngredients((list) => (list.length > 1 ? list.filter((x) => x.key !== item.key) : [blankIngredient()]))
                  }
                  hitSlop={8}
                  style={styles.remove}
                  accessibilityRole="button"
                  accessibilityLabel="Remover ingrediente"
                >
                  <X size={16} color={colors.muted} />
                </Pressable>
              </View>
            );
          })}
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setIngredients((list) => [...list, blankIngredient()])}
          accessibilityRole="button"
        >
          <Plus size={16} color={colors.forest} strokeWidth={2.6} />
          <Text style={styles.addText}>Adicionar ingrediente</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Modo de preparo</Text>
        <Text style={styles.sectionHint}>Cite os ingredientes no texto e a gente mostra a quantidade em cada passo.</Text>
        <View style={{ gap: 12 }}>
          {steps.map((step, i) => {
            const used = mentionedIn(step, rows);
            return (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.stepBox}>
                    <TextInput
                      value={step}
                      onChangeText={(text) => setSteps((list) => list.map((s, j) => (j === i ? text : s)))}
                      placeholder={i === 0 ? 'Ex.: Tempere o frango com alho e sal.' : 'Próximo passo'}
                      placeholderTextColor={colors.muted}
                      multiline
                      maxLength={500}
                      style={[styles.stepInput, noOutline]}
                      accessibilityLabel={`Passo ${i + 1}`}
                    />
                    {steps.length > 1 ? (
                      <Pressable
                        onPress={() => setSteps((list) => list.filter((_, j) => j !== i))}
                        hitSlop={8}
                        style={styles.remove}
                        accessibilityRole="button"
                        accessibilityLabel={`Remover passo ${i + 1}`}
                      >
                        <X size={16} color={colors.muted} />
                      </Pressable>
                    ) : null}
                  </View>
                  {used.length > 0 ? (
                    <View style={styles.usedRow}>
                      {used.map((row) => (
                        <View key={row.key} style={styles.usedChip}>
                          {row.icon ? <Emoji name={row.icon} size={13} /> : null}
                          <Text style={styles.usedName}>{row.name}</Text>
                          <Text style={styles.usedQty}>{row.qty}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
        <Pressable style={styles.addBtn} onPress={() => setSteps((list) => [...list, ''])} accessibilityRole="button">
          <Plus size={16} color={colors.forest} strokeWidth={2.6} />
          <Text style={styles.addText}>Adicionar passo</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>O que vai usar</Text>
        <View style={styles.appliances}>
          {APPLIANCES.map((a) => {
            const on = appliances.includes(a.id);
            const Icon = APPLIANCE_ICONS[a.id];
            return (
              <Pressable
                key={a.id}
                onPress={() => {
                  haptics.select();
                  setAppliances((list) => (on ? list.filter((x) => x !== a.id) : [...list, a.id]));
                }}
                style={[styles.appliance, on && styles.applianceOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <Icon size={15} color={on ? colors.onDark : colors.forest} strokeWidth={2.3} />
                <Text style={[styles.applianceText, on && { color: colors.onDark }]}>{a.short}</Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label="Publicar receita" icon={Send} onPress={publish} loading={create.isPending} />
      </View>

      <Sheet visible={Boolean(unitItem)} onClose={() => setUnitFor(null)}>
        <Text style={styles.sheetTitle}>Unidade{unitItem?.name.trim() ? ` de ${unitItem.name.trim()}` : ''}</Text>
        <View style={styles.units}>
          {UNIT_OPTIONS.map((u) => {
            const on = unitItem?.unit === u.unit;
            return (
              <Pressable
                key={u.unit}
                onPress={() => {
                  if (unitItem) updateIngredient(unitItem.key, { unit: u.unit, qty: u.unit === 'a_gosto' ? '' : unitItem.qty });
                  haptics.select();
                  setUnitFor(null);
                }}
                style={[styles.unitChoice, on && styles.unitChoiceOn]}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <Text style={[styles.unitChoiceText, on && { color: colors.onDark }]}>{u.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <Sheet visible={pasting} onClose={() => setPasting(false)}>
        <Text style={styles.sheetTitle}>Colar lista de ingredientes</Text>
        <Text style={styles.sheetText}>Um por linha, do jeito que está na receita. A gente separa quantidade e unidade.</Text>
        <TextInput
          value={pasted}
          onChangeText={setPasted}
          multiline
          placeholder={'500 g de peito de frango\n2 colheres de sopa de azeite\n1 cebola\nsal a gosto'}
          placeholderTextColor={colors.muted}
          style={[styles.pasteInput, noOutline]}
          accessibilityLabel="Lista de ingredientes"
        />
        <Button label="Adicionar à receita" onPress={addPasted} disabled={!pasted.trim()} style={{ marginTop: 12 }} />
      </Sheet>

      <ConfirmDialog
        visible={confirmClose}
        title="Descartar receita?"
        message="O que você escreveu até aqui vai ser perdido."
        confirmLabel="Descartar"
        destructive
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingBottom: 10,
  },
  headerTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  content: { paddingHorizontal: GUTTER, paddingTop: 6 },
  photoBox: { aspectRatio: 4 / 3, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.creamDeep },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
  },
  photoTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, marginTop: 8 },
  photoText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: 2 },
  photoButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 40,
  },
  photoBtnText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.sun },
  photoActions: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', gap: 8 },
  photoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    height: 34,
    ...shadow(1),
  },
  photoChipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.forest },
  pair: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 6 },
  suffix: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.muted, marginLeft: 6 },
  servings: { marginTop: 14 },
  servingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 8,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.forest, letterSpacing: -0.5 },
  sectionHint: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 4, marginBottom: 12 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  linkText: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.leafDark },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, ...shadow(1) },
  ingredient: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  border: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  ingIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.leafMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  qtyRow: { flexDirection: 'row', gap: 8 },
  qty: {
    width: 76,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
    paddingHorizontal: 10,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  unit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.leafSoft,
    paddingHorizontal: 12,
  },
  unitText: { fontFamily: fonts.bold, fontSize: 14, color: colors.forest },
  remove: { padding: 6 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.leaf,
    borderRadius: radius.md,
    height: 46,
    marginTop: 10,
  },
  addText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.forest },
  step: { flexDirection: 'row', gap: 10 },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  stepNumText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.sun },
  stepBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  stepInput: {
    flex: 1,
    minHeight: 64,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  usedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  usedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.leafMist,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  usedName: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.inkSoft },
  usedQty: { fontFamily: fonts.extrabold, fontSize: 11.5, color: colors.forest },
  appliances: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  appliance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    height: 38,
  },
  applianceOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  applianceText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.forest },
  error: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.tomato, marginTop: 20 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    backgroundColor: 'rgba(248,244,234,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  sheetTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink },
  sheetText: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 19, color: colors.inkSoft, marginTop: 4 },
  units: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 6 },
  unitChoice: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
  },
  unitChoiceOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  unitChoiceText: { fontFamily: fonts.bold, fontSize: 14, color: colors.forest },
  pasteInput: {
    minHeight: 150,
    maxHeight: 260,
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 14,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});
