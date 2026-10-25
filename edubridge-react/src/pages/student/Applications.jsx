import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, Building2, CalendarDays, CheckCircle2, ChevronRight, FileCheck2, FileText, Heart, MapPin, Paperclip, PhoneCall, Send, X, XCircle } from 'lucide-react';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Stepper, Tabs, statusTone } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { studentService } from '@/services/dataService';
import { STAGES } from '@/services/mockData';
import './student.css';

const LAST = STAGES.length - 1;
const stageKey = (a) => (a.result ? a.result : STAGES[a.stage]);
const progress = (a) => (a.result ? 100 : Math.round((a.stage / LAST) * 100));
const shift = (iso, minutes) => new Date(new Date(iso).getTime() + minutes * 60000).toISOString();

export default function StudentApplications() {
  const { t } = useTranslation('student');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, fmtNum } = useLocalized();
  const toast = useToast();

  const apps = useAsync(() => studentService.applications(), []);
  const docs = useAsync(() => studentService.documents(), []);
  const profile = useAsync(() => studentService.profile(), []);

  const [filter, setFilter] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [threads, setThreads] = useState({});
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [checked, setChecked] = useState({});
  const threadRef = useRef(null);

  const all = apps.data || [];
  const active = all.filter((a) => !a.result);
  const done = all.filter((a) => a.result);
  const shown = filter === 'active' ? active : done;
  const selected = all.find((a) => a.id === selectedId) || shown[0] || all[0];

  useEffect(() => { if (!selectedId && all.length) setSelectedId((active[0] || all[0]).id); }, [all, active, selectedId]);

  const firstName = profile.data ? loc(profile.data, 'firstName') : '';
  const seedThread = (a) => {
    const advisor = loc(a, 'advisor').split(' ')[0];
    const vars = { name: firstName, advisor, scholarship: loc(a.scholarship, 'name') };
    const base = shift(a.updatedAt, 9 * 60 + 30);
    return [
      { id: 1, from: 'advisor', text: t('applications.seed.m1', vars), at: base },
      { id: 2, from: 'student', text: t('applications.seed.m2', vars), at: shift(base, 32) },
      { id: 3, from: 'advisor', text: t(a.result ? 'applications.seed.m3done' : 'applications.seed.m3', vars), at: shift(base, 45) },
    ];
  };
  const messages = selected ? threads[selected.id] || seedThread(selected) : [];

  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length, selected?.id]);

  const send = () => {
    if (!draft.trim() && !attachment) return;
    const msg = { id: Date.now(), from: 'student', text: draft.trim(), file: attachment, at: new Date().toISOString() };
    setThreads((th) => ({ ...th, [selected.id]: [...messages, msg] }));
    setDraft('');
    setAttachment(null);
    toast(t('applications.messageSent'));
  };

  const missing = useMemo(() => (docs.data || []).filter((d) => d.status === 'missing' || d.status === 'rejected'), [docs.data]);
  const tasks = selected && !selected.result ? [
    ...missing.map((d) => ({ key: `doc-${d.type}`, label: t('applications.tasks.upload', { doc: tc(`docTypes.${d.type}`) }), to: '/student/documents' })),
    { key: 'confirm', label: t('applications.tasks.confirm') },
    { key: 'review', label: t('applications.tasks.review') },
  ] : [];
  const taskKey = (k) => `${selected?.id}:${k}`;

  const fmtTime = (iso) => `${fmtDate(iso, { day: 'numeric', month: 'short' })} · ${fmtDate(iso, { hour: '2-digit', minute: '2-digit' })}`;

  if (!apps.loading && !all.length) {
    return (
      <>
        <PageHeader title={t('applications.title')} description={t('applications.subtitle')} />
        <div className="card">
          <EmptyState icon={FileCheck2} title={t('applications.emptyTitle')} text={t('applications.emptyText')} action={<Button to="/student/scholarships">{tc('nav.scholarships')}</Button>} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('applications.title')}
        description={t('applications.subtitle')}
        actions={<Button variant="outline" icon={PhoneCall} onClick={() => toast(t('applications.callRequested'))}>{t('applications.requestCall')}</Button>}
      />

      <div className="app-layout">
        <aside className="app-side">
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'active', label: t('applications.filters.active'), count: apps.loading ? undefined : active.length },
              { value: 'done', label: t('applications.filters.done'), count: apps.loading ? undefined : done.length },
            ]}
          />
          <div className="app-list">
            {apps.loading && [0, 1].map((i) => <div key={i} className="card skeleton" style={{ height: 118 }} />)}
            {!apps.loading && !shown.length && <div className="card"><EmptyState title={tc('empty.title')} text={t('applications.emptyFilter')} /></div>}
            {shown.map((a) => (
              <button key={a.id} type="button" className={`card app-item${selected?.id === a.id ? ' on' : ''}`} onClick={() => setSelectedId(a.id)} aria-pressed={selected?.id === a.id}>
                <div className="app-item-top">
                  <b>{loc(a.scholarship, 'name')}</b>
                  <ChevronRight className="flip-rtl" aria-hidden />
                </div>
                <small><Building2 aria-hidden />{loc(a.scholarship, 'university')}</small>
                <div className="app-item-meta">
                  <Badge tone={statusTone(stageKey(a)) || 'info'}>{tc(`status.${stageKey(a)}`)}</Badge>
                  <span className="text-muted">{fmtDate(a.updatedAt)}</span>
                </div>
                <ProgressBar value={progress(a)} navy={!!a.result} />
              </button>
            ))}
          </div>
        </aside>

        {apps.loading || !selected ? (
          <div className="stack"><div className="card skeleton" style={{ height: 260 }} /><div className="card skeleton" style={{ height: 380 }} /></div>
        ) : (
          <div className="stack app-detail fade-up" key={selected.id}>
            <Card accent="navy" pad={false}>
              <div className="app-head">
                <div className="app-head-main">
                  <div className="row wrap">
                    <span className="ltr app-id">{selected.id}</span>
                    <Badge tone={statusTone(stageKey(selected)) || 'info'}>{tc(`status.${stageKey(selected)}`)}</Badge>
                  </div>
                  <h2>{loc(selected.scholarship, 'name')}</h2>
                  <ul className="det-meta app-meta">
                    <li><Building2 aria-hidden />{loc(selected.scholarship, 'university')}</li>
                    <li><MapPin aria-hidden />{tc(`countries.${selected.scholarship.country}`)}</li>
                    <li><CalendarDays aria-hidden />{t('applications.updated', { date: fmtDate(selected.updatedAt) })}</li>
                  </ul>
                </div>
                <div className="app-advisor">
                  <Avatar name={selected.advisor} gold />
                  <div><small>{t('applications.advisor')}</small><b>{loc(selected, 'advisor')}</b></div>
                </div>
              </div>
              <div className="app-facts">
                <div><small>{t('applications.facts.level')}</small><b>{profile.data ? tc(`levels.${profile.data.level}`) : '—'}</b></div>
                <div><small>{t('applications.facts.intake')}</small><b>{profile.data?.intake || '—'}</b></div>
                <div><small>{tc('time.deadline')}</small><b>{fmtDate(selected.scholarship.deadline)}</b></div>
                <div><small>{t('applications.facts.progress')}</small><b>{fmtNum(progress(selected))}%</b></div>
              </div>
              <div className="card-body">
                <h4 className="mini-title">{t('applications.journey')}</h4>
                <Stepper
                  current={selected.result ? STAGES.length : selected.stage}
                  steps={STAGES.map((k, i) => ({
                    key: k,
                    label: tc(`status.${k}`),
                    caption: selected.result || i < selected.stage ? tc('status.completed') : i === selected.stage ? tc('status.inProgress') : tc('status.upcoming'),
                  }))}
                />
              </div>
            </Card>

            {selected.result ? (
              <section className={`app-result ${selected.result}`}>
                {selected.result === 'accepted' ? <Award aria-hidden /> : <XCircle aria-hidden />}
                <div className="grow">
                  <b>{t(`applications.result.${selected.result}Title`)}</b>
                  <p>{t(`applications.result.${selected.result}Text`, { scholarship: loc(selected.scholarship, 'name') })}</p>
                </div>
                {selected.result === 'rejected'
                  ? <Button variant="outline" size="sm" to="/student/scholarships">{t('applications.result.explore')}</Button>
                  : <Button size="sm" to="/student/services">{t('applications.result.next')}</Button>}
              </section>
            ) : (
              <section className="app-result pending">
                <Heart aria-hidden />
                <div className="grow">
                  <b>{t('applications.result.pendingTitle')}</b>
                  <p>{t('applications.result.pendingText')}</p>
                </div>
              </section>
            )}

            <div className="app-grid">
              <Card
                title={t('applications.thread', { name: loc(selected, 'advisor').split(' ')[0] })}
                subtitle={t('applications.threadSub')}
                pad={false}
                className="app-chat"
              >
                <div className="chat" ref={threadRef}>
                  {messages.map((m) => (
                    <div key={m.id} className={`msg ${m.from}`}>
                      {m.from === 'advisor' && <Avatar name={selected.advisor} size="sm" gold />}
                      <div className="bubble">
                        {m.text && <p>{m.text}</p>}
                        {m.file && <span className="msg-file"><Paperclip aria-hidden /><span className="ltr">{m.file}</span></span>}
                        <time dateTime={m.at}>{fmtTime(m.at)}</time>
                      </div>
                    </div>
                  ))}
                </div>
                <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  {attachment && (
                    <span className="chip on composer-file">
                      <Paperclip aria-hidden /><span className="ltr">{attachment}</span>
                      <button type="button" onClick={() => setAttachment(null)} aria-label={tc('actions.delete')}><X aria-hidden /></button>
                    </span>
                  )}
                  <div className="composer-row">
                    <label className="icon-btn" title={t('applications.attach')}>
                      <input type="file" hidden onChange={(e) => { setAttachment(e.target.files?.[0]?.name || null); e.target.value = ''; }} />
                      <Paperclip aria-hidden />
                      <span className="sr-only">{t('applications.attach')}</span>
                    </label>
                    <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('applications.placeholder')} aria-label={t('applications.placeholder')} />
                    <Button type="submit" icon={Send} disabled={!draft.trim() && !attachment}>{tc('actions.send')}</Button>
                  </div>
                </form>
              </Card>

              <div className="stack">
                <Card title={t('applications.nextActions')} accent="gold">
                  {!tasks.length ? (
                    <p className="text-muted">{t('applications.noTasks')}</p>
                  ) : (
                    <ul className="tasks">
                      {tasks.map((x) => (
                        <li key={x.key} className={checked[taskKey(x.key)] ? 'done' : ''}>
                          <label className="check">
                            <input type="checkbox" checked={!!checked[taskKey(x.key)]} onChange={(e) => setChecked((c) => ({ ...c, [taskKey(x.key)]: e.target.checked }))} />
                            <span>{x.label}</span>
                          </label>
                          {x.to && !checked[taskKey(x.key)] && <Link to={x.to} className="link">{tc('actions.upload')}</Link>}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card title={t('applications.docs')} actions={<Link to="/student/documents" className="link">{tc('actions.viewAll')}</Link>}>
                  {docs.loading ? (
                    <div className="stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 10 }} />)}</div>
                  ) : (
                    <ul className="det-docs">
                      {(docs.data || []).map((d) => (
                        <li key={d.id}>
                          {d.status === 'approved' ? <CheckCircle2 aria-hidden className="ok" /> : <FileText aria-hidden />}
                          <span className="grow">{tc(`docTypes.${d.type}`)}</span>
                          <Badge tone={statusTone(d.status)}>{tc(`status.${d.status}`)}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
