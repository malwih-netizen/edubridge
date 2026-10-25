import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarClock, CheckCircle2, ClipboardList, FileCheck2, FileText, Mail, MessageCircle, NotebookPen,
  Phone, PhoneCall, Send, Users, UserPlus,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { greetingKey, useAsync, useLocalized } from '@/hooks';
import { crmService, scholarshipService } from '@/services/dataService';
import { STAGES } from '@/services/mockData';
import { activity, ASSIGNMENTS, CURRENT_ADVISOR, extraRequests, normalizeRequest, studentApplications, tasks as seedTasks } from './data';
import { daysUntil, ReadinessCell, SkeletonRows, StageBadge, useBasePath } from './shared';
import './employee.css';

const TASK_ICON = { call: Phone, whatsapp: MessageCircle, email: Mail, review: FileCheck2, deadline: CalendarClock };
const ACTIVITY_ICON = { document: FileText, call: PhoneCall, application: Send, service: ClipboardList, note: NotebookPen };

export default function EmployeeDashboard() {
  const { t } = useTranslation('employee');
  const { t: tc } = useTranslation();
  const { user } = useAuth();
  const { loc, fmtDate, fmtNum } = useLocalized();
  const toast = useToast();
  const base = useBasePath();

  const students = useAsync(() => crmService.students(), []);
  const requests = useAsync(() => crmService.requests(), []);
  const schols = useAsync(() => scholarshipService.list(), []);
  const [taskList, setTaskList] = useState(seedTasks);

  const mine = useMemo(
    () => (students.data || []).filter((s) => (ASSIGNMENTS[s.id] || CURRENT_ADVISOR) === CURRENT_ADVISOR),
    [students.data],
  );
  const allRequests = useMemo(() => [...(requests.data || []).map(normalizeRequest), ...extraRequests], [requests.data]);
  const pending = allRequests.filter((r) => r.status !== 'completed').length;
  const apps = Object.values(studentApplications).flat();
  const awaitingResult = apps.filter((a) => a.stage === 5 || a.stage === 6).length;
  const toReview = (students.data || []).filter((s) => s.readiness < 100 && s.stage >= 1 && s.stage <= 4).length;

  const pipeline = STAGES.map((k, i) => ({ key: k, count: (students.data || []).filter((s) => s.stage === i).length }));
  const maxCount = Math.max(1, ...pipeline.map((p) => p.count));

  const deadlines = (schols.data || [])
    .filter((s) => s.status === 'open' && daysUntil(s.deadline) >= 0)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4)
    .map((s) => ({ ...s, applicants: apps.filter((a) => a.scholarshipId === s.id && a.stage < 7).length }));

  const doneCount = taskList.filter((x) => x.done).length;
  const toggleTask = (id) => {
    setTaskList((list) => list.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    const task = taskList.find((x) => x.id === id);
    if (task && !task.done) toast(t('dashboard.taskDone'));
  };

  const firstName = loc(user, 'name').split(' ')[0];

  return (
    <>
      <PageHeader
        title={t('dashboard.greeting', { greeting: tc(greetingKey()), name: firstName })}
        description={students.data ? t('dashboard.subtitle', { students: mine.length, requests: pending }) : t('dashboard.subtitleLoading')}
        actions={<>
          <Button variant="outline" icon={ClipboardList} to={`${base}/requests`}>{t('dashboard.openRequests')}</Button>
          <Button icon={UserPlus} onClick={() => toast(tc('toast.demo'))}>{t('dashboard.newStudent')}</Button>
        </>}
      />

      <div className="grid grid-4 emp-kpis fade-up">
        <StatCard icon={Users} label={t('dashboard.kpi.myStudents')} value={students.data ? fmtNum(mine.length) : '–'} trend={t('dashboard.kpi.myStudentsTrend', { count: (students.data || []).length })} />
        <StatCard icon={ClipboardList} tone="gold" label={t('dashboard.kpi.pendingRequests')} value={requests.data ? fmtNum(pending) : '–'} trend={t('dashboard.kpi.pendingTrend', { count: allRequests.filter((r) => !r.assignee).length })} trendDown />
        <StatCard icon={FileCheck2} tone="red" label={t('dashboard.kpi.docsToReview')} value={students.data ? fmtNum(toReview) : '–'} trend={t('dashboard.kpi.docsTrend')} trendDown />
        <StatCard icon={CheckCircle2} tone="green" label={t('dashboard.kpi.awaitingResults')} value={fmtNum(awaitingResult)} trend={t('dashboard.kpi.awaitingTrend', { count: apps.filter((a) => a.result === 'accepted').length })} />
      </div>

      <div className="emp-dash-grid">
        <Card
          accent="navy"
          title={t('dashboard.myStudents')}
          subtitle={t('dashboard.myStudentsSub')}
          actions={<Link to={`${base}/students`} className="link">{tc('actions.viewAll')}</Link>}
          pad={false}
        >
          {students.loading ? <div className="card-body"><SkeletonRows rows={4} /></div> : mine.length ? (
            <div className="emp-roster">
              {mine.map((s) => (
                <Link key={s.id} to={`${base}/students/${s.id}`} className="emp-roster-row">
                  <Avatar name={s.name} />
                  <div className="grow">
                    <b>{loc(s, 'name')}</b>
                    <small>{tc(`levels.${s.level}`)} · {tc(`fields.${s.field}`)}</small>
                  </div>
                  <div className="emp-roster-ready"><ReadinessCell value={s.readiness} /></div>
                  <span className="emp-roster-stage"><StageBadge stage={s.stage} result={s.result} /></span>
                </Link>
              ))}
            </div>
          ) : <EmptyState title={t('dashboard.noStudents')} text={tc('empty.text')} />}
        </Card>

        <Card
          accent="gold"
          title={t('dashboard.today')}
          subtitle={t('dashboard.todaySub', { done: doneCount, total: taskList.length })}
        >
          {taskList.length ? (
            <ul className="emp-tasks">
              {taskList.map((task) => {
                const Icon = TASK_ICON[task.type] || CalendarClock;
                return (
                  <li key={task.id} className={task.done ? 'done' : undefined}>
                    <label className="emp-task-check">
                      <input type="checkbox" checked={!!task.done} onChange={() => toggleTask(task.id)} aria-label={t('dashboard.markDone')} />
                    </label>
                    <span className={`emp-task-icon t-${task.type}`}><Icon aria-hidden /></span>
                    <div className="grow">
                      <b>{loc(task, 'text')}</b>
                      <small>
                        <span className="ltr-num">{task.time}</span> · {t(`dashboard.taskType.${task.type}`)} ·{' '}
                        <Link to={`${base}/students/${task.studentId}`} className="link">{loc(task, 'student')}</Link>
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState icon={CheckCircle2} title={t('dashboard.noTasks')} />}
        </Card>
      </div>

      <Card className="emp-section" title={t('dashboard.pipeline')} subtitle={t('dashboard.pipelineSub')}
        actions={<Link to={`${base}/students`} className="link">{t('dashboard.openRoster')}</Link>}>
        {students.loading ? <SkeletonRows rows={2} height={40} /> : (
          <div className="emp-pipeline">
            {pipeline.map((p, i) => (
              <Link key={p.key} to={`${base}/students?stage=${i}`} className="emp-pipe">
                <span className="emp-pipe-idx">{i + 1}</span>
                <b className="emp-pipe-count">{fmtNum(p.count)}</b>
                <div className="emp-pipe-bar"><i style={{ blockSize: `${Math.max(6, (p.count / maxCount) * 100)}%` }} /></div>
                <small>{tc(`status.${p.key}`)}</small>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div className="emp-dash-grid emp-section">
        <Card title={t('dashboard.activity')} subtitle={t('dashboard.activitySub')}>
          {activity.length ? (
            <ol className="emp-timeline">
              {activity.map((a) => {
                const Icon = ACTIVITY_ICON[a.type] || FileText;
                return (
                  <li key={a.id}>
                    <span className={`emp-tl-dot a-${a.type}`}><Icon aria-hidden /></span>
                    <div className="grow">
                      <b><Link to={`${base}/students/${a.studentId}`}>{loc(a, 'student')}</Link></b>
                      <p>{loc(a, 'text')}</p>
                    </div>
                    <div className="emp-tl-meta">
                      <Badge>{t(`dashboard.activityType.${a.type}`)}</Badge>
                      <small>{fmtDate(a.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : <EmptyState title={tc('empty.title')} />}
        </Card>

        <Card accent="gold" title={t('dashboard.deadlines')} subtitle={t('dashboard.deadlinesSub')}
          actions={<Link to={`${base}/scholarships`} className="link">{tc('actions.viewAll')}</Link>}>
          {schols.loading ? <SkeletonRows rows={3} /> : deadlines.length ? (
            <div className="list">
              {deadlines.map((s) => {
                const d = daysUntil(s.deadline);
                return (
                  <div key={s.id} className="list-item">
                    <span className="emp-date-chip"><b>{new Date(s.deadline).getDate()}</b><small>{fmtDate(s.deadline, { month: 'short' })}</small></span>
                    <div className="grow">
                      <b>{loc(s, 'name')}</b>
                      <small>{t('dashboard.applicants', { count: s.applicants })}</small>
                    </div>
                    <Badge tone={d <= 21 ? 'danger' : d <= 45 ? 'warning' : 'info'}>{tc('time.daysLeft', { count: d })}</Badge>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={CalendarClock} title={t('dashboard.noDeadlines')} />}
        </Card>
      </div>
    </>
  );
}
