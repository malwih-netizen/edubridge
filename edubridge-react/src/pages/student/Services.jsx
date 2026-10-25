import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarClock, CheckCircle2, ClipboardList, FileText, FileUser, FolderCheck, Info, Languages, Paperclip, PenLine, Plus, Search, Send, ShieldCheck, Trash2, UserRound,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, PageHeader, Select, Tabs, Textarea, statusTone } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { scholarshipService, studentService } from '@/services/dataService';
import './student.css';

const SERVICES = [
  { id: 'scholarshipSearch', icon: Search },
  { id: 'filePreparation', icon: FolderCheck },
  { id: 'cv', icon: FileUser },
  { id: 'motivationLetter', icon: PenLine },
  { id: 'translation', icon: Languages },
  { id: 'applicationAssistance', icon: Send },
  { id: 'followUp', icon: CalendarClock },
];
const ICON = Object.fromEntries(SERVICES.map((s) => [s.id, s.icon]));
const DESTINATIONS = ['canada', 'germany', 'uk', 'usa', 'turkey', 'malaysia', 'australia', 'netherlands'];
const LEVELS = ['bachelor', 'master', 'phd'];
const BLANK = { service: '', priority: 'medium', country: '', level: '', scholarshipId: '', notes: '', docIds: [], files: [] };
const MAX_MB = 10;

