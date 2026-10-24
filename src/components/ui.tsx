import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT, TOUCH } from '@/constants/colors';

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
  linkHint,
  onLinkPress,
  children,
}: {
  label: string;
  link?: string;
  linkHint?: string;
  onLinkPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text accessibilityRole="header" style={s.sectionLabel}>
          {label}
        </Text>
        {link ? (
          <Pressable
            onPress={onLinkPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${link}: ${label}`}
            accessibilityHint={linkHint}
            style={s.sectionLinkBtn}>
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
  trendLabel = 'vs ayer',
}: {
  icon: IconName;
  label: string;
  value: string;
  sub: string;
  trend: number;
  trendLabel?: string;
}) {
  const up = trend > 0;
  return (
    <View
      style={s.kpi}
      accessible
      accessibilityLabel={`${label}: ${value} ${sub}. ${up ? 'Subió' : 'Bajó'} ${Math.abs(trend)} por ciento ${trendLabel}.`}>
      <View style={s.kpiIcon}>
        <Icon name={icon} color={C.blue} />
      </View>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiSub}>{sub}</Text>
      <Text style={s.kpiTrend}>
        {up ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  disabled,
  loading,
  style,
  children,
}: {
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
  children?: React.ReactNode;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }, disabled && !loading && s.primaryBtnDisabled, style]}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : null}
      {children ?? <Text style={[s.primaryBtnText, disabled && !loading && { color: C.disabledText }]}>{label}</Text>}
    </Pressable>
  );
}

/** Inline validation / status message. Announced by screen readers when it appears. */
export function FieldMessage({ text, tone = 'error' }: { text?: string | null; tone?: 'error' | 'info' | 'success' }) {
  if (!text) return null;
  const color = tone === 'error' ? C.danger : tone === 'success' ? C.success : C.blue;
  const icon: IconName = tone === 'error' ? 'warn' : tone === 'success' ? 'check' : 'bulb';
  return (
    <View
      style={s.msg}
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessible>
      <Icon name={icon} size={14} color={color} strokeWidth={2.2} />
      <Text style={[s.msgText, { color }]}>{text}</Text>
    </View>
  );
}

/** Empty list placeholder with an optional recovery action (e.g. clear filters). */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.empty} accessibilityLiveRegion="polite">
      <View style={s.emptyIcon}>
        <Icon name="search" size={22} color={C.blue} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {body ? <Text style={s.emptyBody}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={s.emptyBtn}>
          <Text style={s.emptyBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
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
  active,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  variant?: 'inline' | 'row';
  leftIcon?: IconName;
  rightIcon?: IconName;
  /** Highlights the control when a non-default value is selected. */
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const inline = variant === 'inline';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityHint="Abre la lista de opciones"
        onPress={() => setOpen(true)}
        style={[inline ? s.selInline : s.selRow, inline && { flex: 1 }, active && s.selActive]}>
        {leftIcon ? <Icon name={leftIcon} size={16} color={C.blueMid} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {inline ? <Text style={s.selLabel}>{label}</Text> : null}
          <Text numberOfLines={1} style={inline ? s.selValueSm : s.selValue}>
            {value}
          </Text>
        </View>
        <Icon name={rightIcon} size={inline ? 12 : 14} color={C.text2} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={s.pickerBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar lista"
          />
          <View style={[s.pickerSheet, { paddingBottom: insets.bottom + 8 }]} accessibilityViewIsModal>
            <View style={s.handle} />
            <View style={s.pickerHead}>
              <Text accessibilityRole="header" style={s.pickerTitle}>
                {label}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={() => setOpen(false)}
                style={s.pickerClose}>
                <Icon name="x" size={16} color={C.text2} strokeWidth={2.4} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(o) => o}
              renderItem={({ item }) => {
                const on = item === value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on, selected: on }}
                    accessibilityLabel={item}
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [s.pickerItem, on && { backgroundColor: C.blueSoft }, pressed && { backgroundColor: C.blueSoft }]}>
                    <Text style={[s.pickerItemText, on && { color: C.blue, fontFamily: FONT.sansBold }]}>{item}</Text>
                    {on ? <Icon name="check" size={18} color={C.blue} strokeWidth={2.4} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  section: { paddingHorizontal: 18, paddingTop: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { fontFamily: FONT.sansBold, fontSize: 16, color: C.text1, flexShrink: 1 },
  sectionLinkBtn: { minHeight: TOUCH, justifyContent: 'center', paddingLeft: 12 },
  sectionLink: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
  kpi: { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: C.border, ...cardShadow },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiLabel: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.text2, lineHeight: 16, marginBottom: 4 },
  kpiValue: { fontFamily: FONT.displayXBold, fontSize: 21, color: C.text1, letterSpacing: -0.4 },
  kpiSub: { fontFamily: FONT.sans, fontSize: 12, color: C.text3, marginTop: 2, marginBottom: 4 },
  kpiTrend: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blueMid },
  primaryBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  primaryBtnDisabled: { backgroundColor: C.disabledBg, shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { fontFamily: FONT.sansBold, fontSize: 15, color: '#fff' },
  msg: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },
  msgText: { flex: 1, fontFamily: FONT.sansSemi, fontSize: 13, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 6 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: FONT.sansBold, fontSize: 15, color: C.text1, textAlign: 'center' },
  emptyBody: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { marginTop: 8, minHeight: TOUCH, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1.5, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  emptyBtnText: { fontFamily: FONT.sansBold, fontSize: 14, color: C.blue },
  selInline: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder, minWidth: 0 },
  selRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder },
  selActive: { borderColor: C.blue, borderWidth: 1.5, backgroundColor: C.blueSoft },
  selLabel: { fontFamily: FONT.sansSemi, fontSize: 11.5, color: C.text3 },
  selValueSm: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.text1 },
  selValue: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.text1 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 10, marginBottom: 6 },
  pickerBackdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
  pickerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 10 },
  pickerTitle: { fontFamily: FONT.displayXBold, fontSize: 17, color: C.text1, paddingVertical: 8 },
  pickerClose: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, minHeight: 52 },
  pickerItemText: { fontFamily: FONT.sansMedium, fontSize: 15, color: C.text1 },
});
