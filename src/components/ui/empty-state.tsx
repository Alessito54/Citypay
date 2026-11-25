import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS } from '@/constants/colors';
import { useTheme } from '@/features/theme/theme-context';

import { Icon } from '../icon';
import { Button } from './button';

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
  const { colors } = useTheme();
  return (
    <View style={s.empty} accessibilityLiveRegion="polite">
      <View style={[s.icon, { backgroundColor: colors.blueIcon }]}>
        <Icon name="search" size={22} color={colors.blue} />
      </View>
      <Text style={[s.title, { color: colors.text1 }]}>{title}</Text>
      {body ? <Text style={[s.body, { color: colors.text2 }]}>{body}</Text> : null}
      {actionLabel && onAction ? <Button variant="secondary" label={actionLabel} onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 6 },
  icon: { width: 48, height: 48, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontFamily: FONT.sansBold, fontSize: 15, textAlign: 'center' },
  body: { fontFamily: FONT.sans, fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
});
