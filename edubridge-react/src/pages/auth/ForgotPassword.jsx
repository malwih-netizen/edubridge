import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, KeyRound, Mail, MailCheck } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import AuthLayout, { PasswordStrength } from './AuthLayout';

export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const toast = useToast();
  const [stage, setStage] = useState('email'); // email → code → reset → done
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [pw, setPw] = useState({ a: '', b: '' });
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [resetToken, setResetToken] = useState('');
  const refs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const id = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  async function sendCode(e) {
    e?.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(t('validation.email'));
    setError('');
    const r = await authService.forgotPassword(email);
    if (r?.devCode) toast(`Dev code: ${r.devCode}`); // يظهر فقط عندما يعمل الـ API بوضع التطوير المحلي
    setStage('code');
    setTimer(45);
    setTimeout(() => refs.current[0]?.focus(), 50);
    return undefined;
  }

  function typeDigit(i, v) {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  }
  function onPaste(e) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length) { e.preventDefault(); setCode([...digits, ...Array(6 - digits.length).fill('')]); refs.current[Math.min(digits.length, 5)]?.focus(); }
  }

  async function verify(e) {
    e.preventDefault();
    try { const r = await authService.verifyCode(email, code.join('')); setResetToken(r.resetToken); setStage('reset'); setError(''); } catch { setError(t('validation.required')); }
  }

  async function reset(e) {
    e.preventDefault();
    if (pw.a.length < 8) return setError(t('validation.password'));
    if (pw.a !== pw.b) return setError(t('validation.match'));
    await authService.resetPassword(resetToken, pw.a);
    setStage('done');
    return undefined;
  }

  const mmss = `0:${String(timer).padStart(2, '0')}`;

  return (
    <AuthLayout>
      {stage === 'email' && (
        <form className="stack" onSubmit={sendCode} noValidate>
          <div className="auth-icon"><KeyRound aria-hidden /></div>
          <header className="auth-head"><h2>{t('forgot.title')}</h2><p>{t('forgot.subtitle')}</p></header>
          <Field label={t('signin.email')} error={error}><Input icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('signin.emailPh')} error={error} /></Field>
          <Button type="submit" size="lg" block iconEnd={ArrowRight}>{t('forgot.send')}</Button>
        </form>
      )}

      {stage === 'code' && (
        <form className="stack" onSubmit={verify}>
          <div className="auth-icon"><MailCheck aria-hidden /></div>
          <header className="auth-head"><h2>{t('forgot.codeTitle')}</h2><p>{t('forgot.codeText', { email })}</p></header>
          <div className="code-inputs" onPaste={onPaste}>
            {code.map((d, i) => (
              <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" maxLength={1} value={d} aria-label={`Digit ${i + 1}`}
                onChange={(e) => typeDigit(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()} />
            ))}
          </div>
          <small className="text-muted" style={{ textAlign: 'center' }}>{t('forgot.codeHint')}</small>
          <Button type="submit" size="lg" block disabled={code.join('').length < 6}>{t('forgot.verify')}</Button>
          <div style={{ textAlign: 'center' }}>
            {timer > 0
              ? <small className="text-muted">{t('forgot.resendIn', { time: mmss })}</small>
              : <button type="button" className="link" onClick={() => { setTimer(45); toast(t('forgot.resent')); }}>{t('forgot.resend')}</button>}
          </div>
        </form>
      )}

      {stage === 'reset' && (
        <form className="stack" onSubmit={reset} noValidate>
          <div className="auth-icon"><KeyRound aria-hidden /></div>
          <header className="auth-head"><h2>{t('forgot.newTitle')}</h2><p>{t('forgot.newText')}</p></header>
          <Field label={t('forgot.newPassword')}><Input type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} autoComplete="new-password" /></Field>
          <PasswordStrength value={pw.a} labels={t('register.strength', { returnObjects: true })} />
          <Field label={t('register.confirm')} error={error}><Input type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} autoComplete="new-password" error={error} /></Field>
          <Button type="submit" size="lg" block>{t('forgot.update')}</Button>
        </form>
      )}

      {stage === 'done' && (
        <div className="stack" style={{ textAlign: 'center' }}>
          <div className="auth-icon success"><CheckCircle2 aria-hidden /></div>
          <header className="auth-head" style={{ textAlign: 'center' }}><h2>{t('forgot.doneTitle')}</h2><p>{t('forgot.doneText')}</p></header>
          <Button to="/login" size="lg" block>{t('forgot.toSignin')}</Button>
        </div>
      )}

      {stage !== 'done' && <p className="auth-switch"><Link to="/login" className="link">{t('forgot.toSignin')}</Link></p>}
    </AuthLayout>
  );
}
