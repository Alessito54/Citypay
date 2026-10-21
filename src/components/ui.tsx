import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT } from '@/constants/colors';

import { Icon, type IconName } from './icon';

export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;

export function Section({
  label,
  link,
  onLinkPress,
  children,
}: {
  label: string;
  link?: string;
  onLinkPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionLabel}>{label}</Text>
        {link ? (
          <Pressable onPress={onLinkPress} hitSlop={8} accessibilityRole="button">
            <Text style={s.sectionLink}>{link}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub: string;
  trend: number;
}) {
  return (
    <View style={s.kpi}>
      <View style={s.kpiIcon}>
        <Icon name={icon} color={C.blue} />
      </View>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiSub}>{sub}</Text>
      <Text style={s.kpiTrend}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs ayer
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
  children,
}: {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }, disabled && { opacity: 0.85 }, style]}>
      {children ?? <Text style={s.primaryBtnText}>{label}</Text>}
    </Pressable>
  );
}

/** Replacement for the web <select>: opens a bottom list of options. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  variant = 'inline',
  leftIcon,
  rightIcon = 'chevronDown',
}: {
  label?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  variant?: 'inline' | 'row';
  leftIcon?: IconName;
  rightIcon?: IconName;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const inline = variant === 'inline';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? value}
        onPress={() => setOpen(true)}
        style={[inline ? s.selInline : s.selRow, inline && { flex: 1 }]}>
        {leftIcon ? <Icon name={leftIcon} size={16} color={C.blueMid} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {inline && label ? <Text style={s.selLabel}>{label}</Text> : null}
          <Text numberOfLines={1} style={inline ? s.selValueSm : s.selValue}>
            {value}
          </Text>
        </View>
        <Icon name={rightIcon} size={inline ? 10 : 12} color={C.text2} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.pickerBackdrop} onPress={() => setOpen(false)}>
          <View style={[s.pickerSheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={s.handle} />
            {label ? <Text style={s.pickerTitle}>{label}</Text> : null}
            <FlatList
              data={options}
              keyExtractor={(o) => o}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[s.pickerItem, item === value && { backgroundColor: C.blueSoft }]}>
                  <Text style={[s.pickerItemText, item === value && { color: C.blue, fontFamily: FONT.sansBold }]}>
                    {item}
                  </Text>
                  {item === value ? <Icon name="check" size={16} color={C.blue} /> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  section: { paddingHorizontal: 18, paddingTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontFamily: FONT.sansBold, fontSize: 15, color: C.text1 },
  sectionLink: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.blue },
  kpi: { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: C.border, ...cardShadow },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiLabel: { fontFamily: FONT.sansSemi, fontSize: 10.5, color: C.text2, lineHeight: 13, marginBottom: 4 },
  kpiValue: { fontFamily: FONT.displayXBold, fontSize: 20, color: C.text1, letterSpacing: -0.4 },
  kpiSub: { fontFamily: FONT.sans, fontSize: 10.5, color: C.text3, marginTop: 2, marginBottom: 4 },
  kpiTrend: { fontFamily: FONT.sansSemi, fontSize: 10.5, color: C.blueMid },
  primaryBtn: {
    height: 46,
    borderRadius: 10,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: C.blue,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  primaryBtnText: { fontFamily: FONT.sansBold, fontSize: 14, color: '#fff' },
  selInline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, minWidth: 0 },
  selRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  selLabel: { fontFamily: FONT.sansSemi, fontSize: 9.5, color: C.text3 },
  selValueSm: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.text1 },
  selValue: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text1 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 10, marginBottom: 6 },
  pickerBackdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
  pickerTitle: { fontFamily: FONT.displayXBold, fontSize: 16, color: C.text1, paddingHorizontal: 18, paddingVertical: 8 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  pickerItemText: { fontFamily: FONT.sansMedium, fontSize: 14, color: C.text1 },
});
