import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { LocationMap } from '@/components/map/location-map';
import { Button, InfoList, SheetHeader, SheetModal, SheetPanel } from '@/components/ui';
import { C, FONT, RADIUS } from '@/constants/colors';
import { reportsService } from '@/services/reports-service';
import type { Report } from '@/types';

import { EstadoBadge } from './estado-badge';
import { ESTADO_STEPS } from './report-status';

/**
 * Report detail. The list endpoint returns a summary, so the full record (description,
 * photos and map coordinates) is fetched when the sheet opens. Mount with `key={report.id}`.
 */
export function ReportDetailSheet({ report, onClose }: { report: Report; onClose: () => void }) {
  const [full, setFull] = useState<Report>(report);

  useEffect(() => {
    let alive = true;
    reportsService
      .get(report.id)
      .then((r) => alive && r && setFull((prev) => ({ ...prev, ...r })))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [report.id]);

  const current = ESTADO_STEPS.indexOf(full.estado);
  const hasPin = full.latitude != null && full.longitude != null;

  return (
    <SheetModal onDismiss={onClose} dismissLabel="Cerrar detalle">
      <SheetPanel padBottom>
        <SheetHeader
          title={full.title}
          onClose={onClose}
          closeLabel="Cerrar detalle"
          leading={
            <View style={s.thumb} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Text style={{ fontSize: 22 }}>{full.icon}</Text>
            </View>
          }>
          <View style={{ marginTop: 4 }}>
            <EstadoBadge estado={full.estado} />
          </View>
        </SheetHeader>
        <ScrollView contentContainerStyle={s.body}>
          <View accessible accessibilityLabel={`Seguimiento: paso ${current + 1} de ${ESTADO_STEPS.length}, ${full.estado}`}>
            <Text style={s.label}>Seguimiento</Text>
            <View style={s.steps}>
              {ESTADO_STEPS.map((st, i) => {
                const done = i <= current;
                return (
                  <View key={st} style={s.step}>
                    <View style={[s.stepBar, done && { backgroundColor: C.blue }]} />
                    <View style={s.stepRow}>
                      {done ? <Icon name="check" size={12} color={C.blue} strokeWidth={3} /> : null}
                      <Text style={[s.stepText, done && { color: C.text1, fontFamily: FONT.sansSemi }]}>{st}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {full.description ? (
            <View>
              <Text style={s.label}>Descripción</Text>
              <Text style={s.desc}>{full.description}</Text>
            </View>
          ) : null}

          {hasPin ? (
            <LocationMap
              coords={{ latitude: full.latitude!, longitude: full.longitude! }}
              interactive={false}
              height={170}
              accessibilityLabel={`Mapa con la ubicación del reporte: ${full.address}`}
            />
          ) : null}

          {full.fotos?.length ? (
            <View>
              <Text style={s.label}>Fotos de evidencia</Text>
              <View style={s.photos}>
                {full.fotos.map((uri, i) => (
                  <Image key={uri} source={{ uri }} style={s.photo} contentFit="cover" accessibilityLabel={`Foto de evidencia ${i + 1}`} />
                ))}
              </View>
            </View>
          ) : null}

          <InfoList
            rows={[
              { label: 'Categoría', value: full.categoria },
              { label: 'Prioridad', value: full.prioridad },
              { label: 'Ubicación', value: full.address },
              { label: 'Fecha', value: full.date },
            ]}
          />
          <Button variant="secondary" label="Cerrar" onPress={onClose} />
        </ScrollView>
      </SheetPanel>
    </SheetModal>
  );
}

const s = StyleSheet.create({
  thumb: { width: 48, height: 48, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18, gap: 16 },
  label: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1, marginBottom: 8 },
  steps: { flexDirection: 'row', gap: 4 },
  step: { flex: 1, gap: 6 },
  stepBar: { height: 6, backgroundColor: C.border },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stepText: { fontFamily: FONT.sans, fontSize: 12, color: C.text2, flexShrink: 1 },
  desc: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text1, lineHeight: 21 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 88, height: 88, borderRadius: RADIUS, backgroundColor: C.blueIcon },
});
