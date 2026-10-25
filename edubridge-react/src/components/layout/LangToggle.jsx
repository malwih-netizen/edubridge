import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

/** Switches between Arabic and English (icon button); direction (RTL/LTR) follows automatically. */
export default function LangToggle({ onDark = false, withLabel = false }) {
  const { i18n, t } = useTranslation();
  const next = i18n.language === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className={`lang-btn${withLabel ? '' : ' icon-only'}${onDark ? ' on-dark' : ''}`}
      onClick={() => i18n.changeLanguage(next)}
      aria-label={t('language.switchAria')}
      title={t('language.switchLabel')}
      lang={next}
    >
      <Languages aria-hidden />
      {withLabel && <span className={`label${next === 'ar' ? ' alt' : ''}`}>{t('language.switchLabel')}</span>}
    </button>
  );
}
