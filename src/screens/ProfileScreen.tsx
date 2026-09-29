import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '../components/Brand';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Emoji } from '../components/Emoji';
import {
  ChevronRight,
  CookingPot,
  Heart,
  LogOut,
  Plus,
  RefreshCw,
  SquarePen,
  Store,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from '../components/icons';
import { PostGrid } from '../components/social/PostGrid';
import { ProfileHeader } from '../components/social/ProfileHeader';
import { brl, plural } from '../lib/format';
import { haptics } from '../lib/haptics';
import type { TabScreenProps } from '../navigation/types';
import { isDemo, social } from '../social/backend';
import { useMe, useModeration, useSavedPosts, useUserPosts, useVisiblePosts } from '../social/hooks';
import type { Post } from '../social/types';
import { useMarketInfo } from '../store/selectors';
import { useAppStore } from '../store/useAppStore';
import { colors, fonts, GUTTER, radius, shadow } from '../theme';

const PREF_LABELS: Record<string, string> = {
  vegetariano: 'vegetariano',
  sem_lactose: 'sem lactose',
  sem_gluten: 'sem glúten',
  proteico: 'mais proteína',
  low_carb: 'menos carboidrato',
};

type Tab = 'posts' | 'saved' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'posts', label: 'Publicadas' },
  { id: 'saved', label: 'Salvas' },
  { id: 'settings', label: 'Ajustes' },
];

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const [tab, setTab] = useState<Tab>('posts');
  const openPost = (post: Post) => navigation.navigate('PostDetail', { postId: post.id });

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        {me.data ? (
          <ProfileHeader profile={me.data}>
            <Button
              label="Editar perfil"
              icon={SquarePen}
              variant="light"
              size="md"
              onPress={() => navigation.navigate('EditProfile')}
              style={{ flex: 1 }}
            />
            <Button
              label="Publicar"
              icon={Plus}
              variant="leaf"
              size="md"
              onPress={() => navigation.navigate('Composer')}
              style={{ flex: 1 }}
            />
          </ProfileHeader>
        ) : me.isPending ? (
          <ActivityIndicator color={colors.sun} style={{ marginVertical: 40 }} />
        ) : (
          <View>
            <Logo size={30} />
            <Text style={styles.heroTitle}>Monte seu perfil</Text>
            <Text style={styles.heroText}>
              {isDemo
                ? 'Com ele você publica receitas, salva as favoritas e segue quem cozinha bem.'
                : 'Entre ou crie uma conta para publicar receitas, salvar as favoritas e seguir quem cozinha bem.'}
            </Text>
            <Button
              label={isDemo ? 'Criar perfil' : 'Entrar ou criar conta'}
              variant="leaf"
              size="md"
              onPress={() => navigation.navigate('EditProfile')}
              style={{ marginTop: 16, alignSelf: 'flex-start' }}
            />
          </View>
        )}
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                haptics.select();
                setTab(t.id);
              }}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {tab === 'posts' ? (
          <MyPosts
            userId={me.data?.id}
            onOpen={openPost}
            onCompose={() => navigation.navigate(me.data ? 'Composer' : 'EditProfile')}
          />
        ) : tab === 'saved' ? (
          <SavedPosts hasProfile={Boolean(me.data)} onOpen={openPost} onBrowse={() => navigation.navigate('Community')} />
        ) : (
          <Settings navigation={navigation} signedIn={Boolean(me.data)} />
        )}
      </View>
    </ScrollView>
  );
}

function Empty({ emoji, title, text, action }: { emoji: 'cook' | 'bookmark'; title: string; text: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Emoji name={emoji} size={44} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {action}
    </View>
  );
}

function MyPosts({ userId, onOpen, onCompose }: { userId?: string; onOpen: (post: Post) => void; onCompose: () => void }) {
  const posts = useUserPosts(userId);
  if (userId && posts.isPending) return <ActivityIndicator color={colors.forest} style={{ marginTop: 30 }} />;
  if (!posts.data?.length) {
    return (
      <Empty
        emoji="cook"
        title="Suas receitas aparecem aqui"
        text="Publique o que você cozinha, com as quantidades de cada ingrediente, e ajude mais gente a planejar a semana."
        action={<Button label="Publicar receita" icon={Plus} size="md" onPress={onCompose} style={{ marginTop: 14 }} />}
      />
    );
  }
  return <PostGrid posts={posts.data} onOpen={onOpen} />;
}

function SavedPosts({
  hasProfile,
  onOpen,
  onBrowse,
}: {
  hasProfile: boolean;
  onOpen: (post: Post) => void;
  onBrowse: () => void;
}) {
  const saved = useSavedPosts();
  const visible = useVisiblePosts(saved.data);
  if (hasProfile && saved.isPending) return <ActivityIndicator color={colors.forest} style={{ marginTop: 30 }} />;
  if (visible.length === 0) {
    return (
      <Empty
        emoji="bookmark"
        title="Nenhuma receita salva"
        text="Toque no marcador das receitas da comunidade para guardar aqui. Elas também entram nas sugestões do seu plano."
        action={<Button label="Ver a comunidade" variant="light" size="md" onPress={onBrowse} style={{ marginTop: 14 }} />}
      />
    );
  }
  return <PostGrid posts={visible} onOpen={onOpen} />;
}

