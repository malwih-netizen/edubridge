import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Ban, CheckCircle2, Clock, Download, Eye, Mail, Minus, Pencil, RotateCcw, Search, ShieldCheck,
  UserCheck, UserCog, UserPlus, Users as UsersIcon, UserX,
} from 'lucide-react';
import {
  Avatar, Badge, Button, Card, DataTable, EmptyState, Field, Input, Modal, PageHeader, Select, StatCard, statusTone, Textarea,
} from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { adminService } from '@/services/dataService';
import './admin.css';

const ROLES = ['student', 'employee', 'admin'];
const STATUSES = ['active', 'pending', 'invited', 'suspended'];
const DEPARTMENTS = ['studentServices', 'admissions', 'visa', 'scholarships', 'compliance'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLE_TONE = { admin: 'navy', employee: 'gold', student: 'info' };

// مصفوفة الصلاحيات حسب الدور: edit = عرض وتعديل، view = عرض فقط، none = لا وصول
const MODULES = [
  { key: 'profile', student: 'edit', employee: 'view', admin: 'edit' },
  { key: 'documents', student: 'edit', employee: 'edit', admin: 'edit' },
  { key: 'scholarships', student: 'view', employee: 'edit', admin: 'edit' },
  { key: 'serviceRequests', student: 'edit', employee: 'edit', admin: 'edit' },
  { key: 'applications', student: 'view', employee: 'edit', admin: 'edit' },
  { key: 'crm', student: 'none', employee: 'edit', admin: 'edit' },
  { key: 'reports', student: 'none', employee: 'view', admin: 'edit' },
  { key: 'users', student: 'none', employee: 'none', admin: 'edit' },
  { key: 'system', student: 'none', employee: 'none', admin: 'edit' },
];
const LEVEL_ICON = { edit: Pencil, view: Eye, none: Minus };

const EMPTY_FORM = { name: '', email: '', role: 'employee', department: '', message: '' };

export default function AdminUsers() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, fmtNum } = useLocalized();
  const toast = useToast();

  const { data, loading, setData } = useAsync(() => adminService.users(), []);
  const users = data || [];

  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [nextRole, setNextRole] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => (!role || u.role === role)
      && (!status || u.status === status)
      && (!dept || u.department === dept)
      && (!needle || [u.name, u.nameAr, u.email].some((v) => v?.toLowerCase().includes(needle))));
  }, [users, q, role, status, dept]);

  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    pending: users.filter((u) => u.status === 'pending' || u.status === 'invited').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  }), [users]);

  const hasFilters = q || role || status || dept;
  const clearFilters = () => { setQ(''); setRole(''); setStatus(''); setDept(''); };

  const ago = (iso) => {
    if (!iso) return t('users.never');
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    if (mins < 1) return tc('time.justNow');
    if (mins < 60) return tc('time.minutesAgo', { count: mins });
    if (mins < 1440) return tc('time.hoursAgo', { count: Math.round(mins / 60) });
    if (mins < 43200) return tc('time.daysAgo', { count: Math.round(mins / 1440) });
    return fmtDate(iso);
  };

  const patch = async (u, changes, message) => {
    setData((list) => list.map((x) => (x.id === u.id ? { ...x, ...changes } : x)));
    try { await adminService.updateUser(u.id, changes); } catch { /* demo: keep optimistic state */ }
    toast(message);
  };

  const toggleSuspend = (u) => {
    const name = loc(u, 'name');
    if (u.status === 'suspended') patch(u, { status: 'active' }, t('users.toast.activated', { name }));
    else if (u.status === 'active') patch(u, { status: 'suspended' }, t('users.toast.suspended', { name }));
    else patch(u, { status: 'active' }, t('users.toast.activated', { name }));
  };

  const openRole = (u) => { setRoleTarget(u); setNextRole(u.role); };
  const saveRole = () => {
    const u = roleTarget;
    setRoleTarget(null);
    if (!u || nextRole === u.role) return;
    patch(u, { role: nextRole, department: nextRole === 'student' ? null : u.department || DEPARTMENTS[0] },
      t('users.toast.roleChanged', { name: loc(u, 'name'), role: tc(`roles.${nextRole}`) }));
  };

  const setField = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value, ...(k === 'role' && value === 'student' ? { department: '' } : {}) }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 3) er.name = t('invite.errors.name');
    const email = form.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) er.email = t('invite.errors.email');
    else if (users.some((u) => u.email.toLowerCase() === email)) er.email = t('invite.errors.duplicate');
    if (form.role !== 'student' && !form.department) er.department = t('invite.errors.department');
    setErrors(er);
    return !Object.keys(er).length;
  };

  const closeInvite = () => { setInviteOpen(false); setForm(EMPTY_FORM); setErrors({}); };
  const submitInvite = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = { name: form.name.trim(), email: form.email.trim().toLowerCase(), role: form.role, department: form.role === 'student' ? null : form.department };
    try {
      const created = await adminService.createUser(payload);
      setData((list) => [{ lastActive: null, ...payload, ...created, status: 'invited' }, ...(list || [])]);
      toast(t('users.toast.invited', { email: payload.email }));
      closeInvite();
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = ROLES.map((r) => ({ value: r, label: tc(`roles.${r}`) }));
  const statusOptions = STATUSES.map((s) => ({ value: s, label: tc(`status.${s}`) }));
  const deptOptions = DEPARTMENTS.map((d) => ({ value: d, label: tc(`departments.${d}`) }));

  const columns = [
    {
      key: 'user', label: t('users.cols.user'), render: (u) => (
        <div className="adm-user">
          <Avatar name={u.name} gold={u.role === 'admin'} size="sm" />
          <div className="adm-user-meta"><b>{loc(u, 'name')}</b><small dir="ltr">{u.email}</small></div>
        </div>
      ),
    },
    { key: 'role', label: t('users.cols.role'), render: (u) => <Badge tone={ROLE_TONE[u.role]}>{tc(`roles.${u.role}`)}</Badge> },
    { key: 'department', label: t('users.cols.department'), render: (u) => (u.department ? tc(`departments.${u.department}`) : <span className="text-muted">—</span>) },
    { key: 'lastActive', label: t('users.cols.lastActive'), render: (u) => <span className="adm-nowrap"><Clock className="adm-inline-ico" aria-hidden />{ago(u.lastActive)}</span> },
    { key: 'status', label: t('users.cols.status'), render: (u) => <Badge tone={statusTone(u.status)}>{tc(`status.${u.status}`)}</Badge> },
    {
      key: 'actions', label: t('users.cols.actions'), render: (u) => (
        <div className="row adm-actions">
          <Button variant="ghost" size="sm" icon={UserCog} onClick={() => openRole(u)}>{t('users.changeRole')}</Button>
          {u.status === 'active' ? (
            <Button variant="danger" size="sm" icon={Ban} onClick={() => toggleSuspend(u)}>{t('users.suspend')}</Button>
          ) : u.status === 'invited' ? (
            <Button variant="outline" size="sm" icon={Mail} onClick={() => toast(t('users.toast.resent', { email: u.email }))}>{t('users.resend')}</Button>
          ) : (
            <Button variant="outline" size="sm" icon={CheckCircle2} onClick={() => toggleSuspend(u)}>{t('users.activate')}</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={<>
          <Button variant="outline" icon={Download} onClick={() => toast(tc('toast.exported'))}>{t('users.export')}</Button>
          <Button icon={UserPlus} onClick={() => setInviteOpen(true)}>{t('users.invite')}</Button>
        </>}
      />

      <div className="grid grid-4 adm-kpis fade-up">
        <StatCard icon={UsersIcon} label={t('users.stats.total')} value={loading ? '–' : fmtNum(counts.total)} />
        <StatCard icon={UserCheck} tone="green" label={t('users.stats.active')} value={loading ? '–' : fmtNum(counts.active)} trend={!loading && counts.total ? t('users.stats.activeRate', { value: Math.round((counts.active / counts.total) * 100) }) : undefined} />
        <StatCard icon={Mail} tone="gold" label={t('users.stats.pending')} value={loading ? '–' : fmtNum(counts.pending)} />
        <StatCard icon={UserX} tone="red" label={t('users.stats.suspended')} value={loading ? '–' : fmtNum(counts.suspended)} />
      </div>

      <Card className="adm-section" pad={false}>
        <div className="adm-filters">
          <Input icon={Search} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('users.searchPlaceholder')} aria-label={tc('actions.search')} />
          <Select value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} placeholder={t('users.allRoles')} aria-label={t('users.cols.role')} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} placeholder={t('users.allStatuses')} aria-label={t('users.cols.status')} />
          <Select value={dept} onChange={(e) => setDept(e.target.value)} options={deptOptions} placeholder={t('users.allDepartments')} aria-label={t('users.cols.department')} />
          <Button variant="ghost" icon={RotateCcw} onClick={clearFilters} disabled={!hasFilters}>{tc('actions.clear')}</Button>
        </div>
        <div className="adm-table-meta">
          {loading ? t('users.loading') : t('users.showing', { count: filtered.length, total: users.length })}
        </div>
        {loading ? (
          <div className="adm-table-skel" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="adm-skeleton" />)}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            empty={{
              icon: Search,
              title: users.length ? t('users.noResults') : tc('empty.title'),
              text: users.length ? t('users.noResultsText') : tc('empty.text'),
              action: hasFilters ? <Button variant="outline" size="sm" icon={RotateCcw} onClick={clearFilters}>{tc('actions.clear')}</Button> : undefined,
            }}
          />
        )}
      </Card>

      <Card
        className="adm-section"
        accent="navy"
        title={t('perm.title')}
        subtitle={t('perm.subtitle')}
        actions={<Button variant="outline" size="sm" icon={ShieldCheck} onClick={() => toast(tc('toast.demo'))}>{t('perm.edit')}</Button>}
        pad={false}
      >
        <div className="table-wrap">
          <table className="table adm-matrix">
            <thead>
              <tr>
                <th>{t('perm.module')}</th>
                {ROLES.map((r) => <th key={r}>{tc(`roles.${r}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.key}>
                  <td><b>{t(`perm.modules.${m.key}.title`)}</b><small>{t(`perm.modules.${m.key}.desc`)}</small></td>
                  {ROLES.map((r) => {
                    const lvl = m[r];
                    const Icon = LEVEL_ICON[lvl];
                    return (
                      <td key={r}>
                        <span className={`adm-perm ${lvl}`}><Icon aria-hidden />{t(`perm.levels.${lvl}`)}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="adm-perm-foot">
          {['edit', 'view', 'none'].map((lvl) => {
            const Icon = LEVEL_ICON[lvl];
            return <span key={lvl} className="adm-perm-key"><span className={`adm-perm ${lvl}`}><Icon aria-hidden />{t(`perm.levels.${lvl}`)}</span>{t(`perm.legend.${lvl}`)}</span>;
          })}
          <p className="text-muted">{t('perm.note')}</p>
        </div>
      </Card>

      <Modal
        open={inviteOpen}
        title={t('invite.title')}
        onClose={closeInvite}
        width={560}
        footer={<>
          <Button variant="ghost" onClick={closeInvite}>{tc('actions.cancel')}</Button>
          <Button icon={Mail} onClick={submitInvite} disabled={saving}>{saving ? t('invite.sending') : t('invite.send')}</Button>
        </>}
      >
        <form className="form-grid" onSubmit={submitInvite} noValidate>
          <p className="span-2 text-muted adm-modal-intro">{t('invite.intro')}</p>
          <Field label={t('invite.name')} error={errors.name} className="span-2">
            <Input value={form.name} onChange={setField('name')} placeholder={t('invite.namePh')} error={errors.name} autoFocus />
          </Field>
          <Field label={t('invite.email')} error={errors.email} className="span-2">
            <Input type="email" value={form.email} onChange={setField('email')} placeholder="name@edubridge.app" error={errors.email} />
          </Field>
          <Field label={t('invite.role')}>
            <Select value={form.role} onChange={setField('role')} options={roleOptions} />
          </Field>
          <Field label={t('invite.department')} error={errors.department} hint={form.role === 'student' ? t('invite.noDepartment') : undefined}>
            <Select value={form.department} onChange={setField('department')} options={deptOptions} placeholder={t('invite.chooseDepartment')} disabled={form.role === 'student'} />
          </Field>
          <Field label={t('invite.message')} hint={t('invite.messageHint')} className="span-2">
            <Textarea value={form.message} onChange={setField('message')} rows={3} />
          </Field>
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      <Modal
        open={!!roleTarget}
        title={t('roleModal.title')}
        onClose={() => setRoleTarget(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setRoleTarget(null)}>{tc('actions.cancel')}</Button>
          <Button icon={UserCog} onClick={saveRole} disabled={!roleTarget || nextRole === roleTarget.role}>{t('roleModal.confirm')}</Button>
        </>}
      >
        {roleTarget ? (
          <div className="stack">
            <div className="adm-user">
              <Avatar name={roleTarget.name} />
              <div className="adm-user-meta"><b>{loc(roleTarget, 'name')}</b><small dir="ltr">{roleTarget.email}</small></div>
            </div>
            <Field label={t('roleModal.newRole')} hint={t(`roleModal.hints.${nextRole || roleTarget.role}`)}>
              <Select value={nextRole} onChange={(e) => setNextRole(e.target.value)} options={roleOptions} />
            </Field>
          </div>
        ) : <EmptyState />}
      </Modal>
    </>
  );
}
