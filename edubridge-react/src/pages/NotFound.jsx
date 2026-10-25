import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';
import Logo from '@/components/layout/Logo';
import LangToggle from '@/components/layout/LangToggle';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ position: 'fixed', top: 16, insetInlineEnd: 16 }}><LangToggle /></div>
      <div className="fade-up" style={{ maxWidth: 420, display: 'grid', justifyItems: 'center', gap: 14 }}>
        <Logo height={70} />
        <div className="auth-icon" style={{ marginTop: 10 }}><Compass /></div>
        <h1 style={{ fontSize: 30 }}>{t('notFound.title')}</h1>
        <p className="text-muted">{t('notFound.text')}</p>
        <Button to="/">{t('notFound.home')}</Button>
      </div>
    </div>
  );
}
