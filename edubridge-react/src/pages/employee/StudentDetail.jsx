import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Award, BookOpen, Check, CheckCircle2, Clock, Eye, FileText, GraduationCap, History, ListChecks, Mail, MapPin, MessageCircle, NotebookPen, Phone, Plus, Send, ThumbsDown, ThumbsUp, Upload, User, Users, Video, X } from 'lucide-react';
import {
  Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, ProgressRing, Select, Stepper, Tabs, Textarea, statusTone,
} from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useAsync, useLocalized } from '@/hooks';
import { crmService, scholarshipService } from '@/services/dataService';
import { readiness, recommend, WEIGHTS } from '@/services/matching';
import { STAGES } from '@/services/mockData';
import {
  ADVISORS, advisorAr, ASSIGNMENTS, buildDocuments, communications, CURRENT_ADVISOR, notes as seedNotes,
  PHONES, PREFERRED, serviceHistory, studentApplications,
} from './data';
import { daysUntil, PriorityBadge, SkeletonRows, StageBadge, StatusBadge, useBasePath } from './shared';
import './employee.css';

const CHANNELS = [
  { key: 'call', icon: Phone },
  { key: 'whatsapp', icon: MessageCircle },
  { key: 'email', icon: Mail },
  { key: 'meeting', icon: Video },
];
const CHANNEL_ICON = Object.fromEntries(CHANNELS.map((c) => [c.key, c.icon]));
const LAST = STAGES.length - 1;
const dt = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };

