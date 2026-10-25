import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, CalendarClock, CheckCircle2, Download, Lock, Pencil, Plus, Search } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, StatCard, Textarea, statusTone } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { scholarshipService } from '@/services/dataService';
import { DEFAULT_REQUIREMENTS } from './data';
import { daysUntil, SkeletonRows } from './shared';
import './employee.css';

const COUNTRIES = ['canada', 'germany', 'uk', 'usa', 'turkey', 'malaysia', 'australia', 'netherlands'];
const NATIONALITIES = ['palestine', 'jordan', 'egypt', 'uae', 'saudi'];
const LEVELS = ['bachelor', 'master', 'phd'];
const FIELDS = ['computerScience', 'engineering', 'business', 'publicHealth', 'science', 'humanities'];
const FUNDING = ['full', 'partial', 'self'];
const STATUSES = ['draft', 'upcoming', 'open', 'closed'];
const DOCS = ['passport', 'transcript', 'degree', 'cv', 'language', 'motivation', 'recommendation'];
const TESTS = ['IELTS', 'TOEFL', 'Duolingo'];
const RESULT_TONE = { notStarted: undefined, inProgress: 'info', partial: 'warning', completed: 'success' };

const EMPTY = {
  name: '', nameAr: '', country: '', university: '', universityAr: '', levels: [], fields: [],
  minGpa: '', languageTest: 'IELTS', languageScore: '', nationalities: ['all'], funding: 'full',
  opens: '', deadline: '', requirements: [...DEFAULT_REQUIREMENTS], requirementsNote: '', status: 'draft', amount: '',
};

const toForm = (s) => ({
  ...EMPTY, ...s,
  minGpa: String(s.minGpa ?? ''), languageTest: s.language?.test || 'IELTS', languageScore: String(s.language?.score ?? ''),
  requirements: s.requirements || [...DEFAULT_REQUIREMENTS], nationalities: s.nationalities?.length ? s.nationalities : ['all'],
});

const fromForm = (f) => {
  const { languageTest, languageScore, ...rest } = f;
  return { ...rest, minGpa: Number(f.minGpa), language: { test: languageTest, score: Number(languageScore) } };
};

// مجموعة خيارات متعددة (لا نستخدم <label> حتى لا يُفعَّل أول زر عند النقر على العنوان)
function ChipField({ label, error, children }) {
  return (
    <div className="field span-2" role="group" aria-label={label}>
      <span>{label}</span>
      {children}
      {error && <small className="error">{error}</small>}
    </div>
  );
}

function validate(f, t) {
  const e = {};
  if (f.name.trim().length < 3) e.name = t('scholarships.errors.name');
  if (!f.country) e.country = t('scholarships.errors.country');
  if (f.university.trim().length < 2) e.university = t('scholarships.errors.university');
  if (!f.levels.length) e.levels = t('scholarships.errors.levels');
  if (!f.fields.length) e.fields = t('scholarships.errors.fields');
  const gpa = Number(f.minGpa);
  if (f.minGpa === '' || Number.isNaN(gpa) || gpa < 0 || gpa > 4) e.minGpa = t('scholarships.errors.gpa');
  const score = Number(f.languageScore);
  const max = f.languageTest === 'TOEFL' ? 120 : f.languageTest === 'Duolingo' ? 160 : 9;
  if (f.languageScore === '' || Number.isNaN(score) || score < 0 || score > max) e.languageScore = t('scholarships.errors.language', { max });
  if (!f.nationalities.length) e.nationalities = t('scholarships.errors.nationalities');
  if (!f.opens) e.opens = t('scholarships.errors.opens');
  if (!f.deadline) e.deadline = t('scholarships.errors.deadline');
  else if (f.opens && new Date(f.deadline) <= new Date(f.opens)) e.deadline = t('scholarships.errors.deadlineOrder');
  if (!f.requirements.length) e.requirements = t('scholarships.errors.requirements');
  return e;
}

