import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  CalendarRange, ClipboardList, Download, FileCheck2, FileSpreadsheet, FileText, Globe, GraduationCap, Trophy, Users,
} from 'lucide-react';
import { Avatar, Button, Card, IconButton, PageHeader, ProgressBar, ProgressRing, Select, StatCard, Tabs } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { adminService } from '@/services/dataService';
import {
  ChartEmpty, ChartLegend, ChartSkeleton, ChartTooltip, Donut, GOLD, NAVY, RankedBarChart, STATUS_COLORS, useChartAxes,
} from './AdminCharts';
import './admin.css';

export default function AdminReports() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { loc, fmtNum } = useLocalized();
  const ax = useChartAxes();
  const toast = useToast();

  const { data, loading } = useAsync(() => adminService.stats(), []);
  const months = data?.monthly || [];
  const last = Math.max(0, months.length - 1);

  const [preset, setPreset] = useState('all');
  const [range, setRange] = useState(null); // { from, to } indexes into monthly; null = whole period
  const from = range ? range.from : preset === '3m' ? Math.max(0, last - 2) : 0;
  const to = range ? range.to : last;

  const choosePreset = (p) => { setPreset(p); setRange(null); };
  const setBound = (k) => (e) => {
    const v = Number(e.target.value);
    const next = { from, to, [k]: v };
    if (next.from > next.to) { if (k === 'from') next.to = v; else next.from = v; }
    setPreset('custom');
    setRange(next);
  };

  // كل الأرقام تُحسب للفترة المختارة؛ التوزيعات تُقاس بنسبة حجم الفترة إلى إجمالي البيانات.
  const r = useMemo(() => {
    if (!data) return null;
    const slice = months.slice(from, to + 1).map((m) => ({ ...m, label: loc(m, 'month') }));
    const sum = (list, k) => list.reduce((n, x) => n + x[k], 0);
    const ratio = sum(months, 'applications') ? sum(slice, 'applications') / sum(months, 'applications') : 1;
    const scale = (list) => list.map((x) => ({ ...x, value: Math.max(0, Math.round(x.value * ratio)) }));
    const statuses = scale(data.statuses).map((s) => ({ ...s, label: tc(`status.${s.key}`), color: STATUS_COLORS[s.key] || NAVY }));
    const services = scale(data.services).map((s) => ({ ...s, label: tc(`services.${s.key}.title`) }));
    const countries = data.countries.map((c) => ({ ...c, label: tc(`countries.${c.key}`) }));
    const workload = data.workload.map((w) => ({ ...w, label: loc(w, 'name').split(' ')[0], done: Math.round(w.done * ratio) }));
    const val = (k) => statuses.find((s) => s.key === k)?.value ?? 0;
    const decided = val('accepted') + val('rejected');
    return {
      monthly: slice,
      students: sum(slice, 'students'),
      applications: sum(slice, 'applications'),
      requests: services.reduce((n, s) => n + s.value, 0),
      statuses,
      statusTotal: statuses.reduce((n, s) => n + s.value, 0),
      services,
      countries,
      workload,
      accepted: val('accepted'),
      rejected: val('rejected'),
      awaiting: val('waitingResult'),
      decided,
      acceptance: decided ? Math.round((val('accepted') / decided) * 100) : 0,
    };
  }, [data, months, from, to, loc, tc]);

  const periodLabel = months.length ? t('reports.period', { from: loc(months[from], 'month'), to: loc(months[to], 'month') }) : '';
  const monthOptions = months.map((m, i) => ({ value: String(i), label: loc(m, 'month') }));
  const exportAll = (fmt) => toast(t('reports.toast.exportAll', { format: fmt }));
  const exportOne = (key) => toast(t('reports.toast.exportOne', { name: t(`reports.cards.${key}.title`) }));
  const exportBtn = (key) => <IconButton icon={Download} label={t('reports.exportCsv')} onClick={() => exportOne(key)} />;

  const decidedChart = r ? [
    { key: 'accepted', label: tc('status.accepted'), value: r.accepted, color: GOLD },
    { key: 'rejected', label: tc('status.rejected'), value: r.rejected, color: '#c2413b' },
    { key: 'waitingResult', label: tc('status.waitingResult'), value: r.awaiting, color: '#95a5b9' },
  ] : [];
  const maxLoad = r ? Math.max(1, ...r.workload.map((w) => w.active)) : 1;

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.subtitle')}
        actions={<>
          <Button variant="outline" icon={FileSpreadsheet} onClick={() => exportAll('Excel')}>{t('reports.exportExcel')}</Button>
          <Button icon={FileText} onClick={() => exportAll('PDF')}>{t('reports.exportPdf')}</Button>
        </>}
      />

      <Card className="adm-range fade-up" pad={false}>
        <div className="adm-range-inner">
          <div className="adm-range-label"><CalendarRange aria-hidden /><div><b>{t('reports.range')}</b><small>{loading ? t('users.loading') : periodLabel}</small></div></div>
          <Tabs value={preset} onChange={choosePreset} items={[
            { value: '3m', label: t('reports.presets.3m') },
            { value: 'all', label: t('reports.presets.all') },
            ...(preset === 'custom' ? [{ value: 'custom', label: t('reports.presets.custom') }] : []),
          ]} />
          <div className="adm-range-pickers">
            <label><span>{t('reports.from')}</span><Select value={String(from)} onChange={setBound('from')} options={monthOptions} disabled={loading} /></label>
            <label><span>{t('reports.to')}</span><Select value={String(to)} onChange={setBound('to')} options={monthOptions} disabled={loading} /></label>
          </div>
        </div>
      </Card>

      <div className="grid grid-4 adm-kpis adm-section">
        <StatCard icon={GraduationCap} label={t('reports.kpi.students')} value={r ? fmtNum(r.students) : '–'} trend={r ? periodLabel : undefined} />
        <StatCard icon={ClipboardList} tone="gold" label={t('reports.kpi.requests')} value={r ? fmtNum(r.requests) : '–'} trend={r ? periodLabel : undefined} />
        <StatCard icon={FileCheck2} label={t('reports.kpi.applications')} value={r ? fmtNum(r.applications) : '–'} trend={r ? periodLabel : undefined} />
        <StatCard icon={Trophy} tone="green" label={t('reports.kpi.acceptance')} value={r ? `${r.acceptance}%` : '–'} trend={r ? t('reports.kpi.decided', { count: fmtNum(r.decided) }) : undefined} />
      </div>

      <div className="grid grid-2 adm-section">
        <Card accent="navy" title={t('reports.cards.volume.title')} subtitle={t('reports.cards.volume.sub')} actions={exportBtn('volume')}>
          <ChartLegend items={[{ label: t('charts.students'), color: NAVY }, { label: t('charts.applications'), color: GOLD }]} />
          {!r ? <ChartSkeleton /> : !r.monthly.length ? <ChartEmpty title={t('charts.noData')} /> : (
            <ResponsiveContainer className="adm-chart" width="100%" height={260}>
              <BarChart data={r.monthly} margin={{ top: 10, right: 6, left: 6, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#eef3f8" />
                <XAxis dataKey="label" {...ax.x} />
                <YAxis {...ax.y} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(15,44,85,.04)' }} content={<ChartTooltip />} />
                <Bar dataKey="students" name={t('charts.students')} fill={NAVY} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="applications" name={t('charts.applications')} fill={GOLD} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card accent="gold" title={t('reports.cards.statuses.title')} subtitle={t('reports.cards.statuses.sub')} actions={exportBtn('statuses')}>
          {!r ? <ChartSkeleton /> : !r.statusTotal ? <ChartEmpty title={t('charts.noData')} /> : (
            <div className="adm-donut-row">
              <Donut rows={r.statuses} total={r.statusTotal} totalLabel={t('charts.totalApps')} height={230} />
              <table className="table adm-mini-table">
                <thead><tr><th>{t('reports.status')}</th><th>{t('reports.count')}</th><th>{t('reports.share')}</th></tr></thead>
                <tbody>
                  {r.statuses.map((s) => (
                    <tr key={s.key}>
                      <td><span className="adm-dot" style={{ background: s.color }} />{s.label}</td>
                      <td>{fmtNum(s.value)}</td>
                      <td>{Math.round((s.value / r.statusTotal) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={t('reports.cards.countries.title')} subtitle={t('reports.cards.countries.sub')} actions={exportBtn('countries')}>
          <div className="adm-card-kicker"><Globe aria-hidden />{t('reports.topItem', { name: r?.countries[0]?.label || '–' })}</div>
          {!r ? <ChartSkeleton /> : !r.countries.length ? <ChartEmpty title={t('charts.noData')} />
            : <RankedBarChart rows={r.countries} seriesName={t('charts.share')} suffix="%" />}
        </Card>

        <Card title={t('reports.cards.services.title')} subtitle={t('reports.cards.services.sub')} actions={exportBtn('services')}>
          <div className="adm-card-kicker"><ClipboardList aria-hidden />{t('reports.topItem', { name: r?.services[0]?.label || '–' })}</div>
          {!r ? <ChartSkeleton /> : !r.services.length ? <ChartEmpty title={t('charts.noData')} />
            : <RankedBarChart rows={r.services} color="#24508a" seriesName={t('charts.requests')} />}
        </Card>

        <Card accent="gold" title={t('reports.cards.acceptance.title')} subtitle={t('reports.cards.acceptance.sub')} actions={exportBtn('acceptance')}>
          {!r ? <ChartSkeleton /> : !r.decided && !r.awaiting ? <ChartEmpty title={t('charts.noData')} /> : (
            <div className="adm-accept wide">
              <ProgressRing value={r.acceptance} size={140} stroke={12} color="var(--gold-500)" label={t('charts.acceptanceRate')} />
              <div className="adm-accept-chart">
                <ResponsiveContainer className="adm-chart" width="100%" height={200}>
                  <BarChart data={decidedChart} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#eef3f8" />
                    <XAxis dataKey="label" {...ax.x} interval={0} />
                    <YAxis {...ax.y} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(15,44,85,.04)' }} content={<ChartTooltip />} />
                    <Bar dataKey="value" name={t('reports.count')} radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {decidedChart.map((d) => <Cell key={d.key} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        <Card accent="navy" title={t('reports.cards.workload.title')} subtitle={t('reports.cards.workload.sub')} actions={exportBtn('workload')}>
          {!r ? <ChartSkeleton /> : !r.workload.length ? <ChartEmpty title={t('charts.noData')} /> : (
            <div className="list">
              {r.workload.map((w, i) => (
                <div key={w.name} className="list-item adm-load">
                  <Avatar name={w.name} gold={i === 0} size="sm" />
                  <div className="grow">
                    <div className="row between">
                      <b>{loc(w, 'name')}</b>
                      <small>{t('reports.loadLine', { active: fmtNum(w.active), done: fmtNum(w.done) })}</small>
                    </div>
                    <ProgressBar value={(w.active / maxLoad) * 100} navy={i !== 0} />
                  </div>
                  <span className={i === 0 ? 'adm-load-pill top' : 'adm-load-pill'}>
                    <Users aria-hidden />{fmtNum(w.active)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
