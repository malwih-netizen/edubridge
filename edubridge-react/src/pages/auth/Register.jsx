import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Mail, MailCheck, Phone, RotateCw } from 'lucide-react';
import { Button, Field, Input, Select } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import PageLoader from '@/components/layout/PageLoader';
import AuthLayout, { PasswordStrength } from './AuthLayout';

const STEPS = ['account', 'personal', 'academic', 'goals', 'review'];
const COUNTRIES = ['canada', 'germany', 'uk', 'usa', 'turkey', 'malaysia', 'australia', 'netherlands'];
const NATIONALITIES = ['palestine', 'jordan', 'egypt', 'saudi', 'uae'];
const FIELDS = ['computerScience', 'engineering', 'business', 'publicHealth', 'science', 'humanities'];

export default function Register() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = new URLSearchParams(location.search).get('next');
  const [step, setStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [f, setF] = useState({
    firstName: '', lastName: '', email: '', password: '', confirm: '', terms: false,
    birth: '', gender: '', nationality: '', phone: '', city: '',
    currentLevel: '', level: 'master', field: '', gpa: '', institution: '', language: '',
    countries: [], intake: '', funding: 'full', help: 'full', alerts: true,
  });
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }); setErrors({ ...errors, [k]: null }); };
  const toggleCountry = (c) => setF((s) => ({ ...s, countries: s.countries.includes(c) ? s.countries.filter((x) => x !== c) : s.countries.length < 3 ? [...s.countries, c] : s.countries }));

  const req = (keys, e) => keys.forEach((k) => { if (!String(f[k]).trim()) e[k] = t('validation.required'); });
  function validate() {
    const e = {};
    if (step === 0) {
      req(['firstName', 'lastName', 'email', 'password', 'confirm'], e);
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = t('validation.email');
      if (f.password && f.password.length < 8) e.password = t('validation.password');
      if (f.confirm && f.confirm !== f.password) e.confirm = t('validation.match');
      if (!f.terms) e.terms = t('validation.terms');
    }
    if (step === 1) req(['gender', 'nationality'], e);
    if (step === 2) {
      req(['currentLevel', 'field', 'gpa'], e);
      const g = Number(f.gpa);
      if (f.gpa && (Number.isNaN(g) || g < 0 || g > 100)) e.gpa = t('validation.gpa');
    }
    setErrors(e);
    return !Object.keys(e).length;
  }

  const next = () => validate() && setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function finish() {
    setBusy(true);
    try {
      await register(f);
      setConfirmed(true);
      window.scrollTo(0, 0);
    } finally { setBusy(false); }
  }

  const reviewRows = [
    [t('register.firstName'), `${f.firstName} ${f.lastName}`],
    [t('signin.email'), f.email],
    [t('register.nationality'), f.nationality && tc(`countries.${f.nationality}`)],
    [t('register.field'), f.field && t(`register.fields.${f.field}`)],
    [t('register.targetLevel'), tc(`levels.${f.level}`)],
    [t('register.gpa'), f.gpa],
    [t('register.countries'), f.countries.map((c) => tc(`countries.${c}`)).join('، ')],
    [t('register.funding'), tc(`funding.${f.funding}`)],
  ];

  // بعد إنشاء الحساب: رسالة تأكيد البريد الإلكتروني
  if (confirmed) {
    return (
      <AuthLayout>
        <div className="stack" style={{ textAlign: 'center', justifyItems: 'center' }}>
          <div className="auth-icon success"><MailCheck aria-hidden /></div>
          <header className="auth-head" style={{ textAlign: 'center' }}>
            <h2>{t('register.confirmTitle')}</h2>
            <p>{t('register.confirmText')}</p>
          </header>
          <div className="confirm-email ltr">{f.email}</div>
          <p className="text-muted" style={{ fontSize: 13 }}>{t('register.confirmHint')}</p>
          <Button size="lg" block iconEnd={ArrowRight} onClick={() => { toast(t('register.created')); navigate(nextPath && nextPath.startsWith('/student') ? nextPath : '/student', { replace: true }); }}>
            {t('register.confirmContinue')}
          </Button>
          <Button variant="ghost" icon={RotateCw} onClick={async () => { await authService.resendConfirmation(f.email); toast(t('register.confirmResent')); }}>
            {t('register.confirmResend')}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide>
      {busy && <PageLoader />}
      <header className="auth-head">
        <span className="badge badge-gold">{t('register.stepOf', { n: step + 1, total: STEPS.length })}</span>
        <h2>{t('register.title')}</h2>
        <p>{t('register.subtitle')}</p>
      </header>

      <ol className="reg-steps" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'current' : undefined}>
            <span className="node">{i < step ? <Check size={14} /> : i + 1}</span>
            <span className="lbl">{t(`register.steps.${s}`)}</span>
          </li>
        ))}
      </ol>

      <div className="reg-body fade-up" key={step}>
        {step === 0 && (
          <div className="form-grid">
            <Field label={t('register.firstName')} error={errors.firstName}><Input value={f.firstName} onChange={set('firstName')} placeholder={t('register.firstNamePh')} autoComplete="given-name" error={errors.firstName} /></Field>
            <Field label={t('register.lastName')} error={errors.lastName}><Input value={f.lastName} onChange={set('lastName')} placeholder={t('register.lastNamePh')} autoComplete="family-name" error={errors.lastName} /></Field>
            <Field className="span-2" label={t('signin.email')} error={errors.email}><Input icon={Mail} type="email" value={f.email} onChange={set('email')} placeholder={t('signin.emailPh')} autoComplete="email" error={errors.email} /></Field>
            <Field label={t('register.password')} error={errors.password}><Input type="password" value={f.password} onChange={set('password')} placeholder={t('register.passwordPh')} autoComplete="new-password" error={errors.password} /></Field>
            <Field label={t('register.confirm')} error={errors.confirm}><Input type="password" value={f.confirm} onChange={set('confirm')} placeholder={t('register.confirmPh')} autoComplete="new-password" error={errors.confirm} /></Field>
            <div className="span-2"><PasswordStrength value={f.password} labels={t('register.strength', { returnObjects: true })} /></div>
            <div className="span-2">
              <label className="check"><input type="checkbox" checked={f.terms} onChange={set('terms')} />{t('register.terms')}</label>
              {errors.terms && <small className="error" style={{ display: 'block', color: 'var(--danger)', fontSize: 11.5, marginTop: 4 }}>{errors.terms}</small>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="form-grid">
            <Field label={t('register.birth')}><Input type="date" value={f.birth} onChange={set('birth')} /></Field>
            <Field label={t('register.gender')} error={errors.gender}>
              <Select value={f.gender} onChange={set('gender')} placeholder={t('register.select')} options={[{ value: 'female', label: t('register.female') }, { value: 'male', label: t('register.male') }]} />
            </Field>
            <Field label={t('register.nationality')} error={errors.nationality}>
              <Select value={f.nationality} onChange={set('nationality')} placeholder={t('register.select')} options={NATIONALITIES.map((c) => ({ value: c, label: tc(`countries.${c}`) }))} />
            </Field>
            <Field label={t('register.phone')}><Input icon={Phone} type="tel" value={f.phone} onChange={set('phone')} placeholder="+970 5X XXX XXXX" autoComplete="tel" /></Field>
            <Field className="span-2" label={t('register.city')}><Input value={f.city} onChange={set('city')} placeholder={t('register.cityPh')} /></Field>
          </div>
        )}

        {step === 2 && (
          <div className="form-grid">
            <Field label={t('register.level')} error={errors.currentLevel}>
              <Select value={f.currentLevel} onChange={set('currentLevel')} placeholder={t('register.select')} options={[{ value: 'highSchool', label: t('register.highSchool') }, ...['bachelor', 'master'].map((l) => ({ value: l, label: tc(`levels.${l}`) }))]} />
            </Field>
            <Field label={t('register.targetLevel')}>
              <Select value={f.level} onChange={set('level')} options={['bachelor', 'master', 'phd'].map((l) => ({ value: l, label: tc(`levels.${l}`) }))} />
            </Field>
            <Field label={t('register.field')} error={errors.field}>
              <Select value={f.field} onChange={set('field')} placeholder={t('register.select')} options={FIELDS.map((x) => ({ value: x, label: t(`register.fields.${x}`) }))} />
            </Field>
            <Field label={t('register.gpa')} error={errors.gpa}><Input inputMode="decimal" value={f.gpa} onChange={set('gpa')} placeholder="3.6" className="ltr-input" error={errors.gpa} /></Field>
            <Field label={t('register.institution')}><Input value={f.institution} onChange={set('institution')} placeholder={t('register.institutionPh')} /></Field>
            <Field label={t('register.language')}>
              <Select value={f.language} onChange={set('language')} placeholder={t('register.select')} options={Object.keys(t('register.languageLevels', { returnObjects: true })).map((k) => ({ value: k, label: t(`register.languageLevels.${k}`) }))} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="stack" style={{ gap: 16 }}>
            <Field label={t('register.countries')} hint={t('register.countriesHint')}>
              <div className="chips">
                {COUNTRIES.map((c) => (
                  <button type="button" key={c} className={`chip${f.countries.includes(c) ? ' on' : ''}`} onClick={() => toggleCountry(c)} aria-pressed={f.countries.includes(c)}>
                    {f.countries.includes(c) && <Check size={13} />}{tc(`countries.${c}`)}
                  </button>
                ))}
              </div>
            </Field>
            <div className="form-grid">
              <Field label={t('register.intake')}>
                <Select value={f.intake} onChange={set('intake')} placeholder={t('register.select')} options={Object.keys(t('register.intakes', { returnObjects: true })).map((k) => ({ value: k, label: t(`register.intakes.${k}`) }))} />
              </Field>
              <Field label={t('register.funding')}>
                <Select value={f.funding} onChange={set('funding')} options={['full', 'partial', 'self'].map((k) => ({ value: k, label: tc(`funding.${k}`) }))} />
              </Field>
            </div>
            <Field label={t('register.help')}>
              <div className="radio-cards">
                {['full', 'partial', 'no'].map((k) => (
                  <label key={k} className={f.help === k ? 'on' : undefined}>
                    <input type="radio" name="help" value={k} checked={f.help === k} onChange={set('help')} />
                    {t(`register.help${k[0].toUpperCase()}${k.slice(1)}`)}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="stack">
            <div><h3 style={{ fontSize: 18 }}>{t('register.review')}</h3><p className="text-muted" style={{ marginTop: 4 }}>{t('register.reviewText')}</p></div>
            <dl className="review-list">
              {reviewRows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}
            </dl>
            <label className="check"><input type="checkbox" checked={f.alerts} onChange={set('alerts')} />{t('register.alerts')}</label>
          </div>
        )}
      </div>

      <div className="reg-nav">
        {step > 0 ? <Button variant="outline" icon={ArrowLeft} onClick={back} className="reg-back">{tc('actions.back')}</Button> : <span />}
        {step < STEPS.length - 1
          ? <Button iconEnd={ArrowRight} onClick={next}>{tc('actions.continue')}</Button>
          : <Button iconEnd={Check} onClick={finish} disabled={busy}>{t('register.finish')}</Button>}
      </div>

      <p className="auth-switch">{t('register.haveAccount')} <Link to={`/login${location.search}`} className="link">{t('register.signin')}</Link></p>
    </AuthLayout>
  );
}
