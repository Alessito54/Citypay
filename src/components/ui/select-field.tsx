import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ACCENT_BAR, FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

import { Icon, type IconName } from '../icon';
import { SheetHeader, SheetModal, SheetPanel } from './sheet';

/** Replacement for the web <select>: opens a bottom list of options. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  variant = 'inline',
  leftIcon,
  active,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  variant?: 'inline' | 'row';
  leftIcon?: IconName;
  active?: boolean;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const inline = variant === 'inline';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityHint="Abre la lista de opciones"
        onPress={() => setOpen(true)}
        style={[
          s.control,
          { backgroundColor: colors.white, borderColor: colors.inputBorder },
          inline && { flex: 1 },
          active && { borderColor: colors.blue, borderWidth: 1.5, backgroundColor: colors.blueSoft },
        ]}>
        {leftIcon ? <Icon name={leftIcon} size={16} color={colors.blueMid} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          {inline ? <Text style={[s.label, { color: colors.text3 }]}>{label}</Text> : null}
          <Text numberOfLines={1} style={[inline ? s.valueSm : s.value, { color: colors.text1 }]}>
            {value}
          </Text>
        </View>
        <Icon name="chevronDown" size={inline ? 12 : 14} color={colors.text2} />
      </Pressable>
      {open ? (
        <SheetModal onDismiss={() => setOpen(false)} dismissLabel="Cerrar lista">
          <SheetPanel maxHeight="60%" padBottom>
            <SheetHeader title={label} onClose={() => setOpen(false)} />
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
                    style={({ pressed }) => [
                      s.item,
                      on && { backgroundColor: colors.blueSoft, borderLeftColor: colors.blue },
                      pressed && { backgroundColor: colors.blueSoft },
                    ]}>
                    <Text style={[s.itemText, { color: on ? colors.blue : colors.text1 }, on && { fontFamily: FONT.sansBold }]}>
                      {item}
                    </Text>
                    {on ? <Icon name="check" size={18} color={colors.blue} strokeWidth={2.4} /> : null}
                  </Pressable>
                );
              }}
            />
          </SheetPanel>
        </SheetModal>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  control: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingVertical: 6, paddingHorizontal: 12, borderRadius: RADIUS, borderWidth: 1, minWidth: 0 },
  label: { fontFamily: FONT.sansSemi, fontSize: 11.5 },
  valueSm: { fontFamily: FONT.sansSemi, fontSize: 13.5 },
  value: { fontFamily: FONT.sansSemi, fontSize: 14 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, minHeight: 52, borderLeftWidth: ACCENT_BAR, borderLeftColor: 'transparent' },
  itemText: { fontFamily: FONT.sansMedium, fontSize: 15 },
});