export default function StudentServices() {
  const { t } = useTranslation('student');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, fmtNum } = useLocalized();
  const toast = useToast();

  const requests = useAsync(() => studentService.serviceRequests(), []);
  const docs = useAsync(() => studentService.documents(), []);
  const schs = useAsync(() => scholarshipService.list(), []);

  const [tab, setTab] = useState('new');
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })); };
  const pickService = (id) => { setForm((f) => ({ ...f, service: id })); setErrors((er) => ({ ...er, service: undefined })); };
  const toggleDoc = (id) => setForm((f) => ({ ...f, docIds: f.docIds.includes(id) ? f.docIds.filter((x) => x !== id) : [...f.docIds, id] }));
  const addFiles = (e) => {
    const picked = [...(e.target.files || [])];
    const ok = picked.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    if (ok.length < picked.length) toast(t('services.form.tooLarge', { max: MAX_MB }));
    setForm((f) => ({ ...f, files: [...f.files, ...ok.map((x) => ({ name: x.name, size: x.size }))] }));
    e.target.value = '';
  };
  const removeFile = (i) => setForm((f) => ({ ...f, files: f.files.filter((_, idx) => idx !== i) }));

  const myDocs = (docs.data || []).filter((d) => d.file && d.status !== 'missing');
  const attachedCount = form.docIds.length + form.files.length;
  const selected = SERVICES.find((s) => s.id === form.service);
  const scholarship = (schs.data || []).find((s) => String(s.id) === String(form.scholarshipId));
  const list = requests.data || [];
  const openCount = list.filter((r) => r.status !== 'completed').length;

  const submit = async () => {
    const er = {};
    if (!form.service) er.service = t('services.form.pickService');
    if (form.notes.trim().length < 10) er.notes = t('services.form.notesShort');
    setErrors(er);
    if (Object.keys(er).length) return;
    setSending(true);
    try {
      const payload = {
        service: form.service, priority: form.priority, country: form.country || null, level: form.level || null,
        scholarshipId: form.scholarshipId || null, notes: form.notes.trim(), documentIds: form.docIds, attachments: form.files.map((f) => f.name),
      };
      const created = await studentService.requestService(payload);
      requests.setData((cur = []) => [{ createdAt: new Date().toISOString().slice(0, 10), ...created }, ...cur]);
      toast(tc('toast.requestSent'));
      setForm(BLANK);
      setTab('mine');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('services.title')}
        description={t('services.subtitle')}
        actions={<Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'new', label: t('services.tabs.new') },
            { value: 'mine', label: t('services.tabs.mine'), count: requests.loading ? undefined : list.length },
          ]}
        />}
      />

      {tab === 'new' ? (
        <div className="svc-layout">
          <div className="stack svc-main">
            <Card title={<StepTitle n={1}>{t('services.steps.choose')}</StepTitle>} subtitle={t('services.steps.chooseSub')}>
              <div className="svc-grid" role="radiogroup" aria-label={t('services.steps.choose')}>
                {SERVICES.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={form.service === id}
                    className={`svc-option${form.service === id ? ' on' : ''}`}
                    onClick={() => pickService(id)}
                  >
                    <span className="svc-icon"><Icon aria-hidden /></span>
                    <b>{tc(`services.${id}.title`)}</b>
                    <small>{tc(`services.${id}.desc`)}</small>
                    {form.service === id && <CheckCircle2 className="svc-check" aria-hidden />}
                  </button>
                ))}
              </div>
              {errors.service && <small className="drop-error">{errors.service}</small>}
            </Card>

            <Card title={<StepTitle n={2}>{t('services.steps.details')}</StepTitle>} subtitle={t('services.steps.detailsSub')}>
              <div className="form-grid">
                <Field label={t('services.form.priority')}>
                  <Select value={form.priority} onChange={set('priority')} options={['low', 'medium', 'high'].map((k) => ({ value: k, label: tc(`priority.${k}`) }))} />
                </Field>
                <Field label={t('services.form.scholarship')}>
                  <Select
                    value={form.scholarshipId}
                    onChange={set('scholarshipId')}
                    placeholder={t('services.form.optional')}
                    options={(schs.data || []).map((s) => ({ value: String(s.id), label: loc(s, 'name') }))}
                  />
                </Field>
                <Field label={t('services.form.country')}>
                  <Select value={form.country} onChange={set('country')} placeholder={t('services.form.select')} options={DESTINATIONS.map((k) => ({ value: k, label: tc(`countries.${k}`) }))} />
                </Field>
                <Field label={t('services.form.level')}>
                  <Select value={form.level} onChange={set('level')} placeholder={t('services.form.select')} options={LEVELS.map((k) => ({ value: k, label: tc(`levels.${k}`) }))} />
                </Field>
                <Field label={t('services.form.notes')} className="span-2" error={errors.notes} hint={t('services.form.notesHint')}>
                  <Textarea value={form.notes} onChange={set('notes')} rows={5} placeholder={t('services.form.notesPlaceholder')} />
                </Field>
              </div>
            </Card>

            <Card title={<StepTitle n={3}>{t('services.steps.attach')}</StepTitle>} subtitle={t('services.steps.attachSub')}>
              <div className="stack">
                <div>
                  <h4 className="mini-title">{t('services.form.fromDocs')}</h4>
                  {docs.loading ? (
                    <div className="skeleton" style={{ height: 40, borderRadius: 99 }} />
                  ) : myDocs.length ? (
                    <div className="chips">
                      {myDocs.map((d) => (
                        <button key={d.id} type="button" className={`chip${form.docIds.includes(d.id) ? ' on' : ''}`} aria-pressed={form.docIds.includes(d.id)} onClick={() => toggleDoc(d.id)}>
                          {form.docIds.includes(d.id) ? <CheckCircle2 aria-hidden /> : <FileText aria-hidden />}
                          {tc(`docTypes.${d.type}`)}
                        </button>
                      ))}
                    </div>
                  ) : <p className="text-muted">{t('services.form.noDocs')}</p>}
                </div>
                <div>
                  <h4 className="mini-title">{t('services.form.newFiles')}</h4>
                  <label className="drop drop-sm">
                    <input type="file" multiple hidden onChange={addFiles} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <Paperclip aria-hidden />
                    <b>{t('services.form.browse')}</b>
                    <small>{t('services.form.limits', { max: MAX_MB })}</small>
                  </label>
                  {form.files.length > 0 && (
                    <ul className="svc-files">
                      {form.files.map((f, i) => (
                        <li key={`${f.name}-${i}`}>
                          <FileText aria-hidden />
                          <span className="grow ltr">{f.name}</span>
                          <small>{fmtNum(Math.max(1, Math.round(f.size / 1024)))} KB</small>
                          <button type="button" className="icon-btn svc-remove" aria-label={tc('actions.delete')} onClick={() => removeFile(i)}><Trash2 aria-hidden /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <aside className="svc-aside">
            <Card title={t('services.summary.title')} accent="gold">
              {selected ? (
                <div className="svc-picked">
                  <span className="svc-icon"><selected.icon aria-hidden /></span>
                  <div><b>{tc(`services.${selected.id}.title`)}</b><small>{tc(`services.${selected.id}.desc`)}</small></div>
                </div>
              ) : <p className="text-muted svc-none">{t('services.summary.none')}</p>}
              <dl className="svc-dl">
                <div><dt>{t('services.form.priority')}</dt><dd><Badge tone={{ high: 'danger', medium: 'warning', low: 'info' }[form.priority]}>{tc(`priority.${form.priority}`)}</Badge></dd></div>
                <div><dt>{t('services.form.scholarship')}</dt><dd>{scholarship ? loc(scholarship, 'name') : t('services.summary.notSelected')}</dd></div>
                <div><dt>{t('services.form.country')}</dt><dd>{form.country ? tc(`countries.${form.country}`) : t('services.summary.notSelected')}</dd></div>
                <div><dt>{t('services.form.level')}</dt><dd>{form.level ? tc(`levels.${form.level}`) : t('services.summary.notSelected')}</dd></div>
                <div><dt>{t('services.summary.attachments')}</dt><dd>{fmtNum(attachedCount)}</dd></div>
              </dl>
              <div className="svc-next">
                <Info aria-hidden />
                <div><b>{t('services.summary.nextTitle')}</b><small>{t('services.summary.nextText')}</small></div>
              </div>
              <div className="stack svc-buttons">
                <Button icon={Send} block onClick={submit} disabled={sending}>{sending ? t('services.form.sending') : t('services.form.submit')}</Button>
                <Button variant="ghost" block onClick={() => { setForm(BLANK); setErrors({}); }} disabled={sending}>{t('services.form.reset')}</Button>
              </div>
              <p className="svc-secure"><ShieldCheck aria-hidden />{t('services.summary.secure')}</p>
            </Card>
          </aside>
        </div>
      ) : (
        <Card
          title={t('services.mine.title')}
          subtitle={t('services.mine.sub', { open: fmtNum(openCount) })}
          actions={<Button size="sm" icon={Plus} onClick={() => setTab('new')}>{t('services.tabs.new')}</Button>}
          className="fade-up"
        >
          {requests.loading ? (
            <div className="stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />)}</div>
          ) : !list.length ? (
            <EmptyState
              icon={ClipboardList}
              title={t('services.mine.emptyTitle')}
              text={t('services.mine.emptyText')}
              action={<Button icon={Plus} onClick={() => setTab('new')}>{t('services.tabs.new')}</Button>}
            />
          ) : (
            <ul className="req-list">
              {list.map((r) => {
                const Icon = ICON[r.service] || ClipboardList;
                return (
                  <li key={r.id} className="req-row">
                    <span className="svc-icon"><Icon aria-hidden /></span>
                    <div className="req-info">
                      <b>{tc(`services.${r.service}.title`)}</b>
                      <small><span className="ltr">{r.id}</span> · {t('services.mine.created', { date: fmtDate(r.createdAt) })}</small>
                      {r.notes && <p className="req-notes">{r.notes}</p>}
                    </div>
                    <div className="req-assignee">
                      <UserRound aria-hidden />
                      <span>{r.assignee ? loc(r, 'assignee') : t('services.mine.unassigned')}</span>
                    </div>
                    <Badge tone={statusTone(r.status)}>{tc(`status.${r.status}`)}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}

function StepTitle({ n, children }) {
  return <span className="step-title"><i aria-hidden>{n}</i>{children}</span>;
}
