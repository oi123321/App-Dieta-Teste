import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Emoji } from '../../components/Emoji';
import { IconButton } from '../../components/IconButton';
import { ArrowLeft, SquarePen, UserCheck, UserPlus } from '../../components/icons';
import { PostGrid } from '../../components/social/PostGrid';
import { ProfileHeader } from '../../components/social/ProfileHeader';
import { haptics } from '../../lib/haptics';
import type { RootScreenProps } from '../../navigation/types';
import { useFollow, useIsFollowing, useMe, useModeration, useProfile, useUserPosts, useVisiblePosts } from '../../social/hooks';
import { colors, fonts, GUTTER, radius } from '../../theme';

export function UserProfileScreen({ route, navigation }: RootScreenProps<'UserProfile'>) {
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const me = useMe();
  const profile = useProfile(userId);
  const posts = useUserPosts(userId);
  const visible = useVisiblePosts(posts.data);
  const following = useIsFollowing(userId);
  const follow = useFollow(userId);
  const blocked = useModeration((s) => s.blockedUsers.includes(userId));
  const unblockUser = useModeration((s) => s.unblockUser);
  const isMe = me.data?.id === userId;
  const on = Boolean(following.data);

  const toggleFollow = () => {
    if (!me.data) {
      navigation.navigate('EditProfile');
      return;
    }
    haptics.tap();
    follow.mutate(!on);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.nav}>
          <IconButton icon={ArrowLeft} label="Voltar" tone="dark" onPress={() => navigation.goBack()} />
          {profile.data ? <Text style={styles.navTitle}>@{profile.data.username}</Text> : null}
          <View style={{ width: 42 }} />
        </View>
        {profile.data ? (
          <ProfileHeader profile={profile.data}>
            {isMe ? (
              <Button
                label="Editar perfil"
                icon={SquarePen}
                variant="light"
                size="md"
                onPress={() => navigation.navigate('EditProfile')}
                style={{ flex: 1 }}
              />
            ) : blocked ? null : (
              <Pressable
                style={[styles.follow, on && styles.followOn]}
                onPress={toggleFollow}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                {on ? (
                  <UserCheck size={18} color={colors.onDark} strokeWidth={2.4} />
                ) : (
                  <UserPlus size={18} color={colors.forest} strokeWidth={2.4} />
                )}
                <Text style={[styles.followText, on && { color: colors.onDark }]}>{on ? 'Seguindo' : 'Seguir'}</Text>
              </Pressable>
            )}
          </ProfileHeader>
        ) : profile.isPending ? (
          <ActivityIndicator color={colors.sun} style={{ marginVertical: 40 }} />
        ) : (
          <Text style={styles.missing}>Perfil não encontrado.</Text>
        )}
      </View>

      <View style={styles.body}>
        {blocked ? (
          <View style={styles.empty}>
            <Emoji name="warning" size={40} />
            <Text style={styles.emptyTitle}>Você bloqueou esta pessoa</Text>
            <Text style={styles.emptyText}>As receitas dela não aparecem para você.</Text>
            <Button label="Desbloquear" variant="light" size="md" onPress={() => unblockUser(userId)} style={{ marginTop: 14 }} />
          </View>
        ) : posts.isPending ? (
          <ActivityIndicator color={colors.forest} style={{ marginTop: 30 }} />
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Emoji name="cook" size={44} />
            <Text style={styles.emptyTitle}>Nenhuma receita publicada ainda</Text>
          </View>
        ) : (
          <>
            <Text style={styles.section}>
              {visible.length} {visible.length === 1 ? 'receita publicada' : 'receitas publicadas'}
            </Text>
            <PostGrid posts={visible} onOpen={(post) => navigation.push('PostDetail', { postId: post.id })} />
          </>
        )}
      </View>
    </ScrollView>
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
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.onDark },
  missing: { fontFamily: fonts.bold, fontSize: 16, color: colors.onDark, textAlign: 'center', marginVertical: 40 },
  follow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.sun,
  },
  followOn: { backgroundColor: 'rgba(255,255,255,0.14)' },
  followText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.forest },
  body: { paddingHorizontal: GUTTER, paddingTop: 20 },
  section: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  empty: { alignItems: 'center', paddingTop: 30, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, marginTop: 10, textAlign: 'center' },
  emptyText: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkSoft, marginTop: 4, textAlign: 'center' },
});