function Settings({ navigation, signedIn }: { navigation: TabScreenProps<'Profile'>['navigation']; signedIn: boolean }) {
  const client = useQueryClient();
  const profile = useAppStore((s) => s.profile);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const reset = useAppStore((s) => s.reset);
  const { label: market } = useMarketInfo();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const rows: { icon: LucideIcon; title: string; value: string; onPress: () => void }[] = [
    { icon: Store, title: 'Mercado', value: market, onPress: () => navigation.navigate('EditMarket') },
    {
      icon: Wallet,
      title: 'Orçamento semanal',
      value: profile.budget ? brl(profile.budget, { cents: false }) : 'não definido',
      onPress: () => navigation.navigate('EditBudget'),
    },
    {
      icon: Users,
      title: 'Casa e preferências',
      value: [
        plural(profile.people, 'pessoa', 'pessoas'),
        plural(profile.dinners, 'refeição', 'refeições'),
        ...profile.prefs.map((p) => PREF_LABELS[p]),
      ].join(' · '),
      onPress: () => navigation.navigate('EditHousehold'),
    },
    {
      icon: CookingPot,
      title: 'Minha cozinha',
      value: plural(profile.appliances.length, 'aparelho', 'aparelhos'),
      onPress: () => navigation.navigate('EditKitchen'),
    },
  ];

  return (
    <View>
      <Text style={styles.section}>Plano semanal</Text>
      <View style={styles.group}>
        {rows.map((row, i) => (
          <Pressable
            key={row.title}
            style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { backgroundColor: colors.leafMist }]}
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${row.title}: ${row.value}`}
          >
            <View style={styles.rowIcon}>
              <row.icon size={19} color={colors.forest} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Atalhos</Text>
      <View style={styles.group}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.leafMist }]}
          onPress={() => {
            haptics.success();
            regeneratePlan();
            navigation.navigate('Plan');
          }}
          accessibilityRole="button"
        >
          <View style={styles.rowIcon}>
            <RefreshCw size={19} color={colors.forest} strokeWidth={2.2} />
          </View>
          <Text style={[styles.rowTitle, { flex: 1 }]}>Gerar um novo plano</Text>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.row, styles.rowBorder, pressed && { backgroundColor: colors.leafMist }]}
          onPress={() => navigation.navigate('Recipes')}
          accessibilityRole="button"
        >
          <View style={styles.rowIcon}>
            <Heart size={19} color={colors.forest} strokeWidth={2.2} />
          </View>
          <Text style={[styles.rowTitle, { flex: 1 }]}>Ver receitas</Text>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
        {!isDemo && signedIn ? (
          <Pressable
            style={({ pressed }) => [styles.row, styles.rowBorder, pressed && { backgroundColor: colors.leafMist }]}
            onPress={() => setConfirmSignOut(true)}
            accessibilityRole="button"
          >
            <View style={styles.rowIcon}>
              <LogOut size={19} color={colors.forest} strokeWidth={2.2} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Sair da conta</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.row, styles.rowBorder, pressed && { backgroundColor: colors.tomatoSoft }]}
          onPress={() => setConfirmReset(true)}
          accessibilityRole="button"
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.tomatoSoft }]}>
            <Trash2 size={19} color={colors.tomato} strokeWidth={2.2} />
          </View>
          <Text style={[styles.rowTitle, { flex: 1, color: colors.tomato }]}>Recomeçar do zero</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        salsa · versão 1.1{isDemo ? ' · comunidade em modo demonstração' : ''}
        {'\n'}Preços e calorias são estimativas.{'\n'}Ilustrações baseadas no Fluent Emoji (Microsoft, licença MIT).
      </Text>

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sair da conta?"
        message="Seu plano e sua lista continuam neste aparelho. Suas receitas publicadas continuam na comunidade."
        confirmLabel="Sair"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={async () => {
          setConfirmSignOut(false);
          await social.signOut().catch(() => {});
          client.clear();
        }}
      />
      <ConfirmDialog
        visible={confirmReset}
        title="Recomeçar do zero?"
        message={
          isDemo
            ? 'Seu plano, lista, curtidas, receitas importadas e seu perfil da comunidade serão apagados deste aparelho.'
            : 'Seu plano, lista, curtidas e receitas importadas serão apagados deste aparelho, e você sai da conta. Suas receitas publicadas continuam na comunidade.'
        }
        confirmLabel="Apagar tudo"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false);
          await social.signOut().catch(() => {});
          useModeration.setState({ hiddenPosts: [], blockedUsers: [] });
          client.clear();
          reset();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  hero: {
    backgroundColor: colors.forest,
    paddingHorizontal: GUTTER,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.onDark, marginTop: 18, letterSpacing: -0.7 },
  heroText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.onDarkSoft, marginTop: 4 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: GUTTER,
    marginTop: 18,
    backgroundColor: colors.creamDeep,
    borderRadius: radius.pill,
    padding: 4,
  },
  tab: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.card, ...shadow(1) },
  tabText: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSoft },
  tabTextActive: { fontFamily: fonts.extrabold, color: colors.forest },
  body: { paddingHorizontal: GUTTER, paddingTop: 18 },
  empty: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 12 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginTop: 10, textAlign: 'center' },
  emptyText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.inkSoft, marginTop: 6, textAlign: 'center' },
  section: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 18, ...shadow(1) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.leafSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  rowValue: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: 1 },
  footer: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
