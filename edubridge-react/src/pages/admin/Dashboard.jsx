import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Activity, ArrowRight, BarChart3, ClipboardList, Download, FileCheck2, GraduationCap, KeyRound,
  Send, Settings2, ShieldCheck, Trophy, UserPlus,
} from 'lucide-react';
import { Button, Card, EmptyState, PageHeader, ProgressBar, ProgressRing, StatCard, Tabs } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { adminService } from '@/services/dataService';
import {
  ChartEmpty, ChartLegend, ChartSkeleton, ChartTooltip, Donut, GOLD, NAVY, RankedBarChart, STATUS_COLORS, useChartAxes,
} from './AdminCharts';
import './admin.css';

// سجل النشاط (عرض تجريبي حتى يتوفر مسار سجل التدقيق في الـ API)
const ACTIVITY = [
  { key: 'newAdvisor', icon: UserPlus, tone: 'gold', time: ['minutesAgo', 4] },
  { key: 'batchApproved', icon: FileCheck2, tone: 'green', time: ['minutesAgo', 18] },
  { key: 'securityAudit', icon: ShieldCheck, tone: 'navy', time: ['hoursAgo', 1] },
  { key: 'roleChanged', icon: KeyRound, tone: 'info', time: ['hoursAgo', 2] },
  { key: 'reportExported', icon: Send, tone: 'navy', time: ['hoursAgo', 3] },
  { key: 'settingUpdated', icon: Settings2, tone: 'gold', time: ['daysAgo', 1] },
];

const growth = (list, key) => {
  if (!list || list.length < 2) return null;
  const prev = list[list.length - 2][key];
  const last = list[list.length - 1][key];
  return prev ? ((last - prev) / prev) * 100 : null;
};