export default function EmployeeScholarships() {
  const { t } = useTranslation('employee');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, fmtNum } = useLocalized();
  const toast = useToast();

  const { data, loading } = useAsync(() => scholarshipService.list(), []);
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [funding, setFunding] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | scholarship
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setList(data); }, [data]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list
      .filter((s) => !term || [s.name, s.nameAr, s.university, s.universityAr].some((v) => v?.toLowerCase().includes(term)))
      .filter((s) => !country || s.country === country)
      .filter((s) => !status || s.status === status)
      .filter((s) => !funding || s.funding === funding)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [list, q, country, status, funding]);

  const openNew = () => { setForm(EMPTY); setErrors({}); setEditing('new'); };
  const openEdit = (s) => { setForm(toForm(s)); setErrors({}); setEditing(s); };
  const close = () => setEditing(null);

  const set = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); setErrors((x) => ({ ...x, [k]: undefined })); };
  const toggle = (k, v) => {
    setForm((f) => {
      let next = f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v];
      if (k === 'nationalities') next = v === 'all' ? (f[k].includes('all') ? [] : ['all']) : next.filter((x) => x !== 'all');
      return { ...f, [k]: next };
    });
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const save = async () => {
    const e = validate(form, t);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const payload = fromForm(form);
    if (editing === 'new') {
      const created = await scholarshipService.create({ ...payload, results: 'notStarted', tags: [] });
      setList((l) => [{ ...payload, results: 'notStarted', tags: [], ...created }, ...l]);
      toast(t('scholarships.created', { name: payload.name }));
    } else {
      const updated = await scholarshipService.update(editing.id, payload);
      setList((l) => l.map((s) => (s.id === editing.id ? { ...s, ...payload, ...(updated || {}), id: s.id } : s)));
      toast(t('scholarships.updated', { name: payload.name }));
    }
    setSaving(false);
    close();
  };

  const count = (s) => list.filter((x) => x.status === s).length;
  const chips = (k, values, label) => (
    <div className="chips">
      {values.map((v) => (
        <button key={v} type="button" className={`chip${form[k].includes(v) ? ' on' : ''}`} aria-pressed={form[k].includes(v)} onClick={() => toggle(k, v)}>{label(v)}</button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title={t('scholarships.title')} description={t('scholarships.subtitle')}
        actions={<>
          <Button variant="outline" icon={Download} onClick={() => toast(tc('toast.exported'))}>{tc('actions.export')}</Button>
          <Button icon={Plus} onClick={openNew}>{t('scholarships.add')}</Button>
        </>}
      />

      <div className="grid grid-4 emp-kpis fade-up">
        <StatCard icon={Award} label={t('scholarships.kpi.total')} value={loading ? '–' : fmtNum(list.length)} />
        <StatCard icon={CheckCircle2} tone="green" label={t('scholarships.kpi.open')} value={loading ? '–' : fmtNum(count('open'))} />
        <StatCard icon={CalendarClock} tone="gold" label={t('scholarships.kpi.upcoming')} value={loading ? '–' : fmtNum(count('upcoming'))} />
        <StatCard icon={Lock} tone="red" label={t('scholarships.kpi.closed')} value={loading ? '–' : fmtNum(count('closed'))} />
      </div>

      <Card pad={false} className="emp-section">
        <div className="emp-filters">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('scholarships.search')} aria-label={tc('actions.search')} className="emp-search" />
          <Select value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('students.anyCountry')} aria-label={t('common.country')}
            options={COUNTRIES.map((c) => ({ value: c, label: tc(`countries.${c}`) }))} />
          <Select value={funding} onChange={(e) => setFunding(e.target.value)} placeholder={t('scholarships.anyFunding')} aria-label={t('scholarships.form.funding')}
            options={FUNDING.map((c) => ({ value: c, label: tc(`funding.${c}`) }))} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder={t('scholarships.anyStatus')} aria-label={t('common.status')}
            options={STATUSES.map((c) => ({ value: c, label: tc(`status.${c}`) }))} />
          {(q || country || status || funding) && <button type="button" className="link emp-clear" onClick={() => { setQ(''); setCountry(''); setStatus(''); setFunding(''); }}>{tc('actions.clear')}</button>}
        </div>

        {loading ? <div className="card-body"><SkeletonRows rows={5} /></div> : rows.length ? (
          <div className="table-wrap">
            <table className="table emp-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 230 }}>{t('common.scholarship')}</th>
                  <th>{t('common.country')}</th>
                  <th>{t('scholarships.form.levels')}</th>
                  <th>{t('scholarships.col.requirements')}</th>
                  <th>{t('scholarships.form.funding')}</th>
                  <th>{t('scholarships.col.window')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('scholarships.col.results')}</th>
                  <th aria-label={tc('actions.edit')} />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const d = daysUntil(s.deadline);
                  return (
                    <tr key={s.id}>
                      <td><span className="emp-two-line"><b>{loc(s, 'name')}</b><small>{loc(s, 'university')}</small></span></td>
                      <td className="nowrap">{tc(`countries.${s.country}`)}</td>
                      <td className="nowrap">{s.levels.map((l) => tc(`levels.${l}`)).join(' · ')}</td>
                      <td className="nowrap"><span className="emp-two-line"><b>{t('common.gpa')} <span className="ltr-num">≥ {s.minGpa}</span></b><small className="ltr-num">{s.language?.test} {s.language?.score}</small></span></td>
                      <td><Badge tone={s.funding === 'full' ? 'gold' : undefined}>{tc(`funding.${s.funding}`)}</Badge></td>
                      <td className="nowrap">
                        <span className="emp-two-line">
                          <b>{fmtDate(s.opens, { day: 'numeric', month: 'short' })} – {fmtDate(s.deadline)}</b>
                          <small className={s.status === 'open' && d >= 0 && d <= 30 ? 'emp-urgent' : undefined}>
                            {d >= 0 ? tc('time.daysLeft', { count: d }) : t('scholarships.ended')}
                          </small>
                        </span>
                      </td>
                      <td><Badge tone={statusTone(s.status) || (s.status === 'upcoming' ? 'info' : undefined)}>{tc(`status.${s.status}`)}</Badge></td>
                      <td><Badge tone={RESULT_TONE[s.results]}>{tc(`results.${s.results || 'notStarted'}`)}</Badge></td>
                      <td><Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(s)}>{tc('actions.edit')}</Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Award} title={t('scholarships.empty')} text={tc('empty.text')}
            action={<Button size="sm" icon={Plus} onClick={openNew}>{t('scholarships.add')}</Button>} />
        )}
      </Card>

      <Modal
        open={!!editing}
        width={820}
        title={editing === 'new' ? t('scholarships.newTitle') : t('scholarships.editTitle')}
        onClose={close}
        footer={<>
          <Button variant="ghost" onClick={close}>{tc('actions.cancel')}</Button>
          <Button icon={CheckCircle2} onClick={save} disabled={saving}>{editing === 'new' ? t('scholarships.create') : tc('actions.save')}</Button>
        </>}
      >
        {Object.values(errors).some(Boolean) && <div className="alert">{t('scholarships.errors.summary')}</div>}
        <h4 className="emp-form-title">{t('scholarships.form.basics')}</h4>
        <div className="form-grid">
          <Field label={`${t('scholarships.form.name')} *`} error={errors.name}>
            <Input value={form.name} onChange={set('name')} error={errors.name} dir="ltr" />
          </Field>
          <Field label={t('scholarships.form.nameAr')} hint={t('scholarships.form.optional')}>
            <Input value={form.nameAr} onChange={set('nameAr')} dir="rtl" />
          </Field>
          <Field label={`${t('scholarships.form.university')} *`} error={errors.university}>
            <Input value={form.university} onChange={set('university')} error={errors.university} dir="ltr" />
          </Field>
          <Field label={t('scholarships.form.universityAr')} hint={t('scholarships.form.optional')}>
            <Input value={form.universityAr} onChange={set('universityAr')} dir="rtl" />
          </Field>
          <Field label={`${t('common.country')} *`} error={errors.country}>
            <Select value={form.country} onChange={set('country')} placeholder={t('scholarships.form.pick')}
              className={errors.country ? 'has-error' : undefined} options={COUNTRIES.map((c) => ({ value: c, label: tc(`countries.${c}`) }))} />
          </Field>
          <Field label={`${t('common.status')} *`}>
            <Select value={form.status} onChange={set('status')} options={STATUSES.map((c) => ({ value: c, label: tc(`status.${c}`) }))} />
          </Field>
        </div>

        <h4 className="emp-form-title">{t('scholarships.form.eligibility')}</h4>
        <div className="form-grid">
          <ChipField label={`${t('scholarships.form.levels')} *`} error={errors.levels}>
            {chips('levels', LEVELS, (v) => tc(`levels.${v}`))}
          </ChipField>
          <ChipField label={`${t('scholarships.form.fields')} *`} error={errors.fields}>
            {chips('fields', FIELDS, (v) => tc(`fields.${v}`))}
          </ChipField>
          <Field label={`${t('scholarships.form.gpa')} *`} hint={t('scholarships.form.gpaHint')} error={errors.minGpa}>
            <Input type="number" step="0.1" min="0" max="4" value={form.minGpa} onChange={set('minGpa')} error={errors.minGpa} />
          </Field>
          <Field label={`${t('scholarships.form.language')} *`} error={errors.languageScore}>
            <div className="emp-inline-pair">
              <Select value={form.languageTest} onChange={set('languageTest')} options={TESTS} aria-label={t('scholarships.form.languageTest')} />
              <Input type="number" step="0.5" min="0" value={form.languageScore} onChange={set('languageScore')} error={errors.languageScore} aria-label={t('scholarships.form.languageScore')} placeholder={t('scholarships.form.languageScore')} />
            </div>
          </Field>
          <ChipField label={`${t('scholarships.form.nationalities')} *`} error={errors.nationalities}>
            {chips('nationalities', ['all', ...NATIONALITIES], (v) => tc(`countries.${v}`))}
          </ChipField>
        </div>

        <h4 className="emp-form-title">{t('scholarships.form.fundingDates')}</h4>
        <div className="form-grid">
          <Field label={`${t('scholarships.form.funding')} *`}>
            <Select value={form.funding} onChange={set('funding')} options={FUNDING.map((c) => ({ value: c, label: tc(`funding.${c}`) }))} />
          </Field>
          <Field label={t('scholarships.form.amount')} hint={t('scholarships.form.optional')}>
            <Input value={form.amount} onChange={set('amount')} placeholder="EUR 1,200 / month" dir="ltr" />
          </Field>
          <Field label={`${t('scholarships.form.opens')} *`} error={errors.opens}>
            <Input type="date" value={form.opens} onChange={set('opens')} error={errors.opens} />
          </Field>
          <Field label={`${t('scholarships.form.deadline')} *`} error={errors.deadline}>
            <Input type="date" value={form.deadline} onChange={set('deadline')} error={errors.deadline} min={form.opens || undefined} />
          </Field>
        </div>

        <h4 className="emp-form-title">{t('scholarships.form.requirements')}</h4>
        <div className="form-grid">
          <ChipField label={`${t('scholarships.form.requiredDocs')} *`} error={errors.requirements}>
            {chips('requirements', DOCS, (v) => tc(`docTypes.${v}`))}
          </ChipField>
          <Field label={t('scholarships.form.requirementsNote')} hint={t('scholarships.form.optional')} className="span-2">
            <Textarea value={form.requirementsNote} onChange={set('requirementsNote')} rows={3} placeholder={t('scholarships.form.requirementsPlaceholder')} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
