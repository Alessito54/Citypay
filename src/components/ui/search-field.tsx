import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { FONT, RADIUS, TOUCH } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

import { Icon } from '../icon';

export function SearchField({
  value,
  onChangeText,
  label,
  hint,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  label: string;
  hint?: string;
  placeholder: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[s.box, { backgroundColor: colors.white, borderColor: colors.inputBorder }]}>
      <Icon name="search" size={18} color={colors.text2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        style={[s.input, { color: colors.text1 }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => onChangeText('')} style={s.clear}>
          <Icon name="xCircle" size={18} color={colors.text2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingLeft: 12, borderRadius: RADIUS, borderWidth: 1 },
  input: { flex: 1, minWidth: 0, minHeight: 46, fontFamily: FONT.sans, fontSize: 16, paddingVertical: 0 },
  clear: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
