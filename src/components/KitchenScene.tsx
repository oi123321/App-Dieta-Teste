import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { applianceName } from '../data/appliances';
import { pct } from '../lib/format';
import type { ApplianceId } from '../data/types';
import { colors } from '../theme';

const VIEW_W = 360;
const VIEW_H = 300;

/** Tap areas in viewBox units (x, y, w, h). */
const HIT: Record<ApplianceId, [number, number, number, number]> = {
  microondas: [8, 100, 100, 72],
  liquidificador: [108, 78, 36, 94],
  pressao: [148, 96, 50, 56],
  fogao: [146, 152, 86, 36],
  forno: [146, 188, 86, 100],
  airfryer: [236, 94, 58, 78],
  grill: [294, 132, 58, 40],
};

const Scene = memo(function Scene() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Defs>
        <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6F0E4" />
          <Stop offset="1" stopColor="#EEE5D4" />
        </LinearGradient>
        <LinearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#B9C0C8" />
          <Stop offset="0.5" stopColor="#E6EAEE" />
          <Stop offset="1" stopColor="#A9B1BA" />
        </LinearGradient>
        <LinearGradient id="ovenGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2A1E" />
          <Stop offset="1" stopColor="#8A4A1C" />
        </LinearGradient>
        <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E3F2F8" />
          <Stop offset="1" stopColor="#BFDDEA" />
        </LinearGradient>
      </Defs>

      {/* Wall, backsplash tiles, window and shelf */}
      <Rect x="0" y="0" width={VIEW_W} height="170" fill="url(#wall)" />
      {Array.from({ length: 9 }, (_, i) => (
        <Line key={`h${i}`} x1="0" y1={78 + i * 11} x2={VIEW_W} y2={78 + i * 11} stroke="#E6DCC8" strokeWidth="1" />
      ))}
      {Array.from({ length: 19 }, (_, i) => (
        <Line key={`v${i}`} x1={i * 20} y1="78" x2={i * 20} y2="168" stroke="#E6DCC8" strokeWidth="1" />
      ))}
      <Rect x="250" y="12" width="96" height="62" rx="6" fill="#FFFFFF" />
      <Rect x="255" y="17" width="41" height="52" rx="3" fill="url(#glass)" />
      <Rect x="300" y="17" width="41" height="52" rx="3" fill="url(#glass)" />
      <Path d="M262 60 L280 24" stroke="#FFFFFF" strokeWidth="4" strokeOpacity="0.7" strokeLinecap="round" />
      <Rect x="246" y="72" width="104" height="5" rx="2.5" fill="#E2D6C0" />
      <Rect x="16" y="46" width="96" height="5" rx="2.5" fill="#C9A27A" />
      <Path d="M26 46 L30 30 L42 30 L46 46 Z" fill="#E7DFD2" />
      <Ellipse cx="32" cy="24" rx="5" ry="10" fill="#7DBB4B" transform="rotate(-25 32 24)" />
      <Ellipse cx="41" cy="22" rx="5" ry="11" fill="#5DA83A" transform="rotate(20 41 22)" />
      <Ellipse cx="36" cy="18" rx="4" ry="10" fill="#8FD14F" />
      <Rect x="60" y="30" width="16" height="16" rx="3" fill="#F1E3C8" />
      <Rect x="59" y="27" width="18" height="5" rx="2" fill="#C9A27A" />
      <Rect x="82" y="34" width="14" height="12" rx="3" fill="#FCE4DE" />
      <Rect x="81" y="31" width="16" height="4" rx="2" fill="#E4553F" />

      {/* Counters and cabinets */}
      <Rect x="0" y="166" width="146" height="10" fill="#E3DCCB" />
      <Rect x="232" y="166" width="128" height="10" fill="#E3DCCB" />
      <Rect x="0" y="174" width="146" height="3" fill="#D2C8B2" />
      <Rect x="232" y="174" width="128" height="3" fill="#D2C8B2" />
      <Rect x="0" y="177" width="146" height="113" fill="#A9B99A" />
      <Rect x="232" y="177" width="128" height="113" fill="#A9B99A" />
      <Rect x="8" y="186" width="62" height="96" rx="5" fill="#B7C6A8" />
      <Rect x="76" y="186" width="62" height="96" rx="5" fill="#B7C6A8" />
      <Rect x="240" y="186" width="54" height="96" rx="5" fill="#B7C6A8" />
      <Rect x="300" y="186" width="52" height="96" rx="5" fill="#B7C6A8" />
      <Rect x="58" y="200" width="5" height="22" rx="2.5" fill="#E9E2D2" />
      <Rect x="83" y="200" width="5" height="22" rx="2.5" fill="#E9E2D2" />
      <Rect x="284" y="200" width="5" height="22" rx="2.5" fill="#E9E2D2" />
      <Rect x="306" y="200" width="5" height="22" rx="2.5" fill="#E9E2D2" />
      <Rect x="0" y="290" width={VIEW_W} height="10" fill="#D8CBB2" />

      {/* Microwave */}
      <G>
        <Rect x="12" y="104" width="92" height="64" rx="8" fill="#FAF7F1" stroke="#DDD5C6" strokeWidth="1.5" />
        <Rect x="19" y="111" width="58" height="50" rx="5" fill="#2B2F33" />
        <Path d="M26 152 L44 118" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" />
        <Rect x="83" y="114" width="15" height="8" rx="2" fill="#1E2A22" />
        <Rect x="85" y="116.5" width="11" height="3" rx="1" fill="#8FD14F" />
        <Circle cx="90.5" cy="134" r="4" fill="#D8D1C4" />
        <Circle cx="90.5" cy="148" r="4" fill="#D8D1C4" />
      </G>

      {/* Blender */}
      <G>
        <Path d="M114 92 L138 92 L135 144 L117 144 Z" fill="url(#glass)" opacity="0.95" />
        <Path d="M116.5 120 L135.5 120 L135 144 L117 144 Z" fill="#9ACB6A" />
        <Path d="M137 100 C146 102 146 128 136 130" stroke="#2B2F33" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Rect x="112" y="86" width="28" height="8" rx="3" fill="#2B2F33" />
        <Rect x="112" y="144" width="28" height="24" rx="5" fill="#2B2F33" />
        <Circle cx="126" cy="156" r="4" fill="#9AA1A9" />
      </G>

      {/* Freestanding stove: cooktop + oven */}
      <G>
        <Rect x="146" y="150" width="86" height="140" rx="6" fill="#F5F2EC" stroke="#D9D2C3" strokeWidth="1.5" />
        <Rect x="148" y="152" width="82" height="18" rx="4" fill="#3A3F46" />
        <Ellipse cx="166" cy="161" rx="10" ry="4.5" fill="#1F2328" stroke="#5A6069" strokeWidth="1.5" />
        <Ellipse cx="212" cy="161" rx="10" ry="4.5" fill="#1F2328" stroke="#5A6069" strokeWidth="1.5" />
        <Rect x="150" y="174" width="78" height="10" rx="3" fill="#E7E2D8" />
        {[160, 176, 202, 218].map((x) => (
          <Circle key={x} cx={x} cy="179" r="3.6" fill="#3A3F46" />
        ))}
        <Rect x="152" y="190" width="74" height="94" rx="6" fill="#ECE7DD" />
        <Rect x="159" y="192" width="60" height="5" rx="2.5" fill="#9AA1A9" />
        <Rect x="160" y="204" width="58" height="56" rx="5" fill="url(#ovenGlow)" />
        <Path d="M166 252 L182 212" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="5" strokeLinecap="round" />
        <Rect x="170" y="238" width="38" height="4" rx="2" fill="#F59E0B" opacity="0.7" />
      </G>

      {/* Pressure cooker on the back burner */}
      <G>
        <Path d="M170 104 C170 98 178 98 178 104 L178 110 L170 110 Z" fill="#2B2F33" />
        <Path
          d="M176 96 C180 90 172 86 176 80"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
        <Rect x="138" y="112" width="22" height="7" rx="3.5" fill="#2B2F33" />
        <Ellipse cx="174" cy="116" rx="21" ry="7" fill="#DCE1E6" />
        <Rect x="154" y="116" width="40" height="34" rx="8" fill="url(#steel)" />
        <Rect x="154" y="122" width="40" height="3" fill="#FFFFFF" opacity="0.5" />
        <Rect x="192" y="126" width="9" height="5" rx="2.5" fill="#2B2F33" />
      </G>

      {/* Air fryer */}
      <G>
        <Rect x="240" y="100" width="50" height="68" rx="14" fill="#FAF7F1" stroke="#DDD5C6" strokeWidth="1.5" />
        <Circle cx="265" cy="115" r="7" fill="#2E3238" />
        <Circle cx="265" cy="115" r="2.2" fill="#8FD14F" />
        <Rect x="246" y="128" width="38" height="34" rx="7" fill="#2E3238" />
        <Rect x="259" y="138" width="12" height="16" rx="3" fill="#1A1D21" />
        <Path d="M251 158 L262 132" stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="4" strokeLinecap="round" />
      </G>

      {/* Grill / sanduicheira */}
      <G>
        <Rect x="298" y="154" width="54" height="14" rx="5" fill="#2E3238" />
        <Rect x="300" y="138" width="50" height="16" rx="7" fill="#3A3F46" />
        {[308, 316, 324, 332, 340].map((x) => (
          <Line key={x} x1={x} y1="142" x2={x} y2="150" stroke="#5A6069" strokeWidth="2" strokeLinecap="round" />
        ))}
        <Rect x="317" y="158" width="16" height="5" rx="2.5" fill="#9AA1A9" />
        <Circle cx="345" cy="161" r="2" fill="#8FD14F" />
      </G>
    </Svg>
  );
});

