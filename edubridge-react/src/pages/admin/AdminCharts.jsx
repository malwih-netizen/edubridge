// عناصر الرسوم البيانية المشتركة لصفحات الإدارة (لوحة التحكم + التقارير).
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { useLocalized } from '@/hooks';

export const PALETTE = ['#0f2c55', '#c9952d', '#e0b354', '#24508a', '#95a5b9', '#173a6b'];
export const NAVY = '#0f2c55';
export const GOLD = '#c9952d';
export const STATUS_COLORS = {
  newRequest: '#e0b354',
  preparingDocuments: '#24508a',
  submitted: '#0f2c55',
  waitingResult: '#95a5b9',
  accepted: '#c9952d',
  rejected: '#c2413b',
};

const AXIS_TICK = { fill: '#6b7f98', fontSize: 12 };

/** Axis props that mirror the chart in Arabic (RTL). */
export function useChartAxes() {
  const { isAr } = useLocalized();
  return {
    isAr,
    x: { reversed: isAr, tick: AXIS_TICK, tickLine: false, axisLine: { stroke: '#e3eaf2' } },
    y: { orientation: isAr ? 'right' : 'left', tick: AXIS_TICK, tickLine: false, axisLine: false, width: 44 },
  };
}

/** Tooltip body — series names come from each <Bar/Area name={t(...)} />, so they are already translated. */
export function ChartTooltip({ active, payload, label, suffix = '' }) {
  const { fmtNum } = useLocalized();
  if (!active || !payload?.length) return null;
  return (
    <div className="adm-tooltip">
      {label != null && label !== '' && <b>{label}</b>}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="adm-tooltip-row">
          <i style={{ background: p.payload?.color || p.color || p.fill || NAVY }} />
          <span>{p.name}</span>
          <strong>{fmtNum(p.value)}{suffix}</strong>
        </div>
      ))}
    </div>
  );
}

/** HTML legend (keeps text direction correct in Arabic). */
export function ChartLegend({ items }) {
  return (
    <ul className="adm-legend">
      {items.map((it) => (
        <li key={it.label}><i style={{ background: it.color }} />{it.label}</li>
      ))}
    </ul>
  );
}

export function ChartSkeleton({ height = 260 }) {
  return <div className="adm-skeleton" style={{ height }} aria-hidden />;
}

export function ChartEmpty({ title }) {
  return <EmptyState icon={BarChart3} title={title} />;
}

/** Horizontal ranked bars — rows: [{ label, value }]. */
export function RankedBarChart({ rows, color = NAVY, height, seriesName, suffix = '' }) {
  const ax = useChartAxes();
  const h = height || Math.max(180, rows.length * 44);
  return (
    <ResponsiveContainer className="adm-chart" width="100%" height={h}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke="#eef3f8" />
        <XAxis type="number" {...ax.x} allowDecimals={false} tickFormatter={(v) => `${v}${suffix}`} />
        <YAxis type="category" dataKey="label" {...ax.y} width={112} />
        <Tooltip cursor={{ fill: 'rgba(15,44,85,.04)' }} content={<ChartTooltip suffix={suffix} />} />
        <Bar dataKey="value" name={seriesName} radius={ax.isAr ? [6, 0, 0, 6] : [0, 6, 6, 0]} maxBarSize={22}>
          {rows.map((r, i) => <Cell key={r.label} fill={i === 0 ? GOLD : color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut with total in the centre — rows: [{ key, label, value, color }]. */
export function Donut({ rows, total, totalLabel, height = 220 }) {
  const { fmtNum } = useLocalized();
  return (
    <div className="adm-donut" style={{ height }}>
      <ResponsiveContainer className="adm-chart" width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
            {rows.map((r) => <Cell key={r.key} fill={r.color} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="adm-donut-center">
        <b>{fmtNum(total)}</b>
        <small>{totalLabel}</small>
      </div>
    </div>
  );
}
