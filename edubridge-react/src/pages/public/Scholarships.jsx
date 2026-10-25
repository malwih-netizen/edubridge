import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Building2, CalendarDays, GraduationCap, MapPin, RotateCcw, Search, SearchX, Wallet } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Select } from '@/components/ui';
import { useAsync, useLocalized } from '@/hooks';
import { scholarshipService } from '@/services/dataService';
import { PublicFooter, PublicHeader } from './PublicChrome';

const LEVELS = ['bachelor', 'master', 'phd'];
const COUNTRIES = ['canada', 'germany', 'uk', 'usa', 'turkey', 'malaysia', 'netherlands', 'australia'];
const FIELDS = ['computerScience', 'engineering', 'business', 'publicHealth', 'science', 'humanities'];
const FUNDING = ['full', 'partial'];
const STATUS_TONE = { open: 'success', upcoming: 'info', closed: 'danger' };

export const daysUntil = (iso) => Math.max(0, Math.ceil((new Date(iso) - new Date()) / 86400000));

/** Public scholarship directory — anyone can browse; applying requires sign-in. */
export default function PublicScholarships() {
  const { t } = useTranslation('public');
  const { t: tc } = useTranslation();
  const { loc, fmtDate } = useLocalized();
  const [params, setParams] = useSearchParams();
  const { data, loading } = useAsync(() => scholarshipService.list(), []);

  const f = {
    q: params.get('q') || '', level: params.get('level') || '', country: params.get('country') || '',
    field: params.get('field') || '', funding: params.get('funding') || '', sort: params.get('sort') || 'deadline',
  };
  const update = (patch) => {
    const next = { ...f, ...patch };
    const p = {};
    Object.entries(next).forEach(([k, v]) => { if (v && !(k === 'sort' && v === 'deadline')) p[k] = v; });
    setParams(p, { replace: true });
  };

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = (data || []).filter((s) => (!f.level || s.levels.includes(f.level))
      && (!f.country || s.country === f.country)
      && (!f.field || s.fields.includes(f.field))
      && (!f.funding || s.funding === f.funding)
      && (!q || [s.name, s.nameAr, s.university, s.universityAr].some((x) => x && x.toLowerCase().includes(q))));
    const rank = { open: 0, upcoming: 1, closed: 2 };
    return list.sort((a, b) => (f.sort === 'name'
      ? loc(a, 'name').localeCompare(loc(b, 'name'))
      : rank[a.status] - rank[b.status] || new Date(a.deadline) - new Date(b.deadline)));
  }, [data, f.q, f.level, f.country, f.field, f.funding, f.sort, loc]);

  const hasFilters = f.q || f.level || f.country || f.field || f.funding;

  return (
    <div className="pub">
      <PublicHeader />
      <main>
        <section className="browse-hero">
          <div className="browse-hero-inner">
            <h1>{t('browse.title')}</h1>
            <p className="browse-lead">{t('browse.text')}</p>

            <form className="browse-search" onSubmit={(e) => e.preventDefault()} role="search">
              <label className="bs-field bs-keyword">
                <span>{t('browse.keyword')}</span>
                <Input icon={Search} value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder={t('browse.keywordPh')} />
              </label>
              <label className="bs-field">
                <span>{t('browse.level')}</span>
                <Select value={f.level} onChange={(e) => update({ level: e.target.value })} placeholder={t('browse.anyLevel')} options={LEVELS.map((l) => ({ value: l, label: tc(`levels.${l}`) }))} />
              </label>
              <label className="bs-field">
                <span>{t('browse.country')}</span>
                <Select value={f.country} onChange={(e) => update({ country: e.target.value })} placeholder={t('browse.anyCountry')} options={COUNTRIES.map((c) => ({ value: c, label: tc(`countries.${c}`) }))} />
              </label>
              <label className="bs-field">
                <span>{t('browse.field')}</span>
                <Select value={f.field} onChange={(e) => update({ field: e.target.value })} placeholder={t('browse.anyField')} options={FIELDS.map((x) => ({ value: x, label: tc(`fields.${x}`) }))} />
              </label>
              <label className="bs-field">
                <span>{t('browse.funding')}</span>
                <Select value={f.funding} onChange={(e) => update({ funding: e.target.value })} placeholder={t('browse.anyFunding')} options={FUNDING.map((x) => ({ value: x, label: tc(`funding.${x}`) }))} />
              </label>
            </form>

          </div>
        </section>

        <section className="browse-body">
          <div className="browse-bar">
            <strong>{loading ? '…' : t('browse.results', { count: results.length })}</strong>
            <div className="row">
              {hasFilters && <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setParams({}, { replace: true })}>{t('browse.reset')}</Button>}
              <label className="row browse-sort">
                <span className="text-muted">{t('browse.sort')}</span>
                <Select value={f.sort} onChange={(e) => update({ sort: e.target.value })} options={[{ value: 'deadline', label: t('browse.sortDeadline') }, { value: 'name', label: t('browse.sortName') }]} />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="browse-grid">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}</div>
          ) : results.length ? (
            <div className="browse-grid">
              {results.map((s) => (
                <article key={s.id} className="card browse-card">
                  <div className="row between">
                    <Badge tone={STATUS_TONE[s.status]}>{t(`browse.${s.status}`)}</Badge>
                    <span className="browse-country"><MapPin aria-hidden />{tc(`countries.${s.country}`)}</span>
                  </div>
                  <h3><Link to={`/scholarships/${s.id}`}>{loc(s, 'name')}</Link></h3>
                  <p className="browse-uni"><Building2 aria-hidden />{loc(s, 'university')}</p>
                  <p className="browse-desc">{loc(s, 'description')}</p>
                  <ul className="browse-meta">
                    <li><GraduationCap aria-hidden />{s.levels.map((l) => tc(`levels.${l}`)).join(' · ')}</li>
                    <li><Wallet aria-hidden />{tc(`funding.${s.funding}`)}</li>
                    <li><CalendarDays aria-hidden />{s.status === 'upcoming' ? t('browse.opens') : t('browse.deadline')}: {fmtDate(s.status === 'upcoming' ? s.opens : s.deadline)}</li>
                  </ul>
                  <Button variant="outline" to={`/scholarships/${s.id}`} iconEnd={ArrowRight} block>{t('browse.details')}</Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="card"><EmptyState icon={SearchX} title={t('browse.emptyTitle')} text={t('browse.emptyText')} action={<Button variant="outline" onClick={() => setParams({}, { replace: true })}>{t('browse.reset')}</Button>} /></div>
          )}

          <div className="browse-cta">
            <div>
              <h2>{t('browse.ctaTitle')}</h2>
              <p>{t('browse.ctaText')}</p>
            </div>
            <Button size="lg" to="/login" iconEnd={ArrowRight}>{t('browse.ctaBtn')}</Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
