import { StyleSheet, Text, View } from 'react-native';

import { C, FONT, RADIUS } from '@/constants/colors';

import { Icon } from '../icon';
import { Button } from './button';

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
      <View style={s.icon}>
        <Icon name="search" size={22} color={C.blue} />
      </View>
      <Text style={s.title}>{title}</Text>
      {body ? <Text style={s.body}>{body}</Text> : null}
      {actionLabel && onAction ? <Button variant="secondary" label={actionLabel} onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 6 },
  icon: { width: 48, height: 48, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontFamily: FONT.sansBold, fontSize: 15, color: C.text1, textAlign: 'center' },
  body: { fontFamily: FONT.sans, fontSize: 13.5, color: C.text2, textAlign: 'center', lineHeight: 19 },
});
