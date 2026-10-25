import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// كل قسم له ملف ترجمة مستقل: src/locales/<lang>/<namespace>.json
// (common, public, auth, student, employee, admin) — يُحمَّل تلقائياً.
const files = import.meta.glob('../locales/*/*.json', { eager: true });
const resources = {};
for (const [path, mod] of Object.entries(files)) {
  const [, lang, ns] = path.match(/locales\/(\w+)\/(\w+)\.json$/);
  resources[lang] ??= {};
  resources[lang][ns] = mod.default;
}

export const LANG_KEY = 'edu-lang';
export const SUPPORTED = ['en', 'ar'];

function initialLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (SUPPORTED.includes(q)) return q;
    const s = localStorage.getItem(LANG_KEY);
    if (SUPPORTED.includes(s)) return s;
  } catch { /* storage unavailable */ }
  return 'en';
}

export function applyDirection(lng) {
  const el = document.documentElement;
  el.lang = lng;
  el.dir = lng === 'ar' ? 'rtl' : 'ltr';
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang(),
  fallbackLng: 'en',
  ns: ['common', 'public', 'auth', 'student', 'employee', 'admin'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDirection(i18n.language);
try { localStorage.setItem(LANG_KEY, i18n.language); } catch { /* ignore */ }
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
  try { localStorage.setItem(LANG_KEY, lng); } catch { /* ignore */ }
});

export default i18n;
