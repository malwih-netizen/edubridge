import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Hourglass, Megaphone, Save, Trophy, XCircle } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, ProgressBar, Select, StatCard, PageHeader, Tabs } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { scholarshipService } from '@/services/dataService';
import { admissionApplicants, RESULT_STATUSES } from './data';
import { SkeletonRows, useBasePath } from './shared';
import './employee.css';

const OUTCOMES = ['waitingResult', 'accepted', 'rejected'];
const RESULT_TONE = { notStarted: undefined, inProgress: 'info', partial: 'warning', completed: 'success' };
const OUTCOME_TONE = { waitingResult: 'warning', accepted: 'success', rejected: 'danger' };

/** Suggests a results status from the applicants' outcomes. */
const suggestStatus = (apps, current) => {
  if (!apps.length) return current;
  const decided = apps.filter((a) => a.outcome !== 'waitingResult').length;
  if (decided === apps.length) return 'completed';
  if (decided > 0) return 'partial';
  return current === 'notStarted' ? current : 'inProgress';
};

export default function EmployeeAdmissions() {
  const { t } = useTranslation('employee');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, fmtNum } = useLocalized();
  const toast = useToast();
  const base = useBasePath();

  const { data, loading } = useAsync(() => scholarshipService.list(), []);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dirty, setDirty] = useState({});

  useEffect(() => {
    if (data) {
      setItems(data.map((s) => {
        const applicants = (admissionApplicants[s.id] || []).map((a) => ({ ...a }));
        return { ...s, applicants, results: suggestStatus(applicants, s.results || 'notStarted') };
      }));
    }
  }, [data]);

  const visible = useMemo(() => items.filter((s) => filter === 'all' || s.results === filter), [items, filter]);
  const allApps = items.flatMap((s) => s.applicants);
  const totals = {
    tracked: allApps.length,
    waiting: allApps.filter((a) => a.outcome === 'waitingResult').length,
    accepted: allApps.filter((a) => a.outcome === 'accepted').length,
    rejected: allApps.filter((a) => a.outcome === 'rejected').length,
  };

  const patch = (id, fn) => {
    setItems((list) => list.map((s) => (s.id === id ? fn(s) : s)));
    setDirty((d) => ({ ...d, [id]: true }));
  };
  const setResults = (id, results) => patch(id, (s) => ({ ...s, results }));
  const setOutcome = (id, studentId, outcome) => patch(id, (s) => {
    const applicants = s.applicants.map((a) => (a.studentId === studentId ? { ...a, outcome } : a));
    return { ...s, applicants, results: suggestStatus(applicants, s.results) };
  });

  const save = async (s) => {
    await scholarshipService.updateResults(s.id, s.results);
    setDirty((d) => ({ ...d, [s.id]: false }));
    toast(t('admissions.saved', { name: loc(s, 'name'), status: tc(`results.${s.results}`) }));
  };

  return (
    <>
      <PageHeader title={t('admissions.title')} description={t('admissions.subtitle')} />

      <div className="grid grid-4 emp-kpis fade-up">
        <StatCard icon={Trophy} label={t('admissions.kpi.tracked')} value={loading ? '–' : fmtNum(totals.tracked)} />
        <StatCard icon={Hourglass} tone="gold" label={t('admissions.kpi.waiting')} value={loading ? '–' : fmtNum(totals.waiting)} />
        <StatCard icon={CheckCircle2} tone="green" label={t('admissions.kpi.accepted')} value={loading ? '–' : fmtNum(totals.accepted)} />
        <StatCard icon={XCircle} tone="red" label={t('admissions.kpi.rejected')} value={loading ? '–' : fmtNum(totals.rejected)} />
      </div>

      <div className="emp-tabs-row emp-section">
        <Tabs value={filter} onChange={setFilter} items={[
          { value: 'all', label: t('admissions.all'), count: items.length },
          ...RESULT_STATUSES.map((r) => ({ value: r, label: tc(`results.${r}`), count: items.filter((s) => s.results === r).length })),
        ]} />
      </div>

      {loading ? <SkeletonRows rows={3} height={180} /> : visible.length ? (
        <div className="emp-adm-grid">
          {visible.map((s) => {
            const decided = s.applicants.filter((a) => a.outcome !== 'waitingResult').length;
            const pct = s.applicants.length ? Math.round((decided / s.applicants.length) * 100) : 0;
            return (
              <Card key={s.id} className="emp-adm-card"
                title={loc(s, 'name')}
                subtitle={`${loc(s, 'university')} · ${tc(`countries.${s.country}`)} · ${tc('time.deadline')}: ${fmtDate(s.deadline)}`}
                actions={<Badge tone={RESULT_TONE[s.results]} icon={Megaphone}>{tc(`results.${s.results}`)}</Badge>}>
                <div className="emp-adm-progress">
                  <div className="row between">
                    <small>{t('admissions.announced', { done: decided, total: s.applicants.length })}</small>
                    <b>{pct}%</b>
                  </div>
                  <ProgressBar value={pct} navy={s.results === 'completed'} />
                </div>

                <div className="emp-adm-steps" aria-label={t('admissions.statusLabel')}>
                  {RESULT_STATUSES.map((r, i) => {
                    const cur = RESULT_STATUSES.indexOf(s.results);
                    return (
                      <button key={r} type="button" className={i < cur ? 'done' : i === cur ? 'on' : undefined} aria-pressed={i === cur} onClick={() => setResults(s.id, r)}>
                        <span>{i + 1}</span>{tc(`results.${r}`)}
                      </button>
                    );
                  })}
                </div>

                {s.applicants.length ? (
                  <ul className="emp-adm-list">
                    {s.applicants.map((a) => (
                      <li key={a.studentId}>
                        <Link to={`${base}/students/${a.studentId}`} className="emp-person"><Avatar name={a.name} size="sm" /><b>{loc(a, 'name')}</b></Link>
                        <Select value={a.outcome} onChange={(e) => setOutcome(s.id, a.studentId, e.target.value)}
                          className={`emp-inline-select o-${OUTCOME_TONE[a.outcome]}`} aria-label={t('admissions.outcome')}
                          options={OUTCOMES.map((o) => ({ value: o, label: tc(`status.${o}`) }))} />
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted emp-adm-none">{t('admissions.noApplicants')}</p>}

                <div className="row between emp-adm-foot">
                  <small className="text-muted">{dirty[s.id] ? t('admissions.unsaved') : t('admissions.upToDate')}</small>
                  <Button size="sm" icon={Save} variant={dirty[s.id] ? 'gold' : 'outline'} disabled={!dirty[s.id]} onClick={() => save(s)}>{tc('actions.update')}</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <Card><EmptyState icon={Trophy} title={t('admissions.empty')} text={tc('empty.text')} /></Card>}
    </>
  );
}
