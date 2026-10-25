import { useTranslation } from 'react-i18next';
import { ArrowRight, Building2, CalendarDays, MapPin, Wallet } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useLocalized } from '@/hooks';

const toneFor = (level) => ({ eligible: 'success', potential: 'warning', notSuitable: 'danger' }[level]);

/** Scholarship summary card with AI match score (used on dashboard and search). */
export default function ScholarshipCard({ s, onGuidance, compact = false }) {
  const { t } = useTranslation();
  const { loc, fmtDate } = useLocalized();
  const m = s.match;
  return (
    <article className="sch-card card">
      <div className="sch-top">
        <div className="sch-flag" aria-hidden>{loc(s, 'university').slice(0, 1)}</div>
        <div className="sch-title">
          <h4>{loc(s, 'name')}</h4>
          <span><Building2 aria-hidden />{loc(s, 'university')}</span>
        </div>
        {m && (
          <div className={`sch-score ${m.level}`}>
            <b>{m.score}%</b>
            <small>{t('match.match')}</small>
          </div>
        )}
      </div>
      <ul className="sch-meta">
        <li><MapPin aria-hidden />{t(`countries.${s.country}`)}</li>
        <li><Wallet aria-hidden />{t(`funding.${s.funding}`)}</li>
        <li><CalendarDays aria-hidden />{t('time.deadline')}: {fmtDate(s.deadline)}</li>
      </ul>
      <div className="sch-tags">
        {m && <Badge tone={toneFor(m.level)}>{t(`match.${m.level}`)}</Badge>}
        {s.levels.map((l) => <Badge key={l}>{t(`levels.${l}`)}</Badge>)}
      </div>
      {!compact && (
        <div className="sch-actions">
          <Button variant="outline" size="sm" to={`/student/scholarships/${s.id}`} iconEnd={ArrowRight}>{t('actions.viewDetails')}</Button>
          <Button size="sm" onClick={() => onGuidance?.(s)}>{t('actions.requestGuidance')}</Button>
        </div>
      )}
    </article>
  );
}
