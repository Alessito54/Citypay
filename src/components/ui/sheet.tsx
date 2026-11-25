import { Modal, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT, TOUCH } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

import { Icon } from '../icon';

/** Modal + dimmed backdrop. Tapping the backdrop calls onDismiss. */
export function SheetModal({
  onDismiss,
  dismissLabel,
  children,
}: {
  onDismiss: () => void;
  dismissLabel: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View style={[s.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityRole="button" accessibilityLabel={dismissLabel} />
        {children}
      </View>
    </Modal>
  );
}

/** Square bottom panel. Pads the bottom safe area when `padBottom` is set. */
export function SheetPanel({
  maxHeight = '85%',
  padBottom,
  children,
}: {
  maxHeight?: DimensionValue;
  padBottom?: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View
      style={[
        s.panel,
        { maxHeight, backgroundColor: colors.white, borderTopColor: colors.blue },
        padBottom && { paddingBottom: insets.bottom + 8 },
      ]}
      accessibilityViewIsModal>
      <View style={[s.handle, { backgroundColor: colors.sheetHandle }]} />
      {children}
    </View>
  );
}

/** Sheet title row with a close (or back) button. */
export function SheetHeader({
  title,
  onClose,
  closeLabel = 'Cerrar',
  back,
  leading,
  children,
}: {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  back?: boolean;
  leading?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const btn = (
    <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={s.btn}>
      <Icon name={back ? 'chevronLeft' : 'x'} size={back ? 22 : 18} color={colors.text1} strokeWidth={2.4} />
    </Pressable>
  );
  return (
    <View style={[s.head, { borderBottomColor: colors.border }, back && { paddingLeft: 6 }]}>
      {back ? btn : null}
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text accessibilityRole="header" style={[s.title, { color: colors.text1 }]}>
          {title}
        </Text>
        {children}
      </View>
      {back ? null : btn}
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  panel: { borderTopWidth: 4 },
  handle: { alignSelf: 'center', width: 40, height: 4, marginTop: 10, marginBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 6, paddingBottom: 10, borderBottomWidth: 1 },
  title: { fontFamily: FONT.displayXBold, fontSize: 18 },
  btn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
