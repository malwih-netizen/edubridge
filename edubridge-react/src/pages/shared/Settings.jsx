import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell, Camera, Check, Globe2, KeyRound, Laptop, LogOut, Mail, MailCheck, Monitor, Moon, Palette, Save,
  ShieldCheck, Smartphone, Sun, Tablet, Trash2, User, UserCog,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Switch } from '@/components/ui';
import { PasswordStrength } from '@/pages/auth/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { settingsService } from '@/services/dataService';
import { useTheme } from '@/theme';
import './settings.css';

const TABS = [
  { id: 'profile', icon: User },
  { id: 'account', icon: Mail },
  { id: 'security', icon: ShieldCheck },
  { id: 'devices', icon: Monitor },
  { id: 'preferences', icon: Palette },
  { id: 'notifications', icon: Bell },
];

/** Account settings shared by all roles. */
export default function Settings() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((x) => x.id === params.get('tab')) ? params.get('tab') : 'profile';

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="set-layout">
        <nav className="set-nav card" aria-label={t('settings.title')}>
          {TABS.map(({ id, icon: Icon }) => (
            <button key={id} type="button" className={tab === id ? 'active' : undefined} aria-current={tab === id ? 'page' : undefined}
              onClick={() => setParams({ tab: id }, { replace: true })}>
              <Icon aria-hidden /><span>{t(`settings.tabs.${id}`)}</span>
            </button>
          ))}
        </nav>
        <div className="set-body fade-up" key={tab}>
          {tab === 'profile' && <ProfileTab />}
          {tab === 'account' && <AccountTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'devices' && <DevicesTab />}
          {tab === 'preferences' && <PreferencesTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </>
  );
}

/* ---------- Profile ---------- */
function ProfileTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [first, ...rest] = (user?.name || '').split(' ');
  const [f, setF] = useState({ firstName: first || '', lastName: rest.join(' '), nameAr: user?.nameAr || '', phone: '+970 59 123 4567' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => () => photo && URL.revokeObjectURL(photo), [photo]);

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) setPhoto(URL.createObjectURL(file));
  };

  return (
    <Card title={t('settings.profile.title')} subtitle={t('settings.profile.text')}>
      <div className="set-photo">
        {photo ? <img src={photo} alt="" className="set-avatar-img" /> : <Avatar name={user?.name} gold size="lg" />}
        <div>
          <b>{t('settings.profile.photo')}</b>
          <small>{t('settings.profile.photoHint')}</small>
          <div className="row wrap" style={{ marginTop: 8 }}>
            <Button variant="outline" size="sm" icon={Camera} onClick={() => fileRef.current?.click()}>{t('settings.profile.change')}</Button>
            {photo && <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setPhoto(null)}>{t('settings.profile.remove')}</Button>}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={pick} />
          </div>
        </div>
      </div>
      <div className="divider" />
      <form className="form-grid" onSubmit={async (e) => { e.preventDefault(); await settingsService.updateProfile(f); toast(t('settings.profile.saved')); }}>
        <Field label={t('settings.profile.firstName')}><Input value={f.firstName} onChange={set('firstName')} autoComplete="given-name" /></Field>
        <Field label={t('settings.profile.lastName')}><Input value={f.lastName} onChange={set('lastName')} autoComplete="family-name" /></Field>
        <Field label={t('settings.profile.nameAr')}><Input value={f.nameAr} onChange={set('nameAr')} dir="rtl" /></Field>
        <Field label={t('settings.profile.phone')}><Input type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        <Field label={t('settings.profile.role')}><Input value={t(`roles.${user?.role}`)} disabled /></Field>
        <div className="span-2 set-actions"><Button type="submit" icon={Save}>{t('settings.save')}</Button></div>
      </form>
    </Card>
  );
}

