import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { compactCount } from '../../lib/time';
import { useStats } from '../../social/hooks';
import type { SocialProfile } from '../../social/types';
import { colors, fonts, radius } from '../../theme';
import { MapPin } from '../icons';
import { Avatar } from './Avatar';

/** Avatar, name, bio and counters, drawn on the dark green header. */
export function ProfileHeader({ profile, children }: { profile: SocialProfile; children?: ReactNode }) {
  const stats = useStats(profile.id);
  const items = [
    { value: stats.data?.posts, label: stats.data?.posts === 1 ? 'receita' : 'receitas' },
    { value: stats.data?.followers, label: stats.data?.followers === 1 ? 'seguidor' : 'seguidores' },
    { value: stats.data?.following, label: 'seguindo' },
  ];
  return (
    <View>
      <View style={styles.top}>
        <Avatar avatar={profile.avatar} size={84} ring />
        <View style={styles.stats}>
          {items.map((item) => (
            <View key={item.label} style={styles.stat}>
              <Text style={styles.statValue}>{item.value === undefined ? '–' : compactCount(item.value)}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.name}
        </Text>
        {profile.isExample ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>exemplo</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.handle}>@{profile.username}</Text>
        {profile.city ? (
          <View style={styles.city}>
            <MapPin size={13} color={colors.onDarkSoft} strokeWidth={2.3} />
            <Text style={styles.handle}>{profile.city}</Text>
          </View>
        ) : null}
      </View>
      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: fonts.display, fontSize: 21, color: colors.sun },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onDarkSoft },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  name: { flexShrink: 1, fontFamily: fonts.display, fontSize: 24, letterSpacing: -0.6, color: colors.onDark },
  badge: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.onDarkSoft },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2, flexWrap: 'wrap' },
  handle: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.onDarkSoft },
  city: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bio: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.onDark, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
