import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Award, Bell, Briefcase, CalendarClock, CheckCircle2, FileCheck2, MessageCircle, Upload } from 'lucide-react';
import { Avatar, Button, Card, PageHeader, ProgressRing, StatCard, Stepper } from '@/components/ui';
import ScholarshipCard from '@/components/ScholarshipCard';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { greetingKey, useAsync, useLocalized } from '@/hooks';
import { studentService } from '@/services/dataService';
import { STAGES } from '@/services/mockData';
import './student.css';

const daysUntil = (iso) => Math.max(0, Math.ceil((new Date(iso) - new Date()) / 86400000));

export default function StudentDashboard() {
  const { t } = useTranslation('student');
  const { t: tc } = useTranslation();
  const { user } = useAuth();
  const { loc, fmtDate } = useLocalized();
  const toast = useToast();

  const ready = useAsync(() => studentService.readiness(), []);
  const recs = useAsync(() => studentService.recommendations(), []);
  const apps = useAsync(() => studentService.applications(), []);
  const docs = useAsync(() => studentService.documents(), []);

  const firstName = loc(user, 'name').split(' ')[0];
  const eligible = recs.data?.filter((s) => s.match.level === 'eligible').length ?? '–';
  const active = apps.data?.filter((a) => !a.result) || [];
  const open = (recs.data || []).filter((s) => s.status === 'open').sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const nextDeadline = open[0];
  const approved = docs.data ? `${docs.data.filter((d) => d.status === 'approved').length}/${docs.data.length}` : '–';
  const current = active[0];

  const guidance = (s) => toast(`${tc('toast.requestSent')} — ${loc(s, 'name')}`);

  return (
    <>
      <PageHeader
        title={t('dashboard.greeting', { greeting: tc(greetingKey()), name: firstName })}
        description={t('dashboard.subtitle')}
        actions={<>
          <Button variant="outline" icon={Upload} to="/student/documents">{t('dashboard.uploadDocs')}</Button>
          <Button icon={Briefcase} to="/student/services">{t('dashboard.requestService')}</Button>
        </>}
      />

      <div className="dash-top">
        <section className="readiness-hero fade-up">
          <div className="rh-ring">
            <ProgressRing value={ready.data?.score ?? 0} size={150} stroke={13} color="var(--gold-400)" />
          </div>
          <div className="rh-copy">
            <h2>{t('dashboard.readinessTitle')}</h2>
            <p>{t('dashboard.readinessText')}</p>
            {ready.data && (ready.data.missing.length ? (
              <>
                <div className="rh-label">{t('dashboard.missingTitle')}</div>
                <ul className="rh-missing">
                  {ready.data.missing.map((m) => (
                    <li key={m}>
                      <AlertTriangle aria-hidden />
                      <span>{tc(`docTypes.${m}`)}</span>
                      <Link to="/student/documents">{t('dashboard.upload')}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="rh-done"><CheckCircle2 aria-hidden />{t('dashboard.allSet')}</p>)}
          </div>
        </section>

        <div className="dash-stats">
          <StatCard icon={Award} tone="gold" label={t('dashboard.stats.matches')} value={eligible} />
          <StatCard icon={FileCheck2} label={t('dashboard.stats.applications')} value={apps.data ? active.length : '–'} />
          <StatCard icon={CalendarClock} tone="red" label={t('dashboard.stats.deadline')} value={nextDeadline ? t('dashboard.daysLeft', { count: daysUntil(nextDeadline.deadline) }) : '–'} trend={nextDeadline ? loc(nextDeadline, 'name') : undefined} trendDown />
          <StatCard icon={CheckCircle2} tone="green" label={t('dashboard.stats.approved')} value={approved} />
        </div>
      </div>

      <section className="dash-section">
        <div className="section-head">
          <div><h2>{t('dashboard.recommended')}</h2><p>{t('dashboard.recommendedSub')}</p></div>
          <Link to="/student/scholarships" className="link">{tc('actions.viewAll')}</Link>
        </div>
        <div className="grid grid-3">
          {(recs.data || []).slice(0, 3).map((s) => <ScholarshipCard key={s.id} s={s} onGuidance={guidance} />)}
          {recs.loading && [0, 1, 2].map((i) => <div key={i} className="card skeleton" style={{ height: 230 }} />)}
        </div>
      </section>

      <div className="dash-bottom">
        <Card
          accent="navy"
          title={t('dashboard.journey')}
          subtitle={current && t('dashboard.journeySub', { name: loc(current.scholarship, 'name'), date: fmtDate(current.updatedAt) })}
          actions={<Button variant="ghost" size="sm" to="/student/applications">{tc('actions.viewDetails')}</Button>}
        >
          {current && (
            <Stepper
              current={current.stage}
              steps={STAGES.map((k, i) => ({ key: k, label: tc(`status.${k}`), caption: i < current.stage ? tc('status.completed') : i === current.stage ? tc('status.inProgress') : tc('status.upcoming') }))}
            />
          )}
          <div className="advisor-row">
            <Avatar name="Maya Khalil" gold />
            <div className="grow">
              <small>{t('dashboard.advisor')}</small>
              <b>{loc({ name: 'Maya Khalil', nameAr: 'مايا خليل' }, 'name')}</b>
            </div>
            <Button variant="outline" size="sm" icon={MessageCircle} to="/student/applications">{t('dashboard.message')}</Button>
          </div>
        </Card>

        <Card accent="gold" title={t('dashboard.activity')} actions={<Link to="/student/notifications" className="link">{tc('actions.viewAll')}</Link>}>
          <div className="list">
            {['deadline', 'document', 'service'].map((k, i) => (
              <div key={k} className="list-item">
                <span className={`notif-dot n${i}`}><Bell aria-hidden /></span>
                <div className="grow"><b>{tc(`notifications.${k}`)}</b><small>{tc(`notifications.${k}Text`)}</small></div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <h4 className="mini-title">{t('dashboard.deadlines')}</h4>
          <div className="list">
            {open.slice(0, 3).map((s) => (
              <Link key={s.id} to={`/student/scholarships/${s.id}`} className="list-item">
                <span className="date-chip"><b>{new Date(s.deadline).getDate()}</b><small>{fmtDate(s.deadline, { month: 'short' })}</small></span>
                <div className="grow"><b>{loc(s, 'name')}</b><small>{tc('time.daysLeft', { count: daysUntil(s.deadline) })}</small></div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
