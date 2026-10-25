import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

/** Brand logo. `dark` = white wordmark for navy backgrounds. */
export default function Logo({ dark = false, to = '/', height = 44, className }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className={className} aria-label={t('brand')}>
      <img src={dark ? logoDark : logo} alt={`${t('brand')} — ${t('tagline')}`} style={{ height, width: 'auto' }} />
    </Link>
  );
}
