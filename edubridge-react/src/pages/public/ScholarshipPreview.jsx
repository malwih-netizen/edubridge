import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Check, GraduationCap, Lock, MapPin, SearchX, Wallet } from 'lucide-react';
import { Badge, Button, EmptyState } from '@/components/ui';
import { useAsync, useLocalized } from '@/hooks';
import { scholarshipService } from '@/services/dataService';
import { PublicFooter, PublicHeader } from './PublicChrome';
import { daysUntil } from './Scholarships';

const STATUS_TONE = { open: 'success', upcoming: 'info', closed: 'danger' };

/** Public, partial scholarship details. Full requirements and applying need sign-in. */
export default function ScholarshipPreview() {
  const { id } = useParams();
  const { t } = useTranslation('public');
  const { t: tc } = useTranslation();
  const { loc, fmtDate } = useLocalized();
  const { data: list, loading } = useAsync(() => scholarshipService.list(), []);
  const s = list?.find((x) => String(x.id) === String(id));
  const next = encodeURIComponent(`/student/scholarships/${id}`);
  const related = (list || []).filter((x) => s && x.id !== s.id && (x.country === s.country || x.levels.some((l) => s.levels.includes(l)))).slice(0, 3);

  return (
    <div className="pub">
      <PublicHeader />
      <main className="teaser">
        <div className="teaser-wrap">
          <Link to="/scholarships" className="auth-back"><ArrowLeft className="flip-rtl" aria-hidden />{t('teaser.back')}</Link>

          {loading && <div className="skeleton" style={{ height: 320, marginTop: 18 }} />}
          {!loading && !s && <div className="card" style={{ marginTop: 18 }}><EmptyState icon={SearchX} title={t('teaser.notFound')} action={<Button variant="outline" to="/scholarships">{t('teaser.back')}</Button>} /></div>}

          {s && (
            <>
              <header className="teaser-head">
                <div className="row wrap" style={{ gap: 8 }}>
                  <Badge tone={STATUS_TONE[s.status]}>{t(`browse.${s.status}`)}</Badge>
                  {s.status === 'open' && <Badge tone="gold">{t('teaser.daysLeft', { count: daysUntil(s.deadline) })}</Badge>}
                </div>
                <h1>{loc(s, 'name')}</h1>
                <p className="teaser-sub"><Building2 aria-hidden />{loc(s, 'university')}<span>·</span><MapPin aria-hidden />{tc(`countries.${s.country}`)}</p>
              </header>

              <div className="teaser-grid">
                <div className="stack" style={{ gap: 18 }}>
                  <section className="card card-body">
                    <h2 className="teaser-h2">{t('teaser.overview')}</h2>
                    <p className="teaser-text">{loc(s, 'description')}</p>
                    <h3 className="teaser-h3">{t('teaser.fields')}</h3>
                    <div className="chips">{s.fields.map((x) => <span key={x} className="chip">{tc(`fields.${x}`)}</span>)}</div>
                  </section>

                  <section className="card teaser-locked">
                    <div className="teaser-blur" aria-hidden>
                      {[0, 1, 2, 3].map((i) => <div key={i}><i /><span /></div>)}
                    </div>
                    <div className="teaser-lock">
                      <span className="teaser-lock-icon"><Lock aria-hidden /></span>
                      <h2>{t('teaser.lockedTitle')}</h2>
                      <p>{t('teaser.lockedText')}</p>
                      <ul>
                        {[1, 2, 3, 4].map((n) => <li key={n}><Check aria-hidden />{t(`teaser.locked${n}`)}</li>)}
                      </ul>
                      <div className="row wrap" style={{ justifyContent: 'center' }}>
                        <Button to={`/login?next=${next}`} iconEnd={ArrowRight}>{t('teaser.signin')}</Button>
                        <Button variant="outline" to={`/register?next=${next}`}>{t('teaser.register')}</Button>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className="card card-body teaser-facts">
                  <h2 className="teaser-h2">{t('teaser.facts')}</h2>
                  <dl>
                    <div><dt><GraduationCap aria-hidden />{t('teaser.level')}</dt><dd>{s.levels.map((l) => tc(`levels.${l}`)).join(' · ')}</dd></div>
                    <div><dt><Wallet aria-hidden />{t('teaser.funding')}</dt><dd>{tc(`funding.${s.funding}`)}</dd></div>
                    <div><dt><Wallet aria-hidden />{t('teaser.amount')}</dt><dd className="ltr">{s.amount}</dd></div>
                    <div><dt><CalendarDays aria-hidden />{t('teaser.opens')}</dt><dd>{fmtDate(s.opens)}</dd></div>
                    <div><dt><CalendarDays aria-hidden />{t('teaser.deadline')}</dt><dd>{fmtDate(s.deadline)}</dd></div>
                  </dl>
                  <Button to={`/login?next=${next}`} block iconEnd={ArrowRight}>{t('teaser.signin')}</Button>
                </aside>
              </div>

              {related.length > 0 && (
                <section className="teaser-related">
                  <h2 className="teaser-h2">{t('teaser.related')}</h2>
                  <div className="browse-grid">
                    {related.map((r) => (
                      <Link key={r.id} to={`/scholarships/${r.id}`} className="card browse-card compact">
                        <Badge tone={STATUS_TONE[r.status]}>{t(`browse.${r.status}`)}</Badge>
                        <h3>{loc(r, 'name')}</h3>
                        <p className="browse-uni"><MapPin aria-hidden />{tc(`countries.${r.country}`)} · {r.levels.map((l) => tc(`levels.${l}`)).join(' · ')}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
