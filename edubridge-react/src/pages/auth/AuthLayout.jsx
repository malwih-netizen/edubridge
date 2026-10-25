import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Globe2, ListChecks, UsersRound } from 'lucide-react';
import LangToggle from '@/components/layout/LangToggle';
import Logo from '@/components/layout/Logo';

/** Split screen used by sign in, register and password reset. */
export default function AuthLayout({ children, wide = false }) {
  const { t } = useTranslation('auth');
  return (
    <div className="auth">
      <aside className="auth-story">
        <div className="auth-arches" aria-hidden><span /><span /><span /></div>
        <Logo dark height={96} />
        <div className="auth-story-copy">
          <h1>{t('story.title1')} <em>{t('story.titleEm')}</em> {t('story.title2')}</h1>
          <p className="auth-lead">{t('story.text')}</p>
          <ul className="auth-points">
            <li><Globe2 aria-hidden />{t('story.p1')}</li>
            <li><UsersRound aria-hidden />{t('story.p2')}</li>
            <li><ListChecks aria-hidden />{t('story.p3')}</li>
          </ul>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-top">
          <Link to="/" className="auth-back"><ArrowLeft className="flip-rtl" aria-hidden />{t('backHome')}</Link>
          <LangToggle />
        </div>
        <div className={`auth-panel fade-up${wide ? ' wide' : ''}`}>{children}</div>
      </main>
    </div>
  );
}

export function PasswordStrength({ value, labels }) {
  let s = 0;
  if (value.length >= 8) s++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) s++;
  if (/\d/.test(value)) s++;
  if (/[^A-Za-z0-9]/.test(value)) s++;
  if (!value) s = 0;
  return (
    <div className="strength" data-level={s}>
      <div className="strength-bars" aria-hidden><i /><i /><i /><i /></div>
      <small>{labels[s]}</small>
    </div>
  );
}