/* ---------- Account & email ---------- */
function AccountTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { fmtDate } = useLocalized();
  const toast = useToast();
  const [f, setF] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) er.email = t('settings.account.errEmail');
    else if (f.email.trim().toLowerCase() === user?.email?.toLowerCase()) er.email = t('settings.account.errSame');
    if (!f.password) er.password = t('settings.account.errPassword');
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await settingsService.changeEmail(f.email.trim(), f.password); setPending(f.email.trim()); setF({ email: '', password: '' }); } finally { setBusy(false); }
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card title={t('settings.account.title')} subtitle={t('settings.account.text')}>
        <div className="set-current">
          <span className="set-ico"><Mail aria-hidden /></span>
          <div className="grow"><small>{t('settings.account.current')}</small><b className="ltr">{user?.email}</b></div>
          <Badge tone="success" icon={Check}>{t('settings.account.verified')}</Badge>
        </div>

        {pending ? (
          <div className="set-pending">
            <MailCheck aria-hidden />
            <div className="grow"><b>{t('settings.account.sentTitle')}</b><small>{t('settings.account.sentText', { email: pending })}</small></div>
            <Button variant="ghost" size="sm" onClick={() => setPending('')}>{t('settings.account.cancel')}</Button>
          </div>
        ) : (
          <form className="form-grid" style={{ marginTop: 16 }} onSubmit={submit} noValidate>
            <Field label={t('settings.account.newEmail')} error={errors.email}>
              <Input icon={Mail} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" error={errors.email} />
            </Field>
            <Field label={t('settings.account.password')} error={errors.password}>
              <Input icon={KeyRound} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" error={errors.password} />
            </Field>
            <div className="span-2 set-actions"><Button type="submit" disabled={busy}>{t('settings.account.change')}</Button></div>
          </form>
        )}
      </Card>

      <Card title={t('settings.account.infoTitle')}>
        <dl className="set-info">
          <div><dt>{t('settings.account.id')}</dt><dd className="ltr">EB-{String(user?.id ?? 0).padStart(5, '0')}</dd></div>
          <div><dt>{t('settings.account.type')}</dt><dd>{t(`roles.${user?.role}`)}</dd></div>
          <div><dt>{t('settings.account.since')}</dt><dd>{fmtDate('2026-09-01')}</dd></div>
        </dl>
      </Card>

      <div className="card set-danger">
        <div className="grow"><b>{t('settings.account.dangerTitle')}</b><small>{t('settings.account.dangerText')}</small></div>
        <Button variant="danger" icon={UserCog} onClick={() => toast(t('settings.account.deactivated'))}>{t('settings.account.deactivate')}</Button>
      </div>
    </div>
  );
}

/* ---------- Security ---------- */
function SecurityTab() {
  const { t } = useTranslation('common');
  const { t: ta } = useTranslation('auth');
  const { fmtDate } = useLocalized();
  const toast = useToast();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [sec, setSec] = useState({ twoFa: false, alerts: true });

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!pw.current) er.current = t('settings.security.errCurrent');
    if (pw.next.length < 8) er.next = t('settings.security.errLength');
    if (pw.confirm !== pw.next) er.confirm = t('settings.security.errMatch');
    setErrors(er);
    if (Object.keys(er).length) return;
    await settingsService.changePassword(pw.current, pw.next);
    setPw({ current: '', next: '', confirm: '' });
    toast(t('settings.security.updated'));
  }

  const toggle = async (k, v) => {
    const next = { ...sec, [k]: v };
    setSec(next);
    await settingsService.updateSecurity(next);
    toast(t('toast.saved'));
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card title={t('settings.security.title')} subtitle={t('settings.security.lastChanged', { date: fmtDate('2026-09-14') })}>
        <form className="form-grid" onSubmit={submit} noValidate>
          <Field className="span-2" label={t('settings.security.current')} error={errors.current}>
            <Input icon={KeyRound} type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" error={errors.current} />
          </Field>
          <Field label={t('settings.security.new')} error={errors.next}>
            <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" error={errors.next} />
          </Field>
          <Field label={t('settings.security.confirm')} error={errors.confirm}>
            <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" error={errors.confirm} />
          </Field>
          <div className="span-2"><PasswordStrength value={pw.next} labels={ta('register.strength', { returnObjects: true })} /></div>
          <div className="span-2 set-actions"><Button type="submit">{t('settings.security.update')}</Button></div>
        </form>
      </Card>

      <Card>
        <div className="stack" style={{ gap: 18 }}>
          <Switch checked={sec.twoFa} onChange={(v) => toggle('twoFa', v)} label={t('settings.security.twoFaTitle')} description={t('settings.security.twoFaText')} />
          <div className="divider" style={{ margin: 0 }} />
          <Switch checked={sec.alerts} onChange={(v) => toggle('alerts', v)} label={t('settings.security.alertsTitle')} description={t('settings.security.alertsText')} />
        </div>
      </Card>
    </div>
  );
}

