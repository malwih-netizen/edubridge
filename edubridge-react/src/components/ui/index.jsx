// مكوّنات الواجهة المشتركة لكل صفحات EduBridge.
// الاستيراد: import { Button, Card, Badge } from '@/components/ui';
import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Inbox, X } from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');

/* ---------- Button ---------- */
export function Button({ variant = 'gold', size, block, icon: Icon, iconEnd: IconEnd, to, className, children, ...rest }) {
  const cls = cx('btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', className);
  const inner = (
    <>
      {Icon && <Icon aria-hidden />}
      {children}
      {IconEnd && <IconEnd aria-hidden className={['ArrowRight', 'ChevronRight', 'ArrowLeft', 'ChevronLeft'].includes(IconEnd.displayName) ? 'flip-rtl' : undefined} />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{inner}</Link>;
  return <button type="button" className={cls} {...rest}>{inner}</button>;
}

export function IconButton({ icon: Icon, label, badge, className, ...rest }) {
  return (
    <button type="button" className={cx('icon-btn', className)} aria-label={label} title={label} {...rest}>
      <Icon aria-hidden />
      {badge ? <span className="dot">{badge}</span> : null}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({ title, subtitle, actions, accent, children, className, bodyClass, pad = true, ...rest }) {
  return (
    <section className={cx('card', accent === 'gold' && 'card-accent', accent === 'navy' && 'card-navy', className)} {...rest}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      <div className={cx(pad && 'card-body', bodyClass)}>{children}</div>
    </section>
  );
}

/* ---------- Badge ---------- */
export function Badge({ tone, icon: Icon, children, className }) {
  return (
    <span className={cx('badge', tone && `badge-${tone}`, className)}>
      {Icon && <Icon aria-hidden />}
      {children}
    </span>
  );
}

/** Maps a workflow / record status key to a badge tone. */
export const statusTone = (s) => ({
  accepted: 'success', approved: 'success', active: 'success', completed: 'success', eligible: 'success', open: 'success',
  rejected: 'danger', missing: 'danger', suspended: 'danger', notSuitable: 'danger', closed: 'danger',
  pending: 'warning', waitingStudent: 'warning', underReview: 'warning', waitingResult: 'warning', potential: 'warning', invited: 'warning',
  inProgress: 'info', preparingDocuments: 'info', contacted: 'info', submitted: 'info', readyToApply: 'gold', newRequest: 'gold', upcoming: 'info', draft: undefined,
}[s]);

/* ---------- Page header ---------- */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-head fade-up">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

/* ---------- Stat card ---------- */
export function StatCard({ icon: Icon, label, value, trend, trendDown, tone }) {
  return (
    <div className="card stat">
      <div className={cx('stat-icon', tone)}><Icon aria-hidden /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {trend && <div className={cx('stat-trend', trendDown && 'down')}>{trend}</div>}
      </div>
    </div>
  );
}

/* ---------- Progress ---------- */
export function ProgressRing({ value = 0, size = 120, stroke = 11, label, color = 'var(--navy-800)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${value}%`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset .8s var(--ease)' }}
        />
      </svg>
      <div className="ring-val"><b>{value}%</b>{label && <small>{label}</small>}</div>
    </div>
  );
}

export function ProgressBar({ value = 0, navy }) {
  return <div className={cx('bar', navy && 'navy')}><i style={{ width: `${value}%` }} /></div>;
}

/* ---------- Avatar ---------- */
export function Avatar({ name = '', gold, size }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className={cx('avatar', gold && 'gold', size)} aria-hidden>{initials}</span>;
}

/* ---------- Form fields ---------- */
export function Field({ label, error, children, className }) {
  return (
    <label className={cx('field', className)}>
      {label && <span>{label}</span>}
      {children}
      {error ? <small className="error">{error}</small> : null}
    </label>
  );
}

export function Input({ icon: Icon, action, className, error, ...rest }) {
  const input = <input className={cx('input', error && 'has-error', className)} {...rest} />;
  if (!Icon && !action) return input;
  return (
    <div className="input-wrap">
      {Icon && <Icon aria-hidden />}
      {input}
      {action}
    </div>
  );
}

export function Select({ options = [], className, placeholder, ...rest }) {
  return (
    <select className={cx('select', className)} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

export function Textarea({ className, ...rest }) {
  return <textarea className={cx('textarea', className)} {...rest} />;
}

/* ---------- Tabs ---------- */
export function Tabs({ items, value, onChange, className }) {
  return (
    <div className={cx('tabs', className)} role="tablist">
      {items.map((it) => (
        <button key={it.value} role="tab" aria-selected={value === it.value}
          className={value === it.value ? 'active' : undefined} onClick={() => onChange(it.value)}>
          {it.label}{it.count != null && <span className="text-muted"> ({it.count})</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Table ---------- */
export function DataTable({ columns, rows, rowKey = 'id', empty }) {
  if (!rows.length) return <EmptyState {...(empty || {})} />;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr>{columns.map((c) => <th key={c.key} style={c.width ? { width: c.width } : undefined}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[rowKey]}>{columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="empty">
      <Icon aria-hidden />
      {title && <h4>{title}</h4>}
      {text && <p>{text}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, title, onClose, children, footer, width }) {
  const id = useId();
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="card modal" role="dialog" aria-modal="true" aria-labelledby={id} style={width ? { width: `min(${width}px, 100%)` } : undefined}>
        <header className="card-head">
          <h3 id={id}>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('actions.close')}><X /></button>
        </header>
        <div className="card-body">{children}</div>
        {footer && <footer className="card-head" style={{ borderBlockStart: '1px solid var(--line-2)', borderBlockEnd: 0, justifyContent: 'flex-end' }}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Stepper (application journey) ---------- */
export function Stepper({ steps, current }) {
  return (
    <div className="steps">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : '';
        return (
          <div key={s.key} className={cx('step', state)}>
            <div className="node">{i < current ? <Check aria-hidden /> : i + 1}</div>
            <b>{s.label}</b>
            {s.caption && <small>{s.caption}</small>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Switch (on/off toggle) ---------- */
export function Switch({ checked, onChange, label, description, id }) {
  const autoId = useId();
  const sid = id || autoId;
  return (
    <div className="switch-row">
      <div className="switch-text">
        {label && <label htmlFor={sid}>{label}</label>}
        {description && <small>{description}</small>}
      </div>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        className={cx('switch', checked && 'on')}
        onClick={() => onChange?.(!checked)}
      >
        <span />
      </button>
    </div>
  );
}
