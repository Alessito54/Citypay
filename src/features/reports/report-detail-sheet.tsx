import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { LocationMap } from '@/components/map/location-map';
import { Button, FieldMessage, InfoList, SelectField, SheetHeader, SheetModal, SheetPanel } from '@/components/ui';
import { C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { useAuth } from '@/features/auth/auth-context';
import { getDepartment, ORIZABA_DEPARTMENTS, resolveDepartmentForReport } from '@/lib/orizaba';
import { canUserHandleReport } from '@/lib/roles';
import { reportsService } from '@/services/reports-service';
import type { Report, ReportEstado } from '@/types';

import { EstadoBadge } from './estado-badge';
import { ESTADO_STEPS } from './report-status';
import { useReports } from './reports-context';

const REPORT_DEPARTMENTS = ORIZABA_DEPARTMENTS.filter((d) => d.reportCategories.length > 0);

export function ReportDetailSheet({ report, onClose }: { report: Report; onClose: () => void }) {
  const { session } = useAuth();
  const { updateReportStatus } = useReports();
  const [full, setFull] = useState<Report>(report);
  const [nextStatus, setNextStatus] = useState<ReportEstado>(report.estado);
  const [nextDeptName, setNextDeptName] = useState<string>(() => {
    const d = getDepartment(report.department || resolveDepartmentForReport(report.categoria, report.title));
    return d?.name ?? REPORT_DEPARTMENTS[0].name;
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    reportsService
      .get(report.id)
      .then((r) => {
        if (!alive || !r) return;
        setFull((prev) => ({ ...prev, ...r }));
        setNextStatus(r.estado);
        const dept = getDepartment(r.department || resolveDepartmentForReport(r.categoria, r.title));
        if (dept) setNextDeptName(dept.name);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [report.id]);

  const current = ESTADO_STEPS.indexOf(full.estado);
  const hasPin = full.latitude != null && full.longitude != null;
  const assignedDept = getDepartment(full.department || resolveDepartmentForReport(full.categoria, full.title));
  const canHandle = canUserHandleReport(full, session);
  const canReassignDept = session?.role === 'admin' || session?.role === 'municipal_supervisor';

  const handleSaveStatus = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const selectedDept = REPORT_DEPARTMENTS.find((d) => d.name === nextDeptName);
      const updated = await updateReportStatus(full.id, {
        status: nextStatus,
        notes: notes.trim() || undefined,
        department: canReassignDept && selectedDept ? selectedDept.slug : undefined,
      });
      setFull((prev) => ({ ...prev, ...updated }));
      setNotes('');
      setSaveMsg({ text: `Estado actualizado a "${updated.estado}" y sincronizado en tiempo real.`, tone: 'success' });
    } catch (err) {
      setSaveMsg({
        text: err instanceof Error ? err.message : 'No se pudo actualizar el estado del reporte.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const infoRows = [
    { label: 'Área responsable', value: assignedDept ? `${assignedDept.name} (Ext. ${assignedDept.extension})` : full.categoria },
    { label: 'Categoría', value: full.categoria },
    { label: 'Prioridad', value: full.prioridad },
    { label: 'Ubicación', value: full.address },
    { label: 'Fecha', value: full.date },
    ...(full.user ? [{ label: 'Reportado por', value: `${full.user.displayName} (${full.user.email})` }] : []),
  ];

  return (
    <SheetModal onDismiss={onClose} dismissLabel="Cerrar detalle">
      <SheetPanel padBottom maxHeight="92%">
        <SheetHeader
          title={full.title}
          onClose={onClose}
          closeLabel="Cerrar detalle"
          leading={
            <View style={s.thumb} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <Text style={{ fontSize: 22 }}>{full.icon}</Text>
            </View>
          }>
          <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <EstadoBadge estado={full.estado} />
            {assignedDept ? <Text style={s.deptTag}>{assignedDept.shortName}</Text> : null}
          </View>
        </SheetHeader>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
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

          {full.fotos?.length ? (
            <View>
              <Text style={s.label}>Fotos de evidencia ({full.fotos.length})</Text>
              <View style={s.photos}>
                {full.fotos.map((uri, i) => (
                  <Pressable
                    key={`${uri}-${i}`}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`Ampliar foto de evidencia ${i + 1}`}
                    onPress={() => setPreviewUri(uri)}>
                    <Image source={{ uri }} style={s.photo} contentFit="cover" />
                  </Pressable>
                ))}
              </View>
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

          <InfoList rows={infoRows} />

          {full.history && full.history.length > 0 ? (
            <View style={s.historyBox}>
              <Text style={s.label}>Historial de atención</Text>
              {full.history.slice(0, 4).map((h) => (
                <View key={h.id} style={s.historyRow}>
                  <Text style={s.historyStatus}>
                    {h.newStatus} · <Text style={s.historyBy}>{h.changedBy}</Text>
                  </Text>
                  {h.notes ? <Text style={s.historyNote}>{h.notes}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}

          {canHandle ? (
            <View style={s.manageBox}>
              <Text style={s.manageTitle}>Actualizar seguimiento de atención</Text>
              <SelectField
                variant="row"
                label="Estado de atención"
                leftIcon="check"
                value={nextStatus}
                options={[...ESTADO_STEPS]}
                onChange={(v) => setNextStatus(v as ReportEstado)}
              />
              {canReassignDept ? (
                <SelectField
                  variant="row"
                  label="Turnar a coordinación"
                  leftIcon="tool"
                  value={nextDeptName}
                  options={REPORT_DEPARTMENTS.map((d) => d.name)}
                  onChange={setNextDeptName}
                />
              ) : null}
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Nota de seguimiento (ej. Cuadrilla de bacheo programada en turno matutino)"
                placeholderTextColor={C.text3}
                multiline
                style={s.noteInput}
              />
              <FieldMessage text={saveMsg?.text} tone={saveMsg?.tone} />
              <Button
                icon="check"
                label={saving ? 'Guardando actualización…' : 'Guardar y notificar avance'}
                loading={saving}
                onPress={handleSaveStatus}
              />
            </View>
          ) : null}

          <Button variant="secondary" label="Cerrar" onPress={onClose} />
        </ScrollView>

        <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
          <Pressable style={s.modalBg} onPress={() => setPreviewUri(null)}>
            {previewUri ? <Image source={{ uri: previewUri }} style={s.modalImg} contentFit="contain" /> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar imagen" onPress={() => setPreviewUri(null)} style={s.modalClose}>
              <Icon name="x" size={20} color="#fff" strokeWidth={2.6} />
              <Text style={s.modalCloseText}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Modal>
      </SheetPanel>
    </SheetModal>
  );
}

const s = StyleSheet.create({
  thumb: { width: 48, height: 48, borderRadius: RADIUS, backgroundColor: C.blueIcon, alignItems: 'center', justifyContent: 'center' },
  deptTag: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue, backgroundColor: C.blueSoft, paddingHorizontal: 8, paddingVertical: 2 },
  body: { padding: 18, gap: 16 },
  label: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1, marginBottom: 8 },
  steps: { flexDirection: 'row', gap: 4 },
  step: { flex: 1, gap: 6 },
  stepBar: { height: 6, backgroundColor: C.border },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stepText: { fontFamily: FONT.sans, fontSize: 12, color: C.text2, flexShrink: 1 },
  desc: { fontFamily: FONT.sans, fontSize: 14.5, color: C.text1, lineHeight: 21 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 92, height: 92, borderRadius: RADIUS, backgroundColor: C.blueIcon, borderWidth: 1, borderColor: C.border },
  historyBox: { gap: 8, padding: 12, backgroundColor: C.screen, borderWidth: 1, borderColor: C.border },
  historyRow: { borderLeftWidth: 3, borderLeftColor: C.blueMid, paddingLeft: 10, gap: 2 },
  historyStatus: { fontFamily: FONT.sansBold, fontSize: 13, color: C.text1 },
  historyBy: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2 },
  historyNote: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text2 },
  manageBox: { padding: 14, gap: 10, backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, borderLeftColor: C.blue },
  manageTitle: { fontFamily: FONT.sansBold, fontSize: 14, color: C.navy },
  noteInput: { minHeight: 68, padding: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder, borderRadius: RADIUS, fontFamily: FONT.sans, fontSize: 14, color: C.text1, textAlignVertical: 'top' },
  modalBg: { flex: 1, backgroundColor: 'rgba(11, 23, 54, 0.92)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalImg: { width: '100%', height: '78%' },
  modalClose: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: C.blue, borderRadius: RADIUS, minHeight: TOUCH },
  modalCloseText: { fontFamily: FONT.sansBold, fontSize: 14, color: '#fff' },
});
