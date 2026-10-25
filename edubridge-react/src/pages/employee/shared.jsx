// أدوات مشتركة بين صفحات الموظف (وتُستخدم أيضاً تحت /admin).
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, statusTone } from '@/components/ui';
import { STAGES } from '@/services/mockData';

/** '/admin' when the page is mounted under the admin console, otherwise '/employee'. */
export function useBasePath() {
  const { pathname } = useLocation();
  return pathname.startsWith('/admin') ? '/admin' : '/employee';
}

export const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date()) / 86400000);

export const PRIORITY_TONE = { high: 'danger', medium: 'warning', low: 'info' };

/** Stage index → status key (last stage shows the actual result when known). */
export const stageKey = (stage, result) => (stage === STAGES.length - 1 && result ? result : STAGES[stage]);

export function StageBadge({ stage, result }) {
  const { t } = useTranslation();
  const key = stageKey(stage, result);
  return <Badge tone={statusTone(key) || 'navy'}>{t(`status.${key}`)}</Badge>;
}

export function PriorityBadge({ value }) {
  const { t } = useTranslation();
  return <Badge tone={PRIORITY_TONE[value]} className="prio"><i aria-hidden />{t(`priority.${value}`)}</Badge>;
}

export function StatusBadge({ value }) {
  const { t } = useTranslation();
  return <Badge tone={statusTone(value)}>{t(`status.${value}`)}</Badge>;
}

export function ReadinessCell({ value }) {
  const tone = value >= 80 ? 'good' : value >= 50 ? 'mid' : 'low';
  return (
    <div className={`readiness-cell ${tone}`}>
      <div className="bar"><i style={{ width: `${value}%` }} /></div>
      <b>{value}%</b>
    </div>
  );
}

/** Placeholder rows shown while data loads. */
export function SkeletonRows({ rows = 4, height = 54 }) {
  return (
    <div className="emp-skeletons" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="emp-skel" style={{ height }} />)}
    </div>
  );
}
