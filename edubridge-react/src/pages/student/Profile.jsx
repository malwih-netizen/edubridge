import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, CalendarDays, Globe2, GraduationCap, Languages, Mail, MapPin, Phone, RotateCcw, Save, User, Wallet } from 'lucide-react';
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, ProgressBar, Select, Tabs } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { studentService } from '@/services/dataService';
import './student.css';

const COUNTRIES = ['palestine', 'jordan', 'egypt', 'uae', 'saudi', 'canada', 'germany', 'uk', 'usa', 'turkey', 'malaysia', 'australia', 'netherlands'];
const DESTINATIONS = ['canada', 'germany', 'uk', 'usa', 'turkey', 'malaysia', 'australia', 'netherlands'];
const LEVELS = ['bachelor', 'master', 'phd'];
const FIELDS = ['computerScience', 'engineering', 'business', 'publicHealth', 'science', 'humanities'];
const FUNDING = ['full', 'partial', 'self'];
const LANG_TESTS = ['IELTS', 'TOEFL', 'Duolingo', 'PTE'];
const REQUIRED = ['firstName', 'lastName', 'email', 'phone', 'nationality', 'country', 'birthDate', 'level', 'field', 'university', 'gpa', 'graduationYear', 'languageTest', 'languageScore', 'preferredCountries', 'funding'];

/** API shape → flat form state. */
const toForm = (p) => ({
  ...p,
  languageTest: p.language?.test || '',
  languageScore: p.language?.score ?? '',
  preferredCountries: p.preferredCountries || [],
});
/** Flat form state → API shape. */
const toPayload = ({ languageTest, languageScore, ...rest }) => ({
  ...rest,
  gpa: Number(rest.gpa),
  graduationYear: Number(rest.graduationYear),
  language: { test: languageTest, score: Number(languageScore) },
});

const filled = (v) => (Array.isArray(v) ? v.length > 0 : v !== '' && v != null);