export default function AdminDashboard() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { loc, fmtNum } = useLocalized();
  const ax = useChartAxes();
  const toast = useToast();
  const [chartType, setChartType] = useState('area');

  const { data, loading } = useAsync(() => adminService.stats(), []);

  const monthly = useMemo(() => (data?.monthly || []).map((m) => ({ ...m, label: loc(m, 'month') })), [data, loc]);
  const countries = useMemo(() => (data?.countries || []).map((c) => ({ label: tc(`countries.${c.key}`), value: c.value })), [data, tc]);
  const statuses = useMemo(() => (data?.statuses || []).map((s) => ({ key: s.key, label: tc(`status.${s.key}`), value: s.value, color: STATUS_COLORS[s.key] || NAVY })), [data, tc]);
  const workload = useMemo(() => (data?.workload || []).map((w) => ({ ...w, label: loc(w, 'name').split(' ')[0] })), [data, loc]);
  const services = data?.services || [];
  const statusTotal = statuses.reduce((n, s) => n + s.value, 0);
  const servicesMax = Math.max(1, ...services.map((s) => s.value));
  const count = (k) => data?.statuses?.find((s) => s.key === k)?.value ?? 0;

  const pct = (v) => (v == null ? undefined : t('dashboard.trend', { value: `\u2066${v >= 0 ? '+' : ''}${v.toFixed(1)}%\u2069` }));
  const totals = data?.totals;
  const dash = '–';

  const series = [
    { key: 'students', label: t('charts.students'), color: NAVY },
    { key: 'applications', label: t('charts.applications'), color: GOLD },
  ];

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.subtitle')}
        actions={<>
          <Button variant="outline" icon={Download} onClick={() => toast(tc('toast.exported'))}>{t('dashboard.exportReport')}</Button>
          <Button icon={BarChart3} to="/admin/reports">{t('dashboard.openReports')}</Button>
        </>}
      />

      <div className="grid grid-4 adm-kpis fade-up">
        <StatCard icon={GraduationCap} label={t('kpi.students')} value={totals ? fmtNum(totals.students) : dash} trend={pct(growth(data?.monthly, 'students'))} />
        <StatCard icon={ClipboardList} tone="gold" label={t('kpi.requests')} value={totals ? fmtNum(totals.requests) : dash} trend={data ? t('kpi.requestsHint', { count: services.length }) : undefined} />
        <StatCard icon={FileCheck2} label={t('kpi.applications')} value={totals ? fmtNum(totals.applications) : dash} trend={pct(growth(data?.monthly, 'applications'))} />
        <StatCard icon={Trophy} tone="green" label={t('kpi.acceptance')} value={totals ? `${totals.acceptance}%` : dash} trend={data ? t('kpi.acceptedHint', { count: fmtNum(count('accepted')) }) : undefined} />
      </div>

      <div className="adm-split">
        <Card
          accent="navy"
          title={t('dashboard.trendTitle')}
          subtitle={t('dashboard.trendSub')}
          actions={<Tabs className="adm-tabs-sm" value={chartType} onChange={setChartType} items={[{ value: 'area', label: t('charts.area') }, { value: 'bar', label: t('charts.bar') }]} />}
        >
          <ChartLegend items={series} />
          {loading ? <ChartSkeleton height={280} /> : !monthly.length ? <ChartEmpty title={t('charts.noData')} /> : (
            <ResponsiveContainer className="adm-chart" width="100%" height={280}>
              {chartType === 'area' ? (
                <AreaChart data={monthly} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admGradNavy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={NAVY} stopOpacity={0.28} /><stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="admGradGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.32} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef3f8" />
                  <XAxis dataKey="label" {...ax.x} />
                  <YAxis {...ax.y} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="students" name={series[0].label} stroke={NAVY} strokeWidth={2.5} fill="url(#admGradNavy)" />
                  <Area type="monotone" dataKey="applications" name={series[1].label} stroke={GOLD} strokeWidth={2.5} fill="url(#admGradGold)" />
                </AreaChart>
              ) : (
                <BarChart data={monthly} margin={{ top: 10, right: 6, left: 6, bottom: 0 }} barGap={4}>
                  <CartesianGrid vertical={false} stroke="#eef3f8" />
                  <XAxis dataKey="label" {...ax.x} />
                  <YAxis {...ax.y} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(15,44,85,.04)' }} content={<ChartTooltip />} />
                  <Bar dataKey="students" name={series[0].label} fill={NAVY} radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="applications" name={series[1].label} fill={GOLD} radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </Card>

        <Card accent="gold" title={t('dashboard.statusTitle')} subtitle={t('dashboard.statusSub')}>
          {loading ? <ChartSkeleton height={220} /> : !statuses.length ? <ChartEmpty title={t('charts.noData')} /> : (
            <>
              <Donut rows={statuses} total={statusTotal} totalLabel={t('charts.totalApps')} />
              <ul className="adm-status-list">
                {statuses.map((s) => (
                  <li key={s.key}>
                    <i style={{ background: s.color }} />
                    <span>{s.label}</span>
                    <b>{fmtNum(s.value)}</b>
                    <small>{Math.round((s.value / statusTotal) * 100)}%</small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-3 adm-section">
        <Card title={t('dashboard.countriesTitle')} subtitle={t('dashboard.countriesSub')} actions={<Link to="/admin/reports" className="link">{tc('actions.viewAll')}</Link>}>
          {loading ? <ChartSkeleton height={230} /> : !countries.length ? <ChartEmpty title={t('charts.noData')} />
            : <RankedBarChart rows={countries} seriesName={t('charts.share')} suffix="%" />}
        </Card>

        <Card title={t('dashboard.servicesTitle')} subtitle={t('dashboard.servicesSub')} actions={<Link to="/admin/reports" className="link">{tc('actions.viewAll')}</Link>}>
          {loading ? <ChartSkeleton height={230} /> : !services.length ? <ChartEmpty title={t('charts.noData')} /> : (
            <ol className="adm-rank">
              {services.map((s, i) => (
                <li key={s.key}>
                  <span className={i === 0 ? 'adm-rank-n top' : 'adm-rank-n'}>{i + 1}</span>
                  <div className="grow">
                    <div className="row between"><b>{tc(`services.${s.key}.title`)}</b><small>{t('charts.reqCount', { count: fmtNum(s.value) })}</small></div>
                    <ProgressBar value={(s.value / servicesMax) * 100} navy={i !== 0} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title={t('dashboard.acceptanceTitle')} subtitle={t('dashboard.acceptanceSub')}>
          {loading ? <ChartSkeleton height={230} /> : !totals ? <ChartEmpty title={t('charts.noData')} /> : (
            <div className="adm-accept">
              <ProgressRing value={totals.acceptance} size={150} stroke={13} color="var(--gold-500)" label={t('charts.acceptanceRate')} />
              <div className="adm-accept-stats">
                <div><b className="ok">{fmtNum(count('accepted'))}</b><small>{tc('status.accepted')}</small></div>
                <div><b className="bad">{fmtNum(count('rejected'))}</b><small>{tc('status.rejected')}</small></div>
                <div><b>{fmtNum(count('waitingResult'))}</b><small>{tc('status.waitingResult')}</small></div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="adm-split adm-section">
        <Card accent="navy" title={t('dashboard.workloadTitle')} subtitle={t('dashboard.workloadSub', { count: workload.length })}>
          <ChartLegend items={[{ label: t('charts.activeCases'), color: GOLD }, { label: t('charts.completedCases'), color: NAVY }]} />
          {loading ? <ChartSkeleton height={260} /> : !workload.length ? <ChartEmpty title={t('charts.noData')} /> : (
            <ResponsiveContainer className="adm-chart" width="100%" height={260}>
              <BarChart data={workload} margin={{ top: 10, right: 6, left: 6, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#eef3f8" />
                <XAxis dataKey="label" {...ax.x} />
                <YAxis {...ax.y} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(15,44,85,.04)' }} content={<ChartTooltip />} />
                <Bar dataKey="active" name={t('charts.activeCases')} fill={GOLD} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="done" name={t('charts.completedCases')} fill={NAVY} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {!!workload.length && (
            <div className="adm-accept-stats adm-load-summary">
              <div><b>{fmtNum(Math.round(workload.reduce((n, w) => n + w.active, 0) / workload.length))}</b><small>{t('dashboard.avgActive')}</small></div>
              <div><b className="ok">{fmtNum(workload.reduce((n, w) => n + w.done, 0))}</b><small>{t('dashboard.totalDone')}</small></div>
              <div><b>{[...workload].sort((a, b) => b.active - a.active)[0].label}</b><small>{t('dashboard.busiest')}</small></div>
            </div>
          )}
        </Card>

        <Card
          accent="gold"
          title={t('dashboard.activityTitle')}
          subtitle={t('dashboard.activitySub')}
          actions={<Link to="/admin/users" className="link adm-link-icon">{t('dashboard.auditLog')}<ArrowRight className="flip-rtl" aria-hidden /></Link>}
        >
          {!ACTIVITY.length ? <EmptyState icon={Activity} title={t('dashboard.noActivity')} /> : (
            <div className="list adm-activity">
              {ACTIVITY.map(({ key, icon: Icon, tone, time }) => (
                <div key={key} className="list-item">
                  <span className={`adm-ico ${tone}`}><Icon aria-hidden /></span>
                  <div className="grow">
                    <b>{t(`activity.${key}.title`)}</b>
                    <small>{t(`activity.${key}.text`)}</small>
                  </div>
                  <time className="adm-time">{tc(`time.${time[0]}`, { count: time[1] })}</time>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
