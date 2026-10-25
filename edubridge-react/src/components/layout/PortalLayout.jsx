import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Headphones, Home, LogOut, Menu, Search, Settings, User, X } from 'lucide-react';
import { NAV } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocalized } from '@/hooks';
import { Avatar, IconButton, Input } from '@/components/ui';
import Logo from './Logo';
import LangToggle from './LangToggle';
import logoMark from '@/assets/logo-mark.png';

function useClickOutside(ref, onOut) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onOut();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

/** Shared shell for the student, employee and admin portals. */
export default function PortalLayout({ role }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { loc } = useLocalized();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'profile' | 'notif' | null
  // طيّ الشريط الجانبي إلى أيقونات فقط (يُحفظ في المتصفح)
  const [collapsed, setCollapsed] = useState(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('sidebar') === 'collapsed') return true; // معاينة فقط
    try { return localStorage.getItem('edu-sidebar') === 'collapsed'; } catch { return false; }
  });
  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem('edu-sidebar', c ? 'expanded' : 'collapsed'); } catch { /* ignore */ }
    return !c;
  });
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setMenu(null));

  useEffect(() => { setOpen(false); setMenu(null); window.scrollTo(0, 0); }, [pathname]);

  const items = NAV[role];
  const current = items.filter((i) => i.to && (i.end ? pathname === i.to : pathname.startsWith(i.to))).sort((a, b) => b.to.length - a.to.length)[0];
  const base = `/${role}`;

  const signOut = () => { logout(); navigate('/login'); };

  return (
    <div className={`portal${collapsed ? ' collapsed' : ''}`}>
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label={t(`portal.${role}`)}>
        <div className="sidebar-brand">
          <Logo dark to={base} height={70} className="brand-full" />
          <Link to={base} className="brand-mark" aria-label={t('brand')}><img src={logoMark} alt="" /></Link>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label={t('topbar.closeMenu')}><X size={18} /></button>
        </div>
        <div className="sidebar-role">{t(`portal.${role}`)}</div>
        <nav className="side-nav">
          {items.map((it) => (it.group
            ? <div key={it.group} className="group">{t(it.group)}</div>
            : (
              <NavLink key={it.to} to={it.to} end={it.end} title={collapsed ? t(it.label) : undefined} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
                <it.icon aria-hidden />
                <span>{t(it.label)}</span>
                {it.count ? <span className="count">{it.count}</span> : null}
              </NavLink>
            )))}
        </nav>
        <div className="sidebar-foot">
          <div className="help-card" title={collapsed ? t('sidebar.needHelp') : undefined}>
            <Headphones aria-hidden />
            <div style={{ flex: 1 }}>
              <b>{t('sidebar.needHelp')}</b>
              <small>{role === 'admin' ? t('sidebar.adminSupport') : t('sidebar.chatAdvisor')}</small>
            </div>
          </div>
        </div>
      </aside>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleCollapsed}
        aria-pressed={collapsed}
        aria-label={collapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
        title={collapsed ? t('topbar.expandSidebar') : t('topbar.collapseSidebar')}
      >
        <ChevronLeft aria-hidden />
      </button>
      <button className={`overlay${open ? ' show' : ''}`} aria-label={t('topbar.closeMenu')} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} />

      <div className="main">
        <header className="topbar">
          <IconButton icon={Menu} label={t('topbar.openMenu')} className="menu-btn" onClick={() => setOpen(true)} />
          <nav className="crumbs" aria-label="Breadcrumb">
            <Home aria-hidden className="muted-crumb" />
            <span className="muted-crumb">{t(`portal.${role}`)}</span>
            {current && current.to !== base && <ChevronRight className="flip-rtl muted-crumb" aria-hidden />}
            <span className="current">{current && current.to !== base ? t(current.label) : <span className="mobile-only">{t(`portal.${role}`)}</span>}</span>
          </nav>
          <div className="topbar-search"><Input icon={Search} placeholder={t('topbar.search')} aria-label={t('actions.search')} /></div>
          <div className="topbar-actions" ref={menuRef}>
            <LangToggle />
            <div className="dropdown">
              <IconButton icon={Bell} label={t('topbar.notifications')} badge={3} onClick={() => setMenu(menu === 'notif' ? null : 'notif')} aria-expanded={menu === 'notif'} />
              {menu === 'notif' && (
                <div className="dropdown-menu" style={{ minWidth: 300 }}>
                  {['deadline', 'document', 'service'].map((k) => (
                    <button key={k} className="notif-item"><b>{t(`notifications.${k}`)}</b><small>{t(`notifications.${k}Text`)}</small></button>
                  ))}
                  <div className="divider" style={{ margin: '4px 0' }} />
                  <button style={{ justifyContent: 'center', color: 'var(--gold-600)' }}>{t('topbar.viewAll')}</button>
                </div>
              )}
            </div>
            <div className="dropdown">
              <button className="profile-btn" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-expanded={menu === 'profile'}>
                <Avatar name={user?.name} gold={role !== 'admin'} size="sm" />
                <span className="meta">{loc(user, 'name')}<small>{t(`roles.${role}`)}</small></span>
                <ChevronDown aria-hidden />
              </button>
              {menu === 'profile' && (
                <div className="dropdown-menu">
                  {role === 'student' && <button onClick={() => navigate('/student/profile')}><User />{t('topbar.myProfile')}</button>}
                  <button onClick={() => navigate(`${base}/settings`)}><Settings />{t('topbar.settings')}</button>
                  <div className="divider" style={{ margin: '4px 0' }} />
                  <button className="danger" onClick={signOut}><LogOut className="flip-rtl" />{t('topbar.signOut')}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