/* ---------- Devices ---------- */
const DEVICE_ICON = { laptop: Laptop, phone: Smartphone, tablet: Tablet };
function DevicesTab() {
  const { t } = useTranslation();
  const { loc } = useLocalized();
  const toast = useToast();
  const { data, loading, setData } = useAsync(() => settingsService.sessions(), []);

  const ago = (iso) => {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 2) return t('settings.devices.active');
    const when = m < 60 ? t('time.minutesAgo', { count: m }) : m < 1440 ? t('time.hoursAgo', { count: Math.round(m / 60) }) : t('time.daysAgo', { count: Math.round(m / 1440) });
    return t('settings.devices.lastActive', { when });
  };
  const revoke = async (id) => { await settingsService.revokeSession(id); setData((list) => list.filter((s) => s.id !== id)); toast(t('settings.devices.signedOut')); };
  const revokeAll = async () => { await settingsService.revokeOthers(); setData((list) => list.filter((s) => s.current)); toast(t('settings.devices.signedOutAll')); };
  const others = (data || []).filter((s) => !s.current).length;

  return (
    <Card
      title={t('settings.devices.title')}
      subtitle={t('settings.devices.text')}
      actions={others > 0 && <Button variant="outline" size="sm" icon={LogOut} onClick={revokeAll}>{t('settings.devices.signOutAll')}</Button>}
    >
      {loading && <div className="skeleton" style={{ height: 180 }} />}
      <ul className="set-devices">
        {(data || []).map((s) => {
          const Icon = DEVICE_ICON[s.type] || Laptop;
          return (
            <li key={s.id} className={s.current ? 'current' : undefined}>
              <span className="set-ico"><Icon aria-hidden /></span>
              <div className="grow">
                <b>{s.browser} · <span className="ltr">{s.os}</span></b>
                <small>{loc(s, 'city')} · {ago(s.lastActive)}</small>
              </div>
              {s.current
                ? <Badge tone="success">{t('settings.devices.thisDevice')}</Badge>
                : <Button variant="ghost" size="sm" icon={LogOut} onClick={() => revoke(s.id)}>{t('settings.devices.signOut')}</Button>}
            </li>
          );
        })}
      </ul>
      {data && others === 0 && <p className="text-muted" style={{ marginTop: 12, fontSize: 13 }}>{t('settings.devices.none')}</p>}
    </Card>
  );
}

/* ---------- Preferences: language + theme ---------- */
function PreferencesTab() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useTheme();
  const THEME_OPTS = [{ id: 'light', icon: Sun }, { id: 'dark', icon: Moon }, { id: 'system', icon: Monitor }];

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Card title={t('settings.preferences.langTitle')} subtitle={t('settings.preferences.langText')}>
        <div className="set-choice">
          {[{ id: 'ar', label: 'العربية', sub: 'RTL' }, { id: 'en', label: 'English', sub: 'LTR' }].map((l) => (
            <button key={l.id} type="button" lang={l.id} className={i18n.language === l.id ? 'on' : undefined} onClick={() => i18n.changeLanguage(l.id)} aria-pressed={i18n.language === l.id}>
              <Globe2 aria-hidden />
              <span><b>{l.label}</b><small>{l.sub}</small></span>
              {i18n.language === l.id && <Check className="tick" aria-hidden />}
            </button>
          ))}
        </div>
      </Card>

      <Card title={t('settings.preferences.themeTitle')} subtitle={t('settings.preferences.themeText')}>
        <div className="set-themes">
          {THEME_OPTS.map(({ id, icon: Icon }) => (
            <button key={id} type="button" className={theme === id ? 'on' : undefined} onClick={() => setTheme(id)} aria-pressed={theme === id}>
              <span className={`set-preview ${id}`} aria-hidden><i /><i /><i /></span>
              <span className="set-theme-label"><Icon aria-hidden />{t(`settings.preferences.${id}`)}</span>
              {id === 'system' && <small>{t('settings.preferences.systemHint')}</small>}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Notifications ---------- */
const NOTIF_ITEMS = ['requests', 'documents', 'deadlines', 'matches', 'messages'];
function NotificationsTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const [prefs, setPrefs] = useState(() => Object.fromEntries(NOTIF_ITEMS.map((k) => [k, { email: k !== 'messages', inApp: true }])));
  const flip = (k, ch) => setPrefs({ ...prefs, [k]: { ...prefs[k], [ch]: !prefs[k][ch] } });

  return (
    <Card title={t('settings.notifications.title')} subtitle={t('settings.notifications.text')}>
      <div className="table-wrap">
        <table className="set-notif">
          <thead><tr><th /><th>{t('settings.notifications.email')}</th><th>{t('settings.notifications.inApp')}</th></tr></thead>
          <tbody>
            {NOTIF_ITEMS.map((k) => (
              <tr key={k}>
                <td>{t(`settings.notifications.items.${k}`)}</td>
                {['email', 'inApp'].map((ch) => (
                  <td key={ch}>
                    <button type="button" role="switch" aria-checked={prefs[k][ch]} aria-label={`${t(`settings.notifications.items.${k}`)} — ${t(`settings.notifications.${ch}`)}`}
                      className={`switch${prefs[k][ch] ? ' on' : ''}`} onClick={() => flip(k, ch)}><span /></button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="set-actions" style={{ marginTop: 16 }}>
        <Button icon={Save} onClick={async () => { await settingsService.updateNotifications(prefs); toast(t('settings.notifications.saved')); }}>{t('settings.save')}</Button>
      </div>
    </Card>
  );
}