export default function EmployeeStudentDetail() {
  const { id } = useParams();
  const { t } = useTranslation('employee');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, isAr } = useLocalized();
  const { user } = useAuth();
  const toast = useToast();
  const base = useBasePath();

  const { data, loading } = useAsync(() => crmService.student(id), [id]);
  const schols = useAsync(() => scholarshipService.list(), []);

  const [tab, setTab] = useState('overview');
  const [docs, setDocs] = useState([]);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState('');
  const [advisor, setAdvisor] = useState(CURRENT_ADVISOR);
  const [priority, setPriority] = useState('medium');
  const [noteList, setNoteList] = useState([]);
  const [commList, setCommList] = useState([]);
  const [apps, setApps] = useState([]);
  const [channel, setChannel] = useState('call');

  useEffect(() => {
    if (!data) return;
    setDocs(buildDocuments(data, data.documents));
    setStage(data.stage ?? 0);
    setResult(data.result || '');
    setAdvisor(ASSIGNMENTS[data.id] || CURRENT_ADVISOR);
    setPriority(data.priority || 'medium');
    setNoteList(seedNotes[data.id] || []);
    setCommList(communications[data.id] || []);
    setApps(studentApplications[data.id] || []);
  }, [data]);

  const ready = useMemo(() => readiness(docs), [docs]);
  const scholarships = schols.data || [];
  const byId = (sid) => scholarships.find((s) => s.id === sid);

  const isPrimary = data && String(data.id) === String(data.profile?.id);
  const matchProfile = useMemo(() => {
    if (!data) return null;
    const p = data.profile || {};
    if (isPrimary) return p;
    return { ...p, field: data.field, level: data.level, gpa: data.gpa, nationality: data.country, preferredCountries: PREFERRED[data.id] || p.preferredCountries || [] };
  }, [data, isPrimary]);
  const recs = useMemo(() => (matchProfile && scholarships.length ? recommend(matchProfile, scholarships) : []), [matchProfile, scholarships]);

  if (loading || !data) {
    return (
      <>
        <div className="emp-skel" style={{ height: 32, width: 220, marginBlockEnd: 18 }} />
        <div className="emp-skel" style={{ height: 210, borderRadius: 22 }} />
        <div className="emp-section"><SkeletonRows rows={4} height={64} /></div>
      </>
    );
  }

  const name = loc(data, 'name');
  const profile = data.profile || {};
  const history = serviceHistory[data.id] || [];
  const advisorName = (n) => (isAr ? advisorAr(n) : n);
  const me = user?.name || CURRENT_ADVISOR;

  /* ---------- handlers ---------- */
  const changeStage = async (value) => {
    const next = Number(value);
    setStage(next);
    if (next !== LAST) setResult('');
    await crmService.updateStage(apps[0]?.id || data.id, STAGES[next]);
    toast(t('detail.stageUpdated', { stage: tc(`status.${STAGES[next]}`) }));
  };
  const changeResult = (value) => { setResult(value); if (value) toast(t('detail.resultUpdated', { result: tc(`status.${value}`) })); };
  const changeAdvisor = (value) => { setAdvisor(value); toast(t('detail.assigned', { name: advisorName(value) })); };
  const changePriority = (value) => { setPriority(value); toast(tc('toast.saved')); };

  const quickContact = (key) => { setChannel(key); setTab('communication'); };

  const tabs = [
    { value: 'overview', label: t('detail.tabs.overview') },
    { value: 'documents', label: t('detail.tabs.documents'), count: docs.filter((d) => d.status === 'underReview').length || undefined },
    { value: 'applications', label: t('detail.tabs.applications'), count: apps.length },
    { value: 'notes', label: t('detail.tabs.notes'), count: noteList.length },
    { value: 'communication', label: t('detail.tabs.communication'), count: commList.length },
    { value: 'history', label: t('detail.tabs.history'), count: history.length },
    { value: 'ai', label: t('detail.tabs.ai') },
  ];

  return (
    <>
      <Link to={`${base}/students`} className="emp-back"><ArrowLeft className="flip-rtl" aria-hidden />{t('detail.back')}</Link>
      <PageHeader
        title={name}
        actions={<>
          <Button variant="outline" icon={NotebookPen} onClick={() => setTab('notes')}>{t('detail.addNote')}</Button>
          <Button icon={Phone} onClick={() => quickContact('call')}>{t('detail.logContact')}</Button>
        </>}
      />

      <section className="emp-hero fade-up">
        <div className="emp-hero-id">
          <Avatar name={data.name} gold size="lg" />
          <div className="emp-hero-copy">
            <div className="row wrap">
              <h2>{name}</h2>
              <StageBadge stage={stage} result={result} />
              <PriorityBadge value={priority} />
            </div>
            <ul className="emp-hero-meta">
              <li><MapPin aria-hidden />{tc(`countries.${data.country}`)}</li>
              <li><GraduationCap aria-hidden />{tc(`levels.${data.level}`)} · {tc(`fields.${data.field}`)}</li>
              <li><BookOpen aria-hidden />{t('common.gpa')} <span className="ltr-num">{Number(data.gpa).toFixed(2)} / 4</span></li>
              <li><Mail aria-hidden /><span className="ltr-num">{data.email}</span></li>
              <li><Phone aria-hidden /><span className="ltr-num">{PHONES[data.id] || profile.phone}</span></li>
              <li><Clock aria-hidden />{t('detail.lastContact', { date: fmtDate(data.lastContact) })}</li>
            </ul>
            <div className="emp-hero-quick">
              {CHANNELS.map(({ key, icon: Icon }) => (
                <button key={key} type="button" onClick={() => quickContact(key)}><Icon aria-hidden />{t(`detail.channel.${key}`)}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="emp-hero-ready">
          <ProgressRing value={ready.score} size={128} stroke={12} color="var(--gold-400)" label={t('common.readiness')} />
          <small>{ready.missing.length ? t('detail.missingCount', { count: ready.missing.length }) : t('detail.fileComplete')}</small>
        </div>
      </section>

      <Card className="emp-section emp-controls" pad>
        <div className="emp-control-grid">
          <Field label={t('detail.stageLabel')}>
            <Select value={stage} onChange={(e) => changeStage(e.target.value)}
              options={STAGES.map((k, i) => ({ value: i, label: `${i + 1}. ${tc(`status.${k}`)}` }))} />
          </Field>
          {stage === LAST && (
            <Field label={t('detail.resultLabel')}>
              <Select value={result} onChange={(e) => changeResult(e.target.value)} placeholder={t('detail.pickResult')}
                options={['accepted', 'rejected'].map((r) => ({ value: r, label: tc(`status.${r}`) }))} />
            </Field>
          )}
          <Field label={t('detail.assignLabel')}>
            <Select value={advisor} onChange={(e) => changeAdvisor(e.target.value)}
              options={ADVISORS.map((a) => ({ value: a.name, label: loc(a, 'name') }))} />
          </Field>
          <Field label={t('common.priority')}>
            <Select value={priority} onChange={(e) => changePriority(e.target.value)}
              options={['high', 'medium', 'low'].map((p) => ({ value: p, label: tc(`priority.${p}`) }))} />
          </Field>
        </div>
        <div className="divider" />
        <Stepper
          current={stage}
          steps={STAGES.map((k, i) => ({
            key: k,
            label: i === LAST && result ? tc(`status.${result}`) : tc(`status.${k}`),
            caption: i < stage ? tc('status.completed') : i === stage ? tc('status.inProgress') : tc('status.upcoming'),
          }))}
        />
      </Card>

      <div className="emp-tabs-row emp-section">
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </div>

      <div className="emp-tab-panel fade-up" key={tab}>
        {tab === 'overview' && (
          <OverviewTab {...{ t, tc, loc, fmtDate, data, profile, ready, commList, apps, byId, setTab, advisorName, advisor, isPrimary }} />
        )}
        {tab === 'documents' && <DocumentsTab {...{ t, tc, fmtDate, docs, setDocs, toast }} />}
        {tab === 'applications' && (
          <ApplicationsTab {...{ t, tc, loc, fmtDate, apps, setApps, byId, toast, loading: schols.loading, base }} />
        )}
        {tab === 'notes' && <NotesTab {...{ t, loc, fmtDate, noteList, setNoteList, toast, studentId: data.id, me, isAr }} />}
        {tab === 'communication' && (
          <CommunicationTab {...{ t, tc, loc, fmtDate, commList, setCommList, toast, channel, setChannel, me, isAr }} />
        )}
        {tab === 'history' && <HistoryTab {...{ t, tc, fmtDate, history, advisorName }} />}
        {tab === 'ai' && (
          <AiTab {...{ t, tc, loc, fmtDate, recs, loading: schols.loading, apps, setApps, toast, name }} />
        )}
      </div>
    </>
  );
}

/* ================= Overview ================= */
function OverviewTab({ t, tc, loc, fmtDate, data, profile, ready, commList, apps, byId, setTab, advisorName, advisor, isPrimary }) {
  const personal = [
    ['fullName', loc(data, 'name')],
    ['email', <span key="e" className="ltr-num">{data.email}</span>],
    ['nationality', tc(`countries.${data.country}`)],
    ...(isPrimary ? [['birthDate', fmtDate(profile.birthDate)]] : []),
    ['advisor', advisorName(advisor)],
    ['preferred', (PREFERRED[data.id] || profile.preferredCountries || []).map((c) => tc(`countries.${c}`)).join(' · ')],
  ];
  const academic = [
    ['level', tc(`levels.${data.level}`)],
    ['field', tc(`fields.${data.field}`)],
    ['gpa', <span key="g" className="ltr-num">{Number(data.gpa).toFixed(2)} / 4.00</span>],
    ...(isPrimary ? [
      ['university', loc(profile, 'university')],
      ['graduation', profile.graduationYear],
      ['languageTest', <span key="l" className="ltr-num">{profile.language?.test} {profile.language?.score}</span>],
      ['funding', tc(`funding.${profile.funding}`)],
      ['intake', profile.intake],
    ] : []),
  ];
  const lastComm = commList[0];
  const active = apps.filter((a) => a.stage < LAST);
  const next = active.map((a) => byId(a.scholarshipId)).filter(Boolean).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  return (
    <div className="emp-overview">
      <div className="stack">
        <Card title={t('detail.personal')} actions={<User className="emp-card-ico" aria-hidden />}>
          <dl className="emp-dl">{personal.map(([k, v]) => <div key={k}><dt>{t(`detail.fieldsLabel.${k}`)}</dt><dd>{v || '—'}</dd></div>)}</dl>
        </Card>
        <Card title={t('detail.academic')} actions={<GraduationCap className="emp-card-ico" aria-hidden />}>
          <dl className="emp-dl">{academic.map(([k, v]) => <div key={k}><dt>{t(`detail.fieldsLabel.${k}`)}</dt><dd>{v || '—'}</dd></div>)}</dl>
        </Card>
      </div>
      <div className="stack">
        <Card accent="gold" title={t('detail.readinessSnapshot')}>
          {ready.missing.length ? (
            <>
              <p className="text-muted">{t('detail.missingIntro')}</p>
              <div className="chips emp-gap-top">
                {ready.missing.map((m) => <Badge key={m} tone="danger">{tc(`docTypes.${m}`)}</Badge>)}
              </div>
              <Button variant="ghost" size="sm" className="emp-gap-top" onClick={() => setTab('documents')}>{t('detail.reviewDocs')}</Button>
            </>
          ) : <p className="emp-ok"><CheckCircle2 aria-hidden />{t('detail.fileComplete')}</p>}
        </Card>
        <Card title={t('detail.nextDeadline')}>
          {next ? (
            <div className="list-item">
              <span className="emp-date-chip"><b>{new Date(next.deadline).getDate()}</b><small>{fmtDate(next.deadline, { month: 'short' })}</small></span>
              <div className="grow"><b>{loc(next, 'name')}</b><small>{tc('time.daysLeft', { count: Math.max(0, daysUntil(next.deadline)) })}</small></div>
            </div>
          ) : <p className="text-muted">{t('detail.noActiveApps')}</p>}
        </Card>
        <Card title={t('detail.latestContact')} actions={<button type="button" className="link" onClick={() => setTab('communication')}>{tc('actions.viewAll')}</button>}>
          {lastComm ? (
            <div className="list-item">
              <ChannelDot channel={lastComm.channel} />
              <div className="grow"><b>{t(`detail.channel.${lastComm.channel}`)}</b><small>{loc(lastComm, 'summary')}</small></div>
            </div>
          ) : <p className="text-muted">{t('detail.noComms')}</p>}
        </Card>
      </div>
    </div>
  );
}

function ChannelDot({ channel }) {
  const Icon = CHANNEL_ICON[channel] || MessageCircle;
  return <span className={`emp-tl-dot c-${channel}`}><Icon aria-hidden /></span>;
}

/* ================= Documents review ================= */
function DocumentsTab({ t, tc, fmtDate, docs, setDocs, toast }) {
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const update = (docId, patch) => setDocs((list) => list.map((d) => (d.id === docId ? { ...d, ...patch } : d)));
  const approve = (d) => { update(d.id, { status: 'approved', reason: undefined }); toast(t('detail.docApproved', { doc: tc(`docTypes.${d.type}`) })); };
  const openReject = (d) => { setRejecting(d); setReason(''); setError(''); };
  const confirmReject = () => {
    if (reason.trim().length < 5) { setError(t('detail.reasonRequired')); return; }
    update(rejecting.id, { status: 'rejected', reason: reason.trim() });
    toast(t('detail.docRejected', { doc: tc(`docTypes.${rejecting.type}`) }));
    setRejecting(null);
  };

  const counts = ['approved', 'underReview', 'rejected', 'missing'].map((s) => [s, docs.filter((d) => d.status === s).length]);

  return (
    <Card title={t('detail.docsTitle')} subtitle={t('detail.docsSub')} pad={false}
      actions={<div className="chips">{counts.map(([s, n]) => <Badge key={s} tone={statusTone(s)}>{tc(`status.${s}`)} · {n}</Badge>)}</div>}>
      {docs.length ? (
        <ul className="emp-docs">
          {docs.map((d) => (
            <li key={d.id} className={`emp-doc s-${d.status}`}>
              <span className="emp-doc-ico"><FileText aria-hidden /></span>
              <div className="grow">
                <b>{tc(`docTypes.${d.type}`)}</b>
                <small>
                  {d.file ? <><span className="ltr-num">{d.file}</span>{d.size && <> · <span className="ltr-num">{d.size}</span></>}{d.uploadedAt && ` · ${fmtDate(d.uploadedAt)}`}</> : t('detail.notUploaded')}
                </small>
                {d.status === 'rejected' && d.reason && <p className="emp-doc-reason"><X aria-hidden />{d.reason}</p>}
              </div>
              <StatusBadge value={d.status} />
              <div className="emp-doc-actions">
                {d.file && <Button variant="ghost" size="sm" icon={Eye} onClick={() => toast(tc('toast.demo'))}>{tc('actions.view')}</Button>}
                {d.file && d.status !== 'approved' && <Button variant="outline" size="sm" icon={ThumbsUp} onClick={() => approve(d)}>{t('detail.approve')}</Button>}
                {d.file && d.status !== 'rejected' && <Button variant="danger" size="sm" icon={ThumbsDown} onClick={() => openReject(d)}>{t('detail.reject')}</Button>}
                {!d.file && <Button variant="outline" size="sm" icon={Upload} onClick={() => toast(t('detail.reminderSent'))}>{t('detail.requestUpload')}</Button>}
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={FileText} title={t('detail.noDocs')} />}

      <Modal
        open={!!rejecting}
        title={t('detail.rejectTitle')}
        onClose={() => setRejecting(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setRejecting(null)}>{tc('actions.cancel')}</Button>
          <Button variant="danger" icon={ThumbsDown} onClick={confirmReject}>{t('detail.confirmReject')}</Button>
        </>}
      >
        {rejecting && (
          <div className="stack">
            <p className="text-muted">{t('detail.rejectIntro', { doc: tc(`docTypes.${rejecting.type}`) })}</p>
            <div className="chips">
              {['blurry', 'expired', 'wrongDoc', 'incomplete'].map((r) => (
                <button key={r} type="button" className="chip" onClick={() => { setReason(t(`detail.reasons.${r}`)); setError(''); }}>{t(`detail.reasons.${r}`)}</button>
              ))}
            </div>
            <Field label={t('detail.reasonLabel')} error={error}>
              <Textarea value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} placeholder={t('detail.reasonPlaceholder')} rows={4} />
            </Field>
          </div>
        )}
      </Modal>
    </Card>
  );
}

/* ================= Applications ================= */
function ApplicationsTab({ t, tc, loc, fmtDate, apps, setApps, byId, toast, loading, base }) {
  const setAppStage = async (app, value) => {
    const stage = Number(value);
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, stage, result: stage === LAST ? a.result : undefined, updatedAt: new Date().toISOString().slice(0, 10) } : a)));
    await crmService.updateStage(app.id, STAGES[stage]);
    toast(t('detail.stageUpdated', { stage: tc(`status.${STAGES[stage]}`) }));
  };
  const setAppResult = (app, value) => {
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, result: value || undefined } : a)));
    if (value) toast(t('detail.resultUpdated', { result: tc(`status.${value}`) }));
  };

  if (loading) return <SkeletonRows rows={3} />;
  return (
    <Card title={t('detail.appsTitle')} subtitle={t('detail.appsSub')} pad={false}
      actions={<Button variant="outline" size="sm" icon={Award} to={`${base}/scholarships`}>{t('detail.browseScholarships')}</Button>}>
      {apps.length ? (
        <div className="table-wrap">
          <table className="table emp-table">
            <thead>
              <tr>
                <th>{t('detail.appId')}</th>
                <th>{t('common.scholarship')}</th>
                <th>{tc('time.deadline')}</th>
                <th style={{ minWidth: 200 }}>{t('common.stage')}</th>
                <th>{t('detail.result')}</th>
                <th>{t('common.updated')}</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const s = byId(a.scholarshipId);
                return (
                  <tr key={a.id}>
                    <td className="ltr-num nowrap"><b>{a.id}</b></td>
                    <td><span className="emp-two-line"><b>{loc(s, 'name')}</b><small>{loc(s, 'university')} · {s && tc(`countries.${s.country}`)}</small></span></td>
                    <td className="nowrap">{s && fmtDate(s.deadline)}</td>
                    <td>
                      <Select className="emp-inline-select" value={a.stage} onChange={(e) => setAppStage(a, e.target.value)} aria-label={t('common.stage')}
                        options={STAGES.map((k, i) => ({ value: i, label: `${i + 1}. ${tc(`status.${k}`)}` }))} />
                    </td>
                    <td>
                      {a.stage === LAST ? (
                        <Select className="emp-inline-select" value={a.result || ''} onChange={(e) => setAppResult(a, e.target.value)} placeholder={t('detail.pickResult')} aria-label={t('detail.result')}
                          options={['accepted', 'rejected'].map((r) => ({ value: r, label: tc(`status.${r}`) }))} />
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="nowrap">{fmtDate(a.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon={Send} title={t('detail.noApps')} text={t('detail.noAppsText')} />}
    </Card>
  );
}

/* ================= Notes ================= */
function NotesTab({ t, loc, fmtDate, noteList, setNoteList, toast, studentId, me, isAr }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const add = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const note = await crmService.addNote(studentId, text.trim());
    setNoteList((list) => [{ author: me, authorAr: advisorAr(me), ...note }, ...list]);
    setText('');
    setSaving(false);
    toast(t('detail.noteAdded'));
  };
  return (
    <div className="emp-split">
      <Card accent="gold" title={t('detail.newNote')}>
        <Field label={t('detail.noteLabel')} hint={t('detail.noteHint')}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('detail.notePlaceholder')} rows={5} />
        </Field>
        <div className="row emp-gap-top" style={{ justifyContent: 'flex-end' }}>
          <Button icon={Plus} onClick={add} disabled={!text.trim() || saving}>{t('detail.addNote')}</Button>
        </div>
      </Card>
      <Card title={t('detail.notesTitle')} subtitle={t('detail.notesSub')}>
        {noteList.length ? (
          <ul className="emp-notes">
            {noteList.map((n) => (
              <li key={n.id}>
                <div className="row between">
                  <span className="row"><Avatar name={n.author || me} size="sm" /><b>{loc(n, 'author') || me}</b></span>
                  <small>{fmtDate(n.createdAt, dt)}</small>
                </div>
                <p>{loc(n, 'text')}</p>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={NotebookPen} title={t('detail.noNotes')} />}
      </Card>
    </div>
  );
}

/* ================= Communication log ================= */
function CommunicationTab({ t, tc, loc, fmtDate, commList, setCommList, toast, channel, setChannel, me, isAr }) {
  const [form, setForm] = useState({ direction: 'outbound', summary: '', duration: '', followUp: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };
  const timed = channel === 'call' || channel === 'meeting';

  const submit = (e) => {
    e.preventDefault();
    if (form.summary.trim().length < 5) { setError(t('detail.summaryRequired')); return; }
    const entry = {
      id: Date.now(), channel, direction: form.direction, at: new Date().toISOString(),
      author: me, authorAr: advisorAr(me), summary: form.summary.trim(),
      duration: timed && form.duration ? Number(form.duration) : undefined, followUp: form.followUp || undefined,
    };
    setCommList((list) => [entry, ...list]);
    setForm({ direction: 'outbound', summary: '', duration: '', followUp: '' });
    toast(form.followUp ? t('detail.loggedFollowUp', { date: fmtDate(form.followUp) }) : t('detail.logged'));
  };

  return (
    <div className="emp-split">
      <Card accent="gold" title={t('detail.logTitle')} subtitle={t('detail.logSub')}>
        <form className="stack" onSubmit={submit} noValidate>
          <div className="emp-channel-pick" role="radiogroup" aria-label={t('detail.channelLabel')}>
            {CHANNELS.map(({ key, icon: Icon }) => (
              <button key={key} type="button" role="radio" aria-checked={channel === key} className={channel === key ? 'on' : undefined} onClick={() => setChannel(key)}>
                <Icon aria-hidden />{t(`detail.channel.${key}`)}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <Field label={t('detail.direction')}>
              <Select value={form.direction} onChange={set('direction')}
                options={['outbound', 'inbound'].map((d) => ({ value: d, label: t(`detail.directions.${d}`) }))} />
            </Field>
            <Field label={t('detail.duration')}>
              <Input type="number" min="1" value={form.duration} onChange={set('duration')} disabled={!timed} placeholder={timed ? '15' : '—'} />
            </Field>
            <Field label={t('detail.summary')} error={error} className="span-2">
              <Textarea value={form.summary} onChange={set('summary')} placeholder={t('detail.summaryPlaceholder')} rows={4} />
            </Field>
            <Field label={t('detail.followUp')} hint={t('detail.followUpHint')} className="span-2">
              <Input type="date" value={form.followUp} onChange={set('followUp')} />
            </Field>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="submit" icon={Check}>{t('detail.saveLog')}</Button>
          </div>
        </form>
      </Card>

      <Card title={t('detail.commTitle')} subtitle={t('detail.commSub')}>
        {commList.length ? (
          <ol className="emp-timeline">
            {commList.map((c) => (
              <li key={c.id}>
                <ChannelDot channel={c.channel} />
                <div className="grow">
                  <b>{t(`detail.channel.${c.channel}`)} · <span className="text-muted">{t(`detail.directions.${c.direction}`)}</span></b>
                  <p>{loc(c, 'summary')}</p>
                  <small className="text-muted">
                    {loc(c, 'author')}{c.duration ? ` · ${t('detail.minutes', { count: c.duration })}` : ''}
                    {c.followUp ? ` · ${t('detail.followUpOn', { date: fmtDate(c.followUp) })}` : ''}
                  </small>
                </div>
                <div className="emp-tl-meta"><small>{fmtDate(c.at, dt)}</small></div>
              </li>
            ))}
          </ol>
        ) : <EmptyState icon={MessageCircle} title={t('detail.noComms')} />}
      </Card>
    </div>
  );
}

/* ================= Service history ================= */
function HistoryTab({ t, tc, fmtDate, history, advisorName }) {
  return (
    <Card title={t('detail.historyTitle')} subtitle={t('detail.historySub')} pad={false}>
      {history.length ? (
        <div className="table-wrap">
          <table className="table emp-table">
            <thead>
              <tr>
                <th>{t('common.requestId')}</th>
                <th>{t('common.service')}</th>
                <th>{t('common.created')}</th>
                <th>{t('detail.completedOn')}</th>
                <th>{t('common.assignee')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="ltr-num nowrap"><b>{h.id}</b></td>
                  <td>{tc(`services.${h.service}.title`)}</td>
                  <td className="nowrap">{fmtDate(h.createdAt)}</td>
                  <td className="nowrap">{h.completedAt ? fmtDate(h.completedAt) : '—'}</td>
                  <td>{h.assignee ? advisorName(h.assignee) : <span className="text-muted">{t('common.unassigned')}</span>}</td>
                  <td><StatusBadge value={h.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon={History} title={t('detail.noHistory')} />}
    </Card>
  );
}

/* ================= AI recommendations ================= */
function AiTab({ t, tc, loc, fmtDate, recs, loading, apps, setApps, toast, name }) {
  if (loading) return <SkeletonRows rows={3} height={110} />;
  const top = recs.slice(0, 5);
  const add = (s) => {
    setApps((list) => [...list, { id: `APP-${Math.floor(Math.random() * 9000 + 1000)}`, scholarshipId: s.id, stage: 0, updatedAt: new Date().toISOString().slice(0, 10) }]);
    toast(t('detail.appCreated', { name: loc(s, 'name') }));
  };
  return (
    <div className="stack">
      <div className="emp-ai-banner">
        <ListChecks aria-hidden />
        <div><b>{t('detail.aiTitle', { name })}</b><p>{tc('match.disclaimer')}</p></div>
      </div>
      {top.length ? top.map((s) => {
        const already = apps.some((a) => a.scholarshipId === s.id);
        return (
          <Card key={s.id} className="emp-rec">
            <div className="emp-rec-top">
              <div className={`emp-rec-score ${s.match.level}`}>
                <b>{s.match.score}%</b><small>{tc(`match.${s.match.level}`)}</small>
              </div>
              <div className="grow">
                <h4>{loc(s, 'name')}</h4>
                <small className="text-muted">{loc(s, 'university')} · {tc(`countries.${s.country}`)} · {tc(`funding.${s.funding}`)} · {tc('time.deadline')}: {fmtDate(s.deadline)}</small>
                <div className="emp-rec-parts">
                  {Object.entries(WEIGHTS).map(([k, w]) => {
                    const v = s.match.parts[k];
                    return (
                      <span key={k} className={`emp-part ${v === 1 ? 'full' : v > 0 ? 'half' : 'none'}`} title={`${Math.round(w * v)}/${w}`}>
                        {v === 1 ? <Check aria-hidden /> : v > 0 ? <Clock aria-hidden /> : <X aria-hidden />}
                        {t(`detail.criteria.${k}`)}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="emp-rec-actions">
                <Button variant="outline" size="sm" icon={Users} onClick={() => toast(t('detail.proposed', { name: loc(s, 'name') }))}>{t('detail.propose')}</Button>
                <Button size="sm" icon={Plus} disabled={already} onClick={() => add(s)}>{already ? t('detail.alreadyApplied') : t('detail.createApp')}</Button>
              </div>
            </div>
          </Card>
        );
      }) : <EmptyState icon={ListChecks} title={t('detail.noRecs')} />}
    </div>
  );
}
