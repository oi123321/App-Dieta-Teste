import * as Clipboard from 'expo-clipboard';
import { Check, Plus, Share2, X } from '../components/icons';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { Emoji } from '../components/Emoji';
import { MarketBadge } from '../components/MarketBadge';
import { brl } from '../lib/format';
import { haptics } from '../lib/haptics';
import { shoppingListText, type ShoppingItem } from '../lib/shopping';
import type { TabScreenProps } from '../navigation/types';
import { useMarketInfo, useShoppingList } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow, type } from '../theme';

export function ShoppingListScreen({ navigation }: TabScreenProps<'List'>) {
  const insets = useSafeAreaInsets();
  const list = useShoppingList();
  const checked = useAppStore((s) => s.checked);
  const toggleChecked = useAppStore((s) => s.toggleChecked);
  const clearChecked = useAppStore((s) => s.clearChecked);
  const addCustomItem = useAppStore((s) => s.addCustomItem);
  const removeCustomItem = useAppStore((s) => s.removeCustomItem);
  const { label: market } = useMarketInfo();
  const [newItem, setNewItem] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const buyable = list.sections.flatMap((s) => s.items).filter((i) => !i.pantry);
  const done = buyable.filter((i) => checked[i.key]).length;
  const anyChecked = Object.values(checked).some(Boolean);

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const share = async () => {
    const message = shoppingListText(list, market, checked);
    const canShare = Platform.OS !== 'web' || (typeof navigator !== 'undefined' && 'share' in navigator);
    try {
      if (canShare) {
        await Share.share({ message, title: 'Lista de compras' });
        return;
      }
    } catch {
      // Fall back to the clipboard below.
    }
    const copied = await Clipboard.setStringAsync(message).catch(() => false);
    if (copied) {
      haptics.success();
      flash('Lista copiada! É só colar no WhatsApp.');
    } else {
      flash('Não deu para compartilhar por aqui. Tente pelo app no celular.');
    }
  };

  const add = () => {
    if (!newItem.trim()) return;
    haptics.tap();
    addCustomItem(newItem);
    setNewItem('');
  };

  if (list.count === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 60 }]}>
        <Emoji name="shopping-cart" size={96} />
        <Text style={[type.h2, { textAlign: 'center', marginTop: 16 }]}>sua lista aparece aqui</Text>
        <Text style={[type.body, { textAlign: 'center', marginTop: 8 }]}>Monte a semana e a gente junta tudo por corredor.</Text>
        <Button
          label="Montar minha semana"
          style={{ alignSelf: 'stretch', marginTop: 24 }}
          onPress={() => navigation.navigate('BuildWeek')}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: GUTTER, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.range}>{list.range.toUpperCase()}</Text>
        <Text style={type.h1} accessibilityRole="header">
          Lista de compras
        </Text>
        <View style={styles.badges}>
          <MarketBadge prefix="Para o" />
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {done} / {buyable.length} itens
            </Text>
          </View>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total estimado</Text>
          <Text style={styles.total}>≈ {brl(list.total)}</Text>
        </View>

        {list.sections.map((section) => (
          <View key={section.aisle} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
              <View style={styles.sectionLine} />
            </View>
            {section.aisle === 'despensa' ? <Text style={styles.sectionHint}>Confira se já tem em casa</Text> : null}
            <View style={styles.group}>
              {section.items.map((item, i) => (
                <ItemRow
                  key={item.key}
                  item={item}
                  first={i === 0}
                  checked={Boolean(checked[item.key])}
                  onToggle={() => {
                    haptics.select();
                    toggleChecked(item.key);
                  }}
                  onRemove={item.key.startsWith('c:') ? () => removeCustomItem(item.key.slice(2)) : undefined}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.addRow}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Adicionar item (ex.: café, papel toalha)"
            placeholderTextColor={colors.muted}
            style={styles.addInput}
            onSubmitEditing={add}
            returnKeyType="done"
            accessibilityLabel="Adicionar item à lista"
          />
          <Pressable onPress={add} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="Adicionar">
            <Plus size={20} color={colors.onDark} strokeWidth={2.6} />
          </Pressable>
        </View>

        {anyChecked ? (
          <Pressable onPress={clearChecked} style={styles.clear} accessibilityRole="button">
            <Text style={styles.clearText}>Desmarcar tudo</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.floating} pointerEvents="box-none">
        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
        <Button label="Compartilhar lista" icon={Share2} variant="leaf" onPress={share} />
      </View>
    </View>
  );
}

function ItemRow({
  item,
  first,
  checked,
  onToggle,
  onRemove,
}: {
  item: ShoppingItem;
  first: boolean;
  checked: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${item.name}${item.qty ? `, ${item.qty}` : ''}`}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, !first && styles.rowBorder, pressed && { backgroundColor: colors.leafMist }]}
    >
      <View style={styles.iconWrap}>
        {item.icon ? <Emoji name={item.icon} size={26} /> : <Emoji name="clipboard" size={22} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, checked && styles.nameDone]} numberOfLines={2}>
          {item.name}
        </Text>
        {item.qty ? <Text style={styles.qty}>{item.qty}</Text> : null}
      </View>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${item.name}`}
          style={styles.remove}
        >
          <X size={16} color={colors.muted} />
        </Pressable>
      ) : null}
      <View style={[styles.check, checked && styles.checkOn]}>
        {checked ? <Check size={15} color={colors.onDark} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  empty: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', paddingHorizontal: GUTTER },
  range: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, color: colors.muted, marginBottom: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  progressPill: { backgroundColor: colors.sunSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  progressText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.ink },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.inkSoft },
  total: { fontFamily: fonts.display, fontSize: 20, color: colors.forest },
  section: { marginTop: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, color: colors.muted },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.line },
  sectionHint: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.muted, marginTop: -4, marginBottom: 10 },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  nameDone: { textDecorationLine: 'line-through', color: colors.muted },
  qty: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: 1 },
  remove: { padding: 4 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.leaf, borderColor: colors.leaf },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  addInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clear: { alignSelf: 'center', marginTop: 16, padding: 8 },
  clearText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.leafDark },
  floating: { position: 'absolute', left: GUTTER, right: GUTTER, bottom: 14, gap: 10 },
  toast: {
    alignSelf: 'center',
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.onDark },
});
