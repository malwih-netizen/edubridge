import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';

/** Full-screen loading overlay: blurred page behind, logo inside a spinning ring. */
export default function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-mark">
        <svg className="page-loader-ring" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r="54" className="track" />
          <circle cx="60" cy="60" r="54" className="arc" />
        </svg>
        <img src={logo} alt="" />
      </div>
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
