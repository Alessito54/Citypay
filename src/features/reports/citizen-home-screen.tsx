import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, EmptyState, Notice, Section } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { ScreenTop } from '@/features/shell/screen-top';
import type { Report } from '@/types';

import { ReportCard } from './report-card';
import { ReportDetailSheet } from './report-detail-sheet';
import { useReports } from './reports-context';

/** Home for citizens: their main task is reporting a problem and following it up. */
export function CitizenHomeScreen() {
  const { session } = useAuth();
  const { reports, source, loading } = useReports();
  const [detail, setDetail] = useState<Report | null>(null);
  const recent = reports.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenTop />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.head}>
          <Text accessibilityRole="header" style={s.hello}>
            ¡Hola, {session?.displayName ?? 'vecino'}!
          </Text>
          <Text style={s.sub}>¿Viste un problema en tu calle? Repórtalo y sigue su atención.</Text>
          <Button icon="send" label="Reportar un problema" onPress={() => router.push('/new-report')} />
          {source === 'demo' ? <Notice tone="warning" text="Sin conexión con el servidor: se muestran reportes de demostración." /> : null}
        </View>
        <Section label="Reportes recientes" link="Ver todos" linkHint="Abre la lista de reportes" onLinkPress={() => router.navigate('/reports')}>
          {loading ? <Text style={s.sub}>Cargando reportes…</Text> : null}
          {!loading && recent.length === 0 ? <EmptyState title="Aún no hay reportes" body="Tu primer reporte aparecerá aquí." /> : null}
        </Section>
        {recent.map((r) => (
          <ReportCard key={r.id} r={r} onPress={() => setDetail(r)} />
        ))}
      </ScrollView>
      {detail ? <ReportDetailSheet key={detail.id} report={detail} onClose={() => setDetail(null)} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingTop: 16, gap: 12 },
  hello: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.text1 },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, lineHeight: 19 },
});
