import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send, User } from 'lucide-react';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { contactService } from '@/services/dataService';

const EMPTY = { name: '', email: '', phone: '', subject: 'general', message: '', consent: false };
const SUBJECTS = ['general', 'scholarships', 'services', 'support'];

/** "Contact us" section: info panel + validated message form. */
export default function ContactSection() {
  const { t } = useTranslation('public');
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    setErrors({ ...errors, [k]: null });
  };

  function validate() {
    const e = {};
    if (f.name.trim().length < 3) e.name = t('contact.errName');
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t('contact.errEmail');
    if (f.phone.replace(/\D/g, '').length < 9) e.phone = t('contact.errPhone');
    if (f.message.trim().length < 10) e.message = t('contact.errMessage');
    if (!f.consent) e.consent = t('contact.errConsent');
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await contactService.send(f);
      setSentTo(f.email.trim());
      toast(t('contact.sentTitle'));
      setF(EMPTY);
    } finally {
      setBusy(false);
    }
  }

  const info = [
    { icon: Phone, label: t('contact.phoneLabel'), value: <a href={`tel:${t('contact.phoneValue').replace(/\s/g, '')}`} className="ltr">{t('contact.phoneValue')}</a> },
    { icon: Mail, label: t('contact.emailLabel'), value: <a href={`mailto:${t('footer.email')}`} className="ltr">{t('footer.email')}</a> },
    { icon: Clock, label: t('contact.hoursLabel'), value: t('footer.hours') },
    { icon: MapPin, label: t('contact.locationLabel'), value: t('footer.location') },
  ];

  return (
    <section className="pub-section pub-contact-sec" id="contact">
      <div className="pub-contact-grid">
        <aside className="pub-contact-info">
          <h2>{t('contact.title')}</h2>
          <p className="pub-contact-lead">{t('contact.text')}</p>
          <h3>{t('contact.infoTitle')}</h3>
          <ul>
            {info.map(({ icon: Icon, label, value }) => (
              <li key={label}>
                <span className="pci-icon"><Icon aria-hidden /></span>
                <span><small>{label}</small><b>{value}</b></span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="card pub-contact-form">
          {sentTo ? (
            <div className="pub-contact-done">
              <span className="auth-icon success"><CheckCircle2 aria-hidden /></span>
              <h3>{t('contact.sentTitle')}</h3>
              <p>{t('contact.sentText', { email: sentTo })}</p>
              <Button variant="outline" onClick={() => setSentTo('')}>{t('contact.another')}</Button>
            </div>
          ) : (
            <form className="form-grid" onSubmit={submit} noValidate>
              <Field label={t('contact.name')} error={errors.name}>
                <Input icon={User} value={f.name} onChange={set('name')} placeholder={t('contact.namePh')} autoComplete="name" error={errors.name} />
              </Field>
              <Field label={t('contact.subject')}>
                <Select value={f.subject} onChange={set('subject')} options={SUBJECTS.map((s) => ({ value: s, label: t(`contact.subjects.${s}`) }))} />
              </Field>
              <Field label={t('contact.email')} error={errors.email}>
                <Input icon={Mail} type="email" value={f.email} onChange={set('email')} placeholder={t('contact.emailPh')} autoComplete="email" error={errors.email} />
              </Field>
              <Field label={t('contact.phone')} error={errors.phone}>
                <Input icon={Phone} type="tel" value={f.phone} onChange={set('phone')} placeholder={t('contact.phonePh')} autoComplete="tel" error={errors.phone} />
              </Field>
              <Field className="span-2" label={t('contact.message')} error={errors.message}>
                <Textarea rows={5} value={f.message} onChange={set('message')} placeholder={t('contact.messagePh')} />
              </Field>
              <div className="span-2">
                <label className="check"><input type="checkbox" checked={f.consent} onChange={set('consent')} />{t('contact.consent')}</label>
                {errors.consent && <small className="pub-contact-err">{errors.consent}</small>}
              </div>
              <div className="span-2">
                <Button type="submit" size="lg" block icon={Send} disabled={busy} className="pub-contact-send">{busy ? t('contact.sending') : t('contact.send')}</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
