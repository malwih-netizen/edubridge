import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Loads async data: const { data, loading, error, reload, setData } = useAsync(() => service.call(), []); */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    run().then(
      (data) => alive && setState({ data, loading: false, error: null }),
      (error) => alive && setState({ data: null, loading: false, error }),
    );
    return () => { alive = false; };
  }, [run]);
  useEffect(load, [load]);
  const setData = (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  return { ...state, reload: load, setData };
}

/** Picks the Arabic variant of a field when the UI is in Arabic: loc(item, 'name') → item.nameAr | item.name */
export function useLocalized() {
  const { i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const loc = useCallback((obj, field) => (obj ? (ar && obj[`${field}Ar`]) || obj[field] : ''), [ar]);
  const fmtDate = useCallback((iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
    if (!iso) return '';
    return new Intl.DateTimeFormat(ar ? 'ar-EG-u-nu-latn' : 'en-GB', opts).format(new Date(iso));
  }, [ar]);
  const fmtNum = useCallback((n) => new Intl.NumberFormat(ar ? 'ar-EG-u-nu-latn' : 'en-US').format(n), [ar]);
  return { loc, fmtDate, fmtNum, isAr: ar };
}

/** Time-of-day greeting key. */
export const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? 'greeting.morning' : h < 18 ? 'greeting.afternoon' : 'greeting.evening';
};
