// وضع العرض: فاتح / داكن / حسب الجهاز — يُحفظ في المتصفح ويُطبَّق على <html data-theme>.
import { useEffect, useState } from 'react';

const KEY = 'edu-theme';
export const THEMES = ['light', 'dark', 'system'];
const media = () => window.matchMedia?.('(prefers-color-scheme: dark)');

export function getThemePref() {
  try { const v = localStorage.getItem(KEY); return THEMES.includes(v) ? v : 'light'; } catch { return 'light'; }
}

export function applyTheme(pref = getThemePref()) {
  const dark = pref === 'dark' || (pref === 'system' && media()?.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function setThemePref(pref) {
  try { localStorage.setItem(KEY, pref); } catch { /* ignore */ }
  applyTheme(pref);
  window.dispatchEvent(new CustomEvent('edu-theme', { detail: pref }));
}

/** const [theme, setTheme] = useTheme(); */
export function useTheme() {
  const [pref, setPref] = useState(getThemePref);
  useEffect(() => {
    const onChange = (e) => setPref(e.detail);
    const mq = media();
    const onSystem = () => getThemePref() === 'system' && applyTheme('system');
    window.addEventListener('edu-theme', onChange);
    mq?.addEventListener?.('change', onSystem);
    return () => { window.removeEventListener('edu-theme', onChange); mq?.removeEventListener?.('change', onSystem); };
  }, []);
  return [pref, setThemePref];
}

applyTheme();
// وضع التطوير فقط: ?theme=dark|light للمعاينة دون حفظ
if (import.meta.env.DEV) {
  const q = new URLSearchParams(window.location.search).get('theme');
  if (q === 'dark' || q === 'light') document.documentElement.dataset.theme = q;
}
