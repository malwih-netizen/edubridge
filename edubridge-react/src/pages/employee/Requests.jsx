import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ClipboardList, Columns3, Inbox, List, Search, UserCheck } from 'lucide-react';
import { Avatar, Card, EmptyState, Input, PageHeader, Select, StatCard, Tabs } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { crmService } from '@/services/dataService';
import { ADVISORS, advisorAr, CURRENT_ADVISOR, extraRequests, normalizeRequest, REQUEST_STATUSES } from './data';
import { PriorityBadge, SkeletonRows, StatusBadge, useBasePath } from './shared';
import './employee.css';

const SERVICES = ['scholarshipSearch', 'filePreparation', 'cv', 'motivationLetter', 'translation', 'applicationAssistance', 'followUp'];

export default function EmployeeRequests() {
  const { t } = useTranslation('employee');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, fmtNum, isAr } = useLocalized();
  const toast = useToast();
  const base = useBasePath();

  const { data, loading } = useAsync(() => crmService.requests(), []);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState('board');
  const [q, setQ] = useState('');
  const [service, setService] = useState('');
  const [assignee, setAssignee] = useState('');

  useEffect(() => {
    if (data) setRows([...data.map(normalizeRequest), ...extraRequests.filter((x) => !data.some((d) => d.id === x.id))]);
  }, [data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => !term || [r.id, r.student, r.studentAr].some((v) => v?.toLowerCase().includes(term)))
      .filter((r) => !service || r.service === service)
      .filter((r) => !assignee || (assignee === 'none' ? !r.assignee : r.assignee === assignee))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [rows, q, service, assignee]);

  const assign = (id, name) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, assignee: name, assigneeAr: advisorAr(name), status: r.status === 'newRequest' && name ? 'inProgress' : r.status } : r)));
    toast(name ? t('requests.assigned', { id, name: isAr ? advisorAr(name) : name }) : t('requests.unassignedToast', { id }));
  };
  const setStatus = (id, status) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    toast(t('requests.statusChanged', { id, status: tc(`status.${status}`) }));
  };

  const advisorOptions = ADVISORS.map((a) => ({ value: a.name, label: loc(a, 'name') }));
  const kpi = {
    open: rows.filter((r) => r.status !== 'completed').length,
    unassigned: rows.filter((r) => !r.assignee).length,
    mine: rows.filter((r) => r.assignee === CURRENT_ADVISOR && r.status !== 'completed').length,
    done: rows.filter((r) => r.status === 'completed').length,
  };

  const controls = (r) => (
    <div className="emp-req-controls">
      <Select value={r.assignee || ''} onChange={(e) => assign(r.id, e.target.value)} placeholder={t('common.unassigned')}
        aria-label={tc('actions.assign')} className="emp-inline-select" options={advisorOptions} />
      <Select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} aria-label={t('common.status')}
        className="emp-inline-select" options={REQUEST_STATUSES.map((s) => ({ value: s, label: tc(`status.${s}`) }))} />
    </div>
  );
  const studentLink = (r) => (r.studentId
    ? <Link to={`${base}/students/${r.studentId}`} className="emp-person"><Avatar name={r.student} size="sm" /><b>{loc(r, 'student')}</b></Link>
    : <span className="emp-person"><Avatar name={r.student} size="sm" /><b>{loc(r, 'student')}</b></span>);

  return (
    <>
      <PageHeader title={t('requests.title')} description={t('requests.subtitle')}
        actions={<Tabs value={view} onChange={setView} items={[
          { value: 'board', label: <span className="row emp-tab-ico"><Columns3 aria-hidden />{t('requests.board')}</span> },
          { value: 'table', label: <span className="row emp-tab-ico"><List aria-hidden />{t('requests.table')}</span> },
        ]} />}
      />

      <div className="grid grid-4 emp-kpis fade-up">
        <StatCard icon={ClipboardList} label={t('requests.kpi.open')} value={loading ? '–' : fmtNum(kpi.open)} />
        <StatCard icon={Inbox} tone="red" label={t('requests.kpi.unassigned')} value={loading ? '–' : fmtNum(kpi.unassigned)} />
        <StatCard icon={UserCheck} tone="gold" label={t('requests.kpi.mine')} value={loading ? '–' : fmtNum(kpi.mine)} />
        <StatCard icon={CalendarDays} tone="green" label={t('requests.kpi.done')} value={loading ? '–' : fmtNum(kpi.done)} />
      </div>

      <Card pad={false} className="emp-section">
        <div className="emp-filters">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('requests.search')} aria-label={tc('actions.search')} className="emp-search" />
          <Select value={service} onChange={(e) => setService(e.target.value)} placeholder={t('requests.anyService')} aria-label={t('common.service')}
            options={SERVICES.map((s) => ({ value: s, label: tc(`services.${s}.title`) }))} />
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder={t('requests.anyAssignee')} aria-label={t('common.assignee')}
            options={[{ value: 'none', label: t('common.unassigned') }, ...advisorOptions]} />
          {(q || service || assignee) && <button type="button" className="link emp-clear" onClick={() => { setQ(''); setService(''); setAssignee(''); }}>{tc('actions.clear')}</button>}
        </div>
      </Card>

      {loading ? <div className="emp-section"><SkeletonRows rows={4} height={90} /></div> : !filtered.length ? (
        <Card className="emp-section"><EmptyState icon={ClipboardList} title={t('requests.empty')} text={tc('empty.text')} /></Card>
      ) : view === 'board' ? (
        <div className="emp-board emp-section">
          {REQUEST_STATUSES.map((s) => {
            const col = filtered.filter((r) => r.status === s);
            return (
              <section key={s} className={`emp-col col-${s}`} aria-label={tc(`status.${s}`)}>
                <header><StatusBadge value={s} /><span className="emp-col-count">{col.length}</span></header>
                <div className="emp-col-body">
                  {col.length ? col.map((r) => (
                    <article key={r.id} className="emp-req-card">
                      <div className="row between">
                        <span className="ltr-num emp-req-id">{r.id}</span>
                        <PriorityBadge value={r.priority} />
                      </div>
                      <h4>{tc(`services.${r.service}.title`)}</h4>
                      {studentLink(r)}
                      <small className="text-muted">{t('requests.createdOn', { date: fmtDate(r.createdAt) })}</small>
                      {controls(r)}
                    </article>
                  )) : <p className="emp-col-empty">{t('requests.columnEmpty')}</p>}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Card pad={false} className="emp-section">
          <div className="table-wrap">
            <table className="table emp-table">
              <thead>
                <tr>
                  <th>{t('common.requestId')}</th>
                  <th>{t('common.service')}</th>
                  <th>{t('common.student')}</th>
                  <th>{t('common.created')}</th>
                  <th>{t('common.priority')}</th>
                  <th>{t('common.status')}</th>
                  <th style={{ minWidth: 340 }}>{t('requests.manage')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="ltr-num nowrap"><b>{r.id}</b></td>
                    <td>{tc(`services.${r.service}.title`)}</td>
                    <td>{studentLink(r)}</td>
                    <td className="nowrap">{fmtDate(r.createdAt)}</td>
                    <td><PriorityBadge value={r.priority} /></td>
                    <td><StatusBadge value={r.status} /></td>
                    <td>{controls(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
