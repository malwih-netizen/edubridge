import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, CheckCircle2, Clock, CloudUpload, Eye, FileText, FolderOpen, Info, Layers, RefreshCw, ShieldCheck, Trash2, Upload, XCircle,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, IconButton, Modal, PageHeader, ProgressRing, Select, StatCard, Tabs, statusTone } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { studentService } from '@/services/dataService';
import { readiness } from '@/services/matching';
import './student.css';

const DOC_TYPES = ['passport', 'transcript', 'degree', 'cv', 'language', 'motivation', 'recommendation', 'other'];
const MAX_MB = 10;
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

const STATUS_ICON = { approved: CheckCircle2, underReview: Clock, rejected: XCircle, missing: AlertTriangle };
const hasFile = (d) => d.status !== 'missing' && d.file;

export default function StudentDocuments() {
  const { t } = useTranslation('student');
  const { t: tc } = useTranslation();
  const { fmtDate, fmtNum } = useLocalized();
  const toast = useToast();

  const docs = useAsync(() => studentService.documents(), []);
  const apps = useAsync(() => studentService.applications(), []);

  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // { type, replace }
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const list = docs.data || [];
  const ready = useMemo(() => readiness(list), [list]);
  const activeApps = (apps.data || []).filter((a) => !a.result).length;
  const count = (s) => list.filter((d) => d.status === s).length;
  const shown = filter === 'all' ? list : list.filter((d) => d.status === filter);

  const openUpload = (type = 'cv', replace = false) => { setModal({ type, replace }); setFile(null); setFileError(''); };
  const closeUpload = () => { if (!busy) setModal(null); };

  const pick = (f) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) { setFileError(t('documents.upload.tooLarge', { max: MAX_MB })); setFile(null); return; }
    setFileError('');
    setFile(f);
  };

  const submit = async () => {
    if (!file) { setFileError(t('documents.upload.choose')); return; }
    setBusy(true);
    try {
      const saved = await studentService.uploadDocument(modal.type, file);
      docs.setData((cur = []) => {
        const idx = modal.type === 'other' ? -1 : cur.findIndex((d) => d.type === modal.type);
        if (idx === -1) return [...cur, saved];
        const next = [...cur];
        next[idx] = saved; // the server replaces the file in place and keeps the same document id
        return next;
      });
      toast(tc('toast.uploaded', { name: tc(`docTypes.${modal.type}`) }));
      setModal(null);
    } catch {
      toast(t('documents.failed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    const d = toDelete;
    setToDelete(null);
    try {
      await studentService.deleteDocument(d.id);
    } catch (err) {
      toast(err?.error?.code === 'document_approved' ? t('documents.locked') : t('documents.failed'));
      return;
    }
    docs.setData((cur) => (DOC_TYPES.slice(0, -1).includes(d.type)
      ? cur.map((x) => (x.id === d.id ? { id: `missing-${x.type}`, type: x.type, file: null, status: 'missing' } : x))
      : cur.filter((x) => x.id !== d.id)));
    toast(t('documents.deleted', { name: tc(`docTypes.${d.type}`) }));
  };

  const view = async (d) => {
    try {
      if (!(await studentService.openDocument(d.id))) toast(t('documents.noPreview'));
    } catch {
      toast(t('documents.failed'));
    }
  };

  const tabs = [
    { value: 'all', label: t('documents.filters.all'), count: list.length },
    ...['approved', 'underReview', 'rejected', 'missing'].map((s) => ({ value: s, label: tc(`status.${s}`), count: count(s) })),
  ];

  return (
    <>
      <PageHeader
        title={t('documents.title')}
        description={t('documents.subtitle')}
        actions={<Button icon={Upload} onClick={() => openUpload(ready.missing[0] || 'other')}>{t('documents.uploadNew')}</Button>}
      />

      <div className="doc-top">
        <section className="card doc-ready fade-up">
          <ProgressRing value={docs.loading ? 0 : ready.score} size={118} stroke={11} color="var(--gold-500)" label={t('documents.readiness')} />
          <div className="doc-ready-copy">
            <h2>{ready.score >= 90 ? t('documents.readyHigh') : ready.score >= 60 ? t('documents.readyMid') : t('documents.readyLow')}</h2>
            <p>{t('documents.readinessText')}</p>
            {!docs.loading && (ready.missing.length ? (
              <div className="doc-missing">
                {ready.missing.map((m) => (
                  <button key={m} type="button" className="chip" onClick={() => openUpload(m)}>
                    <Upload aria-hidden />{tc(`docTypes.${m}`)}
                  </button>
                ))}
              </div>
            ) : <p className="doc-done"><CheckCircle2 aria-hidden />{t('documents.allSet')}</p>)}
          </div>
        </section>
        <div className="doc-stats">
          <StatCard icon={CheckCircle2} tone="green" label={tc('status.approved')} value={docs.loading ? '–' : fmtNum(count('approved'))} />
          <StatCard icon={Clock} tone="gold" label={tc('status.underReview')} value={docs.loading ? '–' : fmtNum(count('underReview'))} />
          <StatCard icon={AlertTriangle} tone="red" label={t('documents.needAction')} value={docs.loading ? '–' : fmtNum(count('missing') + count('rejected'))} />
        </div>
      </div>

      <div className="doc-layout">
        <Card
          title={t('documents.listTitle')}
          subtitle={t('documents.listSub')}
          pad={false}
          className="fade-up"
        >
          <div className="doc-tabs"><Tabs items={tabs} value={filter} onChange={setFilter} /></div>
          {docs.loading ? (
            <div className="doc-list">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton doc-skel" />)}</div>
          ) : !shown.length ? (
            <EmptyState icon={FolderOpen} title={t('documents.emptyTitle')} text={t('documents.emptyText')} />
          ) : (
            <ul className="doc-list">
              {shown.map((d) => {
                const Icon = STATUS_ICON[d.status] || FileText;
                return (
                  <li key={d.id} className={`doc-row ${d.status}`}>
                    <span className="doc-icon"><FileText aria-hidden /></span>
                    <div className="doc-info">
                      <div className="doc-name">
                        <b>{tc(`docTypes.${d.type}`)}</b>
                        <Badge tone={statusTone(d.status)} icon={Icon}>{tc(`status.${d.status}`)}</Badge>
                      </div>
                      {hasFile(d) ? (
                        <small className="doc-file"><span className="ltr">{d.file}</span> · {d.size} · {t('documents.uploadedOn', { date: fmtDate(d.uploadedAt) })}</small>
                      ) : (
                        <small className="doc-file">{t('documents.notUploaded')}</small>
                      )}
                      {d.status === 'rejected' && (
                        <p className="doc-reason"><Info aria-hidden /><span><b>{t('documents.reason')}:</b> {d.reason || t('documents.reasonFallback')}</span></p>
                      )}
                      {hasFile(d) && d.status !== 'rejected' && activeApps > 0 && (
                        <small className="doc-reuse"><Layers aria-hidden />{t('documents.reusedIn', { count: activeApps })}</small>
                      )}
                    </div>
                    <div className="doc-actions">
                      {hasFile(d) ? (
                        <>
                          <IconButton icon={Eye} label={tc('actions.view')} onClick={() => view(d)} />
                          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => openUpload(d.type, true)}>{tc('actions.replace')}</Button>
                          <IconButton icon={Trash2} label={tc('actions.delete')} className="doc-del" onClick={() => setToDelete(d)} />
                        </>
                      ) : (
                        <Button size="sm" icon={Upload} onClick={() => openUpload(d.type)}>{tc('actions.upload')}</Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <aside className="stack doc-aside">
          <Card accent="gold" title={t('documents.guideTitle')}>
            <ul className="doc-guide">
              <li><CheckCircle2 aria-hidden />{t('documents.guide.formats', { max: MAX_MB })}</li>
              <li><CheckCircle2 aria-hidden />{t('documents.guide.clear')}</li>
              <li><CheckCircle2 aria-hidden />{t('documents.guide.translate')}</li>
              <li><CheckCircle2 aria-hidden />{t('documents.guide.review')}</li>
            </ul>
          </Card>
          <Card accent="navy" title={t('documents.reuseTitle')}>
            <p className="text-muted doc-reuse-text">{t('documents.reuseText')}</p>
            <Button variant="outline" size="sm" block to="/student/applications">{tc('nav.applications')}</Button>
          </Card>
          <div className="doc-help">
            <ShieldCheck aria-hidden />
            <div>
              <b>{t('documents.helpTitle')}</b>
              <small>{t('documents.helpText')}</small>
              <Link to="/student/services" className="link">{t('documents.helpLink')}</Link>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={!!modal}
        onClose={closeUpload}
        title={modal?.replace ? t('documents.upload.replaceTitle', { name: tc(`docTypes.${modal.type}`) }) : t('documents.upload.title')}
        footer={<>
          <Button variant="ghost" onClick={closeUpload} disabled={busy}>{tc('actions.cancel')}</Button>
          <Button icon={Upload} onClick={submit} disabled={busy}>{busy ? t('documents.upload.uploading') : tc('actions.upload')}</Button>
        </>}
      >
        {modal && (
          <div className="stack">
            <Field label={t('documents.upload.type')}>
              <Select
                value={modal.type}
                disabled={modal.replace}
                onChange={(e) => setModal((m) => ({ ...m, type: e.target.value }))}
                options={DOC_TYPES.map((k) => ({ value: k, label: tc(`docTypes.${k}`) }))}
              />
            </Field>
            <label
              className={`drop${drag ? ' over' : ''}${fileError ? ' err' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            >
              <input type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />
              <CloudUpload aria-hidden />
              {file ? (
                <>
                  <b className="ltr">{file.name}</b>
                  <small>{t('documents.upload.size', { size: fmtNum(Math.max(1, Math.round(file.size / 1024))) })} · {t('documents.upload.change')}</small>
                </>
              ) : (
                <>
                  <b>{t('documents.upload.drop')}</b>
                  <small>{t('documents.upload.limits', { max: MAX_MB })}</small>
                </>
              )}
            </label>
            {fileError && <small className="drop-error">{fileError}</small>}
            {modal.replace && <p className="drop-note"><Info aria-hidden />{t('documents.upload.replaceNote')}</p>}
          </div>
        )}
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('documents.deleteTitle')}
        width={440}
        footer={<>
          <Button variant="ghost" onClick={() => setToDelete(null)}>{tc('actions.cancel')}</Button>
          <Button variant="danger" icon={Trash2} onClick={confirmDelete}>{tc('actions.delete')}</Button>
        </>}
      >
        {toDelete && <p>{t('documents.deleteText', { name: tc(`docTypes.${toDelete.type}`) })}</p>}
      </Modal>
    </>
  );
}
