import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BookOpen, CalendarDays, ShoppingBasket, UserRound, UsersRound, type LucideIcon } from '../components/icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMarket } from '../data/markets';
import { haptics } from '../lib/haptics';
import { buildShoppingList } from '../lib/shopping';
import { findRecipe } from '../lib/recipes';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, shadow } from '../theme';
import type { TabParamList } from './types';

const ICONS: Record<keyof TabParamList, LucideIcon> = {
  Plan: CalendarDays,
  Recipes: BookOpen,
  Community: UsersRound,
  List: ShoppingBasket,
  Profile: UserRound,
};

function usePendingItems(): number {
  const plan = useAppStore((s) => s.plan);
  const imported = useAppStore((s) => s.imported);
  const community = useAppStore((s) => s.community);
  const people = useAppStore((s) => s.profile.people);
  const marketId = useAppStore((s) => s.profile.marketId);
  const checked = useAppStore((s) => s.checked);
  const customItems = useAppStore((s) => s.customItems);
  return useMemo(() => {
    const list = buildShoppingList(
      plan,
      (id) => findRecipe(id, imported, community),
      people,
      getMarket(marketId)?.index ?? 1,
      customItems,
    );
    return list.sections.flatMap((s) => s.items).filter((i) => !i.pantry && !checked[i.key]).length;
  }, [plan, imported, community, people, marketId, checked, customItems]);
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pending = usePendingItems();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = ICONS[route.name as keyof TabParamList];
        const label = descriptors[route.key].options.title ?? route.name;
        const badge = route.name === 'List' && pending > 0 ? pending : 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? `${label}, ${badge} itens pendentes` : label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptics.select();
                navigation.navigate(route.name, route.params);
              }
            }}
            style={styles.item}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon size={22} color={focused ? colors.forest : colors.muted} strokeWidth={focused ? 2.5 : 2.1} />
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 6,
    ...shadow(3),
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 54, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: colors.leafSoft },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted },
  labelActive: { fontFamily: fonts.extrabold, color: colors.forest },
  badge: {
    position: 'absolute',
    top: -2,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.sun,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 9.5, color: colors.ink },
});
