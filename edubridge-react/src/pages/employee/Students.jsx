import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Download, Search, Users } from 'lucide-react';
import { Avatar, Button, Card, EmptyState, Input, PageHeader, Select } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { crmService } from '@/services/dataService';
import { STAGES } from '@/services/mockData';
import { advisorAr, ASSIGNMENTS, CURRENT_ADVISOR } from './data';
import { PriorityBadge, ReadinessCell, SkeletonRows, StageBadge, useBasePath } from './shared';
import './employee.css';

const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function EmployeeStudents() {
  const { t } = useTranslation('employee');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, isAr } = useLocalized();
  const toast = useToast();
  const base = useBasePath();
  const [params, setParams] = useSearchParams();

  const { data, loading } = useAsync(() => crmService.students(), []);
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('');
  const [country, setCountry] = useState('');
  const [scope, setScope] = useState('all');
  const [sort, setSort] = useState('priority');
  const stage = params.get('stage') ?? '';

  const setStage = (v) => {
    const next = new URLSearchParams(params);
    if (v === '') next.delete('stage'); else next.set('stage', v);
    setParams(next, { replace: true });
  };

  const students = data || [];
  const countries = [...new Set(students.map((s) => s.country))];

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return students
      .filter((s) => !term || [s.name, s.nameAr, s.email].some((v) => v?.toLowerCase().includes(term)))
      .filter((s) => stage === '' || String(s.stage) === stage)
      .filter((s) => !priority || s.priority === priority)
      .filter((s) => !country || s.country === country)
      .filter((s) => scope === 'all' || (ASSIGNMENTS[s.id] || CURRENT_ADVISOR) === CURRENT_ADVISOR)
      .sort((a, b) => {
        if (sort === 'readiness') return b.readiness - a.readiness;
        if (sort === 'lastContact') return new Date(b.lastContact) - new Date(a.lastContact);
        if (sort === 'name') return loc(a, 'name').localeCompare(loc(b, 'name'));
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      });
  }, [students, q, stage, priority, country, scope, sort, loc]);

  const hasFilters = q || stage !== '' || priority || country || scope !== 'all';
  const clear = () => { setQ(''); setStage(''); setPriority(''); setCountry(''); setScope('all'); };

  return (
    <>
      <PageHeader
        title={t('students.title')}
        description={t('students.subtitle')}
        actions={<Button variant="outline" icon={Download} onClick={() => toast(tc('toast.exported'))}>{tc('actions.export')}</Button>}
      />

      <div className="emp-stage-strip fade-up" role="tablist" aria-label={t('common.stage')}>
        <button type="button" className={stage === '' ? 'on' : undefined} onClick={() => setStage('')}>
          <b>{students.length}</b><span>{t('students.allStages')}</span>
        </button>
        {STAGES.map((k, i) => (
          <button key={k} type="button" className={stage === String(i) ? 'on' : undefined} onClick={() => setStage(String(i))}>
            <b>{students.filter((s) => s.stage === i).length}</b><span>{tc(`status.${k}`)}</span>
          </button>
        ))}
      </div>

      <Card pad={false} className="emp-section">
        <div className="emp-filters">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('students.search')} aria-label={tc('actions.search')} className="emp-search" />
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} placeholder={t('students.anyPriority')} aria-label={t('common.priority')}
            options={PRIORITIES.map((p) => ({ value: p, label: tc(`priority.${p}`) }))} />
          <Select value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('students.anyCountry')} aria-label={t('common.country')}
            options={countries.map((c) => ({ value: c, label: tc(`countries.${c}`) }))} />
          <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('students.sortBy')}
            options={['priority', 'readiness', 'lastContact', 'name'].map((v) => ({ value: v, label: t(`students.sort.${v}`) }))} />
          <div className="chips">
            {['all', 'mine'].map((v) => (
              <button key={v} type="button" className={`chip${scope === v ? ' on' : ''}`} onClick={() => setScope(v)}>{t(`students.scope.${v}`)}</button>
            ))}
          </div>
          {hasFilters && <button type="button" className="link emp-clear" onClick={clear}>{tc('actions.clear')}</button>}
        </div>

        {loading ? <div className="card-body"><SkeletonRows rows={5} /></div> : rows.length ? (
          <div className="table-wrap">
            <table className="table emp-table">
              <thead>
                <tr>
                  <th>{t('common.student')}</th>
                  <th>{t('common.country')}</th>
                  <th>{t('common.program')}</th>
                  <th>{t('common.gpa')}</th>
                  <th style={{ minWidth: 150 }}>{t('common.readiness')}</th>
                  <th>{t('common.stage')}</th>
                  <th>{t('common.priority')}</th>
                  <th>{t('common.advisor')}</th>
                  <th>{t('students.lastContact')}</th>
                  <th aria-label={tc('actions.view')} />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const advisor = ASSIGNMENTS[s.id] || CURRENT_ADVISOR;
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link to={`${base}/students/${s.id}`} className="emp-person">
                          <Avatar name={s.name} size="sm" />
                          <span><b>{loc(s, 'name')}</b><small className="ltr-num">{s.email}</small></span>
                        </Link>
                      </td>
                      <td>{tc(`countries.${s.country}`)}</td>
                      <td><span className="emp-two-line"><b>{tc(`levels.${s.level}`)}</b><small>{tc(`fields.${s.field}`)}</small></span></td>
                      <td className="ltr-num">{s.gpa.toFixed(2)}</td>
                      <td><ReadinessCell value={s.readiness} /></td>
                      <td><StageBadge stage={s.stage} result={s.result} /></td>
                      <td><PriorityBadge value={s.priority} /></td>
                      <td className="nowrap">{isAr ? advisorAr(advisor) : advisor}</td>
                      <td className="nowrap">{fmtDate(s.lastContact)}</td>
                      <td>
                        <Link to={`${base}/students/${s.id}`} className="icon-btn emp-row-go" aria-label={tc('actions.viewDetails')} title={tc('actions.viewDetails')}>
                          <ChevronRight className="flip-rtl" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Users} title={t('students.empty')} text={tc('empty.text')}
            action={hasFilters && <Button variant="outline" size="sm" onClick={clear}>{tc('actions.clear')}</Button>} />
        )}
        {!loading && rows.length > 0 && <div className="emp-table-foot">{t('common.showing', { shown: rows.length, total: students.length })}</div>}
      </Card>
    </>
  );
}
