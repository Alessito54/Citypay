import { Badge } from '@/components/ui';
import type { ReportEstado } from '@/types';

import { ESTADO_STYLE } from './report-status';

export function EstadoBadge({ estado }: { estado: ReportEstado }) {
  const st = ESTADO_STYLE[estado] ?? ESTADO_STYLE.Nuevo;
  return <Badge label={estado} symbol={st.sym} bg={st.bg} fg={st.fg} />;
}
