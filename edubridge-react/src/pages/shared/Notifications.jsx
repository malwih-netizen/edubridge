import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CalendarClock, CheckCircle2, FileCheck2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, Tabs } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

const ITEMS = [
  { id: 1, key: 'deadline', icon: CalendarClock, tone: 'danger', unread: true, ago: { k: 'time.hoursAgo', n: 2 } },
  { id: 2, key: 'document', icon: FileCheck2, tone: 'success', unread: true, ago: { k: 'time.hoursAgo', n: 5 } },
  { id: 3, key: 'service', icon: Bell, tone: 'info', unread: false, ago: { k: 'time.daysAgo', n: 1 } },
];

export default function Notifications() {
  const { t } = useTranslation();
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState(ITEMS);
  const shown = tab === 'unread' ? items.filter((i) => i.unread) : items;
  return (
    <>
      <PageHeader title={t('nav.notifications')} actions={
        <Button variant="outline" icon={CheckCircle2} onClick={() => { setItems(items.map((i) => ({ ...i, unread: false }))); toast(t('toast.saved')); }}>{t('topbar.markAllRead')}</Button>
      } />
      <Card pad={false}>
        <div className="card-head">
          <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: t('actions.viewAll'), count: items.length }, { value: 'unread', label: t('status.pending'), count: items.filter((i) => i.unread).length }]} />
        </div>
        <div className="card-body list">
          {shown.length ? shown.map((n) => (
            <div key={n.id} className="list-item">
              <span className={`stat-icon ${n.tone === 'danger' ? 'red' : n.tone === 'success' ? 'green' : ''}`}><n.icon /></span>
              <div className="grow"><b>{t(`notifications.${n.key}`)}</b><small>{t(`notifications.${n.key}Text`)}</small></div>
              <small className="text-muted">{t(n.ago.k, { count: n.ago.n })}</small>
              {n.unread && <Badge tone="gold">●</Badge>}
            </div>
          )) : <EmptyState title={t('empty.title')} text={t('empty.text')} />}
        </div>
      </Card>
    </>
  );
}