interface Props {
  selected: ApplianceId[];
  onToggle: (id: ApplianceId) => void;
}

export function KitchenScene({ selected, onToggle }: Props) {
  return (
    <View style={styles.box}>
      <Scene />
      {(Object.keys(HIT) as ApplianceId[]).map((id) => {
        const [x, y, w, h] = HIT[id];
        const active = selected.includes(id);
        return (
          <Pressable
            key={id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
            accessibilityLabel={applianceName(id)}
            onPress={() => onToggle(id)}
            style={[
              styles.hit,
              {
                left: pct((x / VIEW_W) * 100),
                top: pct((y / VIEW_H) * 100),
                width: pct((w / VIEW_W) * 100),
                height: pct((h / VIEW_H) * 100),
              },
              active && styles.hitActive,
            ]}
          >
            <View style={[styles.badge, active ? styles.badgeOn : styles.badgeOff]}>
              <Svg width={12} height={12} viewBox="0 0 12 12">
                {active ? (
                  <Path
                    d="M2.5 6.2 L5 8.6 L9.6 3.6"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <Path d="M6 2.5 V9.5 M2.5 6 H9.5" stroke={colors.forest} strokeWidth="2" strokeLinecap="round" />
                )}
              </Svg>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    aspectRatio: VIEW_W / VIEW_H,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F6F0E4',
  },
  hit: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  hitActive: {
    borderColor: colors.leaf,
    backgroundColor: 'rgba(114, 184, 67, 0.16)',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeOn: { backgroundColor: colors.leaf },
  badgeOff: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: colors.leafSoft },
});
