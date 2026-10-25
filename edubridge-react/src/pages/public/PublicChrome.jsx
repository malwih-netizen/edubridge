import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, ArrowUp, ChevronRight, House, CircleHelp, Clock, Info, LayoutGrid, ListOrdered, Mail, MapPin, Menu, Search, X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import LangToggle from '@/components/layout/LangToggle';
import Logo from '@/components/layout/Logo';
import './public.css';

// روابط القائمة: أقسام الصفحة الرئيسية + صفحة المنح المستقلة
const NAV = ['home', 'about', 'services', 'how', 'faq', 'contact'];

/** Highlights the nav link of the home-page section currently in view. */
function useActiveSection(enabled) {
  const [active, setActive] = useState('home');
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return undefined;
    const els = NAV.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-35% 0px -55% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);
  return enabled ? active : null;
}

const NAV_ICONS = { home: House, about: Info, services: LayoutGrid, how: ListOrdered, faq: CircleHelp, contact: Mail };

/** Public site navigation bar (home + scholarships pages). On small screens the links move into a side drawer. */
export function PublicHeader() {
  const { t, i18n } = useTranslation('public');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // وضع التطوير فقط: ?menu=open يفتح القائمة الجانبية مباشرة (للمعاينة)
  const [open, setOpen] = useState(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get('menu') === 'open');
  const [q, setQ] = useState('');
  const onHome = pathname === '/';
  const active = useActiveSection(onHome);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) setOpen(false);
    lastPath.current = pathname;
  }, [pathname]);

  const href = (id) => (onHome ? `#${id}` : `/#${id}`);
  const search = (e) => {
    e.preventDefault();
    setOpen(false);
    navigate(q.trim() ? `/scholarships?q=${encodeURIComponent(q.trim())}` : '/scholarships');
  };

  return (
    <header className="public-nav">
      <Logo className="brand" height={46} />
      <nav className="public-links" aria-label={t('nav.primary')}>
        {NAV.map((id) => (
          <a key={id} href={href(id)} className={active === id ? 'active' : undefined} aria-current={active === id ? 'true' : undefined}>
            {t(`nav.${id}`)}
          </a>
        ))}
      </nav>
      <div className="public-actions">
        <Link to="/scholarships" className={`pub-search${pathname.startsWith('/scholarships') ? ' on' : ''}`} aria-label={t('nav.findScholarship')}>
          <span className="pub-search-text">{t('nav.findScholarship')}…</span>
          <span className="pub-search-icon"><Search aria-hidden /></span>
        </Link>
        <LangToggle />
        <Button to="/login" className="pub-apply">{t('nav.apply')}</Button>
        <button type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="pub-drawer" aria-label={t('nav.openMenu')} onClick={() => setOpen(true)}>
          <Menu aria-hidden />
        </button>
      </div>

      {createPortal(
        <div className={`pub-drawer-root${open ? ' open' : ''}`} aria-hidden={!open}>
          <button type="button" className="pub-drawer-backdrop" tabIndex={-1} aria-label={t('nav.closeMenu')} onClick={() => setOpen(false)} />
          <aside id="pub-drawer" className="pub-drawer" role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
            <div className="pub-drawer-head">
              <Logo height={44} />
              <button type="button" className="icon-btn" aria-label={t('nav.closeMenu')} onClick={() => setOpen(false)}><X aria-hidden /></button>
            </div>

            <form className="pub-drawer-search" onSubmit={search} role="search">
              <Search aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t('nav.findScholarship')}…`} aria-label={t('nav.findScholarship')} tabIndex={open ? 0 : -1} />
              <button type="submit" aria-label={t('nav.findScholarship')} tabIndex={open ? 0 : -1}><ArrowRight className="flip-rtl" aria-hidden /></button>
            </form>

            <nav className="pub-drawer-links" aria-label={t('nav.primary')}>
              {NAV.map((id) => {
                const Icon = NAV_ICONS[id];
                return (
                  <a key={id} href={href(id)} className={active === id ? 'active' : undefined} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
                    <span className="pub-drawer-ico"><Icon aria-hidden /></span>
                    <span className="grow">{t(`nav.${id}`)}</span>
                    <ChevronRight className="flip-rtl chev" aria-hidden />
                  </a>
                );
              })}
            </nav>

            <div className="pub-drawer-lang">
              <span>{t('nav.language')}</span>
              <div className="tabs">
                <button type="button" className={i18n.language === 'en' ? 'active' : undefined} onClick={() => i18n.changeLanguage('en')} tabIndex={open ? 0 : -1}>English</button>
                <button type="button" lang="ar" className={i18n.language === 'ar' ? 'active' : undefined} onClick={() => i18n.changeLanguage('ar')} tabIndex={open ? 0 : -1}>العربية</button>
              </div>
            </div>

            <div className="pub-drawer-foot">
              <Button to="/login" block size="lg" tabIndex={open ? 0 : -1}>{t('nav.apply')}</Button>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </header>
  );
}

/** Public site footer. */
export function PublicFooter() {
  const { t } = useTranslation('public');
  const { t: tc } = useTranslation();
  return (
    <footer className="pub-footer" id="footer">
      <div className="pub-footer-grid">
        <div className="pub-footer-brand">
          <Logo dark height={64} />
          <p>{t('footer.about')}</p>
        </div>
        <nav aria-label={t('footer.journey')}>
          <strong>{t('footer.journey')}</strong>
          <a href="/#services">{t('nav.services')}</a>
          <a href="/#how">{t('nav.how')}</a>
          <Link to="/scholarships">{t('nav.scholarships')}</Link>
          <Link to="/register">{t('footer.createAccount')}</Link>
        </nav>
        <nav aria-label={t('footer.platform')}>
          <strong>{t('footer.platform')}</strong>
          <Link to="/student">{t('footer.studentPortal')}</Link>
          <Link to="/employee">{t('footer.employeePortal')}</Link>
          <Link to="/admin">{t('footer.adminPortal')}</Link>
          <Link to="/login">{t('nav.signIn')}</Link>
        </nav>
        <div>
          <strong>{t('footer.contact')}</strong>
          <a href={`mailto:${t('footer.email')}`} className="pub-contact"><Mail aria-hidden /><span className="ltr">{t('footer.email')}</span></a>
          <span className="pub-contact"><Clock aria-hidden />{t('footer.hours')}</span>
          <span className="pub-contact"><MapPin aria-hidden />{t('footer.location')}</span>
        </div>
      </div>
      <div className="pub-footer-bottom">
        <span className="pub-rights">{tc('footer.rights')}</span>
        <button
          type="button"
          className="pub-top"
          aria-label={t('footer.backTop')}
          title={t('footer.backTop')}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp aria-hidden />
        </button>
      </div>
    </footer>
  );
}
