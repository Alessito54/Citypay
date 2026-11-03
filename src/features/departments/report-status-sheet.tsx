import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { EstadoBadge } from '@/components/status-badge';
import { FieldMessage, PrimaryButton, SelectField } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import { reportsService } from '@/services/reports-service';
import type { Department, Report, ReportEstado } from '@/types';

const FLOW: { estado: ReportEstado; hint: string }[] = [
  { estado: 'Nuevo', hint: 'Recibido, sin asignar a cuadrilla' },
  { estado: 'Asignado', hint: 'Turnado a una cuadrilla o inspector' },
  { estado: 'En proceso', hint: 'Trabajos en ejecución en el sitio' },
  { estado: 'Resuelto', hint: 'Atendido y cerrado para el ciudadano' },
];

const SIN_CAMBIO = 'Mantener departamento actual';

/**
 * Lets municipal staff move a citizen report along its workflow, leaving a note
 * in the history. Supervisors and the administrator may also re-route it to
 * another department when the incident was mis-classified.
 */
export function ReportStatusSheet({
  report,
  visible,
  departments,
  canReroute,
  onClose,
  onUpdated,
}: {
  report: Report | null;
  visible: boolean;
  departments?: Department[];
  canReroute?: boolean;
  onClose: () => void;
  onUpdated?: (updated: Report) => void;
}) {
  const insets = useSafeAreaInsets();
  const [estado, setEstado] = useState<ReportEstado>(report?.estado ?? 'Nuevo');
  const [notes, setNotes] = useState('');
  const [deptName, setDeptName] = useState(SIN_CAMBIO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!report) return null;

  const deptOptions = [SIN_CAMBIO, ...(departments ?? []).map((d) => d.name)];
  const selectedDept = (departments ?? []).find((d) => d.name === deptName);
  const unchanged = estado === report.estado && !selectedDept && !notes.trim();

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await reportsService.updateStatus(report.id, {
        status: estado,
        notes: notes.trim() || undefined,
        departmentId: selectedDept?.id,
      });
      onUpdated?.(updated);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el reporte.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar gestión del reporte"
        />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal>
          <View style={s.handle} />
          <View style={s.head}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text accessibilityRole="header" style={s.title}>
                Gestionar reporte
              </Text>
              <Text numberOfLines={1} style={s.subtitle}>
                {report.title} · {report.categoria}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={s.closeBtn}>
              <View style={s.closeCircle}>
                <Icon name="x" size={16} color={C.text1} strokeWidth={2.4} />
              </View>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8, gap: 14 }}>
            <View style={s.currentRow}>
              <Text style={s.blockLabel}>Estado actual</Text>
              <EstadoBadge estado={report.estado} />
            </View>

            <View>
              <Text style={s.blockLabel}>Nuevo estado de atención</Text>
              <View style={{ gap: 8 }}>
                {FLOW.map((step) => {
                  const on = estado === step.estado;
                  return (
                    <Pressable
                      key={step.estado}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on, selected: on }}
                      accessibilityLabel={`${step.estado}. ${step.hint}`}
                      onPress={() => setEstado(step.estado)}
                      style={[s.option, on && s.optionOn]}>
                      <View style={[s.radio, on && s.radioOn]}>
                        {on ? <Icon name="check" size={12} color="#fff" strokeWidth={3} /> : null}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[s.optionLabel, on && { color: C.blue }]}>{step.estado}</Text>
                        <Text style={s.optionHint}>{step.hint}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {canReroute && (departments ?? []).length > 0 ? (
              <View>
                <Text style={s.blockLabel}>Turnar a otro departamento</Text>
                <SelectField
                  label="Departamento responsable"
                  value={deptName}
                  options={deptOptions}
                  onChange={setDeptName}
                  variant="row"
                  leftIcon="home"
                  active={deptName !== SIN_CAMBIO}
                />
              </View>
            ) : null}

            <View>
              <Text style={s.blockLabel}>Nota de seguimiento (opcional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                accessibilityLabel="Nota de seguimiento"
                placeholder="Ej. Cuadrilla 4 programada para el martes por la mañana."
                placeholderTextColor={C.text3}
                multiline
                style={s.textarea}
              />
              <Text style={s.helper}>
                La nota queda en el historial del reporte y es visible para el ciudadano.
              </Text>
            </View>

            <FieldMessage text={error} />

            <PrimaryButton
              label={saving ? 'Guardando…' : 'Guardar cambios'}
              accessibilityHint="Actualiza el estado del reporte y registra la nota"
              disabled={saving || unchanged}
              loading={saving}
              onPress={save}
            />
            {unchanged ? (
              <Text style={s.helper}>
                Elige un estado distinto, turna el reporte o escribe una nota para habilitar el guardado.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.sheetHandle, marginTop: 12, marginBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 18, paddingRight: 8, paddingBottom: 10 },
  title: { fontFamily: FONT.displayXBold, fontSize: 18, color: C.text1 },
  subtitle: { fontFamily: FONT.sans, fontSize: 13, color: C.text2, marginTop: 2 },
  closeBtn: { width: TOUCH + 4, height: TOUCH + 4, alignItems: 'center', justifyContent: 'center' },
  closeCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.screen, alignItems: 'center', justifyContent: 'center' },
  currentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  blockLabel: { fontFamily: FONT.sansBold, fontSize: 14, color: C.text1, marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: TOUCH + 8, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: '#FAFCFF' },
  optionOn: { borderColor: C.blue, borderWidth: 1.5, backgroundColor: C.blueSoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.inputBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  radioOn: { backgroundColor: C.blue, borderColor: C.blue },
  optionLabel: { fontFamily: FONT.sansBold, fontSize: 14.5, color: C.text1 },
  optionHint: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 1 },
  textarea: { minHeight: 90, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 12, padding: 12, fontFamily: FONT.sans, fontSize: 15, color: C.text1, textAlignVertical: 'top' },
  helper: { fontFamily: FONT.sans, fontSize: 12.5, color: C.text3, marginTop: 6, lineHeight: 17 },
});
