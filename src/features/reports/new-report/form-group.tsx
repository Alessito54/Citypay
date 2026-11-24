import { StyleSheet, Text, View } from 'react-native';

import { C, FONT } from '@/constants/colors';

export function FormGroup({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>
        {label}
        {required ? <Text style={s.req}> (obligatorio)</Text> : null}
        {optional ? <Text style={s.opt}> (opcional)</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: FONT.sansBold, fontSize: 15, color: C.navy },
  req: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.danger },
  opt: { fontFamily: FONT.sans, fontSize: 13, color: C.text2 },
});
