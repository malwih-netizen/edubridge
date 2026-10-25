import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { Button, Card, EmptyState, Field, Input, PageHeader, Select } from '@/components/ui';
import ScholarshipCard from '@/components/ScholarshipCard';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { studentService } from '@/services/dataService';
import { WEIGHTS } from '@/services/matching';
import './student.css';

const EMPTY = { q: '', country: '', level: '', field: '', funding: '', deadline: '', match: '', openOnly: false };
const LEVELS = ['bachelor', 'master', 'phd'];
const FIELDS = ['computerScience', 'engineering', 'business', 'publicHealth', 'science', 'humanities'];
const FUNDING = ['full', 'partial', 'self'];
const MATCH = ['eligible', 'potential', 'notSuitable'];
const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date()) / 86400000);

export default function StudentScholarships() {
  const { t } = useTranslation('student');
  const { t: tc } = useTranslation();
  const { fmtNum, loc } = useLocalized();
  const toast = useToast();

  const recs = useAsync(() => studentService.recommendations(), []);
  const [f, setF] = useState(EMPTY);
  const [sort, setSort] = useState('match');
  const [panel, setPanel] = useState(false);

  const all = recs.data || [];
  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const activeCount = Object.entries(f).filter(([k, v]) => v && v !== EMPTY[k]).length;

  const countries = useMemo(() => [...new Set(all.map((s) => s.country))], [all]);

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = all.filter((s) => {
      if (q && ![s.name, s.nameAr, s.university, s.universityAr, tc(`countries.${s.country}`)].some((v) => v?.toLowerCase().includes(q))) return false;
      if (f.country && s.country !== f.country) return false;
      if (f.level && !s.levels.includes(f.level)) return false;
      if (f.field && !s.fields.includes(f.field)) return false;
      if (f.funding && s.funding !== f.funding) return false;
      if (f.match && s.match.level !== f.match) return false;
      if (f.openOnly && s.status !== 'open') return false;
      if (f.deadline) {
        const d = daysUntil(s.deadline);
        if (d < 0 || d > Number(f.deadline)) return false;
      }
      return true;
    });
    const by = {
      match: (a, b) => b.match.score - a.match.score,
      deadline: (a, b) => {
        const da = daysUntil(a.deadline); const db = daysUntil(b.deadline);
        if ((da < 0) !== (db < 0)) return da < 0 ? 1 : -1;
        return da - db;
      },
      newest: (a, b) => new Date(b.opens) - new Date(a.opens),
    }[sort];
    return [...list].sort(by);
  }, [all, f, sort, tc]);

  const levelCounts = MATCH.reduce((acc, m) => ({ ...acc, [m]: all.filter((s) => s.match.level === m).length }), {});

  const guidance = async (s) => {
    await studentService.requestService({ service: 'scholarshipSearch', scholarshipId: s.id, notes: '' });
    toast(`${tc('toast.requestSent')} — ${loc(s, 'name')}`);
  };

  const opts = (keys, ns) => keys.map((k) => ({ value: k, label: tc(`${ns}.${k}`) }));

  return (
    <>
      <PageHeader
        title={t('scholarships.title')}
        description={t('scholarships.subtitle')}
      />

      <div className="find-bar card fade-up">
        <Input
          icon={Search}
          type="search"
          value={f.q}
          onChange={set('q')}
          placeholder={t('scholarships.searchPlaceholder')}
          aria-label={tc('actions.search')}
        />
        <Button variant="outline" icon={SlidersHorizontal} className="find-toggle" onClick={() => setPanel((p) => !p)} aria-expanded={panel}>
          {tc('actions.filter')}{activeCount ? ` (${fmtNum(activeCount)})` : ''}
        </Button>
      </div>

      <div className="match-chips fade-up" role="group" aria-label={t('scholarships.matchLevel')}>
        <button type="button" className={`chip${!f.match ? ' on' : ''}`} onClick={() => setF((s) => ({ ...s, match: '' }))}>
          {t('scholarships.allMatches')} <span className="text-muted">({fmtNum(all.length)})</span>
        </button>
        {MATCH.map((m) => (
          <button key={m} type="button" className={`chip mc-${m}${f.match === m ? ' on' : ''}`} onClick={() => setF((s) => ({ ...s, match: s.match === m ? '' : m }))}>
            <i aria-hidden />{tc(`match.${m}`)} <span className="text-muted">({fmtNum(levelCounts[m] || 0)})</span>
          </button>
        ))}
      </div>

      <div className="find-layout">
        <aside className={`find-panel${panel ? ' open' : ''}`}>
          <Card
            title={t('scholarships.refine')}
            actions={activeCount ? <button type="button" className="link" onClick={() => setF(EMPTY)}>{tc('actions.clear')}</button> : null}
          >
            <div className="stack">
              <Field label={t('scholarships.filters.country')}>
                <Select value={f.country} onChange={set('country')} placeholder={tc('countries.all')} options={opts(countries, 'countries')} />
              </Field>
              <Field label={t('scholarships.filters.level')}>
                <Select value={f.level} onChange={set('level')} placeholder={t('scholarships.any')} options={opts(LEVELS, 'levels')} />
              </Field>
              <Field label={t('scholarships.filters.field')}>
                <Select value={f.field} onChange={set('field')} placeholder={t('scholarships.any')} options={opts(FIELDS, 'fields')} />
              </Field>
              <Field label={t('scholarships.filters.funding')}>
                <Select value={f.funding} onChange={set('funding')} placeholder={t('scholarships.any')} options={opts(FUNDING, 'funding')} />
              </Field>
              <Field label={t('scholarships.filters.deadline')}>
                <Select
                  value={f.deadline}
                  onChange={set('deadline')}
                  placeholder={t('scholarships.anyTime')}
                  options={[{ value: '30', label: t('scholarships.within30') }, { value: '90', label: t('scholarships.within90') }]}
                />
              </Field>
              <label className="check">
                <input type="checkbox" checked={f.openOnly} onChange={set('openOnly')} />
                {t('scholarships.openOnly')}
              </label>
            </div>
          </Card>

          <Card accent="gold" title={t('scholarships.whyTitle')} className="find-why">
            <p className="text-muted find-why-text">{t('scholarships.whyText')}</p>
            <ul className="weights">
              {Object.entries(WEIGHTS).map(([k, w]) => (
                <li key={k}>
                  <span>{t(`details.criteria.${k}`)}</span>
                  <i aria-hidden><em style={{ width: `${(w / 25) * 100}%` }} /></i>
                  <b>{w}%</b>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <section className="find-results">
          <div className="find-head">
            <p>
              {recs.loading ? t('scholarships.loading') : t('scholarships.found', { count: results.length, n: fmtNum(results.length) })}
            </p>
            <label className="find-sort">
              <span>{t('scholarships.sortBy')}</span>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                options={[
                  { value: 'match', label: t('scholarships.sort.match') },
                  { value: 'deadline', label: t('scholarships.sort.deadline') },
                  { value: 'newest', label: t('scholarships.sort.newest') },
                ]}
              />
            </label>
          </div>

          {activeCount > 0 && (
            <div className="chips find-active">
              {Object.entries(f).filter(([k, v]) => v && v !== EMPTY[k]).map(([k, v]) => {
                const label = {
                  q: `“${v}”`,
                  country: tc(`countries.${v}`),
                  level: tc(`levels.${v}`),
                  field: tc(`fields.${v}`),
                  funding: tc(`funding.${v}`),
                  deadline: v === '30' ? t('scholarships.within30') : t('scholarships.within90'),
                  match: tc(`match.${v}`),
                  openOnly: t('scholarships.openOnly'),
                }[k];
                return (
                  <button key={k} type="button" className="chip on" onClick={() => setF((s) => ({ ...s, [k]: EMPTY[k] }))} aria-label={`${tc('actions.clear')}: ${label}`}>
                    {label}<X aria-hidden />
                  </button>
                );
              })}
            </div>
          )}

          {recs.loading ? (
            <div className="grid grid-2">{[0, 1, 2, 3].map((i) => <div key={i} className="card skeleton" style={{ height: 240 }} />)}</div>
          ) : results.length ? (
            <div className="grid grid-2">
              {results.map((s) => <ScholarshipCard key={s.id} s={s} onGuidance={guidance} />)}
            </div>
          ) : (
            <div className="card">
              <EmptyState
                icon={SearchX}
                title={t('scholarships.emptyTitle')}
                text={t('scholarships.emptyText')}
                action={<Button variant="outline" onClick={() => setF(EMPTY)}>{tc('actions.clear')}</Button>}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
