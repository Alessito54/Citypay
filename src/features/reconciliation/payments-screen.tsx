import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, Notice, SearchField } from '@/components/ui';
import { ACCENT_BAR, C, FONT, RADIUS, TOUCH } from '@/constants/colors';
import { ScreenTop } from '@/features/shell/screen-top';
import { useTheme } from '@/features/theme/theme-context';
import type { Status } from '@/types';

import { fmtMoney, SERVICE_LABEL } from './format';
import { useReconciliation } from './reconciliation-context';
import { searchText } from './selectors';
import { STATUS_CFG, TransactionRow } from './transaction-row';

type Filter = 'todos' | Status;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'discrepancia', label: 'Diferencias' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'conciliado', label: 'Cuadrados' },
];

const isFilter = (v: unknown): v is Filter => FILTERS.some((f) => f.id === v);

/** Payment list with status filter and free-text search. */
export function PaymentsScreen() {
  const params = useLocalSearchParams<{ filtro?: string }>();
  const { dark, colors } = useTheme();
  const { transactions, source, sourceReason, loading, open } = useReconciliation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(isFilter(params.filtro) ? params.filtro : 'todos');

  // Home shortcuts open this tab with a preset filter; adjust during render instead of an effect.
  const [lastParam, setLastParam] = useState(params.filtro);
  if (params.filtro !== lastParam) {
    setLastParam(params.filtro);
    if (isFilter(params.filtro)) setFilter(params.filtro);
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todos: transactions.length, conciliado: 0, discrepancia: 0, pendiente: 0 };
    transactions.forEach((t) => (c[t.estado] += 1));
    return c;
  }, [transactions]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return transactions.filter(
      (t) => (filter === 'todos' || t.estado === filter) && (!term || searchText(t, SERVICE_LABEL[t.servicio]).includes(term)),
    );
  }, [transactions, q, filter]);

  const total = list.reduce((a, t) => a + t.montoSistema, 0);
  const hasFilters = q.trim() !== '' || filter !== 'todos';
  const clearAll = () => {
    setQ('');
    setFilter('todos');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenTop />
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ padding: 18, paddingBottom: 10, gap: 12 }}>
            <View>
              <Text accessibilityRole="header" style={[s.h1, { color: colors.text1 }]}>
                Pagos
              </Text>
              <Text style={[s.sub, { color: colors.text2 }]}>Toca un pago para ver su detalle o conciliarlo.</Text>
            </View>
            {source === 'demo' ? (
              <Notice
                tone={sourceReason?.startsWith('Vista previa') ? 'info' : 'warning'}
                text={sourceReason || 'Conectando con el servidor: se muestran pagos de demostración mientras reconecta.'}
              />
            ) : null}
            <SearchField
              value={q}
              onChangeText={setQ}
              label="Buscar pagos"
              hint="Busca por folio, ciudadano, concepto o banco"
              placeholder="Folio, ciudadano o banco"
            />
            <View style={s.chips} accessibilityRole="tablist">
              {FILTERS.map((f) => {
                const on = filter === f.id;
                const activeFg = dark ? '#0B1220' : '#FFFFFF';
                return (
                  <Pressable
                    key={f.id}
                    accessibilityRole="tab"
                    accessibilityLabel={`${f.label}, ${counts[f.id]}`}
                    accessibilityState={{ selected: on }}
                    onPress={() => setFilter(f.id)}
                    style={[
                      s.chip,
                      {
                        backgroundColor: on ? colors.blue : colors.white,
                        borderColor: on ? colors.blue : colors.inputBorder,
                        borderBottomColor: on ? (dark ? colors.blueMid : colors.navy) : colors.inputBorder,
                      },
                    ]}>
                    <Text style={[s.chipText, { color: on ? activeFg : colors.blue }]}>{f.label}</Text>
                    <View
                      style={[
                        s.count,
                        { backgroundColor: on ? (dark ? 'rgba(11,18,32,0.22)' : 'rgba(255,255,255,0.22)') : colors.blueSoft },
                      ]}>
                      <Text style={[s.countText, { color: on ? activeFg : colors.blue }]}>{counts[f.id]}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.resultRow}>
              <Text style={[s.result, { color: colors.text2 }]} accessibilityLiveRegion="polite">
                {loading ? 'Cargando pagos…' : `${list.length} ${list.length === 1 ? 'pago' : 'pagos'} · ${fmtMoney(total)}`}
                {filter !== 'todos' ? ` · ${STATUS_CFG[filter].label}` : ''}
              </Text>
              {hasFilters ? (
                <Pressable accessibilityRole="button" onPress={clearAll} style={s.clearAll}>
                  <Text style={[s.clearAllText, { color: colors.blue }]}>Limpiar filtros</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? undefined : (
            <EmptyState
              title="No encontramos pagos"
              body={q ? `Ningún pago coincide con “${q.trim()}” en este filtro.` : 'No hay pagos con este estado.'}
              actionLabel={hasFilters ? 'Limpiar búsqueda y filtros' : undefined}
              onAction={clearAll}
            />
          )
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              s.itemWrap,
              { backgroundColor: colors.white, borderColor: colors.border },
              index === 0 && s.first,
              index === list.length - 1 && s.last,
            ]}>
            <TransactionRow tx={item} last={index === list.length - 1} onPress={() => open(item)} />
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: TOUCH, paddingHorizontal: 12, borderRadius: RADIUS, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder, borderBottomWidth: ACCENT_BAR, borderBottomColor: C.inputBorder },
  chipOn: { backgroundColor: C.blue, borderColor: C.blue, borderBottomColor: C.navy },
  chipText: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.blue },
  count: { minWidth: 22, paddingHorizontal: 5, height: 20, borderRadius: RADIUS, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: FONT.sansBold, fontSize: 12, color: C.blue },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', minHeight: TOUCH },
  result: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text2 },
  clearAll: { minHeight: TOUCH, justifyContent: 'center' },
  clearAllText: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
  itemWrap: { backgroundColor: C.white, marginHorizontal: 18, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border, overflow: 'hidden' },
  first: { borderTopWidth: 1 },
  last: { borderBottomWidth: 1 },
});

