import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail, ShieldCheck, UserCog } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { homeFor, useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLocalized } from '@/hooks';
import PageLoader from '@/components/layout/PageLoader';
import AuthLayout from './AuthLayout';

const DEMOS = [
  { role: 'student', email: 'student@edubridge.app', icon: GraduationCap },
  { role: 'employee', email: 'advisor@edubridge.app', icon: UserCog },
  { role: 'admin', email: 'admin@edubridge.app', icon: ShieldCheck },
];

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" /></svg>
);
const AppleMark = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.3 3-2.5a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.1-4.2zM13.9 5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" /></svg>
);

export default function Login() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const { login } = useAuth();
  const { loc } = useLocalized();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [failed, setFailed] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }); setErrors({ ...errors, [k]: null }); setFailed(false); };

  function validate() {
    const e = {};
    if (!form.email) e.email = t('validation.required');
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = t('validation.email');
    if (!form.password) e.password = t('validation.required');
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const user = await login(form);
      toast(t('signin.welcome', { name: loc(user, 'name') }));
      const from = new URLSearchParams(location.search).get('next') || location.state?.from;
      navigate(from && from.startsWith(homeFor(user.role)) ? from : homeFor(user.role), { replace: true });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const fillDemo = (email) => { setForm({ ...form, email, password: 'demo1234' }); setErrors({}); setFailed(false); };

  return (
    <AuthLayout>
      <header className="auth-head">      {busy && <PageLoader />}

        <h2>{t('signin.title')}</h2>
        <p>{t('signin.subtitle')}</p>
      </header>

      {failed && <div className="alert" role="alert"><AlertCircle aria-hidden />{t('signin.invalid')}</div>}

      <form className="stack" onSubmit={submit} noValidate>
        <Field label={t('signin.email')} error={errors.email}>
          <Input icon={Mail} type="email" autoComplete="email" placeholder={t('signin.emailPh')} value={form.email} onChange={set('email')} error={errors.email} />
        </Field>
        <Field label={t('signin.password')} error={errors.password}>
          <Input
            icon={Lock} type={show ? 'text' : 'password'} autoComplete="current-password" placeholder={t('signin.passwordPh')}
            value={form.password} onChange={set('password')} error={errors.password}
            action={<button type="button" className="input-action" onClick={() => setShow(!show)} aria-label={show ? t('hide') : t('show')}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
          />
        </Field>
        <div className="row between wrap">
          <label className="check"><input type="checkbox" checked={form.remember} onChange={set('remember')} />{t('signin.remember')}</label>
          <Link to="/forgot-password" className="link">{t('signin.forgot')}</Link>
        </div>
        <Button type="submit" size="lg" block iconEnd={ArrowRight} disabled={busy}>{busy ? '…' : t('signin.submit')}</Button>
      </form>

      <div className="auth-or"><span>{t('signin.or')}</span></div>
      <div className="grid grid-2" style={{ gap: 10 }}>
        <Button variant="outline" onClick={() => toast(t('signin.sso'))}><GoogleMark />{t('signin.google')}</Button>
        <Button variant="outline" onClick={() => toast(t('signin.sso'))}><AppleMark />{t('signin.apple')}</Button>
      </div>

      <p className="auth-switch">{t('signin.noAccount')} <Link to={`/register${location.search}`} className="link">{t('signin.create')}</Link></p>

      <div className="demo-box">
        <div className="demo-head"><b>{t('signin.demo')}</b><small>{t('signin.demoHint')}</small></div>
        <div className="demo-roles">
          {DEMOS.map((d) => (
            <button key={d.role} type="button" onClick={() => fillDemo(d.email)} className={form.email === d.email ? 'active' : undefined}>
              <d.icon aria-hidden />{tc(`roles.${d.role}`)}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
