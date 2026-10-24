import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo } from '@/components/brand';
import { Icon } from '@/components/icon';
import { cardShadow, EmptyState } from '@/components/ui';
import { C, FONT, TOUCH } from '@/constants/colors';
import type { Status } from '@/types';

import { fmtMoney, SERVICE_LABEL } from './format';
import { useReconciliation } from './reconciliation-context';
import { STATUS_CFG, TransactionRow } from './transaction-row';

type Filter = 'todos' | Status;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'discrepancia', label: 'Diferencias' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'conciliado', label: 'Cuadrados' },
];

const isFilter = (v: unknown): v is Filter => FILTERS.some((f) => f.id === v);

/** Transaction list with status filter + free-text search over demo data. */
export function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filtro?: string }>();
  const { transactions, resolvedIds, open } = useReconciliation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(isFilter(params.filtro) ? params.filtro : 'todos');

  // Shortcuts on the home screen open this tab with a preset filter. Adjusting state
  // during render when the param changes avoids an extra effect pass.
  const [lastParam, setLastParam] = useState(params.filtro);
  if (params.filtro !== lastParam) {
    setLastParam(params.filtro);
    if (isFilter(params.filtro)) setFilter(params.filtro);
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todos: transactions.length, conciliado: 0, discrepancia: 0, pendiente: 0 };
    transactions.forEach((t) => (c[resolvedIds.has(t.id) ? 'conciliado' : t.estado] += 1));
    return c;
  }, [transactions, resolvedIds]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return transactions.filter((t) => {
      const estado: Status = resolvedIds.has(t.id) ? 'conciliado' : t.estado;
      if (filter !== 'todos' && estado !== filter) return false;
      if (!term) return true;
      return `${t.folio} ${t.concepto} ${t.ciudadano} ${t.banco} ${t.referenciaBancaria} ${SERVICE_LABEL[t.servicio]}`
        .toLowerCase()
        .includes(term);
    });
  }, [transactions, resolvedIds, q, filter]);

  const total = list.reduce((a, t) => a + t.montoSistema, 0);
  const hasFilters = q.trim() !== '' || filter !== 'todos';
  const clearAll = () => {
    setQ('');
    setFilter('todos');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<AdminLogo />} dot />
      </View>
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ padding: 18, paddingBottom: 10, gap: 12 }}>
            <View>
              <Text accessibilityRole="header" style={s.h1}>
                Pagos
              </Text>
              <Text style={s.sub}>Toca un pago para ver su detalle o conciliarlo.</Text>
            </View>
            <View style={s.search}>
              <Icon name="search" size={18} color={C.text2} />
              <TextInput
                value={q}
                onChangeText={setQ}
                accessibilityLabel="Buscar pagos"
                accessibilityHint="Busca por folio, ciudadano, concepto o banco"
                placeholder="Folio, ciudadano o banco"
                placeholderTextColor={C.text3}
                style={s.searchInput}
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="never"
              />
              {q ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => setQ('')} style={s.clear}>
                  <Icon name="xCircle" size={18} color={C.text2} />
                </Pressable>
              ) : null}
            </View>
            <View style={s.chips} accessibilityRole="tablist">
              {FILTERS.map((f) => {
                const on = filter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    accessibilityRole="tab"
                    accessibilityLabel={`${f.label}, ${counts[f.id]}`}
                    accessibilityState={{ selected: on }}
                    onPress={() => setFilter(f.id)}
                    style={[s.chip, on && s.chipOn]}>
                    {on ? <Icon name="check" size={14} color="#fff" strokeWidth={2.6} /> : null}
                    <Text style={[s.chipText, on && { color: '#fff' }]}>{f.label}</Text>
                    <View style={[s.chipCount, on && { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                      <Text style={[s.chipCountText, on && { color: '#fff' }]}>{counts[f.id]}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.resultRow}>
              <Text style={s.result} accessibilityLiveRegion="polite">
                {list.length} {list.length === 1 ? 'pago' : 'pagos'} · {fmtMoney(total)}
                {filter !== 'todos' ? ` · ${STATUS_CFG[filter].label}` : ''}
              </Text>
              {hasFilters ? (
                <Pressable accessibilityRole="button" onPress={clearAll} style={s.clearAll}>
                  <Text style={s.clearAllText}>Limpiar filtros</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No encontramos pagos"
            body={q ? `Ningún pago coincide con “${q.trim()}” en este filtro.` : 'No hay pagos con este estado.'}
            actionLabel="Limpiar búsqueda y filtros"
            onAction={clearAll}
          />
        }
        renderItem={({ item, index }) => (
          <View style={[s.itemWrap, index === 0 && s.first, index === list.length - 1 && s.last]}>
            <TransactionRow tx={item} resolved={resolvedIds.has(item.id)} last={index === list.length - 1} onPress={() => open(item)} />
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: FONT.displayXBold, fontSize: 26, color: C.navy },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.text2, marginTop: 3 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingLeft: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder },
  searchInput: { flex: 1, minWidth: 0, minHeight: 46, fontFamily: FONT.sans, fontSize: 16, color: C.text1, paddingVertical: 0 },
  clear: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.inputBorder },
  chipOn: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.blue },
  chipCount: { minWidth: 22, paddingHorizontal: 5, height: 20, borderRadius: 10, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  chipCountText: { fontFamily: FONT.sansBold, fontSize: 12, color: C.blue },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  result: { fontFamily: FONT.sansSemi, fontSize: 13, color: C.text2 },
  clearAll: { minHeight: TOUCH, justifyContent: 'center' },
  clearAllText: { fontFamily: FONT.sansSemi, fontSize: 14, color: C.blue, textDecorationLine: 'underline' },
  itemWrap: { backgroundColor: C.white, marginHorizontal: 18, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border, overflow: 'hidden' },
  first: { borderTopWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  last: { borderBottomWidth: 1, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, ...cardShadow },
});

export { STATUS_CFG };
