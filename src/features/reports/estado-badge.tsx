import { Badge } from '@/components/ui';
import { useTheme } from '@/features/theme/theme-context';
import type { ReportEstado } from '@/types';

export function EstadoBadge({ estado }: { estado: ReportEstado }) {
  const { colors } = useTheme();
  const map: Record<ReportEstado, { bg: string; fg: string; sym: string }> = {
    Nuevo: { bg: colors.blueChip, fg: colors.blue, sym: '●' },
    Asignado: { bg: colors.blueIcon, fg: colors.blueMid, sym: '→' },
    'En proceso': { bg: colors.blueSoft, fg: colors.blue, sym: '…' },
    Resuelto: { bg: colors.successSoft, fg: colors.success, sym: '✓' },
  };
  const st = map[estado] ?? map.Nuevo;
  return <Badge label={estado} symbol={st.sym} bg={st.bg} fg={st.fg} />;
}