export default function StudentProfile() {
  const { t } = useTranslation('student');
  const { t: tc } = useTranslation();
  const { loc, isAr } = useLocalized();
  const uniKey = isAr ? 'universityAr' : 'university';
  const toast = useToast();

  const profile = useAsync(() => studentService.profile(), []);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { if (profile.data) setForm(toForm(profile.data)); }, [profile.data]);

  const dirty = useMemo(() => form && profile.data && JSON.stringify(toForm(profile.data)) !== JSON.stringify(form), [form, profile.data]);
  const completion = form ? Math.round((REQUIRED.filter((k) => filled(form[k])).length / REQUIRED.length) * 100) : 0;

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };
  const toggleCountry = (c) => setForm((f) => ({
    ...f,
    preferredCountries: f.preferredCountries.includes(c) ? f.preferredCountries.filter((x) => x !== c) : [...f.preferredCountries, c],
  }));

  const validate = () => {
    const er = {};
    if (!form.firstName?.trim()) er.firstName = t('profile.errors.required');
    if (!form.lastName?.trim()) er.lastName = t('profile.errors.required');
    if (!/^\S+@\S+\.\S+$/.test(form.email || '')) er.email = t('profile.errors.email');
    const gpa = Number(form.gpa);
    if (Number.isNaN(gpa) || gpa < 0 || gpa > Number(form.gpaScale || 4)) er.gpa = t('profile.errors.gpa', { max: form.gpaScale || 4 });
    if (form.languageScore !== '' && (Number.isNaN(Number(form.languageScore)) || Number(form.languageScore) < 0)) er.languageScore = t('profile.errors.score');
    setErrors(er);
    if (er.firstName || er.lastName || er.email) setTab('personal');
    else if (er.gpa || er.languageScore) setTab('academic');
    return !Object.keys(er).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = toPayload(form);
      await studentService.updateProfile(payload);
      profile.setData(payload);
      toast(tc('toast.saved'));
    } finally {
      setSaving(false);
    }
  };
  const reset = () => { setForm(toForm(profile.data)); setErrors({}); };

  const opts = (keys, ns) => keys.map((k) => ({ value: k, label: tc(`${ns}.${k}`) }));

  if (profile.loading || !form) {
    return (
      <>
        <PageHeader title={t('profile.title')} />
        <div className="prof-layout">
          <div className="card skeleton" style={{ height: 420 }} />
          <div className="card skeleton" style={{ height: 520 }} />
        </div>
      </>
    );
  }

  const fullName = `${loc(form, 'firstName')} ${loc(form, 'lastName')}`.trim();

  return (
    <>
      <PageHeader
        title={t('profile.title')}
       
        actions={<>
          <Button variant="outline" icon={RotateCcw} onClick={reset} disabled={!dirty || saving}>{t('profile.discard')}</Button>
          <Button icon={Save} onClick={save} disabled={!dirty || saving}>{saving ? t('profile.saving') : tc('actions.save')}</Button>
        </>}
      />

      <div className="prof-layout">
        <aside className="prof-side fade-up">
          <div className="card prof-card">
            <div className="prof-id">
              <Avatar name={`${form.firstName} ${form.lastName}`} size="lg" gold />
              <div>
                <h2>{fullName}</h2>
                <p>{tc(`levels.${form.level}`)} · {tc(`fields.${form.field}`)}</p>
              </div>
            </div>
            <div className="prof-complete">
              <div className="row between">
                <span>{t('profile.completion')}</span>
                <b>{completion}%</b>
              </div>
              <ProgressBar value={completion} />
              <small>{completion === 100 ? t('profile.completeDone') : t('profile.completeHint')}</small>
            </div>
            <ul className="prof-facts">
              <li><Globe2 aria-hidden /><span>{t('profile.fields.nationality')}</span><b>{tc(`countries.${form.nationality}`)}</b></li>
              <li><GraduationCap aria-hidden /><span>{t('profile.fields.gpa')}</span><b className="ltr">{form.gpa} / {form.gpaScale}</b></li>
              <li><Languages aria-hidden /><span>{t('profile.fields.language')}</span><b className="ltr">{form.languageTest} {form.languageScore}</b></li>
              <li><Wallet aria-hidden /><span>{t('profile.fields.funding')}</span><b>{tc(`funding.${form.funding}`)}</b></li>
              <li><CalendarDays aria-hidden /><span>{t('profile.fields.intake')}</span><b>{form.intake || '—'}</b></li>
            </ul>
            <div className="prof-targets">
              <small>{t('profile.fields.preferredCountries')}</small>
              <div className="sch-tags">
                {form.preferredCountries.length
                  ? form.preferredCountries.map((c) => <Badge key={c} tone="gold">{tc(`countries.${c}`)}</Badge>)
                  : <span className="text-muted">—</span>}
              </div>
            </div>
          </div>
        </aside>

        <div className="prof-main fade-up">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'personal', label: t('profile.tabs.personal') },
              { value: 'academic', label: t('profile.tabs.academic') },
              { value: 'preferences', label: t('profile.tabs.preferences') },
            ]}
          />

          {tab === 'personal' && (
            <>
              <Card title={t('profile.sections.personal')} subtitle={t('profile.sections.personalSub')} actions={<User className="prof-head-icon" aria-hidden />}>
                <div className="form-grid">
                  <Field label={t('profile.fields.firstName')} error={errors.firstName}>
                    <Input value={form.firstName} onChange={set('firstName')} error={errors.firstName} autoComplete="given-name" />
                  </Field>
                  <Field label={t('profile.fields.lastName')} error={errors.lastName}>
                    <Input value={form.lastName} onChange={set('lastName')} error={errors.lastName} autoComplete="family-name" />
                  </Field>
                  <Field label={t('profile.fields.firstNameAr')}>
                    <Input value={form.firstNameAr || ''} onChange={set('firstNameAr')} dir="rtl" />
                  </Field>
                  <Field label={t('profile.fields.lastNameAr')}>
                    <Input value={form.lastNameAr || ''} onChange={set('lastNameAr')} dir="rtl" />
                  </Field>
                  <Field label={t('profile.fields.nationality')}>
                    <Select value={form.nationality} onChange={set('nationality')} options={opts(COUNTRIES, 'countries')} />
                  </Field>
                  <Field label={t('profile.fields.residence')}>
                    <Select value={form.country} onChange={set('country')} options={opts(COUNTRIES, 'countries')} />
                  </Field>
                  <Field label={t('profile.fields.gender')}>
                    <Select value={form.gender} onChange={set('gender')} options={['female', 'male'].map((g) => ({ value: g, label: t(`profile.gender.${g}`) }))} />
                  </Field>
                  <Field label={t('profile.fields.birthDate')}>
                    <Input type="date" value={form.birthDate || ''} onChange={set('birthDate')} />
                  </Field>
                </div>
              </Card>
              <Card title={t('profile.sections.contact')} subtitle={t('profile.sections.contactSub')}>
                <div className="form-grid">
                  <Field label={t('profile.fields.email')} error={errors.email}>
                    <Input type="email" icon={Mail} value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
                  </Field>
                  <Field label={t('profile.fields.phone')}>
                    <Input type="tel" icon={Phone} value={form.phone} onChange={set('phone')} autoComplete="tel" />
                  </Field>
                </div>
              </Card>
            </>
          )}

          {tab === 'academic' && (
            <>
              <Card title={t('profile.sections.academic')} subtitle={t('profile.sections.academicSub')} actions={<BookOpen className="prof-head-icon" aria-hidden />}>
                <div className="form-grid">
                  <Field label={t('profile.fields.level')}>
                    <Select value={form.level} onChange={set('level')} options={opts(LEVELS, 'levels')} />
                  </Field>
                  <Field label={t('profile.fields.field')}>
                    <Select value={form.field} onChange={set('field')} options={opts(FIELDS, 'fields')} />
                  </Field>
                  <Field label={t('profile.fields.university')} className="span-2">
                    <Input icon={GraduationCap} value={form[uniKey] || ''} onChange={set(uniKey)} />
                  </Field>
                  <Field label={t('profile.fields.gpa')} error={errors.gpa} hint={t('profile.hints.gpa')}>
                    <Input type="number" step="0.01" min="0" value={form.gpa} onChange={set('gpa')} error={errors.gpa} className="ltr-input" />
                  </Field>
                  <Field label={t('profile.fields.gpaScale')}>
                    <Select value={String(form.gpaScale)} onChange={set('gpaScale')} options={['4', '5', '100']} />
                  </Field>
                  <Field label={t('profile.fields.graduationYear')}>
                    <Input type="number" min="1990" max="2035" value={form.graduationYear} onChange={set('graduationYear')} className="ltr-input" />
                  </Field>
                </div>
              </Card>
              <Card title={t('profile.sections.language')} subtitle={t('profile.sections.languageSub')} actions={<Languages className="prof-head-icon" aria-hidden />}>
                <div className="form-grid">
                  <Field label={t('profile.fields.languageTest')}>
                    <Select value={form.languageTest} onChange={set('languageTest')} options={LANG_TESTS} placeholder={t('profile.select')} />
                  </Field>
                  <Field label={t('profile.fields.languageScore')} error={errors.languageScore} hint={t('profile.hints.score')}>
                    <Input type="number" step="0.5" min="0" value={form.languageScore} onChange={set('languageScore')} error={errors.languageScore} className="ltr-input" />
                  </Field>
                </div>
              </Card>
            </>
          )}

          {tab === 'preferences' && (
            <Card title={t('profile.sections.preferences')} subtitle={t('profile.sections.preferencesSub')} actions={<MapPin className="prof-head-icon" aria-hidden />}>
              <div className="stack">
                <div className="field">
                  <span>{t('profile.fields.preferredCountries')}</span>
                  <div className="chips" role="group" aria-label={t('profile.fields.preferredCountries')}>
                    {DESTINATIONS.map((c) => (
                      <button key={c} type="button" className={`chip${form.preferredCountries.includes(c) ? ' on' : ''}`} aria-pressed={form.preferredCountries.includes(c)} onClick={() => toggleCountry(c)}>
                        {tc(`countries.${c}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-grid">
                  <Field label={t('profile.fields.funding')}>
                    <Select value={form.funding} onChange={set('funding')} options={opts(FUNDING, 'funding')} />
                  </Field>
                  <Field label={t('profile.fields.intake')} hint={t('profile.hints.intake')}>
                    <Input value={form.intake || ''} onChange={set('intake')} icon={CalendarDays} />
                  </Field>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
