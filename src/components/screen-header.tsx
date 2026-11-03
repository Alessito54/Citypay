import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT } from '@/constants/colors';

import { Icon } from './icon';

/**
 * Top bar for pushed screens: back · title · optional action. Mirrors the bar
 * already used by the new-report screen so every stacked screen reads alike.
 */
export function ScreenHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 4 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={s.back}>
        <Icon name="chevronLeft" size={24} color={C.text1} />
      </Pressable>
      <Text numberOfLines={1} accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      <View style={s.action}>{action}</View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 6, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#fff' },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: FONT.displayXBold, fontSize: 18, color: C.navy },
  action: { minWidth: 48, alignItems: 'flex-end', justifyContent: 'center' },
});
