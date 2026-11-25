import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Button, EmptyState, Notice, Section, cardShadow, surface } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { ScreenTop } from '@/features/shell/screen-top';
import { useTheme } from '@/features/theme/theme-context';
import type { Report } from '@/types';

import { ReportCard } from './report-card';
import { ReportDetailSheet } from './report-detail-sheet';
import { useReports } from './reports-context';

export function CitizenHomeScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { reports, source, sourceReason, loading, liveAlert, dismissLiveAlert } = useReports();
  const [detail, setDetail] = useState<Report | null>(null);
  const recent = reports.slice(0, 4);

  const actions: { icon: IconName; title: string; sub: string; onPress: () => void }[] = [
    {
      icon: 'card',
      title: 'Pagar Predial, Agua o Tránsito',
      sub: 'Consulta tus adeudos pendientes, clave catastral y placas',
      onPress: () => router.navigate('/payments'),
    },
    {
      icon: 'camera',
      title: 'Reportar un problema con foto',
      sub: 'Baches, luminarias, fugas, limpia pública o semáforos',
      onPress: () => router.push('/new-report'),
    },
    {
      icon: 'bulb',
      title: '¿A dónde dirigirme? Guía rápida',
      sub: 'Indicaciones sencillas según el trámite que necesitas',
      onPress: () => router.navigate('/orizaba'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTop />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.head}>
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.kicker, { color: colors.blue }]}>Portal Ciudadano</Text>
              <Text accessibilityRole="header" style={[s.hello, { color: colors.text1 }]}>
                ¡Hola, {session?.displayName ?? 'vecino'}!
              </Text>
            </View>
          </View>
          <Text style={[s.sub, { color: colors.text2 }]}>
            Realiza tus pagos municipales, gestiona tus datos de catastro o reporta incidencias en tu calle desde un solo lugar.
          </Text>

          {liveAlert ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const target = reports.find((x) => x.id === liveAlert.reportId);
                if (target) setDetail(target);
                dismissLiveAlert();
              }}
              style={[s.liveBanner, { backgroundColor: colors.successSoft, borderLeftColor: colors.success }]}>
              <Icon name="bell" size={16} color={colors.success} strokeWidth={2.4} />
              <Text style={[s.liveBannerText, { color: colors.text1 }]}>{liveAlert.text}</Text>
            </Pressable>
          ) : null}

          {source === 'demo' ? (
            <Notice
              tone={sourceReason?.startsWith('Vista previa') ? 'info' : 'warning'}
              text={sourceReason || 'Conectando con el servidor: se muestran reportes de demostración mientras reconecta.'}
            />
          ) : null}
        </View>

        <Section label="¿Qué deseas realizar?">
          <View style={[s.actionsCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            {actions.map((a, idx) => (
              <Pressable
                key={a.title}
                accessibilityRole="button"
                onPress={a.onPress}
                style={({ pressed }) => [
                  s.actionRow,
                  idx < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  pressed && { backgroundColor: colors.blueSoft },
                ]}>
                <View style={[s.actionIcon, { backgroundColor: colors.blueIcon }]}>
                  <Icon name={a.icon} size={20} color={colors.blue} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.actionTitle, { color: colors.text1 }]}>{a.title}</Text>
                  <Text style={[s.actionSub, { color: colors.text2 }]}>{a.sub}</Text>
                </View>
                <Icon name="chevronRight" size={16} color={colors.text3} strokeWidth={2.4} />
              </Pressable>
            ))}
          </View>
        </Section>

        <Section
          label="Mis reportes recientes"
          link="Ver todos"
          linkHint="Abre la lista de reportes"
          onLinkPress={() => router.navigate('/reports')}>
          {loading ? <Text style={s.sub}>Cargando reportes…</Text> : null}
          {!loading && recent.length === 0 ? (
            <EmptyState
              title="Aún no tienes reportes"
              body="Cuando reportes un bache, fuga o luminaria podrás seguir su atención desde aquí."
            />
          ) : null}
          {recent.length > 0 ? null : (
            <View style={{ marginTop: 10 }}>
              <Button icon="send" label="Crear mi primer reporte" onPress={() => router.push('/new-report')} />
            </View>
          )}
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
  head: { paddingHorizontal: 18, paddingTop: 14, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  kicker: { fontFamily: FONT.sansBold, fontSize: 11.5, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.6 },
  hello: { fontFamily: FONT.displayXBold, fontSize: 22, color: C.text1, marginTop: 2 },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, lineHeight: 19 },
  liveBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, backgroundColor: C.successSoft, borderLeftWidth: 4, borderLeftColor: C.success },
  liveBannerText: { flex: 1, fontFamily: FONT.sansSemi, fontSize: 13, color: C.text1 },
  actionsCard: { ...surface, overflow: 'hidden', ...cardShadow },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.divider },
  actionIcon: { width: 42, height: 42, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  actionSub: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, marginTop: 2, lineHeight: 17 },
});
