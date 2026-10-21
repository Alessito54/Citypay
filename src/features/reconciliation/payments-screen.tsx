import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AdminLogo } from '@/components/brand';
import { Icon } from '@/components/icon';
import { cardShadow } from '@/components/ui';
import { C, FONT } from '@/constants/colors';
import type { Status } from '@/types';

import { fmtMoney, SERVICE_LABEL } from './format';
import { useReconciliation } from './reconciliation-context';
import { STATUS_CFG, TransactionRow } from './transaction-row';

type Filter = 'todos' | Status;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'conciliado', label: 'Cuadrados' },
  { id: 'discrepancia', label: 'Diferencias' },
  { id: 'pendiente', label: 'Pendientes' },
];

/** Transaction list with status filter + free-text search over demo data. */
export function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, resolvedIds, open } = useReconciliation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return transactions.filter((t) => {
      const estado = resolvedIds.has(t.id) ? 'conciliado' : t.estado;
      if (filter !== 'todos' && estado !== filter) return false;
      if (!term) return true;
      return `${t.folio} ${t.concepto} ${t.ciudadano} ${t.banco} ${t.referenciaBancaria} ${SERVICE_LABEL[t.servicio]}`
        .toLowerCase()
        .includes(term);
    });
  }, [transactions, resolvedIds, q, filter]);

  const total = list.reduce((a, t) => a + t.montoSistema, 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <AppHeader logo={<AdminLogo />} dot />
      </View>
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ padding: 18, paddingBottom: 10, gap: 10 }}>
            <View>
              <Text style={s.h1}>Pagos</Text>
              <Text style={s.sub}>Datos de demostración · {list.length} registros · {fmtMoney(total)}</Text>
            </View>
            <View style={s.search}>
              <Icon name="search" size={16} color={C.text3} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Buscar por folio, ciudadano o banco"
                placeholderTextColor={C.text3}
                style={s.searchInput}
                autoCorrect={false}
              />
              {q ? (
                <Pressable accessibilityLabel="Borrar búsqueda" onPress={() => setQ('')} hitSlop={8}>
                  <Icon name="xCircle" size={14} color={C.text3} />
                </Pressable>
              ) : null}
            </View>
            <View style={s.chips}>
              {FILTERS.map((f) => {
                const on = filter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setFilter(f.id)}
                    style={[s.chip, on && s.chipOn]}>
                    <Text style={[s.chipText, on && { color: '#fff' }]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={s.empty}>No hay pagos con esos filtros.</Text>}
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
  sub: { fontFamily: FONT.sans, fontSize: 12, color: C.text2, marginTop: 3 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, minWidth: 0, fontFamily: FONT.sans, fontSize: 12.5, color: C.text1, paddingVertical: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  chipOn: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { fontFamily: FONT.sansSemi, fontSize: 12, color: C.blue },
  empty: { textAlign: 'center', fontFamily: FONT.sans, fontSize: 12.5, color: C.text2, padding: 24 },
  itemWrap: { backgroundColor: C.white, marginHorizontal: 18, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border, overflow: 'hidden' },
  first: { borderTopWidth: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  last: { borderBottomWidth: 1, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, ...cardShadow },
});

export { STATUS_CFG };
