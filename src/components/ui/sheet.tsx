import { Modal, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, FONT, TOUCH } from '@/constants/colors';

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
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View style={s.backdrop}>
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
  return (
    <View style={[s.panel, { maxHeight }, padBottom && { paddingBottom: insets.bottom + 8 }]} accessibilityViewIsModal>
      <View style={s.handle} />
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
  /** Shows a back chevron on the left instead of a close button on the right. */
  back?: boolean;
  leading?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const btn = (
    <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={s.btn}>
      <Icon name={back ? 'chevronLeft' : 'x'} size={back ? 22 : 18} color={C.text1} strokeWidth={2.4} />
    </Pressable>
  );
  return (
    <View style={[s.head, back && { paddingLeft: 6 }]}>
      {back ? btn : null}
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        {children}
      </View>
      {back ? null : btn}
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  panel: { backgroundColor: '#fff', borderTopWidth: 4, borderTopColor: C.blue },
  handle: { alignSelf: 'center', width: 40, height: 4, backgroundColor: C.sheetHandle, marginTop: 10, marginBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontFamily: FONT.displayXBold, fontSize: 18, color: C.text1 },
  btn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
